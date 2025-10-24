/**
 * Geolocation Service - Determines user location via IP address and browser geolocation
 */

import type { Position } from '../types/core';

export interface GeolocationResult {
  position: Position;
  accuracy?: number;
  source: 'ip' | 'gps' | 'manual';
  city?: string;
  country?: string;
  timezone?: string;
}

export class GeolocationService {
  private static instance: GeolocationService;
  private currentLocation: GeolocationResult | null = null;
  private callbacks: Array<(location: GeolocationResult) => void> = [];

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  private constructor() {
    this.initializeLocation();
  }

  private async initializeLocation(): Promise<void> {
    try {
      // Try IP-based geolocation first (fast, works everywhere)
      await this.getLocationByIP();
      
      // Then try to improve with browser geolocation if available
      this.tryBrowserGeolocation();
    } catch (error) {
      console.warn('Geolocation failed, using default location:', error);
      this.setDefaultLocation();
    }
  }

  private async getLocationByIP(): Promise<void> {
    try {
      // Using ipapi.co - free service with good accuracy
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) {
        throw new Error('IP geolocation service unavailable');
      }
      
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        const location: GeolocationResult = {
          position: {
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            altitude: 0 // IP geolocation doesn't provide altitude
          },
          accuracy: 10000, // IP geolocation is typically accurate to ~10km
          source: 'ip',
          city: data.city,
          country: data.country_name,
          timezone: data.timezone
        };

        this.setCurrentLocation(location);
        console.log('IP Geolocation successful:', location);
      }
    } catch (error) {
      console.warn('IP geolocation failed:', error);
      
      // Fallback to alternative IP geolocation service
      try {
        const fallbackResponse = await fetch('https://api.ipgeolocation.io/ipgeo?apiKey=free');
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.latitude && fallbackData.longitude) {
          const location: GeolocationResult = {
            position: {
              latitude: parseFloat(fallbackData.latitude),
              longitude: parseFloat(fallbackData.longitude),
              altitude: 0
            },
            accuracy: 15000, // Free tier is less accurate
            source: 'ip',
            city: fallbackData.city,
            country: fallbackData.country_name,
            timezone: fallbackData.time_zone?.name
          };

          this.setCurrentLocation(location);
          console.log('Fallback IP Geolocation successful:', location);
        }
      } catch (fallbackError) {
        console.warn('Fallback IP geolocation also failed:', fallbackError);
        throw error;
      }
    }
  }

  private tryBrowserGeolocation(): void {
    if (!navigator.geolocation) {
      console.warn('Browser geolocation not available');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: GeolocationResult = {
          position: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || 0
          },
          accuracy: position.coords.accuracy,
          source: 'gps'
        };

        this.setCurrentLocation(location);
        console.log('Browser geolocation successful:', location);
      },
      (error) => {
        console.warn('Browser geolocation failed:', error.message);
        // Don't throw - IP location is still valid
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }

  private setDefaultLocation(): void {
    // Default to a central location (Europe) if all geolocation fails
    const location: GeolocationResult = {
      position: {
        latitude: 48.8566, // Paris, France
        longitude: 2.3522,
        altitude: 0
      },
      accuracy: 1000000, // Very inaccurate
      source: 'manual',
      city: 'Paris',
      country: 'France'
    };

    this.setCurrentLocation(location);
    console.log('Using default location:', location);
  }

  private setCurrentLocation(location: GeolocationResult): void {
    this.currentLocation = location;
    
    // Notify all callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Error in geolocation callback:', error);
      }
    });
  }

  // Public API
  public getCurrentLocation(): GeolocationResult | null {
    return this.currentLocation;
  }

  public onLocationUpdate(callback: (location: GeolocationResult) => void): () => void {
    this.callbacks.push(callback);
    
    // Call immediately if location is already available
    if (this.currentLocation) {
      callback(this.currentLocation);
    }

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  public async refreshLocation(): Promise<void> {
    await this.initializeLocation();
  }

  // Manual location setting (for testing or when user knows better location)
  public setManualLocation(position: Position, metadata?: Partial<GeolocationResult>): void {
    const location: GeolocationResult = {
      position,
      accuracy: 1, // Manual entry is considered very accurate
      source: 'manual',
      ...metadata
    };

    this.setCurrentLocation(location);
  }

  // Get a rough estimate of the map zoom level based on accuracy
  public getRecommendedZoom(): number {
    if (!this.currentLocation) return 10;

    const accuracy = this.currentLocation.accuracy || 10000;
    
    if (accuracy < 10) return 18;      // GPS accuracy - building level
    if (accuracy < 100) return 16;     // City block level
    if (accuracy < 1000) return 14;    // Neighborhood level
    if (accuracy < 10000) return 12;   // City level
    if (accuracy < 100000) return 10;  // Regional level
    return 8; // Country level
  }

  // Check if current location is from a reliable source
  public isLocationReliable(): boolean {
    if (!this.currentLocation) return false;
    
    const reliability = this.currentLocation.accuracy || Infinity;
    return reliability < 50000; // Consider reliable if accurate to 50km or better
  }

  // Get distance from current location to a point
  public getDistanceToPoint(target: Position): number {
    if (!this.currentLocation) return Infinity;

    return this.calculateDistance(this.currentLocation.position, target);
  }

  private calculateDistance(pos1: Position, pos2: Position): number {
    const R = 6371000; // Earth radius in meters
    const lat1Rad = pos1.latitude * Math.PI / 180;
    const lat2Rad = pos2.latitude * Math.PI / 180;
    const deltaLatRad = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const deltaLonRad = (pos2.longitude - pos1.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}