# Paparazzi System Architecture Analysis & Modernization Strategy

## Executive Summary

This document analyzes the current Paparazzi UAV autopilot system architecture to design a modernization strategy that preserves the proven flight control systems while adding modern interfaces, encrypted communications, and AI-powered safety monitoring.

**Core Philosophy**: "Retain as much of that logic as possible so the new code is essentially functionally equivalent just without the old dependencies" - preserving Paparazzi's rock-solid flight control while modernizing the user experience.

## Current Paparazzi Architecture

### 1. Autopilot System (Airframe Firmware)
**Location**: `sw/airborne/`
**Purpose**: Core flight control, navigation, and safety systems

#### Key Components to PRESERVE:
- **Kalman Filtering** (`estimator.c`): Proven state estimation with multiple filter implementations
- **AHRS/INS Systems** (`ins_*.c`): Multiple attitude/heading reference systems (quaternion, DCM)
- **Navigation Functions** (`navigation.c`): Waypoint navigation, circle patterns, survey modes
- **Flight Plan Execution**: Block/stage state machine for mission execution
- **Safety Systems**: Altitude limits, distance checks, automatic failsafes

#### Flight Control Proven Systems:
```c
// Kalman filtering - KEEP UNCHANGED
float estimator_z, estimator_z_dot;
float estimator_phi, estimator_theta, estimator_psi;

// AHRS systems - KEEP UNCHANGED  
struct Ahrs ahrs;
void ahrs_update_gps(void);
void ahrs_update_accel(void);
void ahrs_update_mag(void);

// Navigation - KEEP UNCHANGED
void nav_init(void);
bool_t nav_approaching_from(uint8_t wp_idx, uint8_t from_idx, int16_t approaching_time);
void nav_circle_XY(float x, float y, float radius);
```

### 2. Communication Layer
**Current**: XBee API protocol + Ivy bus messaging
**Enhancement**: Add encryption wrapper while preserving protocol

#### XBee Telemetry (PRESERVE + ENCRYPT):
```c
// Current XBee implementation - keep protocol, add encryption
xbee_tx_header_t tx_header;
tx_header.api_id = XBEE_TX_REQUEST;
tx_header.frame_id = 1;
tx_header.destination = XBEE_ADDR_COORDINATOR;
tx_header.options = 0;

// NEW: Encrypted wrapper around existing protocol
uint8_t encrypted_payload[XBEE_MAX_PAYLOAD];
encrypt_aes256(raw_payload, payload_len, encrypted_payload);
```

#### Message Types (PRESERVE):
- **GPS**: Position, course, altitude
- **ATTITUDE**: Roll, pitch, yaw rates
- **NAVIGATION**: Current block, waypoint distances
- **DESIRED**: Commanded altitude, course
- **ENGINE_STATUS**: Throttle, RPM
- **ENERGY**: Battery voltage, current

### 3. Ground Control Station (MODERNIZE)
**Current**: OCaml-based desktop application
**Replacement**: React/TypeScript web interface

#### Current GCS Functions to Replace:
- Mission planning with XML flight plans → **Visual drag/drop editor** ✓ DONE
- Real-time telemetry display → **Modern dashboard**
- Aircraft control commands → **Web-based control panel**
- Flight plan upload → **Wireless mission updates**

### 4. SRTM Terrain System (ENHANCE)
**Current**: Local SRTM file processing
**Enhancement**: Online terrain data + AI terrain analysis

#### Current Implementation (PRESERVE):
```ocaml
(* SRTM altitude lookup - keep algorithm, modernize data source *)
val of_wgs84 : Latlong.geographic -> int
val horizon_slope : Latlong.geographic -> int -> float -> float -> float -> float

(* Safety checks - preserve logic *)
let height = alt_m - srtm_alt_m in
if height > 150 then set_to_HOME ()
```

#### Enhanced Terrain Awareness:
- Real-time SRTM data download
- AI-powered terrain analysis for optimal flight paths
- Predictive obstacle avoidance
- Dynamic altitude adjustments for terrain following

### 5. Build System (MODERNIZE)
**Current**: Makefile-based compilation for embedded targets
**Replacement**: Web-based compilation and flashing

#### Current Build Process (TO REPLACE):
```makefile
# Multiple target architectures - abstract into web service
ARCH = lpc21 | stm32 | avr
BOARD = lisa_m | tiny | classix | navgo

# Board-specific configurations - preserve logic
BOARD_CFG = "boards/$(BOARD)_$(BOARD_VERSION).h"
GPS_PORT = UART0
MODEM_PORT = UART1
```

## Modernized System Architecture

### 1. Preserved Flight Control Core
```
┌─────────────────────────────────────┐
│         AUTOPILOT FIRMWARE          │
│              (UNCHANGED)            │
├─────────────────────────────────────┤
│ • Kalman Filtering                  │
│ • AHRS/INS Systems                  │
│ • Navigation Functions              │
│ • Flight Plan Execution             │
│ • Safety Systems                    │
│ • XBee Telemetry Protocol           │
└─────────────────────────────────────┘
```

### 2. Enhanced Communication Layer
```
┌─────────────────────────────────────┐
│        ENCRYPTED TELEMETRY          │
├─────────────────────────────────────┤
│ XBee Protocol (preserved)           │
│ + AES-256 Encryption Wrapper        │
│ + Authentication & Replay Protection│
│ + Secure Command Validation         │
└─────────────────────────────────────┘
```

### 3. Modern Web-Based GCS
```
┌─────────────────────────────────────┐
│          REACT/TYPESCRIPT GCS       │
├─────────────────────────────────────┤
│ • Mission Planner (drag/drop) ✓     │
│ • Real-time Telemetry Dashboard     │
│ • AI Safety Monitoring              │
│ • Encrypted Command Interface       │
│ • SRTM Terrain Integration          │
│ • Web-based Compilation Service     │
└─────────────────────────────────────┘
```

### 4. AI Safety Monitoring System
```
┌─────────────────────────────────────┐
│          AI SAFETY LAYER            │
├─────────────────────────────────────┤
│ • LLM-based Mission Analysis        │
│ • Predictive Risk Assessment        │
│ • Automatic Emergency Procedures    │
│ • Terrain Collision Avoidance       │
│ • Weather-based Flight Adjustments  │
│ • Self-Preservation Logic           │
└─────────────────────────────────────┘
```

## Implementation Strategy

### Phase 1: Foundation (4-6 weeks)
1. **Web-based GCS Infrastructure**
   - React/TypeScript dashboard framework
   - WebSocket telemetry receiver
   - Real-time data visualization
   - User authentication system

2. **Encrypted Communication Wrapper**
   - AES-256 encryption layer over XBee protocol
   - Secure key exchange mechanism
   - Command authentication and validation
   - Replay attack prevention

### Phase 2: Core Systems (6-8 weeks)
1. **Flight Plan System Enhancement**
   - Visual mission editor (drag/drop) ✓ COMPLETE
   - TypeScript flight plan interfaces ✓ COMPLETE
   - Web-based flight plan upload
   - Real-time mission modifications

2. **Terrain Integration**
   - Online SRTM data service
   - Real-time terrain analysis
   - Dynamic altitude safety adjustments
   - 3D visualization of flight paths

### Phase 3: AI Safety Systems (8-10 weeks)
1. **LLM Safety Monitoring**
   - Mission risk analysis
   - Real-time decision support
   - Emergency procedure automation
   - Natural language mission commands

2. **Predictive Safety**
   - Weather-based flight adjustments
   - Terrain collision prediction
   - Battery/fuel optimization
   - Automatic return-to-home logic

### Phase 4: Advanced Features (6-8 weeks)
1. **Web-based Compilation**
   - Browser-based firmware compilation
   - Wireless firmware flashing
   - Configuration management
   - Version control integration

2. **Advanced Mission Capabilities**
   - Multi-aircraft coordination
   - Dynamic mission adaptation
   - Autonomous mission planning
   - Environmental response systems

## Technical Specifications

### Preserved Autopilot Components

#### 1. State Estimation (UNCHANGED)
```c
// Kalman filter implementation - preserve exactly
struct Estimator {
  float z;           // Altitude
  float z_dot;       // Vertical velocity
  float phi;         // Roll angle
  float theta;       // Pitch angle
  float psi;         // Yaw angle
  float p, q, r;     // Angular rates
};

// AHRS implementations - keep all variants
void ahrs_update_accel(struct Int32Vect3* accel);
void ahrs_update_gyro(struct Int32Rates* gyro);
void ahrs_update_mag(struct Int32Vect3* mag);
```

#### 2. Navigation System (UNCHANGED)
```c
// Flight plan execution - preserve state machine
struct navigation {
  uint8_t nav_block;
  uint8_t nav_stage;
  float nav_circle_radians;
  bool_t nav_approaching;
};

// Navigation functions - keep implementations
void nav_circle_XY(float x, float y, float radius);
void nav_route_XY(float last_wp_x, float last_wp_y, float wp_x, float wp_y);
bool_t nav_approaching_from(uint8_t wp_idx, uint8_t from_idx, int16_t approaching_time);
```

#### 3. Safety Systems (ENHANCED BUT PRESERVE LOGIC)
```c
// Existing safety checks - keep logic, enhance triggers
#define GROUND_ALT          // Preserve ground reference
#define SECURITY_HEIGHT     // Keep minimum altitude
#define MAX_DIST_FROM_HOME  // Preserve geofencing

// Enhanced with AI monitoring
void ai_safety_monitor(struct Telemetry* telemetry) {
  // Preserve original checks
  if (estimator_z < GROUND_ALT + SECURITY_HEIGHT) {
    emergency_climb();
  }
  
  // Add AI risk assessment
  float risk_score = llm_assess_flight_risk(telemetry);
  if (risk_score > CRITICAL_THRESHOLD) {
    initiate_safe_landing();
  }
}
```

### Enhanced Communication Protocol

#### Encrypted XBee Wrapper
```typescript
interface EncryptedMessage {
  timestamp: number;
  nonce: Uint8Array;           // Prevent replay attacks
  signature: Uint8Array;       // Message authentication
  payload: Uint8Array;         // AES-256 encrypted original message
}

class SecureXBeeProtocol {
  private encryptionKey: Uint8Array;
  private sequenceNumber: number = 0;
  
  // Encrypt existing Paparazzi messages
  encryptMessage(originalPayload: Uint8Array): EncryptedMessage {
    const nonce = this.generateNonce();
    const encrypted = this.aes256Encrypt(originalPayload, this.encryptionKey, nonce);
    const signature = this.hmacSign(encrypted, this.encryptionKey);
    
    return {
      timestamp: Date.now(),
      nonce,
      signature,
      payload: encrypted
    };
  }
  
  // Preserve original message structure after decryption
  decryptMessage(encMsg: EncryptedMessage): PaparazziMessage {
    this.validateSignature(encMsg);
    this.validateTimestamp(encMsg.timestamp);
    const decrypted = this.aes256Decrypt(encMsg.payload, this.encryptionKey, encMsg.nonce);
    return this.parsePaparazziMessage(decrypted);
  }
}
```

### Web-based GCS Architecture

#### Real-time Dashboard
```typescript
interface TelemetryDashboard {
  // Preserve all Paparazzi telemetry fields
  gps: {
    latitude: number;
    longitude: number;
    altitude: number;
    course: number;
    speed: number;
  };
  
  attitude: {
    roll: number;
    pitch: number;
    yaw: number;
    rollRate: number;
    pitchRate: number;
    yawRate: number;
  };
  
  navigation: {
    currentBlock: number;
    currentStage: number;
    distanceToWaypoint: number;
    distanceToHome: number;
  };
  
  // Enhanced with AI insights
  aiAssessment: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    predictedIssues: SafetyAlert[];
  };
}
```

### SRTM Terrain Enhancement

#### Online Terrain Service
```typescript
class EnhancedSRTMService {
  // Preserve existing altitude lookup logic
  async getGroundAltitude(lat: number, lon: number): Promise<number> {
    // Use existing SRTM algorithm but with online data
    const srtmTile = await this.downloadSRTMTile(lat, lon);
    return this.interpolateAltitude(srtmTile, lat, lon);
  }
  
  // Enhanced terrain analysis
  async analyzeTerrain(flightPath: Position[]): Promise<TerrainAnalysis> {
    const elevationProfile = await Promise.all(
      flightPath.map(pos => this.getGroundAltitude(pos.latitude, pos.longitude))
    );
    
    return {
      minimumSafeAltitude: Math.max(...elevationProfile) + SECURITY_HEIGHT,
      terrainWarnings: this.identifyTerrainHazards(flightPath, elevationProfile),
      optimalAltitudes: this.calculateOptimalAltitudes(flightPath, elevationProfile)
    };
  }
}
```

## Security Enhancements

### 1. Encrypted Command Channel
- **AES-256 encryption** for all aircraft commands
- **HMAC authentication** to prevent tampering
- **Timestamp validation** to prevent replay attacks
- **Secure key exchange** using ECDH

### 2. Authorization System
```typescript
interface CommandAuthorization {
  operatorId: string;
  aircraftId: string;
  commandType: 'navigation' | 'emergency' | 'configuration';
  timestamp: number;
  signature: string;
}

class SecureCommandProcessor {
  validateCommand(command: AircraftCommand, auth: CommandAuthorization): boolean {
    // Verify operator authorization
    // Validate command parameters against safety envelope
    // Check for emergency override conditions
    // Log all command attempts
  }
}
```

### 3. AI Safety Monitoring
```typescript
class AISafetyMonitor {
  async assessMissionRisk(mission: FlightPlan, weather: WeatherData, terrain: TerrainData): Promise<RiskAssessment> {
    const prompt = `
    Analyze this UAV mission for safety risks:
    Mission: ${JSON.stringify(mission)}
    Weather: Wind ${weather.windSpeed}kt, visibility ${weather.visibility}km
    Terrain: Max elevation ${Math.max(...terrain.elevations)}m
    
    Identify potential hazards and recommend safety measures.
    `;
    
    const analysis = await this.llm.analyze(prompt);
    return this.parseRiskAssessment(analysis);
  }
  
  async monitorRealtime(telemetry: Telemetry): Promise<SafetyAction[]> {
    // Real-time safety monitoring with LLM assistance
    // Automatic emergency response triggers
    // Predictive hazard detection
  }
}
```

## Migration Path

### Compatibility Strategy
1. **Preserve Autopilot Binary Compatibility**: No changes to existing flight control firmware
2. **Protocol Preservation**: Maintain XBee message formats, add encryption layer
3. **Gradual Migration**: Support both old OCaml GCS and new web GCS during transition
4. **Configuration Compatibility**: Convert existing XML configurations to TypeScript interfaces

### Testing Strategy
1. **Hardware-in-the-Loop**: Test new GCS with existing autopilot hardware
2. **Protocol Validation**: Verify encrypted communications maintain timing requirements
3. **Safety System Testing**: Validate AI safety monitoring against known scenarios
4. **Regression Testing**: Ensure no degradation of existing flight performance

## Conclusion

This modernization strategy preserves Paparazzi's proven flight control systems while adding modern interfaces and AI-powered safety enhancements. The key principle is **functional equivalence** - the aircraft will fly exactly the same, but operators will have a vastly improved experience with enhanced safety and capability.

**Core Benefits**:
- ✅ **Proven Flight Control Preserved**: Rock-solid autopilot systems unchanged
- ✅ **Modern Interface**: Web-based mission planning and monitoring
- ✅ **Enhanced Security**: Encrypted communications prevent interference
- ✅ **AI Safety**: Intelligent monitoring and emergency response
- ✅ **Improved Accessibility**: Web-based system reduces technical barriers
- ✅ **Future-Proof Architecture**: Extensible platform for advanced capabilities

The result will be a system where "LLMs have methods and tools to do about everything. The humans are just pushing buttons or telling the LLM what the mission is" while maintaining the reliability and safety that make Paparazzi a trusted platform for autonomous flight operations.