/**
 * Flight Model - Physics simulation for UAV flight dynamics
 * Based on the original Paparazzi OCaml flight model but modernized
 */

import type { Position, FlightState, NavigationCommand, Command } from '../types/core.js';

export interface FlightModelConfig {
  aircraftType: 'fixedwing' | 'rotorcraft' | 'hybrid';
  initialPosition: Position;
  mass: number; // kg
  maxThrust: number; // N
  dragCoefficient: number;
  liftCoefficient?: number;
  wingArea?: number; // m²
  momentOfInertia?: {
    xx: number;
    yy: number; 
    zz: number;
  };
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface FlightDynamics {
  position: Position;
  velocity: Vector3D;
  acceleration: Vector3D;
  attitude: {
    roll: number;  // radians
    pitch: number; // radians
    yaw: number;   // radians
  };
  angularVelocity: Vector3D;
  throttle: number; // 0-1
  aileron: number;  // -1 to 1
  elevator: number; // -1 to 1
  rudder: number;   // -1 to 1
}

export class FlightModel {
  private config: FlightModelConfig;
  private state: FlightDynamics;
  private forces: Vector3D = { x: 0, y: 0, z: 0 };
  private moments: Vector3D = { x: 0, y: 0, z: 0 };
  
  // Physical constants
  private readonly GRAVITY = 9.81; // m/s²
  private readonly AIR_DENSITY = 1.225; // kg/m³
  
  constructor(config: FlightModelConfig) {
    this.config = config;
    this.state = {
      position: { ...config.initialPosition },
      velocity: { x: 0, y: 0, z: 0 },
      acceleration: { x: 0, y: 0, z: 0 },
      attitude: { roll: 0, pitch: 0, yaw: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      throttle: 0,
      aileron: 0,
      elevator: 0,
      rudder: 0
    };
  }

  update(deltaTime: number): void {
    // Reset forces and moments
    this.forces = { x: 0, y: 0, z: 0 };
    this.moments = { x: 0, y: 0, z: 0 };
    
    // Calculate aerodynamic forces
    this.calculateAerodynamicForces();
    
    // Calculate propulsion forces
    this.calculatePropulsionForces();
    
    // Calculate control surface effects
    this.calculateControlForces();
    
    // Apply gravity
    this.forces.z -= this.config.mass * this.GRAVITY;
    
    // Integrate forces to get acceleration
    this.state.acceleration = {
      x: this.forces.x / this.config.mass,
      y: this.forces.y / this.config.mass,
      z: this.forces.z / this.config.mass
    };
    
    // Integrate acceleration to get velocity
    this.state.velocity.x += this.state.acceleration.x * deltaTime;
    this.state.velocity.y += this.state.acceleration.y * deltaTime;
    this.state.velocity.z += this.state.acceleration.z * deltaTime;
    
    // Integrate velocity to get position
    this.state.position.latitude += this.state.velocity.y * deltaTime / 111320; // Rough conversion
    this.state.position.longitude += this.state.velocity.x * deltaTime / (111320 * Math.cos(this.state.position.latitude * Math.PI / 180));
    this.state.position.altitude += this.state.velocity.z * deltaTime;
    
    // Update attitude based on moments
    this.updateAttitude(deltaTime);
    
    // Apply constraints (e.g., ground collision)
    this.applyConstraints();
  }

  private calculateAerodynamicForces(): void {
    const airspeed = Math.sqrt(
      this.state.velocity.x ** 2 + 
      this.state.velocity.y ** 2 + 
      this.state.velocity.z ** 2
    );
    
    if (airspeed < 0.1) return; // No significant aerodynamic forces at low speed
    
    const dynamicPressure = 0.5 * this.AIR_DENSITY * airspeed ** 2;
    
    // Drag force (always opposing motion)
    const dragMagnitude = this.config.dragCoefficient * dynamicPressure;
    const dragDirection = {
      x: -this.state.velocity.x / airspeed,
      y: -this.state.velocity.y / airspeed,
      z: -this.state.velocity.z / airspeed
    };
    
    this.forces.x += dragMagnitude * dragDirection.x;
    this.forces.y += dragMagnitude * dragDirection.y;
    this.forces.z += dragMagnitude * dragDirection.z;
    
    // Lift force (perpendicular to velocity, depends on angle of attack)
    if (this.config.aircraftType === 'fixedwing' && this.config.liftCoefficient && this.config.wingArea) {
      const angleOfAttack = this.state.attitude.pitch; // Simplified
      const liftCoefficient = this.config.liftCoefficient * Math.sin(angleOfAttack);
      const liftMagnitude = liftCoefficient * this.config.wingArea * dynamicPressure;
      
      // Lift acts perpendicular to flight path (simplified)
      this.forces.z += liftMagnitude * Math.cos(this.state.attitude.roll);
      this.forces.y += liftMagnitude * Math.sin(this.state.attitude.roll);
    }
  }

  private calculatePropulsionForces(): void {
    // Thrust acts along the aircraft's longitudinal axis
    const thrustMagnitude = this.state.throttle * this.config.maxThrust;
    
    // Convert thrust from body frame to world frame
    const cosYaw = Math.cos(this.state.attitude.yaw);
    const sinYaw = Math.sin(this.state.attitude.yaw);
    const cosPitch = Math.cos(this.state.attitude.pitch);
    
    this.forces.x += thrustMagnitude * cosYaw * cosPitch;
    this.forces.y += thrustMagnitude * sinYaw * cosPitch;
    this.forces.z += thrustMagnitude * Math.sin(this.state.attitude.pitch);
  }

  private calculateControlForces(): void {
    const airspeed = Math.sqrt(
      this.state.velocity.x ** 2 + 
      this.state.velocity.y ** 2 + 
      this.state.velocity.z ** 2
    );
    
    if (airspeed < 1.0) return; // Control surfaces ineffective at low speed
    
    const controlEffectiveness = Math.min(airspeed / 20.0, 1.0); // Full effectiveness at 20 m/s
    
    // Simplified control surface effects
    // Roll moment from ailerons
    this.moments.x += this.state.aileron * controlEffectiveness * 10.0;
    
    // Pitch moment from elevator
    this.moments.y += this.state.elevator * controlEffectiveness * 8.0;
    
    // Yaw moment from rudder
    this.moments.z += this.state.rudder * controlEffectiveness * 6.0;
  }

  private updateAttitude(deltaTime: number): void {
    const momentOfInertia = this.config.momentOfInertia || {
      xx: 0.5,
      yy: 0.8,
      zz: 1.0
    };
    
    // Angular acceleration from moments
    const angularAcceleration = {
      x: this.moments.x / momentOfInertia.xx,
      y: this.moments.y / momentOfInertia.yy,
      z: this.moments.z / momentOfInertia.zz
    };
    
    // Update angular velocities
    this.state.angularVelocity.x += angularAcceleration.x * deltaTime;
    this.state.angularVelocity.y += angularAcceleration.y * deltaTime;
    this.state.angularVelocity.z += angularAcceleration.z * deltaTime;
    
    // Apply damping
    const damping = 0.95;
    this.state.angularVelocity.x *= damping;
    this.state.angularVelocity.y *= damping;
    this.state.angularVelocity.z *= damping;
    
    // Update attitude from angular velocities
    this.state.attitude.roll += this.state.angularVelocity.x * deltaTime;
    this.state.attitude.pitch += this.state.angularVelocity.y * deltaTime;
    this.state.attitude.yaw += this.state.angularVelocity.z * deltaTime;
    
    // Keep angles in reasonable ranges
    this.state.attitude.roll = this.normalizeAngle(this.state.attitude.roll);
    this.state.attitude.pitch = this.clampAngle(this.state.attitude.pitch, -Math.PI/2, Math.PI/2);
    this.state.attitude.yaw = this.normalizeAngle(this.state.attitude.yaw);
  }

  private applyConstraints(): void {
    // Ground collision (simplified)
    if (this.state.position.altitude < 0) {
      this.state.position.altitude = 0;
      
      // Crash or ground effect
      if (this.state.velocity.z < -2.0) {
        // Hard landing - reduce velocities significantly
        this.state.velocity.x *= 0.1;
        this.state.velocity.y *= 0.1;
        this.state.velocity.z = 0;
      } else {
        // Soft landing or taxi
        this.state.velocity.z = Math.max(0, this.state.velocity.z);
      }
    }
  }

  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  private clampAngle(angle: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, angle));
  }

  // Public interface methods
  getPosition(): Position {
    return { ...this.state.position };
  }

  getState(): FlightState {
    return {
      position: this.getPosition(),
      velocity: {
        north: this.state.velocity.y,
        east: this.state.velocity.x,
        down: -this.state.velocity.z
      },
      attitude: {
        roll: this.state.attitude.roll * 180 / Math.PI,   // Convert to degrees
        pitch: this.state.attitude.pitch * 180 / Math.PI,
        yaw: this.state.attitude.yaw * 180 / Math.PI
      },
      airspeed: Math.sqrt(
        this.state.velocity.x ** 2 + 
        this.state.velocity.y ** 2 + 
        this.state.velocity.z ** 2
      ),
      groundspeed: Math.sqrt(
        this.state.velocity.x ** 2 + 
        this.state.velocity.y ** 2
      ),
      verticalSpeed: this.state.velocity.z,
      throttle: this.state.throttle * 100, // Convert to percentage
      controlSurfaces: {
        aileron: this.state.aileron,
        elevator: this.state.elevator,
        rudder: this.state.rudder
      }
    };
  }

  applyNavigationCommands(commands: NavigationCommand[]): void {
    commands.forEach(command => {
      switch (command.type) {
        case 'altitude':
          // Simple altitude hold - adjust elevator
          const altitudeError = command.value - this.state.position.altitude;
          this.state.elevator = Math.max(-1, Math.min(1, altitudeError * 0.1));
          break;
          
        case 'heading':
          // Simple heading hold - adjust rudder
          const headingError = this.normalizeAngle(
            (command.value * Math.PI / 180) - this.state.attitude.yaw
          );
          this.state.rudder = Math.max(-1, Math.min(1, headingError * 0.5));
          break;
          
        case 'airspeed':
          // Simple airspeed hold - adjust throttle
          const currentAirspeed = Math.sqrt(
            this.state.velocity.x ** 2 + 
            this.state.velocity.y ** 2 + 
            this.state.velocity.z ** 2
          );
          const airspeedError = command.value - currentAirspeed;
          this.state.throttle = Math.max(0, Math.min(1, this.state.throttle + airspeedError * 0.01));
          break;
      }
    });
  }

  processCommand(command: Command): void {
    // Process manual control commands
    switch (command.commandType) {
      case 'parameter_set':
        const param = command.parameters.parameter as string;
        const value = command.parameters.value as number;
        
        switch (param) {
          case 'throttle':
            this.state.throttle = Math.max(0, Math.min(1, value / 100));
            break;
          case 'aileron':
            this.state.aileron = Math.max(-1, Math.min(1, value));
            break;
          case 'elevator':
            this.state.elevator = Math.max(-1, Math.min(1, value));
            break;
          case 'rudder':
            this.state.rudder = Math.max(-1, Math.min(1, value));
            break;
        }
        break;
        
      case 'emergency_land':
        // Emergency landing procedure
        this.state.throttle = 0.2; // Reduced power
        this.state.elevator = 0.3; // Nose down for controlled descent
        break;
        
      case 'return_to_home':
        // This would be handled by flight plan executor
        break;
    }
  }
}