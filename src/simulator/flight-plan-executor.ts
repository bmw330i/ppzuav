/**
 * Flight Plan Executor - Executes waypoint navigation and mission logic
 * Based on original Paparazzi navigation algorithms
 */

import type { FlightPlan, NavigationCommand, Position, FlightState } from '../types/core.js';
import { GPSSimulator } from './gps-simulator.js';

export interface WaypointReached {
  waypointId: number; // Changed from string to number
  timestamp: Date;
  position: Position;
}

export interface NavigationState {
  currentWaypointIndex: number;
  targetWaypoint: Position | null;
  distanceToTarget: number;
  bearingToTarget: number;
  crossTrackError: number;
  circling: boolean;
  circleCenter: Position | null;
  circleRadius: number;
}

export class FlightPlanExecutor {
  private flightPlan: FlightPlan;
  private navState: NavigationState;
  private waypointsReached: WaypointReached[] = [];
  private navigationCommands: NavigationCommand[] = [];
  
  // Navigation parameters (tunable)
  private readonly WAYPOINT_RADIUS = 50; // meters - how close to consider "reached"
  private readonly CIRCLE_RADIUS = 100; // meters - default loiter radius
  private readonly MAX_BANK_ANGLE = 30; // degrees
  private readonly CRUISE_SPEED = 15; // m/s
  private readonly APPROACH_SPEED = 12; // m/s

  constructor(flightPlan: FlightPlan) {
    this.flightPlan = flightPlan;
    this.navState = {
      currentWaypointIndex: 0,
      targetWaypoint: null,
      distanceToTarget: 0,
      bearingToTarget: 0,
      crossTrackError: 0,
      circling: false,
      circleCenter: null,
      circleRadius: this.CIRCLE_RADIUS
    };
    
    this.setNextWaypoint();
  }

  update(deltaTime: number, flightState: FlightState): NavigationCommand[] {
    this.navigationCommands = [];
    
    if (!this.navState.targetWaypoint) {
      return this.navigationCommands;
    }

    // Calculate navigation geometry
    this.updateNavigationGeometry(flightState.position);
    
    // Check waypoint reached
    this.checkWaypointReached(flightState.position);
    
    // Generate navigation commands based on current leg
    this.generateNavigationCommands(flightState);
    
    return this.navigationCommands;
  }

  private updateNavigationGeometry(currentPosition: Position): void {
    if (!this.navState.targetWaypoint) return;
    
    // Calculate distance and bearing to target
    this.navState.distanceToTarget = GPSSimulator.distanceBetween(
      currentPosition, 
      this.navState.targetWaypoint
    );
    
    this.navState.bearingToTarget = GPSSimulator.bearingBetween(
      currentPosition,
      this.navState.targetWaypoint
    );
    
    // Calculate cross-track error if we have a previous waypoint
    if (this.navState.currentWaypointIndex > 0) {
      const prevWaypoint = this.flightPlan.waypoints[this.navState.currentWaypointIndex - 1];
      if (prevWaypoint) {
        this.navState.crossTrackError = this.calculateCrossTrackError(
          prevWaypoint.position,
          this.navState.targetWaypoint,
          currentPosition
        );
      }
    }
  }

  private calculateCrossTrackError(
    from: Position, 
    to: Position, 
    current: Position
  ): number {
    // Calculate cross-track error using spherical trigonometry
    const d13 = GPSSimulator.distanceBetween(from, current) / 6371000; // Angular distance
    const θ13 = GPSSimulator.bearingBetween(from, current) * Math.PI / 180; // Bearing to current
    const θ12 = GPSSimulator.bearingBetween(from, to) * Math.PI / 180; // Bearing to target
    
    const δxt = Math.asin(Math.sin(d13) * Math.sin(θ13 - θ12)) * 6371000; // Cross-track distance
    
    return δxt; // Positive = right of track, negative = left of track
  }

  private checkWaypointReached(currentPosition: Position): void {
    if (!this.navState.targetWaypoint) return;
    
    const currentWaypoint = this.flightPlan.waypoints[this.navState.currentWaypointIndex];
    
    // Check if within waypoint radius
    if (this.navState.distanceToTarget <= this.WAYPOINT_RADIUS) {
      // Waypoint reached!
      this.waypointsReached.push({
        waypointId: currentWaypoint.id,
        timestamp: new Date(),
        position: { ...currentPosition }
      });
      
      // Move to next waypoint
      this.setNextWaypoint();
    }
  }

  private setNextWaypoint(): void {
    if (this.navState.currentWaypointIndex >= this.flightPlan.waypoints.length) {
      // Mission complete - handle according to plan
      this.handleMissionComplete();
      return;
    }
    
    const waypoint = this.flightPlan.waypoints[this.navState.currentWaypointIndex];
    this.navState.targetWaypoint = waypoint.position;
    
    // Handle waypoint-specific actions
    switch (waypoint.action) {
      case 'circle':
        this.navState.circling = true;
        this.navState.circleCenter = waypoint.position;
        this.navState.circleRadius = waypoint.parameters?.radius || this.CIRCLE_RADIUS;
        break;
        
      case 'land':
        // Landing approach logic would go here
        break;
        
      default:
        this.navState.circling = false;
        this.navState.circleCenter = null;
        break;
    }
  }

  private handleMissionComplete(): void {
    const endAction = this.flightPlan.endAction || 'hold';
    
    switch (endAction) {
      case 'return_home':
        // Navigate back to first waypoint
        this.navState.currentWaypointIndex = 0;
        this.setNextWaypoint();
        break;
        
      case 'repeat':
        // Restart mission
        this.navState.currentWaypointIndex = 0;
        this.waypointsReached = [];
        this.setNextWaypoint();
        break;
        
      case 'hold':
      default:
        // Loiter at current position
        this.navState.circling = true;
        this.navState.circleCenter = this.navState.targetWaypoint;
        this.navState.circleRadius = this.CIRCLE_RADIUS;
        break;
    }
  }

  private generateNavigationCommands(flightState: FlightState): void {
    if (this.navState.circling) {
      this.generateCircleCommands(flightState);
    } else {
      this.generateWaypointCommands(flightState);
    }
    
    // Always generate altitude command
    this.generateAltitudeCommand(flightState);
    
    // Generate speed command
    this.generateSpeedCommand(flightState);
  }

  private generateWaypointCommands(flightState: FlightState): void {
    if (!this.navState.targetWaypoint) return;
    
    // Basic waypoint following - fly towards target bearing
    let targetHeading = this.navState.bearingToTarget;
    
    // Apply cross-track error correction
    const crossTrackCorrection = Math.atan2(
      this.navState.crossTrackError,
      Math.max(50, this.navState.distanceToTarget)
    ) * 180 / Math.PI;
    
    targetHeading = (targetHeading - crossTrackCorrection + 360) % 360;
    
    this.navigationCommands.push({
      type: 'heading',
      value: targetHeading,
      timestamp: new Date().toISOString()
    });
  }

  private generateCircleCommands(flightState: FlightState): void {
    if (!this.navState.circleCenter) return;
    
    // Calculate desired heading for circular flight
    const bearingToCenter = GPSSimulator.bearingBetween(
      flightState.position,
      this.navState.circleCenter
    );
    
    const distanceToCenter = GPSSimulator.distanceBetween(
      flightState.position,
      this.navState.circleCenter
    );
    
    // Determine turn direction (right turn = positive, left turn = negative)
    const turnDirection = 1; // Could be configurable per waypoint
    
    // Calculate tangential heading for circle
    let tangentHeading = (bearingToCenter + 90 * turnDirection + 360) % 360;
    
    // Adjust heading based on distance from circle
    const radiusError = distanceToCenter - this.navState.circleRadius;
    const headingCorrection = Math.atan2(radiusError, this.navState.circleRadius) * 180 / Math.PI;
    
    const targetHeading = (tangentHeading + headingCorrection * turnDirection + 360) % 360;
    
    this.navigationCommands.push({
      type: 'heading',
      value: targetHeading,
      timestamp: new Date().toISOString()
    });
  }

  private generateAltitudeCommand(flightState: FlightState): void {
    const currentWaypoint = this.flightPlan.waypoints[this.navState.currentWaypointIndex];
    if (currentWaypoint && currentWaypoint.position.altitude !== undefined) {
      this.navigationCommands.push({
        type: 'altitude',
        value: currentWaypoint.position.altitude,
        timestamp: new Date().toISOString()
      });
    }
  }

  private generateSpeedCommand(flightState: FlightState): void {
    const currentWaypoint = this.flightPlan.waypoints[this.navState.currentWaypointIndex];
    let targetSpeed = this.CRUISE_SPEED;
    
    // Adjust speed based on waypoint action
    if (currentWaypoint) {
      switch (currentWaypoint.action) {
        case 'approach':
        case 'land':
          targetSpeed = this.APPROACH_SPEED;
          break;
        case 'circle':
          targetSpeed = currentWaypoint.parameters?.speed || this.CRUISE_SPEED;
          break;
        default:
          targetSpeed = currentWaypoint.parameters?.speed || this.CRUISE_SPEED;
          break;
      }
    }
    
    this.navigationCommands.push({
      type: 'airspeed',
      value: targetSpeed,
      timestamp: new Date().toISOString()
    });
  }

  // Get current navigation status
  getNavigationState(): NavigationState & {
    currentWaypoint: typeof this.flightPlan.waypoints[0] | null;
    progress: number;
    estimatedTimeToTarget: number;
  } {
    const currentWaypoint = this.navState.currentWaypointIndex < this.flightPlan.waypoints.length
      ? this.flightPlan.waypoints[this.navState.currentWaypointIndex]
      : null;
    
    const progress = this.flightPlan.waypoints.length > 0
      ? this.navState.currentWaypointIndex / this.flightPlan.waypoints.length
      : 0;
    
    const estimatedTimeToTarget = this.navState.distanceToTarget / this.CRUISE_SPEED;
    
    return {
      ...this.navState,
      currentWaypoint,
      progress,
      estimatedTimeToTarget
    };
  }

  // Get waypoints reached history
  getWaypointsReached(): WaypointReached[] {
    return [...this.waypointsReached];
  }

  // Emergency procedures
  emergencyReturnToHome(): void {
    if (this.flightPlan.waypoints.length > 0) {
      this.navState.currentWaypointIndex = 0;
      this.navState.targetWaypoint = this.flightPlan.waypoints[0].position;
      this.navState.circling = false;
    }
  }

  emergencyLand(): void {
    // Create emergency landing waypoint at current target
    if (this.navState.targetWaypoint) {
      this.navState.targetWaypoint.altitude = 0;
      this.navState.circling = false;
    }
  }

  // Skip to specific waypoint
  skipToWaypoint(waypointIndex: number): boolean {
    if (waypointIndex >= 0 && waypointIndex < this.flightPlan.waypoints.length) {
      this.navState.currentWaypointIndex = waypointIndex;
      this.setNextWaypoint();
      return true;
    }
    return false;
  }

  // Update flight plan (useful for dynamic missions)
  updateFlightPlan(newFlightPlan: FlightPlan): void {
    this.flightPlan = newFlightPlan;
    
    // Reset to start of new plan
    this.navState.currentWaypointIndex = 0;
    this.waypointsReached = [];
    this.setNextWaypoint();
  }
}