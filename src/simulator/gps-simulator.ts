/**
 * GPS Simulator - Simulates GPS receiver behavior
 * Includes realistic GPS accuracy, satellite visibility, and signal processing delays
 */

import type { Position } from '../types/core.js';

export interface GPSState {
  position: Position;
  accuracy: number; // meters
  satelliteCount: number;
  fixType: 'none' | '2d' | '3d' | 'dgps' | 'rtk';
  hdop: number; // Horizontal Dilution of Precision
  vdop: number; // Vertical Dilution of Precision
  signalToNoise: number[]; // Per satellite
  lastUpdate: Date;
}

export interface GPSConfig {
  updateRate: number; // Hz
  baseAccuracy: number; // meters
  multiPathError: number; // meters
  enableRealism: boolean;
}

export class GPSSimulator {
  private truePosition: Position;
  private reportedPosition: Position;
  private config: GPSConfig;
  private state: GPSState;
  private lastUpdateTime: number = 0;
  private satellites: Array<{
    id: number;
    elevation: number;
    azimuth: number;
    snr: number;
    healthy: boolean;
  }> = [];

  constructor(initialPosition: Position, config?: Partial<GPSConfig>) {
    this.truePosition = { ...initialPosition };
    this.reportedPosition = { ...initialPosition };
    
    this.config = {
      updateRate: 10, // 10 Hz typical for modern GPS
      baseAccuracy: 3.0, // meters
      multiPathError: 1.5, // meters
      enableRealism: true,
      ...config
    };

    this.state = {
      position: { ...initialPosition },
      accuracy: this.config.baseAccuracy,
      satelliteCount: 8,
      fixType: '3d',
      hdop: 1.2,
      vdop: 1.8,
      signalToNoise: [],
      lastUpdate: new Date()
    };

    this.initializeSatellites();
  }

  private initializeSatellites(): void {
    // Initialize constellation of GPS satellites
    for (let i = 1; i <= 32; i++) {
      this.satellites.push({
        id: i,
        elevation: Math.random() * 90, // 0-90 degrees
        azimuth: Math.random() * 360, // 0-360 degrees
        snr: 35 + Math.random() * 15, // 35-50 dB-Hz typical
        healthy: Math.random() > 0.05 // 95% satellite health
      });
    }
  }

  update(deltaTime: number, truePosition: Position): void {
    this.truePosition = { ...truePosition };
    
    // Check if it's time for GPS update
    const now = Date.now();
    const updateInterval = 1000 / this.config.updateRate; // ms
    
    if (now - this.lastUpdateTime >= updateInterval) {
      this.updateGPSReading();
      this.lastUpdateTime = now;
    }
    
    // Update satellite positions (simplified orbital mechanics)
    this.updateSatellitePositions(deltaTime);
  }

  private updateGPSReading(): void {
    if (!this.config.enableRealism) {
      // Perfect GPS for testing
      this.reportedPosition = { ...this.truePosition };
      this.state.accuracy = 0.1;
      this.state.satelliteCount = 12;
      this.state.fixType = '3d';
      return;
    }

    // Calculate visible satellites
    const visibleSats = this.satellites.filter(sat => 
      sat.elevation > 15 && sat.healthy && sat.snr > 30
    );
    
    this.state.satelliteCount = visibleSats.length;
    this.state.signalToNoise = visibleSats.map(sat => sat.snr);

    // Determine fix type based on satellite count
    if (visibleSats.length < 4) {
      this.state.fixType = 'none';
      this.state.accuracy = 999;
      return;
    } else if (visibleSats.length < 5) {
      this.state.fixType = '2d';
    } else {
      this.state.fixType = '3d';
    }

    // Calculate dilution of precision
    this.calculateDOP(visibleSats);

    // Calculate position error
    const positionError = this.calculatePositionError(visibleSats);
    
    // Apply error to true position
    this.reportedPosition = {
      latitude: this.truePosition.latitude + positionError.lat,
      longitude: this.truePosition.longitude + positionError.lon,
      altitude: this.truePosition.altitude + positionError.alt
    };

    this.state.position = { ...this.reportedPosition };
    this.state.lastUpdate = new Date();
  }

  private calculateDOP(visibleSats: any[]): void {
    // Simplified HDOP/VDOP calculation
    // In reality, this involves complex geometric calculations
    
    const baseDOP = 4.0 / Math.sqrt(visibleSats.length);
    
    // Factor in satellite geometry (simplified)
    const avgElevation = visibleSats.reduce((sum, sat) => sum + sat.elevation, 0) / visibleSats.length;
    const geometryFactor = 1.0 + (45 - avgElevation) / 45; // Worse at low elevations
    
    this.state.hdop = baseDOP * geometryFactor;
    this.state.vdop = this.state.hdop * 1.5; // VDOP typically worse than HDOP
    
    // Calculate accuracy estimate
    this.state.accuracy = this.config.baseAccuracy * this.state.hdop;
  }

  private calculatePositionError(visibleSats: any[]): { lat: number; lon: number; alt: number } {
    // Base error from GPS accuracy
    const baseError = this.config.baseAccuracy * this.state.hdop;
    
    // Add multipath and atmospheric errors
    const multiPathError = this.config.multiPathError * (Math.random() * 2 - 1);
    const atmosphericError = Math.random() * 2.0; // Ionospheric/tropospheric delay
    
    // Total error magnitude
    const totalErrorMagnitude = baseError + Math.abs(multiPathError) + atmosphericError;
    
    // Random error direction
    const errorDirection = Math.random() * 2 * Math.PI;
    
    // Convert to lat/lon error
    const latError = (totalErrorMagnitude * Math.cos(errorDirection)) / 111320; // degrees
    const lonError = (totalErrorMagnitude * Math.sin(errorDirection)) / 
                    (111320 * Math.cos(this.truePosition.latitude * Math.PI / 180)); // degrees
    
    // Altitude error (typically worse than horizontal)
    const altError = totalErrorMagnitude * 1.5 * (Math.random() * 2 - 1);
    
    return { lat: latError, lon: lonError, alt: altError };
  }

  private updateSatellitePositions(deltaTime: number): void {
    // Simplified satellite motion (real satellites have complex orbits)
    this.satellites.forEach(sat => {
      // Satellites move approximately 0.5 degrees per minute
      sat.azimuth += (0.5 / 60) * deltaTime;
      if (sat.azimuth > 360) sat.azimuth -= 360;
      
      // Small elevation changes due to orbital mechanics
      sat.elevation += (Math.random() - 0.5) * 0.1 * deltaTime;
      sat.elevation = Math.max(0, Math.min(90, sat.elevation));
      
      // SNR varies with elevation and atmospheric conditions
      const baseSnr = 35 + (sat.elevation / 90) * 15; // Higher at zenith
      const atmosphericNoise = (Math.random() - 0.5) * 5;
      sat.snr = Math.max(20, Math.min(50, baseSnr + atmosphericNoise));
      
      // Occasional satellite health issues
      if (Math.random() < 0.0001) { // Very rare
        sat.healthy = !sat.healthy;
      }
    });
  }

  // Simulate GPS jamming or interference
  simulateJamming(intensity: number): void {
    this.satellites.forEach(sat => {
      sat.snr -= intensity * 10; // Reduce signal strength
    });
  }

  // Simulate DGPS correction (improves accuracy)
  enableDGPS(baseStationDistance: number): void {
    if (baseStationDistance < 100000) { // Within 100km
      this.config.baseAccuracy = 1.0; // Sub-meter accuracy
      this.state.fixType = 'dgps';
    }
  }

  // Simulate RTK correction (centimeter accuracy)
  enableRTK(): void {
    this.config.baseAccuracy = 0.02; // 2cm accuracy
    this.state.fixType = 'rtk';
  }

  getState(): GPSState {
    return { ...this.state };
  }

  getTruePosition(): Position {
    return { ...this.truePosition };
  }

  getReportedPosition(): Position {
    return { ...this.reportedPosition };
  }

  // Calculate distance between two positions (Haversine formula)
  static distanceBetween(pos1: Position, pos2: Position): number {
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

  // Calculate bearing between two positions
  static bearingBetween(pos1: Position, pos2: Position): number {
    const lat1Rad = pos1.latitude * Math.PI / 180;
    const lat2Rad = pos2.latitude * Math.PI / 180;
    const deltaLonRad = (pos2.longitude - pos1.longitude) * Math.PI / 180;

    const y = Math.sin(deltaLonRad) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLonRad);

    const bearingRad = Math.atan2(y, x);
    return (bearingRad * 180 / Math.PI + 360) % 360;
  }
}