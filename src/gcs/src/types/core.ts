import { z } from 'zod';

// Position Schema
export const PositionSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  altitude: z.number(),
  heading: z.number().optional(),
});

// Attitude Schema
export const AttitudeSchema = z.object({
  roll: z.number(),
  pitch: z.number(),
  yaw: z.number(),
  airspeed: z.number().optional(),
});

// Speed Schema  
export const SpeedSchema = z.object({
  airspeed: z.number(),
  groundspeed: z.number(),
  verticalSpeed: z.number(),
});

// Systems Schema
export const SystemsSchema = z.object({
  battery: z.number(),
  gpsSatellites: z.number(),
  gpsAccuracy: z.number(),
  datalinkRssi: z.number(),
});

// Environmental Schema
export const EnvironmentalSchema = z.object({
  temperature: z.number(),
  humidity: z.number(),
  pressure: z.number(),
  windSpeed: z.number(),
  windDirection: z.number(),
}).optional();

// Telemetry Schema
export const TelemetrySchema = z.object({
  aircraftId: z.string(),
  timestamp: z.string(),
  messageId: z.number(),
  position: PositionSchema,
  attitude: AttitudeSchema,
  speed: SpeedSchema,
  systems: SystemsSchema,
  environmental: EnvironmentalSchema,
});

// Command Schema
export const CommandSchema = z.object({
  aircraftId: z.string(),
  timestamp: z.string(),
  command: z.string(),
  parameters: z.record(z.any()),
  priority: z.enum(['low', 'normal', 'high', 'emergency']).default('normal'),
});

// Export types
export type Position = z.infer<typeof PositionSchema>;
export type Attitude = z.infer<typeof AttitudeSchema>;
export type Speed = z.infer<typeof SpeedSchema>;
export type Systems = z.infer<typeof SystemsSchema>;
export type Environmental = z.infer<typeof EnvironmentalSchema>;
export type Telemetry = z.infer<typeof TelemetrySchema>;
export type Command = z.infer<typeof CommandSchema>;