// Base interfaces for Paparazzi MCP tools

export interface BaseTool {
  name: string;
  description: string;
  inputSchema: any;
  execute(args: any): Promise<any>;
}

// Common types used across tools
export interface Position {
  lat: number;
  lon: number;
  altitude: number;
}

export interface SystemStatus {
  timestamp: string;
  aircraftId: number;
  connection: {
    status: 'connected' | 'disconnected' | 'error' | 'unknown';
    lastSeen: string;
    signalStrength: number;
  };
  autopilot: {
    mode: string;
    armed: boolean;
    firmware: string;
  };
  battery: {
    voltage: number;
    current: number;
    remaining: number;
  };
  gps: {
    fix: boolean;
    satellites: number;
    hdop: number;
  };
  attitude: {
    roll: number;
    pitch: number;
    yaw: number;
  };
  errors: string[];
  warnings: string[];
}

export interface TelemetryConfig {
  port: string;
  baudRate: number;
  aircraftId: number;
  protocol: string;
  timeout: number;
}

export interface IMUCalibration {
  accelerometer: {
    offset: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
  };
  gyroscope: {
    bias: { x: number; y: number; z: number };
  };
  magnetometer: {
    offset: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
  };
  timestamp: string;
  valid: boolean;
}

export interface IMUData {
  accelerometer: Array<{
    x: number;
    y: number;
    z: number;
    timestamp: string;
  }>;
  gyroscope: Array<{
    x: number;
    y: number;
    z: number;
    timestamp: string;
  }>;
  magnetometer: Array<{
    x: number;
    y: number;
    z: number;
    timestamp: string;
  }>;
}

export interface SafetyCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  critical: boolean;
}

export interface TelemetryMessage {
  timestamp: string;
  messageType: string;
  data: Record<string, any>;
}

export interface WeatherConditions {
  windSpeed: number; // m/s
  windDirection: number; // degrees
  temperature: number; // celsius
  humidity: number; // percentage
  pressure: number; // hPa
  visibility: number; // km
}

export interface FlightPlan {
  aircraftId: string;
  name: string;
  waypoints: Waypoint[];
  blocks: FlightBlock[];
  settings: FlightPlanSettings;
  safetyEnvelope: SafetyEnvelope;
  missionType: string;
  operatingArea: BoundingBox;
}

export interface Waypoint {
  id: string;
  name: string;
  position: Position;
  type: 'waypoint' | 'home' | 'landing' | 'takeoff';
  actions?: string[];
}

export interface FlightBlock {
  name: string;
  stages: FlightStage[];
  condition?: string;
}

export interface FlightStage {
  name: string;
  actions: FlightAction[];
  duration?: number;
  condition?: string;
}

export interface FlightAction {
  type: string;
  parameters: Record<string, any>;
}

export interface FlightPlanSettings {
  maxDistanceFromHome: number;
  groundAlt: number;
  securityHeight: number;
  alt: number;
}

export interface SafetyEnvelope {
  maxAltitude: number;
  minAltitude: number;
  maxDistanceFromHome: number;
  maxWindSpeed: number;
  minBatteryLevel: number;
  maxLatency: number;
  geofence?: GeofencePolygon;
}

export interface GeofencePolygon {
  points: Position[];
  type: 'inclusion' | 'exclusion';
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface AirQualitySensor {
  pm25: number; // µg/m³
  pm10: number; // µg/m³
  co: number; // ppm
  no2: number; // ppb
  o3: number; // ppb
  so2: number; // ppb
}

export interface SmokeParticleData {
  density: number; // particles/cm³
  size: number; // µm average
  composition: string[];
}

export interface WindData {
  speed: number; // m/s
  direction: number; // degrees
  gusts: number; // m/s
  verticalComponent: number; // m/s
}

export interface ImageData {
  width: number;
  height: number;
  data: Uint8Array;
  format: 'rgb' | 'rgba' | 'grayscale';
  timestamp: string;
}

export interface ThermalImageData extends ImageData {
  temperatureRange: [number, number]; // min, max celsius
  calibrationData: any;
}

// Paparazzi specific types
export interface PaparazziAirframeConfig {
  name: string;
  firmware: 'fixedwing' | 'rotorcraft';
  board: string;
  subsystems: PaparazziSubsystems;
  commands: Command[];
  servos: Servo[];
  sections: ConfigSection[];
  modules: Module[];
}

export interface PaparazziSubsystems {
  imu?: { type: string; options?: Record<string, any> };
  ahrs?: { type: string; options?: Record<string, any> };
  gps?: { type: string; baud?: number };
  telemetry?: { type: 'transparent' | 'xbee_api'; baud?: number };
  radio_control?: { type: 'ppm' | 'spektrum' | 'sbus' };
  actuators?: { type: string; options?: Record<string, any> };
}

export interface Command {
  name: string;
  failsafeValue: number;
}

export interface Servo {
  name: string;
  no: number;
  min: number;
  neutral: number;
  max: number;
}

export interface ConfigSection {
  name: string;
  prefix?: string;
  defines: ConfigDefine[];
}

export interface ConfigDefine {
  name: string;
  value: string | number;
  unit?: string;
}

export interface Module {
  name: string;
  type?: string;
  options?: Record<string, any>;
}

export interface BatteryConfiguration {
  maxVoltage: number;
  criticalVoltage: number;
  lowVoltage: number;
  catastrophicVoltage: number;
  currentAtFullThrottle: number; // mA
}

// XBee configuration types
export interface XBeeConfig {
  port: string;
  baudRate: number;
  channel: number;
  power?: number;
  powerLevel: number;
  networkId: number;
  aircraftId: number;
  mode: 'coordinator' | 'end_device';
}

export interface SerialConfig {
  port: string;
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: 'none' | 'even' | 'odd';
}

export interface ConfigValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface LinkTestResults {
  packetsSent: number;
  packetsReceived: number;
  packetLoss: number; // percentage
  averageLatency: number; // ms
  signalStrength: number; // dBm
  linkQuality: number; // percentage
}

// Calibration types
export interface CalibrationResults {
  offsets: [number, number, number];
  scales: [number, number, number];
  quality: number; // 0-100%
  temperature: number;
  timestamp: string;
}

// Human guidance types
export interface HumanInstruction {
  stepNumber: number;
  title: string;
  description: string;
  visualAid?: string; // URL to image/video
  duration: number; // estimated seconds
  verification: VerificationMethod;
  criticalSafety: boolean;
}

export interface VerificationMethod {
  type: 'visual' | 'measurement' | 'system_check' | 'user_confirm';
  description: string;
  expectedValue?: any;
  tolerance?: number;
}

export interface ReadyButtonConfig {
  enabled: boolean;
  text: string;
  action: string;
  confirmationRequired: boolean;
  confirmationText?: string;
}

export interface HumanAction {
  action: string;
  description: string;
  priority: 'critical' | 'important' | 'optional';
  completed?: boolean;
  timeEstimate: number; // seconds
}

// Safety and risk assessment types
export interface RiskAssessment {
  overallRisk: number; // 0-100%
  riskFactors: {
    weather: number;
    battery: number;
    distance: number;
    altitude: number;
    communications: number;
    mechanical: number;
  };
  aiAnalysis: string;
  timeToIntervention?: number; // seconds
}

export interface SafetyViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  recommendedAction: string;
}

export interface SafetyAction {
  action: string;
  reason: string;
  executed: boolean;
  timestamp: string;
  result?: string;
}

export interface EmergencyProcedure {
  name: string;
  description: string;
  steps: string[];
  estimatedTime: number; // seconds
  criticalActions: string[];
}

// AIS and traffic types
export interface TrackedAircraft {
  id: string;
  callsign: string;
  location: Position;
  velocity: { speed: number; heading: number; verticalRate: number };
  aircraftType: string;
  lastUpdate: string;
}

export interface CollisionRisk {
  targetId: string;
  riskLevel: number; // 0-100%
  timeToClosest: number; // seconds
  closestDistance: number; // meters
  recommendedAction: 'monitor' | 'climb' | 'descend' | 'turn' | 'land';
}

export interface AvoidanceManeuver {
  type: 'climb' | 'descend' | 'turn_left' | 'turn_right' | 'hold' | 'land';
  parameters: Record<string, number>;
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  description: string;
}

export interface FlightPlanModification {
  type: 'waypoint_change' | 'altitude_change' | 'route_deviation' | 'mission_abort';
  modifications: any[];
  reason: string;
  temporary: boolean;
}