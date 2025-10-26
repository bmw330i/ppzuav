/**
 * Demo Data Generator - Creates realistic demo telemetry for testing the GCS
 */

import type { Telemetry, Position } from '../types/core';

export class DemoDataGenerator {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;
  private callbacks: Array<(telemetry: Telemetry) => void> = [];
  private messageId = 0;
  private currentPosition: Position = {
    latitude: 48.8566, // Start in Paris
    longitude: 2.3522,
    altitude: 100
  };
  private heading = 0;
  private speed = 15; // m/s
  private battery = 100;

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.generateTelemetry();
    }, 1000); // 1 Hz for demo
    
    console.log('Demo data generator started');
  }

  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    console.log('Demo data generator stopped');
  }

  onTelemetry(callback: (telemetry: Telemetry) => void): () => void {
    this.callbacks.push(callback);
    
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  public generateTelemetry(): any {
    // Simulate aircraft movement in a circular pattern
    this.heading += 2; // Turn 2 degrees per second
    if (this.heading >= 360) this.heading = 0;
    
    // Move aircraft based on heading and speed
    const headingRad = this.heading * Math.PI / 180;
    const deltaLat = (this.speed * Math.cos(headingRad)) / 111320; // Rough lat conversion
    const deltaLon = (this.speed * Math.sin(headingRad)) / (111320 * Math.cos(this.currentPosition.latitude * Math.PI / 180));
    
    this.currentPosition.latitude += deltaLat;
    this.currentPosition.longitude += deltaLon;
    
    // Simulate altitude changes
    this.currentPosition.altitude = 100 + Math.sin(Date.now() / 10000) * 50; // 50-150m
    
    // Simulate battery drain
    this.battery -= 0.1; // 0.1% per second
    if (this.battery < 0) this.battery = 100; // Reset for demo
    
    const telemetry: Telemetry = {
      timestamp: new Date().toISOString(),
      aircraftId: 'demo_aircraft',
      messageId: ++this.messageId,
      position: { ...this.currentPosition },
      attitude: {
        roll: Math.sin(Date.now() / 5000) * 10, // ±10 degrees
        pitch: Math.sin(Date.now() / 7000) * 5, // ±5 degrees
        yaw: this.heading
      },
      speed: {
        airspeed: this.speed + Math.random() * 2 - 1, // Some variation
        groundspeed: this.speed,
        verticalSpeed: Math.sin(Date.now() / 8000) * 2 // ±2 m/s
      },
      systems: {
        battery: Math.round(this.battery * 10) / 10,
        gpsSatellites: 8 + Math.floor(Math.random() * 4), // 8-11 satellites
        gpsAccuracy: 2 + Math.random() * 3, // 2-5m accuracy
        datalinkRssi: -60 + Math.random() * 20 // -40 to -80 dBm
      },
      environmental: {
        temperature: 15 + Math.random() * 10,
        humidity: 60 + Math.random() * 20,
        pressure: 1013 + Math.random() * 20,
        windSpeed: 5 + Math.random() * 10,
        windDirection: Math.random() * 360
      }
    };

    // Notify all callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(telemetry);
      } catch (error) {
        console.error('Error in demo telemetry callback:', error);
      }
    });
  }

  // Allow manual position setting for testing
  setPosition(position: Position): void {
    this.currentPosition = { ...position };
  }

  setBattery(percentage: number): void {
    this.battery = Math.max(0, Math.min(100, percentage));
  }

  setSpeed(speed: number): void {
    this.speed = Math.max(0, speed);
  }
}