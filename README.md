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


Directories quick and dirty description:
----------------------------------------

_conf_: the configuration directory (airframe, radio, ... descriptions).

_data_: where to put read-only data (e.g. maps, terrain elevation files, icons)

_doc_: documentation (diagrams, manual source files, ...)

_sw_: software (onboard, ground station, simulation, ...)

_var_: products of compilation, cache for the map tiles, ...


Compilation and demo simulation
-------------------------------

1. type "make" in the top directory to compile all the libraries and tools.

2. "./paparazzi" to run the Paparazzi Center

3. Select the "Microjet" aircraft in the upper-left A/C combo box.
  Select "sim" from upper-middle "target" combo box. Click "Build".
  When the compilation is finished, select "Simulation" from
  the upper-right session combo box and click "Execute".

4. In the GCS, wait about 10s for the aircraft to be in the "Holding point" navigation block.
  Switch to the "Takeoff" block (lower-left blue airway button in the strip).
  Takeoff with the green launch button.

Uploading of the embedded software
----------------------------------

1. Power the flight controller board while it is connected to the PC with the USB cable.

2. From the Paparazzi center, select the "ap" target, and click "Upload".


Flight
------

1.  From the Paparazzi Center, select the flight session and ... do the same than in simulation !