/**
 * Geocoding Service for Mission Planner
 * Converts addresses, zipcodes, and coordinates to geographic positions
 */

import type { Position, GeocodeResult, ZipcodeLocation } from '../types/mission';

export class GeocodingService {
  private static instance: GeocodingService;
  private cache: Map<string, GeocodeResult> = new Map();

  public static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  /**
   * Convert zipcode to coordinates using free geocoding APIs
   */
  async geocodeZipcode(zipcode: string, country: string = 'US'): Promise<GeocodeResult> {
    const cacheKey = `zipcode:${zipcode}:${country}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Try Nominatim (OpenStreetMap) first - free and no API key required
      const nominatimResult = await this.geocodeWithNominatim(zipcode, country);
      if (nominatimResult.success) {
        this.cache.set(cacheKey, nominatimResult);
        return nominatimResult;
      }

      // Fallback to Zippopotam.us for postal codes
      if (country === 'US') {
        const zippoResult = await this.geocodeWithZippopotamus(zipcode);
        if (zippoResult.success) {
          this.cache.set(cacheKey, zippoResult);
          return zippoResult;
        }
      }

      return {
        success: false,
        error: `Unable to geocode zipcode ${zipcode}`
      };

    } catch (error) {
      console.error('Geocoding error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown geocoding error'
      };
    }
  }

  /**
   * Convert address to coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    const cacheKey = `address:${address}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const result = await this.geocodeWithNominatim(address);
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Address geocoding error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Address geocoding failed'
      };
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(position: Position): Promise<string> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${position.latitude}&lon=${position.longitude}&format=json&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Paparazzi-NextGen-GCS/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.display_name) {
        return data.display_name;
      }

      return `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;
    }
  }

  /**
   * Parse coordinate string (e.g., "40.7128, -74.0060" or "40°42'46.0"N 74°00'21.6"W")
   */
  parseCoordinates(input: string): GeocodeResult {
    try {
      // Remove extra whitespace
      input = input.trim();

      // Try decimal degrees format: "lat, lon" or "lat lon"
      const decimalMatch = input.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
      if (decimalMatch) {
        const lat = parseFloat(decimalMatch[1]);
        const lon = parseFloat(decimalMatch[2]);
        
        if (this.isValidCoordinate(lat, lon)) {
          return {
            success: true,
            position: { latitude: lat, longitude: lon, altitude: 0 },
            address: `${lat.toFixed(6)}, ${lon.toFixed(6)}`
          };
        }
      }

      // Try degrees/minutes/seconds format
      const dmsMatch = input.match(/(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])/i);
      if (dmsMatch) {
        const latDeg = parseInt(dmsMatch[1]);
        const latMin = parseInt(dmsMatch[2]);
        const latSec = parseFloat(dmsMatch[3]);
        const latDir = dmsMatch[4].toUpperCase();
        
        const lonDeg = parseInt(dmsMatch[5]);
        const lonMin = parseInt(dmsMatch[6]);
        const lonSec = parseFloat(dmsMatch[7]);
        const lonDir = dmsMatch[8].toUpperCase();
        
        let lat = latDeg + latMin/60 + latSec/3600;
        let lon = lonDeg + lonMin/60 + lonSec/3600;
        
        if (latDir === 'S') lat = -lat;
        if (lonDir === 'W') lon = -lon;
        
        if (this.isValidCoordinate(lat, lon)) {
          return {
            success: true,
            position: { latitude: lat, longitude: lon, altitude: 0 },
            address: input
          };
        }
      }

      return {
        success: false,
        error: 'Invalid coordinate format. Use "lat, lon" (e.g., "40.7128, -74.0060") or DMS format'
      };

    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse coordinates'
      };
    }
  }

  /**
   * Validate if coordinates are within valid ranges
   */
  private isValidCoordinate(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  /**
   * Geocode using Nominatim (OpenStreetMap)
   */
  private async geocodeWithNominatim(query: string, country?: string): Promise<GeocodeResult> {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
    
    if (country) {
      url += `&countrycodes=${country.toLowerCase()}`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Paparazzi-NextGen-GCS/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.length > 0) {
      const result = data[0];
      return {
        success: true,
        position: {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          altitude: 0
        },
        address: result.display_name
      };
    }

    return {
      success: false,
      error: 'Location not found'
    };
  }

  /**
   * Geocode US zipcodes using Zippopotam.us
   */
  private async geocodeWithZippopotamus(zipcode: string): Promise<GeocodeResult> {
    const response = await fetch(`http://api.zippopotam.us/us/${zipcode}`);
    
    if (!response.ok) {
      throw new Error(`Zippopotam API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.places && data.places.length > 0) {
      const place = data.places[0];
      return {
        success: true,
        position: {
          latitude: parseFloat(place.latitude),
          longitude: parseFloat(place.longitude),
          altitude: 0
        },
        address: `${place['place name']}, ${place['state abbreviation']}, ${data.country}`
      };
    }

    return {
      success: false,
      error: 'Zipcode not found'
    };
  }

  /**
   * Get timezone for a position
   */
  async getTimezone(position: Position): Promise<string> {
    try {
      // Simple timezone estimation based on longitude
      const timezoneOffset = Math.round(position.longitude / 15);
      const sign = timezoneOffset >= 0 ? '+' : '-';
      const hours = Math.abs(timezoneOffset).toString().padStart(2, '0');
      return `UTC${sign}${hours}:00`;
    } catch (error) {
      return 'UTC+00:00';
    }
  }

  /**
   * Clear geocoding cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}