# Paparazzi MCP Tools for LLM-Controlled Operations

This document defines Model Context Protocol (MCP) tools that enable an LLM to autonomously manage all aspects of Paparazzi UAV operations, from firmware flashing to mission execution.

## MCP Tool Specifications

### 1. Firmware Management Tools

#### `flash_autopilot_firmware`
**Purpose**: Compile and flash firmware to autopilot based on airframe configuration
**Usage**: LLM can prepare autopilot for specific mission requirements

```typescript
interface FlashAutopilotFirmwareInput {
  aircraftId: string;
  airframeFile: string; // Path to XML airframe configuration
  target: 'ap' | 'sim' | 'fbw'; // Target board type
  board: string; // e.g., 'lisa_m_2.0', 'tiny_2.11', 'stm32f4_discovery'
  forceRebuild?: boolean;
}

interface FlashAutopilotFirmwareOutput {
  success: boolean;
  compilationLog: string;
  flashingLog: string;
  firmwareVersion: string;
  checksum: string;
  estimatedTime: number; // seconds
  nextSteps: string[];
}
```

**Implementation Strategy**:
- Wraps Paparazzi Center compilation process
- Executes: `make TARGET=ap AIRCRAFT=<aircraftId> clean_ac upload`
- Monitors compilation output for errors
- Verifies successful flash via USB/JTAG

#### `configure_airframe`
**Purpose**: Generate and validate airframe XML configuration
**Usage**: LLM can create custom airframe configs for specific missions

```typescript
interface ConfigureAirframeInput {
  aircraftName: string;
  aircraftType: 'fixedwing' | 'rotorcraft';
  board: string;
  firmware: 'fixedwing' | 'rotorcraft';
  subsystems: {
    imu: { type: string; options?: Record<string, any> };
    ahrs: { type: string; options?: Record<string, any> };
    gps: { type: string; baud?: number };
    telemetry: { type: 'transparent' | 'xbee_api'; baud?: number };
    radio_control?: { type: 'ppm' | 'spektrum' | 'sbus' };
  };
  flightParameters: {
    maxAltitude: number;
    maxDistanceFromHome: number;
    nominalAirspeed?: number;
    batteryConfig: BatteryConfiguration;
  };
}

interface BatteryConfiguration {
  maxVoltage: number;
  criticalVoltage: number;
  lowVoltage: number;
  catastrophicVoltage: number;
  currentAtFullThrottle: number; // mA
}
```

### 2. Communication & Telemetry Tools

#### `configure_xbee_modems`
**Purpose**: Configure XBee modems for encrypted telemetry link
**Usage**: LLM establishes secure communication between aircraft and GCS

```typescript
interface ConfigureXBeeInput {
  groundModemPort: string; // e.g., '/dev/ttyUSB0'
  aircraftModemPort?: string; // If directly connected
  networkId: string; // PAN ID for network isolation
  encryptionKey: string; // AES-128 key
  baudRate: number; // 9600, 57600, 115200
  channels: number[]; // Frequency hopping channels
  coordinatorAddress?: string;
  nodeAddresses: { [aircraftId: string]: string };
}

interface ConfigureXBeeOutput {
  success: boolean;
  groundModemConfig: XBeeConfig;
  aircraftModemConfig?: XBeeConfig;
  signalStrength: number; // dBm
  linkQuality: number; // 0-100%
  encryptionEnabled: boolean;
  testResults: LinkTestResults;
}

interface XBeeConfig {
  address: string;
  panId: string;
  channel: number;
  baudRate: number;
  apiMode: number;
  encryptionEnabled: boolean;
  powerLevel: number;
}
```

#### `establish_telemetry_link`
**Purpose**: Verify and optimize telemetry communication
**Usage**: LLM ensures reliable data link before flight

```typescript
interface EstablishTelemetryInput {
  aircraftId: string;
  modemPort: string;
  baudRate: number;
  timeout: number; // seconds
  testDuration: number; // seconds for link quality test
}

interface TelemetryLinkOutput {
  connected: boolean;
  signalStrength: number;
  linkQuality: number;
  latency: number; // ms
  packetLoss: number; // percentage
  messagesReceived: TelemetryMessage[];
  systemStatus: SystemStatus;
  recommendations: string[];
}

interface SystemStatus {
  gpsStatus: 'no_fix' | '2d_fix' | '3d_fix';
  imuStatus: 'initializing' | 'calibrating' | 'ready';
  batteryVoltage: number;
  controlMode: 'manual' | 'auto1' | 'auto2';
  flightPlanLoaded: boolean;
  safetyChecks: SafetyCheck[];
}
```

### 3. System Preparation Tools

#### `calibrate_imu`
**Purpose**: Guide IMU calibration process
**Usage**: LLM ensures accurate attitude estimation before flight

```typescript
interface CalibrateIMUInput {
  aircraftId: string;
  calibrationType: 'accel' | 'mag' | 'gyro' | 'full';
  timeout: number; // seconds
  environmentInfo?: {
    temperature: number;
    magneticDeclination: number;
    location: { lat: number; lon: number };
  };
}

interface CalibrateIMUOutput {
  success: boolean;
  calibrationData: {
    accelerometer: CalibrationResults;
    magnetometer: CalibrationResults;
    gyroscope: CalibrationResults;
  };
  qualityScore: number; // 0-100%
  humanInstructions: string[];
  estimatedAccuracy: {
    roll: number; // degrees
    pitch: number; // degrees  
    heading: number; // degrees
  };
}

interface CalibrationResults {
  offsets: [number, number, number];
  scales: [number, number, number];
  quality: number; // 0-100%
  temperature: number;
  timestamp: string;
}
```

#### `prepare_flight_systems`
**Purpose**: Comprehensive pre-flight system check
**Usage**: LLM verifies all systems ready for autonomous operation

```typescript
interface PrepareFlightInput {
  aircraftId: string;
  missionType: 'survey' | 'monitoring' | 'patrol' | 'custom';
  flightPlan: string; // Path to flight plan XML
  weather?: WeatherConditions;
  checksRequired: SystemCheck[];
}

interface PrepareFlightOutput {
  readyForFlight: boolean;
  systemStatus: DetailedSystemStatus;
  humanActions: HumanAction[];
  safetyWarnings: string[];
  estimatedFlightTime: number; // minutes
  energyConsumption: number; // mAh estimated
  checklistComplete: boolean;
}

interface HumanAction {
  action: string;
  description: string;
  priority: 'critical' | 'important' | 'optional';
  completed?: boolean;
  timeEstimate: number; // seconds
}
```

### 4. Mission Control Tools

#### `upload_flight_plan`
**Purpose**: Upload and verify flight plan on autopilot
**Usage**: LLM can dynamically create and upload missions

```typescript
interface UploadFlightPlanInput {
  aircraftId: string;
  flightPlan: FlightPlan | string; // TypeScript object or XML path
  validate: boolean;
  simulate?: boolean; // Test in simulation first
}

interface UploadFlightPlanOutput {
  success: boolean;
  planId: string;
  checksum: string;
  validationResults: ValidationResult[];
  estimatedFlightTime: number;
  safetyAnalysis: SafetyAnalysis;
  autopilotResponse: string;
}

interface ValidationResult {
  type: 'error' | 'warning' | 'info';
  message: string;
  lineNumber?: number;
  suggestion?: string;
}
```

#### `detect_launch`
**Purpose**: Monitor IMU for launch detection
**Usage**: LLM detects when human launches aircraft

```typescript
interface DetectLaunchInput {
  aircraftId: string;
  timeout: number; // seconds to wait for launch
  accelerationThreshold: number; // g-force threshold
  sustainedDuration: number; // ms of sustained acceleration
}

interface DetectLaunchOutput {
  launched: boolean;
  launchTime?: string;
  launchAcceleration?: number; // peak g-force
  launchVector?: [number, number, number]; // x,y,z acceleration
  postLaunchStatus: PostLaunchStatus;
  nextActions: string[];
}

interface PostLaunchStatus {
  altitude: number;
  airspeed?: number;
  groundSpeed: number;
  heading: number;
  controlMode: string;
  engineStatus: string;
  criticalSystems: SystemCheck[];
}
```

### 5. Safety & Monitoring Tools

#### `monitor_flight_safety`
**Purpose**: Continuous AI-powered safety monitoring
**Usage**: LLM monitors flight and triggers interventions

```typescript
interface MonitorFlightSafetyInput {
  aircraftId: string;
  monitoringDuration: number; // seconds, -1 for continuous
  safetyEnvelope: SafetyEnvelope;
  aiAnalysisEnabled: boolean;
  interventionMode: 'alert' | 'recommend' | 'automatic';
}

interface SafetyEnvelope {
  maxAltitude: number;
  minAltitude: number;
  maxDistanceFromHome: number;
  maxWindSpeed: number;
  minBatteryLevel: number;
  maxLatency: number; // ms
  geofence?: GeofencePolygon;
}

interface MonitorFlightSafetyOutput {
  safetyStatus: 'safe' | 'caution' | 'warning' | 'critical';
  currentRisk: RiskAssessment;
  violations: SafetyViolation[];
  aiRecommendations: string[];
  automaticActions: SafetyAction[];
  emergencyProcedures?: EmergencyProcedure[];
}

interface RiskAssessment {
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
```

#### `analyze_wildfire_risk`
**Purpose**: AI analysis for wildfire detection and monitoring
**Usage**: LLM processes sensor data for fire detection

```typescript
interface AnalyzeWildfireInput {
  aircraftId: string;
  sensorData: {
    temperature: number;
    humidity: number;
    airQuality: AirQualitySensor[];
    visualSpectrum?: ImageData;
    infrared?: ThermalImageData;
    smokeDetection?: SmokeParticleData;
  };
  location: { lat: number; lon: number; altitude: number };
  windConditions: WindData;
}

interface AnalyzeWildfireOutput {
  fireRisk: number; // 0-100%
  fireDetected: boolean;
  fireLocation?: { lat: number; lon: number };
  fireIntensity?: number;
  spreadDirection?: number; // degrees
  recommendations: string[];
  alertLevel: 'green' | 'yellow' | 'orange' | 'red';
  evacuationZones?: GeofencePolygon[];
  reportGenerated: boolean;
}
```

#### `track_aircraft_ais`
**Purpose**: Monitor AIS transponders for collision avoidance
**Usage**: LLM tracks manned aircraft and adjusts flight path

```typescript
interface TrackAircraftAISInput {
  region: BoundingBox;
  aircraftLocation: { lat: number; lon: number; altitude: number };
  safetyRadius: number; // meters
  altitudeSeparation: number; // meters
  timeHorizon: number; // seconds to look ahead
}

interface TrackAircraftAISOutput {
  trackedAircraft: TrackedAircraft[];
  collisionRisks: CollisionRisk[];
  avoidanceManeuvers: AvoidanceManeuver[];
  flightPlanAdjustments: FlightPlanModification[];
  alertLevel: 'clear' | 'monitor' | 'caution' | 'avoid';
}

interface TrackedAircraft {
  id: string;
  callsign: string;
  location: { lat: number; lon: number; altitude: number };
  velocity: { speed: number; heading: number; verticalRate: number };
  aircraftType: string;
  lastUpdate: string;
}

interface CollisionRisk {
  targetId: string;
  riskLevel: number; // 0-100%
  timeToClosest: number; // seconds
  closestDistance: number; // meters
  recommendedAction: 'monitor' | 'climb' | 'descend' | 'turn' | 'land';
}
```

### 6. Human Interface Tools

#### `provide_human_guidance`
**Purpose**: Generate step-by-step instructions for human operator
**Usage**: LLM guides human through setup and operation procedures

```typescript
interface ProvideHumanGuidanceInput {
  operation: 'setup' | 'calibration' | 'pre-flight' | 'launch' | 'emergency';
  currentStep?: number;
  systemStatus: SystemStatus;
  equipmentAvailable: string[];
}

interface ProvideHumanGuidanceOutput {
  instructions: HumanInstruction[];
  currentStepIndex: number;
  estimatedTimeRemaining: number; // minutes
  safetyWarnings: string[];
  readyButton: ReadyButtonConfig;
  troubleshooting?: TroubleshootingGuide;
}

interface HumanInstruction {
  stepNumber: number;
  title: string;
  description: string;
  visualAid?: string; // URL to image/video
  duration: number; // estimated seconds
  verification: VerificationMethod;
  criticalSafety: boolean;
}

interface ReadyButtonConfig {
  enabled: boolean;
  text: string;
  action: string;
  confirmationRequired: boolean;
  confirmationText?: string;
}
```

## LLM Integration Examples

### Example 1: Complete Autopilot Preparation
```typescript
// LLM workflow for preparing autopilot
async function prepareAutopilotForFlight(missionRequirements: MissionRequirements) {
  // 1. Configure airframe for mission
  const airframeConfig = await configureAirframe({
    aircraftName: missionRequirements.aircraftId,
    aircraftType: 'fixedwing',
    board: 'lisa_m_2.0',
    firmware: 'fixedwing',
    subsystems: {
      imu: { type: 'aspirin_v2.1' },
      ahrs: { type: 'int_cmpl_quat' },
      gps: { type: 'ublox', baud: 38400 },
      telemetry: { type: 'xbee_api', baud: 57600 }
    },
    flightParameters: missionRequirements.flightEnvelope
  });

  // 2. Flash firmware
  const flashResult = await flashAutopilotFirmware({
    aircraftId: missionRequirements.aircraftId,
    airframeFile: airframeConfig.filePath,
    target: 'ap',
    board: 'lisa_m_2.0'
  });

  // 3. Configure XBee modems
  const xbeeConfig = await configureXBeeModems({
    groundModemPort: '/dev/ttyUSB0',
    networkId: 'PPRZ_NET',
    encryptionKey: generateSecureKey(),
    baudRate: 57600,
    nodeAddresses: { [missionRequirements.aircraftId]: '0x1234' }
  });

  // 4. Guide human through setup
  const guidance = await provideHumanGuidance({
    operation: 'setup',
    systemStatus: flashResult.systemStatus,
    equipmentAvailable: ['xbee_modem', 'usb_cable', 'battery']
  });

  return {
    ready: flashResult.success && xbeeConfig.success,
    nextSteps: guidance.instructions,
    readyForCalibration: true
  };
}
```

### Example 2: Mission Execution with AI Safety
```typescript
async function executeMissionWithAISafety(flightPlan: FlightPlan) {
  // 1. Upload flight plan
  await uploadFlightPlan({
    aircraftId: flightPlan.aircraftId,
    flightPlan: flightPlan,
    validate: true,
    simulate: true
  });

  // 2. Start safety monitoring
  const safetyMonitor = await monitorFlightSafety({
    aircraftId: flightPlan.aircraftId,
    monitoringDuration: -1, // continuous
    safetyEnvelope: flightPlan.safetyEnvelope,
    aiAnalysisEnabled: true,
    interventionMode: 'automatic'
  });

  // 3. Wait for launch detection
  const launchResult = await detectLaunch({
    aircraftId: flightPlan.aircraftId,
    timeout: 300, // 5 minutes
    accelerationThreshold: 2.0, // g-force
    sustainedDuration: 1000 // 1 second
  });

  // 4. Monitor for wildfire (if applicable)
  if (flightPlan.missionType === 'wildfire_monitoring') {
    setInterval(async () => {
      const fireAnalysis = await analyzeWildfireRisk({
        aircraftId: flightPlan.aircraftId,
        sensorData: await getCurrentSensorData(),
        location: await getCurrentLocation(),
        windConditions: await getWindConditions()
      });
      
      if (fireAnalysis.fireDetected) {
        await sendEmergencyAlert(fireAnalysis);
      }
    }, 30000); // Check every 30 seconds
  }

  // 5. Continuous AIS monitoring
  setInterval(async () => {
    const aisTracking = await trackAircraftAIS({
      region: flightPlan.operatingArea,
      aircraftLocation: await getCurrentLocation(),
      safetyRadius: 1000, // 1km safety radius
      altitudeSeparation: 150, // 150m vertical separation
      timeHorizon: 300 // 5 minutes lookahead
    });

    if (aisTracking.collisionRisks.length > 0) {
      await executeAvoidanceManeuver(aisTracking.avoidanceManeuvers[0]);
    }
  }, 10000); // Check every 10 seconds

  return { missionStarted: true, aiSafetyActive: true };
}
```

## Human-LLM Interaction Flow

1. **Human Request**: "Prepare the autopilot for a wildfire monitoring mission"

2. **LLM Actions**:
   - Configures airframe for fire monitoring sensors
   - Flashes appropriate firmware
   - Sets up encrypted XBee communication
   - Generates human instruction checklist

3. **Human Guidance**: LLM provides step-by-step instructions:
   - "Connect USB cable to autopilot"
   - "Power on the autopilot board"
   - "Wait for green LED to confirm firmware flash"
   - "Install XBee modem in ground station"
   - "Place aircraft on level surface for IMU calibration"

4. **Ready Button**: Enabled when all systems verified

5. **Mission Execution**: LLM autonomously manages flight with human oversight

This MCP tool system enables the vision of "LLMs have methods and tools to do about everything. The humans are just pushing buttons or telling the LLM what the mission is" while maintaining safety and human oversight.