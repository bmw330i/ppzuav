# Paparazzi Next-Gen Architecture

## Overview

This document outlines the modernized architecture for Paparazzi UAV, replacing legacy OCaml dependencies with a Node.js-based ecosystem while maintaining full compatibility with existing ARM7 and STM32-based autopilot hardware. The new architecture emphasizes autonomous flight operations with LLM-assisted mission management.

## Design Principles

### 1. Fly the Aircraft First
The fundamental principle from aviation: **ALWAYS FLY THE AIRCRAFT FIRST**. No matter what subsystem failures occur, the primary responsibility is maintaining aircraft control. All mission management, telemetry, and LLM interactions are secondary to core flight control loops.

### 2. Full Autonomy
- Eliminate RC control dependency
- Complete missions without human intervention
- Dynamic home location updates
- Support for one-way missions (different takeoff/landing locations)
- RF links used exclusively for telemetry and mission updates

### 3. LLM Integration
- Model Context Protocol (MCP) server for structured LLM-autopilot communication
- Real-time mission adaptation based on atmospheric conditions
- Intelligent decision-making for mission optimization
- Safety oversight and anomaly detection

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Ground Station                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Web GCS UI    │  │   LLM Agent     │  │  MCP Server     │  │
│  │   (React/Vue)   │  │   (Chat UI)     │  │   (Node.js)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│           │                     │                     │         │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Message Broker (MQTT/WebSocket)               │  │
│  └─────────────────────────────────────────────────────────────┘  │
│           │                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Radio Interface (XBee/LoRa)                   │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                          RF Telemetry
                               │
┌─────────────────────────────────────────────────────────────────┐
│                        Airborne System                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Radio Module   │  │   Data Logger   │  │   Sensors       │  │
│  │   (XBee/LoRa)   │  │   (SD Card)     │  │   (IMU/GPS)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│           │                     │                     │         │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   Autopilot Core                           │  │
│  │              ARM7/STM32 Flight Controller                  │  │
│  │                                                             │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │  │
│  │  │ Flight Control│  │ Navigation    │  │ Mission Mgmt  │  │  │
│  │  │ (Stabilization│  │ (Waypoints)   │  │ (Autonomous)  │  │  │
│  │  │  Attitude)    │  │               │  │               │  │  │
│  │  └───────────────┘  └───────────────┘  └───────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### Ground Station Components

#### 1. Web-Based GCS (Ground Control Station)
- **Technology**: React/Vue.js + WebGL/Three.js
- **Features**:
  - Real-time 2D/3D map visualization
  - Flight plan editor with drag-and-drop waypoints
  - Live telemetry displays (PFD, engine parameters, environmental data)
  - Mission planning and execution monitoring
  - Video stream integration
  - Alert and alarm management

#### 2. LLM Agent Interface
- **Technology**: Node.js + WebSocket
- **Features**:
  - Chat interface for mission interaction
  - Natural language mission planning
  - Real-time atmospheric data interpretation
  - Anomaly detection and response suggestions
  - Mission optimization recommendations

#### 3. MCP Server
- **Technology**: Node.js
- **Protocol**: Model Context Protocol
- **Capabilities**:
  - Structured communication with LLM
  - Flight plan generation and modification
  - Telemetry data analysis
  - Safety protocol enforcement
  - Firmware upload coordination

#### 4. Message Broker
- **Technology**: MQTT or WebSocket-based
- **Purpose**:
  - Real-time telemetry distribution
  - Command routing
  - Multi-client support
  - Message persistence and replay

#### 5. Radio Interface
- **Hardware**: XBee Pro, LoRa modules
- **Protocol**: Custom packet format over radio
- **Features**:
  - Bidirectional telemetry
  - Command uplink
  - Range optimization
  - Error correction and retry logic

### Airborne Components

#### 1. Autopilot Core (Maintained from Original)
- **Hardware**: ARM7 (LPC21xx), STM32F1/F4 series
- **Language**: C (existing codebase maintained)
- **Functions**:
  - Flight control loops (attitude, altitude, speed)
  - Sensor fusion (IMU, GPS, pressure)
  - Actuator control (servos, motor)
  - Safety monitoring

#### 2. Mission Management
- **Enhanced Features**:
  - Autonomous takeoff and landing
  - Dynamic waypoint updates
  - Weather-adaptive flight paths
  - Emergency procedures
  - Fuel/battery optimization

#### 3. Data Logging
- **Storage**: High-capacity SD cards
- **Data**: High-frequency sensor data, mission logs, photos
- **Format**: Structured binary with metadata

## Communication Protocols

### 1. Ground-to-Air Messages
```json
{
  "type": "command",
  "timestamp": "2025-10-24T10:30:00Z",
  "source": "gcs",
  "destination": "aircraft_001",
  "command": {
    "type": "waypoint_update",
    "waypoint_id": 3,
    "latitude": 59.2345,
    "longitude": 10.1234,
    "altitude": 150
  }
}
```

### 2. Air-to-Ground Telemetry
```json
{
  "type": "telemetry",
  "timestamp": "2025-10-24T10:30:01Z",
  "source": "aircraft_001",
  "data": {
    "position": {
      "latitude": 59.2344,
      "longitude": 10.1235,
      "altitude": 148
    },
    "attitude": {
      "roll": 2.1,
      "pitch": -1.5,
      "yaw": 85.3
    },
    "environmental": {
      "temperature": -5.2,
      "humidity": 85,
      "pressure": 1013.25
    }
  }
}
```

### 3. LLM-MCP Communication
```json
{
  "jsonrpc": "2.0",
  "method": "update_flight_plan",
  "params": {
    "aircraft_id": "aircraft_001",
    "modification": {
      "type": "insert_waypoint",
      "after": 2,
      "waypoint": {
        "latitude": 59.2400,
        "longitude": 10.1300,
        "altitude": 200,
        "actions": ["circle", "take_photo"]
      }
    },
    "reason": "Atmospheric condition optimization"
  },
  "id": 1
}
```

## Safety Systems

### 1. Flight Control Hierarchy
1. **Hardware Watchdog**: Independent circuit monitoring
2. **Flight Control Core**: Maintains aircraft stability
3. **Navigation System**: Waypoint following and obstacle avoidance
4. **Mission Management**: High-level goal execution
5. **Ground Control**: Mission updates and monitoring
6. **LLM Assistance**: Advisory only, never override

### 2. Fail-Safe Mechanisms
- **Lost Link**: Automatic return-to-home
- **Low Power**: Emergency landing protocols
- **Sensor Failure**: Graceful degradation
- **Weather**: Automatic diversion procedures
- **Geofencing**: Hard boundaries enforcement

### 3. LLM Safety Constraints
- Cannot directly control flight surfaces
- Cannot override safety protocols
- Cannot modify critical flight parameters without confirmation
- All suggestions require validation against flight envelope

## Development Environment

### macOS M4 Compatibility
- **Node.js**: v18+ with ARM64 native support
- **Cross-compilation**: ARM-based toolchain for STM32
- **Docker**: ARM64 containers for development consistency
- **VS Code**: Native ARM64 with extensions

### Build System
- **Airborne**: CMake + ARM GCC toolchain
- **Ground Station**: npm/yarn + Webpack/Vite
- **MCP Server**: TypeScript + Node.js
- **Docker**: Multi-stage builds for production deployment

## Migration Strategy

### Phase 1: Foundation (Weeks 1-4)
- Set up Node.js development environment
- Implement basic message broker
- Create minimal web GCS
- Establish radio communication

### Phase 2: Core Functionality (Weeks 5-8)
- Port essential OCaml tools to Node.js
- Implement flight plan management
- Add telemetry visualization
- Basic MCP server framework

### Phase 3: LLM Integration (Weeks 9-12)
- Complete MCP server implementation
- Add LLM agent interface
- Implement mission planning assistance
- Safety protocol integration

### Phase 4: Advanced Features (Weeks 13-16)
- Atmospheric research capabilities
- Advanced visualization
- Multi-aircraft support
- Production deployment tools

## Hardware Compatibility

### Supported Autopilots
- **Lisa/L**: STM32F4 + IMU + GPS
- **Lisa/M**: STM32F4 + basic sensors
- **Umarim Lite**: ARM7 + external sensors
- **TWOG**: ARM7 + data logging
- **Custom STM32**: F1/F4/F7 series boards

### Required Sensors
- **IMU**: 3-axis gyro, accelerometer, magnetometer
- **GPS**: uBlox or compatible NMEA
- **Pressure**: Barometric altitude sensor
- **Environmental**: Temperature, humidity (for SUMO)
- **Airspeed**: Pitot tube (optional)

### Communication Hardware
- **Primary**: XBee Pro 900MHz/2.4GHz
- **Alternative**: LoRa modules (868MHz/915MHz)
- **Backup**: WiFi for short-range operations

## Data Structures

### Flight Plan Format
```json
{
  "aircraft_id": "sumo_001",
  "mission_name": "atmospheric_survey_001",
  "waypoints": [
    {
      "id": 0,
      "type": "takeoff",
      "position": {"lat": 59.2345, "lon": 10.1234, "alt": 0},
      "actions": ["engine_start", "arm_autopilot"]
    },
    {
      "id": 1,
      "type": "survey",
      "position": {"lat": 59.2400, "lon": 10.1300, "alt": 150},
      "actions": ["start_logging", "begin_survey"]
    },
    {
      "id": 99,
      "type": "landing",
      "position": {"lat": 59.2350, "lon": 10.1240, "alt": 0},
      "actions": ["stop_logging", "engine_stop"]
    }
  ],
  "parameters": {
    "cruise_speed": 15.0,
    "max_altitude": 300,
    "fuel_limit": 45,
    "weather_limits": {
      "max_wind": 10,
      "min_visibility": 1000
    }
  }
}
```

### Environmental Data Structure
```json
{
  "timestamp": "2025-10-24T10:30:00Z",
  "position": {"lat": 59.2345, "lon": 10.1234, "alt": 150},
  "atmospheric": {
    "temperature": -5.2,
    "humidity": 85.3,
    "pressure": 1013.25,
    "wind_speed": 8.5,
    "wind_direction": 245
  },
  "air_quality": {
    "co2": 415.2,
    "particles_pm25": 12.5,
    "particles_pm10": 18.3
  }
}
```

This architecture provides a solid foundation for modernizing Paparazzi while maintaining its core strengths in autonomous flight and atmospheric research, now enhanced with intelligent LLM assistance for mission optimization and real-time decision making.