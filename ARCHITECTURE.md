# Paparazzi Next-Gen System Architecture# Paparazzi Next-Gen Architecture



**Complete OCaml-Free Modernization with LLM Integration and Interactive Mapping**## 🎯 Phase 1 Implementation Status: ✅ COMPLETED



## 🏗️ **System Overview****Mission Accomplished:** Successfully eliminated all OCaml dependencies and created a modern, maintainable Node.js-based system while preserving full hardware compatibility and safety principles.



The Paparazzi Next-Gen system represents a complete architectural modernization that eliminates OCaml dependencies while preserving the robust flight control capabilities of the original system. The new architecture introduces modern web technologies, LLM integration, real-time mapping, and professional service management.### Key Achievements (Phase 1)

- ✅ **Complete OCaml Elimination**: All OCaml dependencies removed and replaced

## 📐 **High-Level Architecture**- ✅ **Modern Messaging**: MQTT + WebSocket system replaces Ivy-OCaml  

- ✅ **LLM Integration**: MCP server enables AI-assisted flight operations

```mermaid- ✅ **Web-based GCS**: React interface replaces legacy GTK components

graph TB- ✅ **Hardware Compatibility**: Full support for existing ARM7/STM32 autopilots

    subgraph "Ground Station (localhost)"- ✅ **Safety-First Design**: Hierarchical control with proper failsafes

        GCS[🎛️ React GCS<br/>Port 3000<br/>Interactive Mapping]

        MB[📡 Message Broker<br/>Port 8080<br/>MQTT + WebSocket]## Overview

        MCP[🧠 MCP Server<br/>Port 3001<br/>LLM Integration]

        SIM[🛩️ Flight Simulator<br/>Port 8090<br/>Physics Engine]This document outlines the modernized architecture for Paparazzi UAV, replacing legacy OCaml dependencies with a Node.js-based ecosystem while maintaining full compatibility with existing ARM7 and STM32-based autopilot hardware. The new architecture emphasizes autonomous flight operations with LLM-assisted mission management.

        LOGS[📊 File Logging<br/>/logs/*.log<br/>Structured JSON]

    end## Design Principles

    

    subgraph "Aircraft Hardware"### 1. Fly the Aircraft First

        AP[🛸 Autopilot<br/>STM32/ARM7<br/>Flight Control]The fundamental principle from aviation: **ALWAYS FLY THE AIRCRAFT FIRST**. No matter what subsystem failures occur, the primary responsibility is maintaining aircraft control. All mission management, telemetry, and LLM interactions are secondary to core flight control loops.

        SENSORS[📡 Sensors<br/>GPS, IMU, etc.]

        RADIO[📻 Radio Link<br/>XBee/LoRa]### 2. Full Autonomy

    end- Eliminate RC control dependency

    - Complete missions without human intervention

    subgraph "External Services"- Dynamic home location updates

        IP_GEO[🌍 IP Geolocation<br/>ipapi.co<br/>Ground Station Location]- Support for one-way missions (different takeoff/landing locations)

        OSM[🗺️ OpenStreetMap<br/>Free Tiles<br/>No API Key Required]- RF links used exclusively for telemetry and mission updates

        LLM[🤖 Language Model<br/>External AI<br/>Advisory Only]

    end### 3. LLM Integration

    - Model Context Protocol (MCP) server for structured LLM-autopilot communication

    GCS <--> MB- Real-time mission adaptation based on atmospheric conditions

    MB <--> MCP- Intelligent decision-making for mission optimization

    MB <--> SIM- Safety oversight and anomaly detection

    MB <--> RADIO

    RADIO <--> AP## System Architecture

    AP <--> SENSORS

    MCP <--> LLM```

    GCS --> IP_GEO┌─────────────────────────────────────────────────────────────────┐

    GCS --> OSM│                        Ground Station                          │

    ├─────────────────────────────────────────────────────────────────┤

    MB --> LOGS│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │

    GCS --> LOGS│  │   Web GCS UI    │  │   LLM Agent     │  │  MCP Server     │  │

    MCP --> LOGS│  │   (React/Vue)   │  │   (Chat UI)     │  │   (Node.js)     │  │

    SIM --> LOGS│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │

```│           │                     │                     │         │

│  ┌─────────────────────────────────────────────────────────────┐  │

## 🔧 **Component Architecture**│  │              Message Broker (MQTT/WebSocket)               │  │

│  └─────────────────────────────────────────────────────────────┘  │

### **1. React Ground Control Station (GCS)**│           │                                                     │

**Location**: `src/gcs/`  │  ┌─────────────────────────────────────────────────────────────┐  │

**Port**: 3000  │  │              Radio Interface (XBee/LoRa)                   │  │

**Technology**: React 19, TypeScript, Leaflet, Socket.IO│  └─────────────────────────────────────────────────────────────┘  │

└─────────────────────────────────────────────────────────────────┘

#### **Core Components:**                               │

```typescript                          RF Telemetry

src/gcs/src/                               │

├── components/┌─────────────────────────────────────────────────────────────────┐

│   ├── MapView.tsx              # 🗺️ Interactive mapping with real-time aircraft tracking│                        Airborne System                         │

│   ├── TelemetryDisplay.tsx     # 📊 Live telemetry visualization  ├─────────────────────────────────────────────────────────────────┤

│   ├── MissionControl.tsx       # 🎯 Mission planning and execution│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │

│   ├── LLMChat.tsx             # 💬 Natural language LLM interface│  │  Radio Module   │  │   Data Logger   │  │   Sensors       │  │

│   └── AlertPanel.tsx          # ⚠️ System alerts and warnings│  │   (XBee/LoRa)   │  │   (SD Card)     │  │   (IMU/GPS)     │  │

├── services/│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │

│   ├── GeolocationService.ts    # 🌍 IP + GPS location detection│           │                     │                     │         │

│   ├── DemoDataGenerator.ts     # 🎮 Realistic flight simulation data│  ┌─────────────────────────────────────────────────────────────┐  │

│   └── WebSocketService.ts      # 📡 Real-time communication│  │                   Autopilot Core                           │  │

├── context/│  │              ARM7/STM32 Flight Controller                  │  │

│   └── WebSocketContext.tsx     # 🔄 Application state management│  │                                                             │  │

└── types/│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │  │

    └── core.ts                  # 📝 TypeScript definitions│  │  │ Flight Control│  │ Navigation    │  │ Mission Mgmt  │  │  │

```│  │  │ (Stabilization│  │ (Waypoints)   │  │ (Autonomous)  │  │  │

│  │  │  Attitude)    │  │               │  │               │  │  │

#### **Key Features:**│  │  └───────────────┘  └───────────────┘  └───────────────┘  │  │

- **🗺️ Real-time Interactive Mapping**: Leaflet-based mapping with OpenStreetMap tiles│  └─────────────────────────────────────────────────────────────┘  │

- **🌍 Automatic Geolocation**: IP-based location detection with GPS fallback└─────────────────────────────────────────────────────────────────┘

- **✈️ Aircraft Visualization**: Custom icons with real-time position updates```

- **🛤️ Flight Path Tracking**: Dynamic path rendering with configurable history

- **🎮 Demo Mode**: Realistic simulation for testing without hardware## Implemented Phase 1 Components ✅

- **📱 Responsive Design**: Optimized for all screen sizes

### Message Broker System ✅ COMPLETED

### **2. Message Broker System****Location**: `src/message-broker/index.ts`  

**Location**: `src/message-broker/`  **Replaces**: Ivy-OCaml message bus  

**Port**: 8080  **Status**: Fully operational MQTT + WebSocket communication hub

**Technology**: Node.js, TypeScript, MQTT, WebSocket

**Implemented Features**:

#### **Architecture:**- ✅ Protocol translation (Serial ↔ MQTT ↔ WebSocket)

```typescript- ✅ Message validation and routing using Zod schemas

src/message-broker/- ✅ Real-time telemetry distribution

├── index.ts                     # 🚀 Main broker service- ✅ Command injection and verification

├── mqtt-client.ts              # 📡 MQTT communication handler- ✅ Serial port integration for autopilot hardware

├── websocket-server.ts         # 🌐 WebSocket server for real-time updates- ✅ Health monitoring and error handling

├── serial-interface.ts         # 🔌 Hardware communication (MAVLink/Serial)

└── message-types.ts            # 📝 Protocol definitions### Ground Control Station (GCS) ✅ COMPLETED

```**Location**: `src/gcs/`  

**Replaces**: OCaml GTK interface  

#### **Communication Flow:****Status**: Modern React-based web interface with real-time capabilities

```

Aircraft Hardware → Serial/MAVLink → Message Broker → WebSocket → GCS**Implemented Components**:

GCS → WebSocket → Message Broker → Serial/MAVLink → Aircraft Hardware- ✅ **TelemetryDisplay**: Real-time aircraft data visualization

MCP Server ↔ Message Broker ↔ WebSocket ↔ Flight Simulator- ✅ **MapView**: Aircraft positioning and flight path display  

```- ✅ **MissionControl**: Flight operation controls and parameters

- ✅ **LLMChat**: AI assistant integration for flight guidance

#### **Message Routing:**- ✅ **AlertPanel**: Safety monitoring and warning system

- **📡 Telemetry**: Aircraft → Broker → GCS (real-time)- ✅ **WebSocket Context**: Real-time communication with message broker

- **🎮 Commands**: GCS → Broker → Aircraft (validated)

- **🧠 LLM Requests**: MCP Server → Broker → Aircraft (advisory)### LLM Integration Server ✅ COMPLETED

- **📊 Logging**: All messages → Structured logs**Location**: `src/mcp-server/index.ts`  

**Purpose**: AI assistant for flight operations  

### **3. LLM Integration (MCP Server)****Status**: Fully functional MCP server with comprehensive flight tools

**Location**: `src/mcp-server/`  

**Port**: 3001  **Implemented Features**:

**Technology**: Node.js, TypeScript, Model Context Protocol- ✅ Flight planning optimization tools

- ✅ System health analysis capabilities  

#### **MCP Architecture:**- ✅ Emergency procedure assistance

```typescript- ✅ Weather and atmospheric data interpretation

src/mcp-server/- ✅ Mission parameter recommendations

├── index.ts                     # 🧠 MCP protocol server- ✅ Structured LLM communication via Model Context Protocol

├── tools/

│   ├── flight-analysis.ts      # 📊 Telemetry analysis tools### Type System and Safety ✅ COMPLETED

│   ├── mission-planning.ts     # 🎯 Route optimization tools**Location**: `src/types/core.ts`  

│   ├── safety-monitoring.ts    # ⚠️ Safety alert tools**Framework**: Zod for runtime validation  

│   └── weather-integration.ts  # 🌤️ Weather data tools**Status**: Comprehensive type definitions with safety constraints

├── handlers/

│   ├── natural-language.ts     # 💬 Command parsing**Implemented Safety Features**:

│   └── safety-validation.ts    # 🛡️ Safety constraint checking- ✅ Flight envelope constraints and validation

└── protocols/- ✅ Command validation schemas

    └── mcp-types.ts            # 📝 MCP protocol definitions- ✅ Telemetry schema enforcement  

```- ✅ Emergency procedure definitions

- ✅ Hardware compatibility types

#### **LLM Capabilities:**- ✅ Real-time data validation

- **💬 Natural Language Processing**: Convert human commands to flight operations

- **📊 Intelligent Analysis**: Real-time telemetry interpretation and insights## Component Details

- **🎯 Mission Optimization**: Route planning with weather and performance factors

- **⚠️ Predictive Safety**: Early warning system for potential issues### Ground Station Components

- **📈 Performance Tracking**: Historical analysis and improvement suggestions

#### 1. Web-Based GCS (Ground Control Station)

### **4. Flight Simulation Engine**- **Technology**: React/Vue.js + WebGL/Three.js

**Location**: `src/simulator/`  - **Features**:

**Port**: 8090    - Real-time 2D/3D map visualization

**Technology**: Node.js, TypeScript, Physics Engine  - Flight plan editor with drag-and-drop waypoints

  - Live telemetry displays (PFD, engine parameters, environmental data)

#### **Simulation Components:**  - Mission planning and execution monitoring

```typescript  - Video stream integration

src/simulator/  - Alert and alarm management

├── index.ts                     # 🛩️ Main simulation server

├── flight-model.ts             # ⚡ Physics-based flight dynamics#### 2. LLM Agent Interface

├── environment-model.ts        # 🌤️ Weather and atmospheric simulation- **Technology**: Node.js + WebSocket

├── gps-simulator.ts            # 📡 GPS and navigation simulation- **Features**:

├── telemetry-generator.ts      # 📊 Realistic sensor data generation  - Chat interface for mission interaction

└── flight-plan-executor.ts     # 🎯 Mission execution simulation  - Natural language mission planning

```  - Real-time atmospheric data interpretation

  - Anomaly detection and response suggestions

#### **Physics Modeling:**  - Mission optimization recommendations

- **⚡ Flight Dynamics**: 6-DOF aircraft motion with realistic aerodynamics

- **🌤️ Environmental Factors**: Wind, turbulence, and atmospheric conditions#### 3. MCP Server

- **📡 Sensor Simulation**: GPS accuracy, IMU noise, and communication delays- **Technology**: Node.js

- **🔋 System Modeling**: Battery consumption, fuel usage, and component wear- **Protocol**: Model Context Protocol

- **Capabilities**:

## 📊 **Logging & Monitoring Architecture**  - Structured communication with LLM

  - Flight plan generation and modification

### **File-Based Logging System**  - Telemetry data analysis

**Location**: `src/utils/file-logger.ts`    - Safety protocol enforcement

**Storage**: `/logs/*.log`    - Firmware upload coordination

**Format**: Structured JSON with metadata

#### 4. Message Broker

#### **Log Structure:**- **Technology**: MQTT or WebSocket-based

```json- **Purpose**:

{  - Real-time telemetry distribution

  "timestamp": "2025-10-24T23:15:42.123Z",  - Command routing

  "level": "INFO|WARN|ERROR|DEBUG",  - Multi-client support

  "component": "BROKER|GCS|MCP|SIMULATOR",  - Message persistence and replay

  "message": "Human-readable description",

  "meta": {#### 5. Radio Interface

    "additional": "context data",- **Hardware**: XBee Pro, LoRa modules

    "telemetry": "relevant information"- **Protocol**: Custom packet format over radio

  }- **Features**:

}  - Bidirectional telemetry

```  - Command uplink

  - Range optimization

#### **Log Files:**  - Error correction and retry logic

- **📋 `combined.log`**: All services aggregated for overview

- **📡 `message-broker.log`**: MQTT, WebSocket, and communication events### Airborne Components

- **⚛️ `gcs.log`**: React compilation, runtime, and user interactions

- **🧠 `mcp-server.log`**: LLM requests, responses, and protocol events#### 1. Autopilot Core (Maintained from Original)

- **🛩️ `simulator.log`**: Physics simulation and telemetry generation- **Hardware**: ARM7 (LPC21xx), STM32F1/F4 series

- **Language**: C (existing codebase maintained)

### **Service Management System**- **Functions**:

**Location**: `scripts/services.sh`, `scripts/logs.sh`    - Flight control loops (attitude, altitude, speed)

**PID Tracking**: `.pids/*.pid`    - Sensor fusion (IMU, GPS, pressure)

**Features**: Background processes, health monitoring, log analysis  - Actuator control (servos, motor)

  - Safety monitoring

#### **Service Control Flow:**

```bash#### 2. Mission Management

npm run services:start- **Enhanced Features**:

├── Start message-broker (background)  - Autonomous takeoff and landing

├── Start gcs (background, BROWSER=none)  - Dynamic waypoint updates

├── Start mcp-server (background)  - Weather-adaptive flight paths

├── Start simulator (background)  - Emergency procedures

└── Track all PIDs in .pids/ directory  - Fuel/battery optimization



npm run services:status#### 3. Data Logging

├── Check each PID for process existence- **Storage**: High-capacity SD cards

└── Report running/stopped status- **Data**: High-frequency sensor data, mission logs, photos

- **Format**: Structured binary with metadata

npm run services:logs

├── Tail all log files simultaneously## Communication Protocols

└── Pretty-print with color coding

```### 1. Ground-to-Air Messages

```json

## 🗺️ **Interactive Mapping System**{

  "type": "command",

### **Geolocation Architecture**  "timestamp": "2025-10-24T10:30:00Z",

**Location**: `src/gcs/src/services/GeolocationService.ts`    "source": "gcs",

**Primary**: IP-based geolocation via ipapi.co (no API key)    "destination": "aircraft_001",

**Fallback**: Browser Geolocation API (GPS)  "command": {

    "type": "waypoint_update",

#### **Geolocation Flow:**    "waypoint_id": 3,

```typescript    "latitude": 59.2345,

class GeolocationService {    "longitude": 10.1234,

  async getCurrentLocation(): Promise<GeolocationResult> {    "altitude": 150

    try {  }

      // 1. Try IP geolocation (fast, no permissions required)}

      const ipLocation = await this.getIPLocation();```

      

      // 2. Try GPS if available (more accurate)### 2. Air-to-Ground Telemetry

      const gpsLocation = await this.getGPSLocation();```json

      {

      // 3. Return best available with accuracy estimate  "type": "telemetry",

      return this.selectBestLocation(ipLocation, gpsLocation);  "timestamp": "2025-10-24T10:30:01Z",

    } catch (error) {  "source": "aircraft_001",

      // 4. Fallback to default location  "data": {

      return this.getDefaultLocation();    "position": {

    }      "latitude": 59.2344,

  }      "longitude": 10.1235,

}      "altitude": 148

```    },

    "attitude": {

#### **Location Data Structure:**      "roll": 2.1,

```typescript      "pitch": -1.5,

interface GeolocationResult {      "yaw": 85.3

  position: {    },

    latitude: number;    "environmental": {

    longitude: number;      "temperature": -5.2,

    altitude: number;      "humidity": 85,

  };      "pressure": 1013.25

  accuracy: number;        // Estimated accuracy in meters    }

  source: 'ip' | 'gps' | 'default';  }

  city: string;}

  country: string;```

  timezone: string;

  timestamp: string;### 3. LLM-MCP Communication

}```json

```{

  "jsonrpc": "2.0",

### **Real-time Mapping Components**  "method": "update_flight_plan",

**Location**: `src/gcs/src/components/MapView.tsx`    "params": {

**Technology**: React-Leaflet, OpenStreetMap, Custom Icons    "aircraft_id": "aircraft_001",

    "modification": {

#### **Map Features:**      "type": "insert_waypoint",

- **🗾 Base Layer**: OpenStreetMap tiles (free, no API key required)      "after": 2,

- **📍 Ground Station**: Green diamond icon with location popup      "waypoint": {

- **✈️ Aircraft**: Orange star icon with telemetry popup        "latitude": 59.2400,

- **🛤️ Flight Path**: Orange polyline with configurable point history        "longitude": 10.1300,

- **🎮 Demo Mode**: Toggle between live and simulated data        "altitude": 200,

- **📱 Responsive**: Optimized for all screen sizes        "actions": ["circle", "take_photo"]

      }

#### **Real-time Updates:**    },

```typescript    "reason": "Atmospheric condition optimization"

useEffect(() => {  },

  const interval = setInterval(() => {  "id": 1

    if (showDemo) {}

      // Generate realistic demo telemetry```

      const newTelemetry = demoDataGenerator.generateTelemetry();

      setDemoTelemetry(newTelemetry);## Safety Systems

    }

  }, 500); // Update every 500ms for smooth animation### 1. Flight Control Hierarchy

  1. **Hardware Watchdog**: Independent circuit monitoring

  return () => clearInterval(interval);2. **Flight Control Core**: Maintains aircraft stability

}, [showDemo]);3. **Navigation System**: Waypoint following and obstacle avoidance

```4. **Mission Management**: High-level goal execution

5. **Ground Control**: Mission updates and monitoring

## 🔐 **Security & Safety Architecture**6. **LLM Assistance**: Advisory only, never override



### **Multi-Layer Safety System**### 2. Fail-Safe Mechanisms

The system implements multiple independent safety layers:- **Lost Link**: Automatic return-to-home

- **Low Power**: Emergency landing protocols

1. **⚡ Hardware Layer (Highest Priority)**- **Sensor Failure**: Graceful degradation

   - Independent watchdog circuits- **Weather**: Automatic diversion procedures

   - Hardware-level failsafes- **Geofencing**: Hard boundaries enforcement

   - Direct control surface override capability

### 3. LLM Safety Constraints

2. **🎮 Flight Control Layer**- Cannot directly control flight surfaces

   - Real-time stability augmentation- Cannot override safety protocols

   - Control law enforcement- Cannot modify critical flight parameters without confirmation

   - Envelope protection- All suggestions require validation against flight envelope



3. **🗺️ Navigation Layer**## Development Environment

   - Geofencing compliance

   - Obstacle avoidance### macOS M4 Compatibility

   - No-fly zone enforcement- **Node.js**: v18+ with ARM64 native support

- **Cross-compilation**: ARM-based toolchain for STM32

4. **🎯 Mission Layer**- **Docker**: ARM64 containers for development consistency

   - Goal execution with safety constraints- **VS Code**: Native ARM64 with extensions

   - Dynamic replanning for safety

   - Emergency procedure automation### Build System

- **Airborne**: CMake + ARM GCC toolchain

5. **👁️ Ground Oversight Layer**- **Ground Station**: npm/yarn + Webpack/Vite

   - Human monitoring capability- **MCP Server**: TypeScript + Node.js

   - Manual intervention options- **Docker**: Multi-stage builds for production deployment

   - Emergency stop functionality

## Migration Strategy

6. **🧠 LLM Advisory Layer (Lowest Priority)**

   - Intelligent suggestions only### Phase 1: Foundation (Weeks 1-4)

   - No direct control authority- Set up Node.js development environment

   - Safety validation required- Implement basic message broker

- Create minimal web GCS

### **Communication Security**- Establish radio communication

- **🔐 WebSocket Authentication**: Token-based access control

- **📡 Radio Link Encryption**: Secure telemetry and command transmission### Phase 2: Core Functionality (Weeks 5-8)

- **🛡️ Input Validation**: All commands validated against safety constraints- Port essential OCaml tools to Node.js

- **📊 Audit Logging**: Complete traceability of all operations- Implement flight plan management

- Add telemetry visualization

## 🔄 **Data Flow Architecture**- Basic MCP server framework



### **Telemetry Data Flow**### Phase 3: LLM Integration (Weeks 9-12)

```- Complete MCP server implementation

Aircraft Sensors → MAVLink → Serial → Message Broker → WebSocket → GCS- Add LLM agent interface

                                                    ↓- Implement mission planning assistance

                                            Structured Logs- Safety protocol integration

                                                    ↓

                                            Log Analysis Tools### Phase 4: Advanced Features (Weeks 13-16)

```- Atmospheric research capabilities

- Advanced visualization

### **Command Data Flow**- Multi-aircraft support

```- Production deployment tools

GCS User Interface → WebSocket → Message Broker → Validation → Serial → Aircraft

                                        ↓## Hardware Compatibility

                                 Safety Constraints

                                        ↓### Supported Autopilots

                                 LLM Advisory (Optional)- **Lisa/L**: STM32F4 + IMU + GPS

```- **Lisa/M**: STM32F4 + basic sensors

- **Umarim Lite**: ARM7 + external sensors

### **LLM Integration Flow**- **TWOG**: ARM7 + data logging

```- **Custom STM32**: F1/F4/F7 series boards

Human Language Input → MCP Server → Tool Execution → Safety Validation → Message Broker

                                        ↓### Required Sensors

                              Advisory Suggestions Only- **IMU**: 3-axis gyro, accelerometer, magnetometer

                                        ↓- **GPS**: uBlox or compatible NMEA

                              Human Confirmation Required- **Pressure**: Barometric altitude sensor

```- **Environmental**: Temperature, humidity (for SUMO)

- **Airspeed**: Pitot tube (optional)

## 📈 **Performance & Scalability**

### Communication Hardware

### **Real-time Performance Requirements**- **Primary**: XBee Pro 900MHz/2.4GHz

- **🎮 Flight Control**: 50Hz minimum update rate- **Alternative**: LoRa modules (868MHz/915MHz)

- **📡 Telemetry**: 10Hz for standard operation, 50Hz for critical phases- **Backup**: WiFi for short-range operations

- **🗺️ Map Updates**: 2Hz for smooth visualization

- **💬 LLM Response**: <2 seconds for non-critical queries## Data Structures

- **📊 Log Processing**: Asynchronous with minimal latency impact

### Flight Plan Format

### **Scalability Considerations**```json

- **🔗 Multi-Aircraft Support**: Broker can handle multiple concurrent aircraft{

- **🌐 Distributed Deployment**: Services can run on separate machines  "aircraft_id": "sumo_001",

- **📊 Log Management**: Automatic rotation and archival  "mission_name": "atmospheric_survey_001",

- **🧠 LLM Load Balancing**: Multiple MCP server instances possible  "waypoints": [

    {

## 🛠️ **Development & Deployment**      "id": 0,

      "type": "takeoff",

### **Development Environment Setup**      "position": {"lat": 59.2345, "lon": 10.1234, "alt": 0},

```bash      "actions": ["engine_start", "arm_autopilot"]

# 1. Install dependencies    },

npm run setup    {

      "id": 1,

# 2. Start development mode (hot reload)      "type": "survey",

npm run dev      "position": {"lat": 59.2400, "lon": 10.1300, "alt": 150},

      "actions": ["start_logging", "begin_survey"]

# 3. Start background services    },

npm run services:start    {

      "id": 99,

# 4. Monitor logs      "type": "landing",

npm run logs:tail      "position": {"lat": 59.2350, "lon": 10.1240, "alt": 0},

```      "actions": ["stop_logging", "engine_stop"]

    }

### **Production Deployment**  ],

```bash  "parameters": {

# 1. Build optimized version    "cruise_speed": 15.0,

npm run build    "max_altitude": 300,

    "fuel_limit": 45,

# 2. Deploy services    "weather_limits": {

npm run services:start      "max_wind": 10,

      "min_visibility": 1000

# 3. Configure monitoring    }

npm run logs:stats  }

```}

```

### **Testing Strategy**

- **🧪 Unit Tests**: Component-level testing with Jest### Environmental Data Structure

- **🔄 Integration Tests**: Service communication testing```json

- **🛩️ Simulation Testing**: Full flight simulation scenarios{

- **🗺️ UI Testing**: React component and mapping functionality  "timestamp": "2025-10-24T10:30:00Z",

- **🧠 LLM Testing**: MCP protocol and safety validation  "position": {"lat": 59.2345, "lon": 10.1234, "alt": 150},

  "atmospheric": {

## 🔮 **Future Architecture Enhancements**    "temperature": -5.2,

    "humidity": 85.3,

### **Planned Improvements**    "pressure": 1013.25,

- **🛰️ Satellite Imagery**: Integration with free satellite tile services    "wind_speed": 8.5,

- **🌐 Multi-Ground Station**: Distributed control capability    "wind_direction": 245

- **🤖 Swarm Intelligence**: Multi-aircraft coordination  },

- **📱 Mobile Applications**: Native iOS/Android companion apps  "air_quality": {

- **🔬 Advanced Sensors**: Environmental and scientific instrument integration    "co2": 415.2,

    "particles_pm25": 12.5,

### **Extensibility Points**    "particles_pm10": 18.3

- **🔌 Plugin Architecture**: Modular sensor and actuator support  }

- **📡 Protocol Extensions**: Additional communication protocols}

- **🧠 LLM Model Support**: Multiple AI model integration```

- **🗺️ Mapping Providers**: Alternative tile servers and data sources

- **📊 Analytics Platform**: Advanced data analysis and visualizationThis architecture provides a solid foundation for modernizing Paparazzi while maintaining its core strengths in autonomous flight and atmospheric research, now enhanced with intelligent LLM assistance for mission optimization and real-time decision making.

---

This architecture document provides a comprehensive overview of the modernized Paparazzi system. The design prioritizes safety, modularity, and extensibility while eliminating OCaml dependencies and introducing modern web technologies, LLM integration, and interactive mapping capabilities.

**Key Architectural Principles:**
1. **Safety First**: Multiple independent safety layers
2. **Modern Technology**: Web-based, TypeScript, React
3. **Real-time Performance**: Low-latency communication and control
4. **Extensibility**: Modular design for future enhancements
5. **Developer Experience**: Professional tooling and monitoring