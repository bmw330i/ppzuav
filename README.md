# PaparazziAI - Next Generation Autonomous UAV System

**🎯 A Complete Modernization with AI Pilot, FAA-Compliant Operations, and Interactive Mapping**

## 🚀 **Mission Accomplished - Complete AI UAV Ecosystem!**

**All Goals Achieved!** We have successfully created a modern, intelligent UAV platform with complete AI pilot capabilities:

- ✅ **AI Pilot System** - FAA-compliant autonomous operations with safety-first design
- ✅ **Aircraft Builder** - Automated UAV design with weight & balance calculations
- ✅ **Hardware Database** - COTS component library for sub-250g aircraft
- ✅ **Flight Planning** - Professional mission planning with weather integration
- ✅ **Real-time Operations** - Complete autonomous workflow execution
- ✅ **Interactive Mapping** - IP geolocation with OpenStreetMap integration
- ✅ **LLM Integration** - Model Context Protocol for intelligent flight management
- ✅ **Modern Architecture** - Node.js/TypeScript with professional service management

## 🎯 **Project Vision**

PaparazziAI represents a complete modernization of UAV operations, introducing AI pilot capabilities, automated aircraft design, and FAA-compliant autonomous flight operations. The system features LLM integration via Model Context Protocol (MCP), interactive real-time mapping, and a comprehensive hardware database for sub-250g UAVs.

## 📜 **Licensing & Intellectual Property**

**🔒 This codebase is independently developed and licensed.**

- **Original Paparazzi GPL Code**: Moved to `paparazzi_reference/` for research purposes only
- **New PaparazziAI Code**: Independently created AI-generated code with separate licensing
- **Protection Strategy**: Private repository until system maturity and security validation

The new PaparazziAI system is completely separate from the original GPL-licensed Paparazzi project and contains no GPL code. All new code is AI-generated and independently developed.

### **Core Technology Stack:**
- **🚀 Backend**: Node.js 18+ (ARM64 optimized), TypeScript, MQTT, WebSocket
- **⚛️ Frontend**: React 19, TypeScript, Leaflet mapping, Socket.IO
- **🗺️ Mapping**: OpenStreetMap (free), IP geolocation via ipapi.co, GPS fallback
- **🧠 LLM Integration**: Model Context Protocol (MCP) server for intelligent flight management
- **📊 Logging**: Structured JSON logging to files with professional monitoring tools
- **🔧 Services**: Background process management with PID tracking and health monitoring

### **Service Architecture:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React GCS     │◄──►│  Message Broker  │◄──►│  Flight Sim     │
│  (Port 3000)    │    │   (Port 8080)    │    │  (Port 8090)    │
│   🗺️ Mapping    │    │   📡 MQTT/WS     │    │   🛩️ Physics    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲                        ▲                       ▲
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   File Logs     │    │   MCP Server     │    │   Aircraft      │
│  (/logs/*.log)  │    │   (Port 3001)    │    │   Hardware      │
│   📊 Monitoring │    │   🧠 LLM AI      │    │   🛸 STM32      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🌟 **Revolutionary Features**

### **🗺️ Interactive Real-time Mapping System**
Our mapping system sets a new standard for UAV ground control:

- **🌍 Automatic IP Geolocation**: Detects your ground station location automatically using ipapi.co
- **📍 Smart Location Detection**: Falls back to browser GPS for enhanced accuracy
- **✈️ Real-time Aircraft Tracking**: Live position updates with custom aircraft icons
- **🛤️ Flight Path Visualization**: Dynamic flight path rendering with configurable history
- **🎮 Integrated Demo Mode**: Realistic flight simulation for testing without hardware
- **🗾 Professional Mapping**: OpenStreetMap integration (no API keys required)
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile

### **🧠 LLM-Assisted Flight Management**
Revolutionary AI integration that changes how we interact with UAVs:

- **💬 Natural Language Commands**: "Fly to waypoint A", "Return to base", "Check battery status"
- **🔍 Intelligent Analysis**: Real-time telemetry interpretation and optimization suggestions
- **⚠️ Proactive Safety Monitoring**: Automated alerts for critical system states
- **🗓️ Smart Mission Planning**: AI-assisted route optimization with weather consideration
- **📈 Performance Insights**: Historical data analysis and flight improvement recommendations

## 🤖 **AI Pilot System - Complete Autonomous UAV Operations**

The AI Pilot system represents the future of autonomous UAV operations, combining FAA-compliant flight planning, automated aircraft design, and real-time safety monitoring into a comprehensive ecosystem.

### **Core Components**

#### **✈️ Aircraft Builder** (`aircraft_builder/aircraft_builder.py`)
Automated UAV design and configuration system:
- **Weight & Balance**: Automatic center of gravity calculations
- **Stability Analysis**: Flight characteristic estimation and validation
- **Component Integration**: Hardware compatibility and power analysis
- **Performance Modeling**: Flight time, speed, and envelope calculations
- **XML/JSON Generation**: Complete Paparazzi airframe configurations

#### **🗺️ AI Flight Planner** (`aircraft_builder/ai_pilot.py`)
FAA-compliant autonomous flight planning:
- **Weather Integration**: METAR/TAF data analysis and risk assessment
- **Terrain Analysis**: Elevation profiling and obstacle avoidance
- **Safety Validation**: Multi-layer FAA compliance checking
- **Emergency Procedures**: Comprehensive contingency planning
- **Pilot Briefings**: Professional aviation-standard mission briefings

#### **🎯 Complete Operations System** (`aircraft_builder/complete_ai_pilot_system.py`)
End-to-end autonomous mission execution:
- **Pre-flight Checks**: Automated system verification and validation
- **Mission Automation**: Launch detection and autonomous execution
- **Real-time Monitoring**: Live telemetry analysis and safety oversight
- **Post-flight Analysis**: Mission debriefing and performance assessment
- **System Integration**: Seamless workflow from design to flight

#### **📊 Hardware Database** (`hardware_config/`)
Comprehensive COTS component library:
- **Autopilots**: Tiny 2.11, Lisa MX, Cube Black, Pixhawk 4 (all <250g)
- **Sensors**: IMU, GPS, barometer, magnetometer, airspeed systems
- **Power Systems**: LiPo batteries, motors, and power distribution
- **Compatibility**: Paparazzi integration and availability verification

### **Safety Architecture**
- **FAA Part 107 Compliance**: Built-in regulatory adherence checking
- **Multi-layer Validation**: Hardware, software, and procedural safety
- **Emergency Procedures**: Comprehensive contingency protocols
- **Risk Assessment**: Weather, terrain, and operational hazard analysis
- **Go/No-Go Decisions**: Conservative safety-first mission approval

### **Flight Operations Workflow**
1. **Aircraft Design**: Automated airframe configuration and validation
2. **Mission Planning**: FAA-compliant route planning with safety analysis
3. **Pre-flight Checks**: System verification and safety validation
4. **Autonomous Execution**: Launch detection and mission automation
5. **Real-time Monitoring**: Live safety oversight and performance tracking
6. **Post-flight Analysis**: Mission debriefing and improvement recommendations

### **Example Usage**
```bash
# 1. Design and validate aircraft
python3 aircraft_builder/aircraft_builder.py

# 2. Generate FAA-compliant flight plan
python3 aircraft_builder/ai_pilot.py

# 3. Execute complete autonomous mission
python3 aircraft_builder/complete_ai_pilot_system.py
```

### **Key Features**
- **🤖 AI Pilot Behavior**: Acts like a certified human pilot with FAA knowledge
- **⚖️ Weight Limits**: All designs constrained to <250g for regulatory compliance
- **🛡️ Safety First**: Multiple validation layers and emergency procedures
- **📡 ADS-B Integration**: Real-time traffic monitoring and collision avoidance
- **🌤️ Weather Adaptive**: Dynamic mission modification based on conditions
- **🏔️ Terrain Aware**: Elevation profiling and obstacle avoidance planning

### **📊 Professional Service Management**
Enterprise-grade service management built for reliability:

- **🔄 Background Processing**: All services run independently without blocking terminal
- **📁 Structured Logging**: JSON-formatted logs with timestamps, levels, and metadata
- **🎛️ Service Orchestration**: Start/stop/restart all components with simple commands
- **📈 Health Monitoring**: Real-time status checking with PID tracking
- **🔍 Advanced Log Analysis**: Search, filter, and monitor across all services
- **⚡ Hot Reloading**: Development mode with automatic service restart on code changes## 🚀 **Quick Start Guide**

### **📋 Prerequisites**
```bash
# Verify Node.js version (18+ required, ARM64 optimized for Apple Silicon)
node --version  # Should show v18.0.0 or higher

# Verify Python 3.7+ for AI Pilot system
python3 --version  # Should show v3.7.0 or higher

# Verify pip for Python package management
pip3 --version
```

### **⚡ Super Fast Setup**
```bash
# 1. Clone and setup (one command)
git clone https://github.com/bmw330i/paparazzi.git && cd paparazzi && npm run setup

# 2. Start all services in background
npm run services:start

# 3. Open Ground Control Station
open http://localhost:3000
```

### **🤖 AI Pilot System Quick Start**
```bash
# 1. Design your aircraft (generates complete UAV configuration)
python3 aircraft_builder/aircraft_builder.py

# 2. Generate FAA-compliant flight plan
python3 aircraft_builder/ai_pilot.py

# 3. Execute complete autonomous mission
python3 aircraft_builder/complete_ai_pilot_system.py
```

### **🎮 Test the Interactive Map**
1. **Navigate to Map Tab** in the GCS interface
2. **Wait for geolocation** - Your position will be detected automatically via IP
3. **Click "📡 Live Data"** to switch to **"🎮 Demo Mode"**
4. **Watch the magic** - See a simulated aircraft flying with real-time telemetry
5. **Observe flight path** - Watch the orange line trace the aircraft's movement

## 🎛️ **Service Management**

### **🚀 Background Service Commands**
```bash
# Service Control
npm run services:start    # Start all services in background
npm run services:stop     # Stop all services gracefully
npm run services:restart  # Restart all services
npm run services:status   # Check what's running
npm run services:clean    # Stop services and clean logs

# Quick individual access
npm run gcs              # GCS only (foreground)
npm run dev:broker       # Message broker only
npm run sim              # Flight simulator only
```

### **📊 Advanced Logging & Monitoring**
```bash
# Real-time Log Monitoring
npm run services:logs    # Live tail of all service logs
npm run logs:tail        # Pretty-formatted live log viewer
npm run logs:errors      # Show only error messages
npm run logs:stats       # Display log statistics

# Targeted Log Analysis
./scripts/logs.sh show gcs              # Last 50 lines of GCS
./scripts/logs.sh show message-broker   # Message broker logs
./scripts/logs.sh search "WebSocket"    # Search across all logs
./scripts/logs.sh errors simulator      # Errors from simulator only
```

## 🌐 **Access Points & URLs**

| Service | URL | Description |
|---------|-----|-------------|
| **🎛️ Ground Control Station** | http://localhost:3000 | Main web interface with interactive mapping |
| **📡 Message Broker** | ws://localhost:8080 | WebSocket endpoint for real-time communication |
| **🧠 MCP Server** | http://localhost:3001 | LLM integration endpoint |
| **🛩️ Flight Simulator** | http://localhost:8090 | Physics simulation WebSocket |

## 📁 **Logging System Architecture**

### **📊 Log File Structure**
```
logs/
├── combined.log         # 📋 All services aggregated
├── message-broker.log   # 📡 MQTT broker and WebSocket server  
├── gcs.log             # ⚛️ React app, compilation, and runtime
├── mcp-server.log      # 🧠 LLM integration and MCP protocol
└── simulator.log       # 🛩️ Flight physics and telemetry generation
```

### **📈 Log Format & Features**
- **🏷️ Structured JSON**: Consistent format with timestamp, level, component, message
- **🎨 Color-coded Output**: Visual distinction between ERROR, WARN, INFO, DEBUG
- **🔍 Searchable Content**: Full-text search across all logs
- **📊 Statistics Tracking**: Line counts, error rates, file sizes
- **🔄 Automatic Rotation**: Configurable log retention (default: 7 days)

## 🗺️ **Interactive Mapping Deep Dive**

### **🌍 Geolocation Technology**
Our advanced geolocation system provides accurate positioning:

- **🌐 Primary: IP Geolocation** via ipapi.co (no API key required)
- **📡 Secondary: Browser GPS** for enhanced precision when available
- **📍 Accuracy Estimation** with confidence intervals displayed
- **🏙️ Location Context** including city, country, and timezone
- **⚡ Fast Updates** with intelligent caching and fallback mechanisms

### **✈️ Aircraft Visualization**
Professional-grade aircraft tracking and visualization:

- **🔶 Custom Aircraft Icon** - Orange star with attitude indication
- **🟢 Ground Station Marker** - Green diamond showing your location
- **🛤️ Real-time Flight Path** - Dynamic orange line with 100-point history
- **📊 Live Telemetry Overlay** - Altitude, speed, heading, battery status
- **🎮 Demo Mode Toggle** - Seamless switch between live and simulated data

### **🗾 Map Features**
- **🗺️ OpenStreetMap Integration** - High-quality, free mapping tiles
- **🔍 Zoom & Pan Controls** - Smooth navigation with mouse/touch
- **📱 Responsive Design** - Optimized for all screen sizes
- **🎨 Professional Styling** - Clean, aviation-focused interface
- **⚡ Performance Optimized** - Efficient rendering with lazy loading

## 🧠 **LLM Integration Capabilities**

### **💬 Natural Language Interface**
The integrated LLM provides intelligent assistance:

```
👤 Human: "Show me the current battery status and estimated flight time"

🤖 LLM: "Current battery: 78% (11.8V). Based on current power consumption 
and flight profile, estimated remaining flight time is 23 minutes. 
Weather conditions are favorable with 5kt headwind."

👤 Human: "Plan a return to base if battery drops below 25%"

🤖 LLM: "Automated return-to-base trigger set for 25% battery. Route 
calculated: direct heading 284°, distance 2.1km, ETA 4 minutes at 
current airspeed. Landing pattern configured for runway 28."
```

### **🔍 Intelligent Analysis Features**
- **📊 Real-time Data Interpretation** - Telemetry analysis and trend identification
- **⚠️ Predictive Alerts** - Early warning system for potential issues
- **🎯 Mission Optimization** - Route planning with weather and performance factors
- **📈 Performance Tracking** - Historical analysis and improvement suggestions
- **🛡️ Safety Oversight** - Continuous monitoring with emergency procedure recommendations

## 🛠️ **Development Environment**

### **📁 Project Structure (PaparazziAI)**
```
bmw330ipaparazzi/
├── src/                           # 🚀 Node.js/TypeScript source (AI-generated)
│   ├── gcs/                      # ⚛️ React Ground Control Station
│   │   ├── src/components/       # 🧩 UI components (MapView, etc.)
│   │   ├── src/services/         # 🔧 GeolocationService, DemoData
│   │   └── src/context/          # 🔄 WebSocket, state management
│   ├── message-broker/           # 📡 MQTT/WebSocket communication
│   ├── mcp-server/              # 🧠 LLM integration server
│   ├── simulator/               # 🛩️ Flight physics simulation
│   └── utils/                   # 🛠️ Shared utilities, logging
├── aircraft_builder/            # ✈️ AI Pilot aircraft design system
│   ├── aircraft_builder.py      # Automated UAV design & configuration
│   ├── ai_pilot.py             # FAA-compliant flight planning
│   ├── complete_ai_pilot_system.py # End-to-end autonomous operations
│   └── *.json                  # Generated aircraft configurations
├── hardware_config/             # 📊 Hardware component database
│   ├── autopilots.json         # Autopilot specifications
│   └── sensors.json            # Sensor specifications
├── prompts/                     # 🤖 AI Pilot knowledge base
│   ├── ai_pilot_system.txt     # Complete AI pilot guidelines
│   └── flight_plan_*.json      # Generated mission plans
├── scripts/                      # 📜 Service management scripts
│   ├── services.sh              # 🎛️ Background service control
│   └── logs.sh                  # 📊 Log monitoring utilities
├── paparazzi_reference/         # 📚 Original GPL code (reference only)
│   ├── sw/                      # Original airborne C code
│   ├── conf/                    # Original configurations
│   ├── doc/                     # Original documentation
│   └── README.md                # Reference code disclaimer
├── logs/                        # 📁 All service logs
├── .pids/                       # 🔢 Process ID tracking
├── package.json                 # 📦 Node.js dependencies
├── tsconfig.json               # ⚙️ TypeScript configuration
└── README.md                    # � This documentation
```### **🔧 Development Workflow**
```bash
# Development mode with hot reloading
npm run dev                      # All services with file watching
npm run dev:gcs                 # GCS only with React hot reload
npm run dev:broker              # Message broker with nodemon

# Testing and validation
npm test                        # Run test suite
npm run lint                    # Code quality checking
npm run build                   # Production build

# Debugging and analysis
npm run logs:errors             # Focus on error messages
./scripts/logs.sh search "GPS"  # Debug specific functionality
```

## 🛩️ **Flight Operations**

### **🎯 Mission Planning Workflow**
1. **🗺️ Interactive Planning** - Click waypoints directly on the map
2. **🧠 LLM Optimization** - AI suggests improvements based on weather/performance
3. **✅ Safety Validation** - Automatic checks against flight envelope and regulations
4. **📡 Upload to Aircraft** - Secure transmission via radio link
5. **👁️ Real-time Monitoring** - Live mission progress with adaptive replanning

### **🤖 Autonomous Flight Sequence**
1. **🔍 Pre-flight Checks** - Automated system verification and weather analysis
2. **🛫 Smart Takeoff** - Intelligent departure with obstacle avoidance
3. **🎯 Mission Execution** - Waypoint navigation with real-time optimization
4. **🔄 Adaptive Planning** - Dynamic mission modification based on conditions
5. **🏠 Intelligent Return** - Optimized route planning for landing approach
6. **🛬 Automated Landing** - Precision approach with safety monitoring

### **📊 Real-time Data Collection**
- **📈 High-frequency Logging** - Multi-sensor data to onboard storage
- **📡 Live Telemetry Stream** - Real-time data broadcast to ground station
- **🧠 Intelligent Analysis** - LLM-powered interpretation of sensor readings
- **🎯 Adaptive Sampling** - Dynamic measurement strategies based on conditions
- **📁 Research-grade Export** - Scientific data formats for analysis

## 🔒 **Advanced Safety Systems**

### **🛡️ Multi-layer Safety Architecture**
1. **⚡ Hardware Watchdog** - Independent monitoring circuit (highest priority)
2. **🎮 Flight Control Core** - Real-time stability and control loops  
3. **🗺️ Navigation Safety** - Geofencing and collision avoidance
4. **🎯 Mission Logic** - Goal execution with safety constraint validation
5. **👁️ Ground Oversight** - Human monitoring with intervention capability
6. **🧠 LLM Advisory** - Intelligent suggestions with mandatory safety validation

### **🚨 Emergency Response Procedures**
- **📡 Lost Link Protocol** - Automatic return-to-home with alternate landing sites
- **🔋 Low Power Management** - Predictive landing at nearest safe location
- **🌦️ Weather Degradation** - Automatic diversion with real-time replanning
- **⚠️ Sensor Failure Handling** - Graceful degradation with backup systems
- **🛑 System Error Recovery** - Fail-safe mode with basic stability maintenance

## 🧪 **Scientific Research Applications**

### **🌡️ SUMO Enhanced (Small Unmanned Meteorological Observer)**
Next-generation atmospheric research platform:

- **📊 Advanced Sensor Suite** - Temperature, humidity, pressure, air quality, wind
- **📡 Extended Communication** - LoRa for long-range missions beyond radio horizon
- **🧠 Intelligent Sampling** - LLM-guided measurement point selection and optimization
- **✅ Real-time Validation** - Automated data quality control and anomaly detection
- **🌨️ Extreme Environment** - Autonomous operation in harsh weather conditions

### **🔬 Research Capabilities**
- **🌤️ Atmospheric Boundary Layer** - Vertical temperature and wind profiling
- **🏭 Air Quality Monitoring** - Pollution measurement and real-time mapping
- **📈 Climate Research** - Long-term atmospheric data collection and analysis
- **🌡️ Weather Station Networks** - Automated meteorological observations
- **🧊 Polar Research** - Extreme environment data collection with remote operation

## 📚 **Documentation & Resources**

### **📖 Technical Documentation**
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed system design and data flows
- **[LLM_INTEGRATION.md](./LLM_INTEGRATION.md)** - Model Context Protocol implementation
- **[MAPPING_SYSTEM.md](./MAPPING_SYSTEM.md)** - Interactive mapping architecture
- **[SERVICE_MANAGEMENT.md](./SERVICE_MANAGEMENT.md)** - Background services guide
- **[AI_PILOT_SYSTEM.md](./prompts/ai_pilot_system.txt)** - Complete AI pilot guidelines and procedures

### **🤖 AI Pilot Documentation**
- **[Aircraft Builder Guide](./aircraft_builder/README.md)** - Automated UAV design system
- **[Flight Planning](./prompts/flight_plan_README.md)** - FAA-compliant mission planning
- **[Hardware Database](./hardware_config/README.md)** - COTS component specifications
- **[Safety Procedures](./prompts/emergency_procedures.md)** - Emergency response protocols

### **🎓 User Guides**
- **[QUICK_START.md](./docs/quick-start.md)** - Getting started tutorial
- **[MISSION_PLANNING.md](./docs/mission-planning.md)** - Flight plan creation
- **[HARDWARE_SETUP.md](./docs/hardware-setup.md)** - Autopilot configuration
- **[TROUBLESHOOTING.md](./docs/troubleshooting.md)** - Common issues and solutions

### **🌐 External Resources**
- **[Original Paparazzi Project](http://paparazzi.enac.fr)** - Heritage system information
- **[Hardware Compatibility Wiki](https://wiki.paparazziuav.org/wiki/Hardware)** - Supported autopilot boards
- **[SUMO Research Platform](https://wiki.paparazziuav.org/wiki/SUMO)** - Atmospheric research background

## 🤝 **Community & Support**

### **💬 Getting Help**
- **[GitHub Issues](https://github.com/bmw330i/paparazzi/issues)** - Bug reports and feature requests
- **[Discussions](https://github.com/bmw330i/paparazzi/discussions)** - Community support and ideas
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to the project

### **🏆 Contributing**
We welcome contributions! Areas of particular interest:
- **🗺️ Enhanced mapping features** (satellite imagery, terrain analysis)
- **🧠 Advanced LLM capabilities** (mission planning, safety analysis)
- **📱 Mobile applications** (companion apps, field tools)
- **🔬 Scientific instruments** (specialized sensor integration)
- **🌐 Multi-aircraft coordination** (swarm intelligence, collaborative missions)

## 📄 **License & Legal**

This project maintains the **GPL v2+** license of the original Paparazzi project. All modernization components, including the React GCS, mapping system, LLM integration, and service management tools are released under the same GPL v2+ license.

**Copyright**: Original Paparazzi team (1999-2024) + bmw330i Next-Gen modernization (2025)

## ⚠️ **Safety & Legal Notice**

**⚠️ IMPORTANT**: This is experimental software for autonomous aircraft operation. 

### **📋 Safety Requirements:**
- ✅ Always follow local aviation regulations and airspace restrictions
- ✅ Maintain visual line of sight when required by law
- ✅ Ensure proper insurance and legal compliance for UAV operations
- ✅ Implement proper safety protocols and emergency procedures
- ✅ The LLM assistant provides guidance only - never replace proper flight planning

### **🛡️ Liability Disclaimer:**
This software is provided "as-is" without warranty. Users are solely responsible for safe operation, legal compliance, and proper risk management. The LLM integration is advisory only and should not replace human judgment in safety-critical situations.

---

**🎯 Ready to Experience the Future of UAV Operations?**

Start your journey with modern, intelligent, autonomous flight:

```bash
git clone https://github.com/bmw330i/paparazzi.git
cd paparazzi
npm run setup
npm run services:start
open http://localhost:3000
```

*Welcome to the future of autonomous atmospheric research! 🚁✨*