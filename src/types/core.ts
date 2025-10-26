import { z } from 'zod';

// Geographic position schema
export const PositionSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number(), // meters above ground level
});

export type Position = z.infer<typeof PositionSchema>;

// Aircraft attitude schema
export const AttitudeSchema = z.object({
  roll: z.number(), // degrees
  pitch: z.number(), // degrees
  yaw: z.number(), // degrees (0-360)
});

export type Attitude = z.infer<typeof AttitudeSchema>;

// Speed information schema
export const SpeedSchema = z.object({
  airspeed: z.number(), // m/s
  groundspeed: z.number(), // m/s
  verticalSpeed: z.number(), // m/s (positive = climbing)
});

export type Speed = z.infer<typeof SpeedSchema>;

// System health schema
export const SystemHealthSchema = z.object({
  battery: z.number().min(0).max(100), // percentage
  fuel: z.number().min(0).max(100).optional(), // percentage for fuel aircraft
  gpsSatellites: z.number().min(0),
  gpsAccuracy: z.number().min(0), // meters
  datalinkRssi: z.number(), // dBm
  cpuLoad: z.number().min(0).max(100), // percentage
  temperature: z.number(), // Celsius
});

export type SystemHealth = z.infer<typeof SystemHealthSchema>;

// Environmental data schema
export const EnvironmentalDataSchema = z.object({
  temperature: z.number(), // Celsius
  humidity: z.number().min(0).max(100), // percentage
  pressure: z.number(), // hPa
  windSpeed: z.number().min(0), // m/s
  windDirection: z.number().min(0).max(360), // degrees
  airQuality: z.object({
    co2: z.number().optional(), // ppm
    pm25: z.number().optional(), // μg/m³
    pm10: z.number().optional(), // μg/m³
  }).optional(),
});

export type EnvironmentalData = z.infer<typeof EnvironmentalDataSchema>;

// Complete telemetry message schema
export const TelemetrySchema = z.object({
  timestamp: z.string(), // ISO 8601 format
  aircraftId: z.string(),
  messageId: z.number(),
  position: PositionSchema,
  attitude: AttitudeSchema,
  speed: SpeedSchema,
  systems: SystemHealthSchema,
  environmental: EnvironmentalDataSchema.optional(),
});

export type Telemetry = z.infer<typeof TelemetrySchema>;

// Waypoint schema
export const WaypointSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  position: PositionSchema,
  type: z.enum(['takeoff', 'waypoint', 'survey', 'circle', 'landing', 'home']),
  actions: z.array(z.string()).optional(),
  radius: z.number().optional(), // for circle waypoints
  duration: z.number().optional(), // seconds to stay at waypoint
});

export type Waypoint = z.infer<typeof WaypointSchema>;

// Flight plan schema
export const FlightPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  aircraftId: z.string(),
  waypoints: z.array(WaypointSchema),
  parameters: z.object({
    cruiseSpeed: z.number(), // m/s
    cruiseAltitude: z.number(), // m AGL
    maxAltitude: z.number(), // m AGL
    fuelLimit: z.number().optional(), // minutes
    batteryLimit: z.number().optional(), // minutes
    weatherLimits: z.object({
      maxWind: z.number(), // m/s
      minVisibility: z.number(), // meters
      maxTemperature: z.number().optional(), // Celsius
      minTemperature: z.number().optional(), // Celsius
    }),
  }),
  createdAt: z.string(), // ISO 8601
  updatedAt: z.string(), // ISO 8601
});

export type FlightPlan = z.infer<typeof FlightPlanSchema>;

// Command schema for aircraft control
export const CommandSchema = z.object({
  timestamp: z.string(),
  source: z.string(),
  destination: z.string(),
  commandType: z.enum([
    'waypoint_update',
    'flight_plan_upload',
    'parameter_set',
    'mission_start',
    'mission_pause',
    'mission_abort',
    'return_to_home',
    'emergency_land',
  ]),
  parameters: z.record(z.unknown()),
  priority: z.enum(['low', 'normal', 'high', 'emergency']),
  requiresAck: z.boolean().default(true),
});

export type Command = z.infer<typeof CommandSchema>;

// Flight envelope constraints
export const FlightEnvelopeSchema = z.object({
  airspeed: z.object({
    minimum: z.number(), // m/s
    maximum: z.number(), // m/s
    cruise: z.number(), // m/s
  }),
  altitude: z.object({
    minimum: z.number(), // m AGL
    maximum: z.number(), // m AGL
    cruise: z.number(), // m AGL
  }),
  bankAngle: z.object({
    maximum: z.number(), // degrees
  }),
  weather: z.object({
    maxWindSpeed: z.number(), // m/s
    minVisibility: z.number(), // meters
    maxTurbulence: z.enum(['light', 'moderate', 'severe']),
  }),
});

export type FlightEnvelope = z.infer<typeof FlightEnvelopeSchema>;

// MCP message schemas
export const MCPRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.record(z.unknown()),
  id: z.union([z.string(), z.number()]),
});

export type MCPRequest = z.infer<typeof MCPRequestSchema>;

export const MCPResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  result: z.record(z.unknown()).optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.unknown().optional(),
  }).optional(),
  id: z.union([z.string(), z.number()]),
});

export type MCPResponse = z.infer<typeof MCPResponseSchema>;

// Aircraft configuration schema
export const AircraftConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['fixed_wing', 'rotorcraft', 'vtol']),
  hardware: z.object({
    autopilot: z.enum(['lisa_l', 'lisa_m', 'umarim_lite', 'twog', 'custom_stm32']),
    processor: z.enum(['stm32f1', 'stm32f4', 'stm32f7', 'lpc21xx']),
    sensors: z.array(z.string()),
    radio: z.enum(['xbee_pro', 'lora', 'wifi']),
  }),
  flightEnvelope: FlightEnvelopeSchema,
  missions: z.array(z.string()).optional(), // mission IDs
});

export type AircraftConfig = z.infer<typeof AircraftConfigSchema>;

// Mission status enum
export const MissionStatus = z.enum([
  'planning',
  'ready',
  'active',
  'paused',
  'completed',
  'aborted',
  'emergency',
]);

export type MissionStatusType = z.infer<typeof MissionStatus>;

// Safety alert levels
export const SafetyAlertLevel = z.enum([
  'info',
  'warning',
  'caution',
  'critical',
  'emergency',
]);

export type SafetyAlertLevelType = z.infer<typeof SafetyAlertLevel>;

// Safety alert schema
export const SafetyAlertSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  aircraftId: z.string(),
  level: SafetyAlertLevel,
  category: z.enum([
    'system',
    'navigation',
    'weather',
    'fuel',
    'communication',
    'mission',
  ]),
  message: z.string(),
  data: z.record(z.unknown()).optional(),
  acknowledged: z.boolean().default(false),
});

export type SafetyAlert = z.infer<typeof SafetyAlertSchema>;

// Flight simulation types
export const FlightStateSchema = z.object({
  position: PositionSchema,
  velocity: z.object({
    north: z.number(), // m/s
    east: z.number(), // m/s
    down: z.number(), // m/s
  }),
  attitude: AttitudeSchema,
  airspeed: z.number(), // m/s
  groundspeed: z.number(), // m/s
  verticalSpeed: z.number(), // m/s
  throttle: z.number().min(0).max(100), // percentage
  controlSurfaces: z.object({
    aileron: z.number().min(-1).max(1),
    elevator: z.number().min(-1).max(1),
    rudder: z.number().min(-1).max(1),
  }),
});

export type FlightState = z.infer<typeof FlightStateSchema>;

export const NavigationCommandSchema = z.object({
  type: z.enum(['altitude', 'heading', 'airspeed', 'waypoint']),
  value: z.number(),
  timestamp: z.string(),
});

export type NavigationCommand = z.infer<typeof NavigationCommandSchema>;

export const SimulatorConfigSchema = z.object({
  port: z.number(),
  simulationFrequency: z.number().default(50), // Hz
  enableFlightGear: z.boolean().default(false),
  realtimeFactor: z.number().default(1.0), // 1.0 = real time
});

export type SimulatorConfig = z.infer<typeof SimulatorConfigSchema>;

export const SimulationStateSchema = z.object({
  isRunning: z.boolean(),
  totalTime: z.number(), // seconds
  flightPhase: z.enum(['ground', 'takeoff', 'climb', 'cruise', 'descent', 'approach', 'landing']),
  lastCommandTime: z.string().optional(),
});

export type SimulationState = z.infer<typeof SimulationStateSchema>;