/**
 * Telemetry Generator - Creates realistic telemetry data from simulation state
 */

import type { Telemetry, FlightState } from '../types/core.js';
import type { GPSState } from './gps-simulator.js';
import type { EnvironmentState } from './environment-model.js';

export class TelemetryGenerator {
  private lastTelemetryTime = 0;
  private telemetrySequence = 0;

  generate(
    aircraftId: string,
    flightState: FlightState,
    gpsState: GPSState,
    environmentState: EnvironmentState
  ): Telemetry {
    const now = Date.now();
    this.telemetrySequence++;

    return {
      timestamp: new Date().toISOString(),
      aircraftId,
      messageId: this.telemetrySequence,
      position: flightState.position,
      attitude: flightState.attitude,
      speed: {
        airspeed: flightState.airspeed,
        groundspeed: flightState.groundspeed,
        verticalSpeed: flightState.verticalSpeed
      },
      systems: {
        battery: this.generateBatteryData(flightState).percentage,
        fuel: undefined, // Electric aircraft simulation
        gpsSatellites: gpsState.satelliteCount,
        gpsAccuracy: gpsState.accuracy,
        datalinkRssi: -60 + Math.random() * 20, // -40 to -80 dBm
        cpuLoad: 20 + Math.random() * 30, // 20-50% CPU usage
        temperature: environmentState.atmosphere.temperature + 10 // CPU temp higher than ambient
      },
      environmental: {
        temperature: environmentState.atmosphere.temperature,
        humidity: environmentState.atmosphere.humidity,
        pressure: environmentState.atmosphere.pressure,
        windSpeed: environmentState.wind.speed,
        windDirection: environmentState.wind.direction,
        airQuality: {
          co2: 400 + Math.random() * 50 // ppm
        }
      }
    };
  }

  private generateBatteryData(flightState: FlightState): {
    percentage: number;
    voltage: number;
    current: number;
    power: number;
    temperature: number;
    timeRemaining: number;
  } {
    // Simulate battery consumption based on throttle
    const baseConsumption = 0.1; // %/minute at idle
    const throttleConsumption = (flightState.throttle / 100) * 0.5; // Additional %/minute
    const totalConsumption = baseConsumption + throttleConsumption;
    
    // For simulation, assume battery starts at 100% and decreases over time
    const simulationTime = this.telemetrySequence * 0.02; // 50Hz telemetry
    const batteryPercentage = Math.max(0, 100 - (simulationTime * totalConsumption / 60));
    
    const voltage = 22.0 + (batteryPercentage / 100) * 3.0; // 22-25V for 6S LiPo
    const current = 2.0 + (flightState.throttle / 100) * 8.0; // 2-10A
    const power = voltage * current;
    const temperature = 25 + (100 - batteryPercentage) * 0.3; // Heats up as it drains
    const timeRemaining = batteryPercentage > 0 ? (batteryPercentage / totalConsumption) * 60 : 0;

    return {
      percentage: Math.round(batteryPercentage * 10) / 10,
      voltage: Math.round(voltage * 10) / 10,
      current: Math.round(current * 10) / 10,
      power: Math.round(power * 10) / 10,
      temperature: Math.round(temperature * 10) / 10,
      timeRemaining: Math.round(timeRemaining)
    };
  }

  private generateAlerts(
    flightState: FlightState,
    gpsState: GPSState,
    environmentState: EnvironmentState
  ): any[] {
    const alerts: any[] = [];

    // Battery alerts
    const battery = this.generateBatteryData(flightState);
    if (battery.percentage < 20) {
      alerts.push({
        id: 'battery_low',
        timestamp: new Date().toISOString(),
        level: battery.percentage < 10 ? 'critical' : 'warning',
        category: 'system',
        message: `Battery ${battery.percentage}% remaining`,
        data: { percentage: battery.percentage }
      });
    }

    // GPS alerts
    if (gpsState.satelliteCount < 6) {
      alerts.push({
        id: 'gps_low_sats',
        timestamp: new Date().toISOString(),
        level: gpsState.satelliteCount < 4 ? 'critical' : 'warning',
        category: 'navigation',
        message: `Low GPS satellites: ${gpsState.satelliteCount}`,
        data: { satellites: gpsState.satelliteCount }
      });
    }

    // Weather alerts
    if (environmentState.wind.speed > 15) {
      alerts.push({
        id: 'high_wind',
        timestamp: new Date().toISOString(),
        level: environmentState.wind.speed > 25 ? 'critical' : 'warning',
        category: 'weather',
        message: `High wind speed: ${environmentState.wind.speed.toFixed(1)} m/s`,
        data: { windSpeed: environmentState.wind.speed }
      });
    }

    // Altitude alerts
    if (flightState.position.altitude < 10) {
      alerts.push({
        id: 'low_altitude',
        timestamp: new Date().toISOString(),
        level: 'warning',
        category: 'navigation',
        message: `Low altitude: ${flightState.position.altitude.toFixed(1)}m`,
        data: { altitude: flightState.position.altitude }
      });
    }

    return alerts;
  }
}