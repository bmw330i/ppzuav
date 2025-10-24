/**
 * Safety validation utilities for flight operations
 */

import type { Position, FlightEnvelope, Telemetry, Waypoint } from '../types/core.js';

/**
 * Check if a position is within safe flight boundaries
 */
export function isPositionSafe(position: Position, envelope: FlightEnvelope): boolean {
  return (
    position.altitude >= envelope.altitude.minimum &&
    position.altitude <= envelope.altitude.maximum
  );
}

/**
 * Check if airspeed is within safe limits
 */
export function isAirspeedSafe(airspeed: number, envelope: FlightEnvelope): boolean {
  return (
    airspeed >= envelope.airspeed.minimum &&
    airspeed <= envelope.airspeed.maximum
  );
}

/**
 * Check if weather conditions are safe for flight
 */
export function isWeatherSafe(
  windSpeed: number,
  visibility: number,
  envelope: FlightEnvelope
): boolean {
  return (
    windSpeed <= envelope.weather.maxWindSpeed &&
    visibility >= envelope.weather.minVisibility
  );
}

/**
 * Validate telemetry data against flight envelope
 */
export function validateTelemetry(
  telemetry: Telemetry,
  envelope: FlightEnvelope
): {
  isValid: boolean;
  violations: string[];
  warnings: string[];
} {
  const violations: string[] = [];
  const warnings: string[] = [];

  // Check altitude
  if (telemetry.position.altitude > envelope.altitude.maximum) {
    violations.push(`Altitude ${telemetry.position.altitude}m exceeds maximum ${envelope.altitude.maximum}m`);
  } else if (telemetry.position.altitude < envelope.altitude.minimum) {
    violations.push(`Altitude ${telemetry.position.altitude}m below minimum ${envelope.altitude.minimum}m`);
  }

  // Check airspeed
  if (telemetry.speed.airspeed > envelope.airspeed.maximum) {
    violations.push(`Airspeed ${telemetry.speed.airspeed}m/s exceeds maximum ${envelope.airspeed.maximum}m/s`);
  } else if (telemetry.speed.airspeed < envelope.airspeed.minimum) {
    violations.push(`Airspeed ${telemetry.speed.airspeed}m/s below minimum ${envelope.airspeed.minimum}m/s`);
  }

  // Check battery level
  if (telemetry.systems.battery < 20) {
    violations.push(`Critical battery level: ${telemetry.systems.battery}%`);
  } else if (telemetry.systems.battery < 30) {
    warnings.push(`Low battery level: ${telemetry.systems.battery}%`);
  }

  // Check GPS
  if (telemetry.systems.gpsSatellites < 6) {
    violations.push(`Insufficient GPS satellites: ${telemetry.systems.gpsSatellites}`);
  } else if (telemetry.systems.gpsSatellites < 8) {
    warnings.push(`Marginal GPS satellites: ${telemetry.systems.gpsSatellites}`);
  }

  if (telemetry.systems.gpsAccuracy > 5) {
    violations.push(`Poor GPS accuracy: ${telemetry.systems.gpsAccuracy}m`);
  } else if (telemetry.systems.gpsAccuracy > 2) {
    warnings.push(`Degraded GPS accuracy: ${telemetry.systems.gpsAccuracy}m`);
  }

  // Check environmental conditions if available
  if (telemetry.environmental) {
    if (telemetry.environmental.windSpeed > envelope.weather.maxWindSpeed) {
      violations.push(`Wind speed ${telemetry.environmental.windSpeed}m/s exceeds limit ${envelope.weather.maxWindSpeed}m/s`);
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Calculate distance between two positions (haversine formula)
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (pos1.latitude * Math.PI) / 180;
  const φ2 = (pos2.latitude * Math.PI) / 180;
  const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
  const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate bearing from one position to another
 */
export function calculateBearing(from: Position, to: Position): number {
  const φ1 = (from.latitude * Math.PI) / 180;
  const φ2 = (to.latitude * Math.PI) / 180;
  const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360;
}

/**
 * Estimate flight time between waypoints
 */
export function estimateFlightTime(
  waypoints: Waypoint[],
  cruiseSpeed: number
): number {
  let totalTime = 0;

  for (let i = 1; i < waypoints.length; i++) {
    const distance = calculateDistance(
      waypoints[i - 1]!.position,
      waypoints[i]!.position
    );
    totalTime += distance / cruiseSpeed;

    // Add time for waypoint actions
    if (waypoints[i]!.duration) {
      totalTime += waypoints[i]!.duration!;
    }
  }

  return totalTime;
}

/**
 * Check if a waypoint is reachable given current fuel/battery
 */
export function isWaypointReachable(
  currentPosition: Position,
  waypoint: Waypoint,
  cruiseSpeed: number,
  fuelRemainingMinutes: number
): boolean {
  const distance = calculateDistance(currentPosition, waypoint.position);
  const timeNeeded = distance / cruiseSpeed / 60; // convert to minutes

  // Add 20% safety margin
  return timeNeeded * 1.2 < fuelRemainingMinutes;
}

/**
 * Generate a safe return-to-home route
 */
export function generateReturnToHomeRoute(
  currentPosition: Position,
  homePosition: Position,
  safeAltitude: number
): Waypoint[] {
  return [
    {
      id: 9998,
      name: 'RTH_CLIMB',
      position: {
        ...currentPosition,
        altitude: Math.max(currentPosition.altitude, safeAltitude),
      },
      type: 'waypoint',
    },
    {
      id: 9999,
      name: 'HOME',
      position: homePosition,
      type: 'landing',
      actions: ['auto_land'],
    },
  ];
}