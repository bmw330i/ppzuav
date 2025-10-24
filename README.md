# Paparazzi Next-Gen UAV System

## Overview

Paparazzi Next-Gen is a modernized version of the open-source Paparazzi UAV system, rebuilt from the ground up to eliminate OCaml dependencies and embrace autonomous flight with LLM-assisted mission management. This fork maintains full compatibility with existing ARM7 and STM32-based autopilot hardware while providing a cutting-edge Node.js and web-based ground control system.

**🎯 Key Innovation**: Integration of Large Language Models (LLMs) through a Model Context Protocol (MCP) server, enabling intelligent mission planning, real-time atmospheric analysis, and autonomous decision-making for scientific research flights.

## 🆕 What's New in Next-Gen

### ✅ Modernized Technology Stack
- **Eliminated OCaml dependencies** - Now pure Node.js + Web technologies
- **Native macOS M4 support** - Optimized for Apple Silicon
- **Modern web-based GCS** - React/Vue.js with WebGL visualization
- **Real-time telemetry** - WebSocket/MQTT message broker
- **Docker containerization** - Easy deployment and development

### 🤖 LLM Integration
- **MCP Server** - Structured communication protocol for LLM-autopilot interaction
- **Intelligent mission planning** - Natural language flight plan creation
- **Real-time optimization** - Atmospheric condition adaptation
- **Safety oversight** - Anomaly detection and response suggestions
- **Meteorological analysis** - Perfect for atmospheric research missions

### 🛩️ Enhanced Autonomy
- **No RC dependency** - Fully autonomous operation from takeoff to landing
- **Dynamic home location** - Updateable base positions
- **One-way missions** - Different takeoff and landing locations
- **Weather adaptation** - Intelligent response to changing conditions
- **Mission continuity** - Complete operations without human intervention

## 🎯 Primary Use Cases

### 1. Atmospheric Research (SUMO-style)
Perfect for scientific missions with miniaturized environmental sensors:
- Temperature, humidity, pressure profiling
- Air quality monitoring (CO2, particulates)
- Meteorological data collection
- Research station support in remote locations
- LLM-guided mission optimization based on atmospheric conditions

### 2. Autonomous Surveillance
- Perimeter monitoring
- Wildlife tracking
- Infrastructure inspection
- Search and rescue operations

### 3. Educational Platform
- University research projects
- Autonomous systems development
- Atmospheric science education
- AI/ML integration studies

## 🛠️ Hardware Compatibility

### Supported Autopilot Boards
- **Lisa/L** - STM32F4 with integrated IMU and GPS
- **Lisa/M** - STM32F4 with basic sensor suite
- **Umarim Lite v2** - ARM7 with external sensors
- **TWOG** - ARM7 with data logging capabilities
- **Custom STM32** - F1/F4/F7 series compatible

### Communication Hardware
- **XBee Pro** - 900MHz/2.4GHz long-range telemetry
- **LoRa modules** - 868MHz/915MHz alternative
- **WiFi** - Short-range development and testing

### Environmental Sensors (SUMO Configuration)
- **Temperature**: High-precision digital sensors
- **Humidity**: Capacitive humidity sensors
- **Pressure**: Barometric pressure for altitude and weather
- **Air Quality**: CO2, PM2.5, PM10 sensors
- **Wind**: Airspeed and direction measurement

## 🚀 Quick Start (macOS M4)

### Prerequisites
```bash
# Install Node.js (v18+)
brew install node

# Install development tools
brew install git cmake

# Install ARM toolchain for autopilot firmware
brew install --cask gcc-arm-embedded
```

### Installation
```bash
# Clone the repository
git clone https://github.com/bmw330i/paparazzi.git
cd paparazzi

# Install dependencies
npm install

# Build the system
npm run build

# Start the ground control station
npm run gcs
```

### First Flight Simulation
```bash
# Start the simulator
npm run sim

# Open GCS in browser
open http://localhost:3000

# Load example mission
npm run load-mission examples/microjet_demo.json
```


## 📡 System Architecture

The system follows a layered architecture prioritizing flight safety:

```
1. Flight Control Core (C on STM32/ARM7) - ALWAYS MAINTAINS AIRCRAFT CONTROL
2. Navigation System - Waypoint following and obstacle avoidance  
3. Mission Management - High-level autonomous goal execution
4. Ground Station - Monitoring, telemetry, mission updates
5. LLM Assistant - Advisory suggestions, mission optimization
```

**Safety Principle**: The LLM can NEVER directly control flight surfaces or override safety protocols. It provides intelligent suggestions that are validated against flight envelopes and safety constraints.

## 💬 LLM Chat Interface

The integrated LLM provides natural language interaction for mission management:

```
Human: "Plan a temperature survey mission at 150m altitude covering the valley"

LLM: "I'll create a survey pattern with 8 waypoints covering the valley area at 150m. 
Based on current wind conditions (8kt from SW), I recommend starting from the 
downwind side to optimize fuel efficiency. Estimated flight time: 28 minutes."
```

## 🔧 Development Environment

### Directory Structure (Modernized)
```
bmw330ipaparazzi/
├── src/                    # Node.js source code
│   ├── mcp-server/        # Model Context Protocol server
│   ├── gcs/               # Web-based Ground Control Station
│   ├── message-broker/    # MQTT/WebSocket telemetry
│   └── tools/             # Build and configuration tools
├── airborne/              # C code for autopilots (maintained)
├── conf/                  # Configuration files (JSON format)
├── data/                  # Maps, terrain data, mission files
├── examples/              # Example missions and configurations
├── docker/                # Container definitions
└── docs/                  # Documentation and guides
```

## 🛩️ Flight Operations

### Mission Planning
1. **Natural Language**: Describe mission to LLM via chat
2. **Visual Planning**: Drag waypoints on web-based map
3. **Automatic Optimization**: LLM suggests improvements based on weather/fuel
4. **Safety Validation**: All plans checked against flight envelope
5. **Upload**: Missions sent to autopilot via radio link

### Autonomous Flight Sequence
1. **Pre-flight**: Automatic system checks and weather evaluation
2. **Takeoff**: Autonomous engine start and departure
3. **Mission**: Waypoint navigation with environmental data collection
4. **Adaptation**: Real-time mission modification based on conditions
5. **Return**: Automatic navigation to landing location
6. **Landing**: Autonomous approach and touchdown

### Environmental Data Collection
- **Real-time logging**: High-frequency sensor data to SD card
- **Telemetry stream**: Live data broadcast to ground station
- **LLM analysis**: Intelligent interpretation of atmospheric conditions
- **Mission optimization**: Dynamic flight path adjustments
- **Data export**: Scientific-grade data formats for research

## 🔒 Safety Systems

### Multi-layer Safety Architecture
1. **Hardware Watchdog**: Independent monitoring circuit
2. **Flight Control**: Core stability and control loops (highest priority)
3. **Navigation**: Geofencing and obstacle avoidance
4. **Mission Logic**: Goal execution with safety constraints
5. **Ground Oversight**: Human monitoring and intervention capability
6. **LLM Advisory**: Intelligent suggestions with mandatory validation

### Emergency Procedures
- **Lost Link**: Automatic return-to-home
- **Low Power**: Emergency landing at nearest safe location
- **Weather Deterioration**: Automatic diversion or early return
- **Sensor Failure**: Graceful degradation and safe landing
- **System Error**: Fail-safe mode with basic stability control

## 🧪 Scientific Applications

### SUMO (Small Unmanned Meteorological Observer)
Enhanced version of the atmospheric research platform:
- **Advanced Sensors**: Temperature, humidity, pressure, air quality
- **Extended Range**: LoRa communication for long-distance missions
- **Intelligent Sampling**: LLM-guided measurement point selection
- **Data Quality**: Real-time data validation and quality control
- **Mission Continuity**: Autonomous operation in harsh environments

### Research Applications
- **Atmospheric Boundary Layer**: Temperature and wind profiling
- **Air Quality Monitoring**: Pollution measurement and mapping
- **Climate Research**: Long-term atmospheric data collection
- **Weather Station Networks**: Automated meteorological observations
- **Polar Research**: Extreme environment data collection

## 🔗 Links and Resources

### Documentation
- [Architecture Guide](./ARCHITECTURE.md) - Detailed system design
- [LLM Integration Guide](./LLM_GUIDANCE.md) - Working with the AI assistant
- [Hardware Setup](./docs/hardware-setup.md) - Autopilot configuration
- [Mission Planning](./docs/mission-planning.md) - Flight plan creation

### Original Paparazzi Project
- [Official Website](http://paparazzi.enac.fr) - Original project information
- [Hardware Wiki](https://wiki.paparazziuav.org/wiki/Hardware) - Autopilot boards
- [SUMO Project](https://wiki.paparazziuav.org/wiki/SUMO) - Atmospheric research platform

### Community
- [GitHub Issues](https://github.com/bmw330i/paparazzi/issues) - Bug reports and feature requests
- [Discussions](https://github.com/bmw330i/paparazzi/discussions) - Community support
- [Contributing](./CONTRIBUTING.md) - How to contribute to the project

## 📄 License

This project maintains the GPL license of the original Paparazzi project. The modernization and LLM integration components are released under the same GPL v2+ license.

**Copyright**: Original Paparazzi team + bmw330i Next-Gen modernization (2025)

---

**⚠️ Safety Notice**: This is experimental software for autonomous aircraft. Always follow local aviation regulations, maintain visual contact when required by law, and ensure proper safety protocols are in place. The LLM assistant is for guidance only and should not replace proper flight planning and safety procedures.