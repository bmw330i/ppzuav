# AI Assistant Instructions for PaparazziAI Development

## Project Overview
You are working on **PaparazziAI**, a complete modernization of UAV operations featuring:
- AI Pilot system with FAA-compliant autonomous operations
- Automated aircraft design and weight & balance calculations
- Real-time GCS with interactive mapping and ADS-B integration
- Modern Node.js/TypeScript architecture with LLM integration

## Critical Context

### Code Separation & Licensing
- **This codebase is GPL-FREE**: All code is AI-generated and independently licensed
- **Original Paparazzi GPL code**: Contained in `paparazzi_reference/` for reference only
- **Private Repository**: `https://github.com/bmw330i/ppzuav.git` - protect from bad actors
- **Security First**: Keep private until system maturity and security validation

### System Architecture
```
PaparazziAI/
├── src/                    # Modern Node.js/TypeScript services
│   ├── gcs/               # React Ground Control Station
│   ├── message-broker/    # MQTT/WebSocket communication
│   ├── mcp-server/        # LLM integration via MCP
│   └── simulator/         # Flight physics simulation
├── aircraft_builder/      # AI Pilot system (Python)
│   ├── aircraft_builder.py    # Automated UAV design
│   ├── ai_pilot.py            # FAA-compliant flight planning
│   └── complete_ai_pilot_system.py # End-to-end operations
├── hardware_config/       # COTS component database
├── prompts/              # AI pilot knowledge base
└── scripts/              # Service management
```

## Development Principles

### 1. Safety First
- **FAA Compliance**: All operations must follow Part 107 regulations
- **Sub-250g Aircraft**: Design constraint for regulatory compliance
- **Multi-layer Safety**: Hardware → Software → Mission → AI validation
- **Emergency Procedures**: Always have contingency plans

### 2. AI Pilot Behavior
- **Act like certified human pilot**: Thousands of hours experience
- **Conservative decisions**: Safety over mission completion
- **Professional standards**: Use aviation phraseology and procedures
- **Go/No-Go decisions**: Weather, terrain, system health validation

### 3. Modern Architecture
- **TypeScript**: Type safety and modern development
- **React**: Professional web interface with real-time updates
- **Service Management**: Background processes with structured logging
- **MCP Integration**: Structured LLM communication protocol

## Key Technical Components

### Aircraft Builder System
- **Weight & Balance**: Automatic CG calculations and stability analysis
- **Component Selection**: COTS parts database for <250g aircraft
- **Performance Modeling**: Flight time, speeds, envelope calculations
- **Configuration Output**: Complete Paparazzi XML and JSON configs

### AI Pilot System
- **Weather Integration**: METAR/TAF analysis and risk assessment
- **Terrain Analysis**: Elevation profiling and obstacle avoidance
- **Mission Planning**: Waypoint optimization with safety buffers
- **Real-time Monitoring**: Live telemetry analysis and safety alerts

### Ground Control Station
- **Interactive Mapping**: OpenStreetMap with aircraft tracking
- **ADS-B Integration**: Real-time traffic monitoring
- **Telemetry Display**: Professional aviation instruments
- **LLM Chat Interface**: Natural language mission interaction

## Current Development Status

### ✅ Completed
- Complete AI pilot ecosystem with aircraft design through autonomous operations
- Modern GCS with real-time mapping and ADS-B integration
- Hardware database with COTS components for sub-250g aircraft
- FAA-compliant flight planning with weather and terrain integration
- Code separation from GPL-licensed original Paparazzi project
- Private repository establishment for IP protection

### 🔧 In Progress
- Launch detection and mission automation (IMU-based)
- System validation in new repository environment

### 📋 Next Priorities
1. Implement IMU-based launch detection
2. Add automatic mission execution
3. Create human guidance system for flight preparation
4. Comprehensive system testing
5. Security and licensing final review

## Development Commands

### Quick Start
```bash
# Install dependencies
npm install

# Test AI Pilot system
python3 aircraft_builder/aircraft_builder.py
python3 aircraft_builder/ai_pilot.py
python3 aircraft_builder/complete_ai_pilot_system.py

# Start all services
npm run services:start

# Access GCS
open http://localhost:3000
```

### Service Management
```bash
npm run services:start    # Start background services
npm run services:stop     # Stop all services
npm run services:status   # Check service status
npm run logs:tail         # Monitor live logs
```

## Important Files to Review

### Core Documentation
- `README.md`: Complete system overview and quick start
- `ARCHITECTURE.md`: Technical architecture and data flows
- `DEVELOPMENT_CONTEXT.md`: Recent conversation history
- `LICENSE`: Independent licensing terms

### AI Pilot Knowledge
- `prompts/ai_pilot_system.txt`: Complete AI pilot guidelines
- `hardware_config/autopilots.json`: Autopilot specifications
- `hardware_config/sensors.json`: Sensor database

### Generated Configurations
- `aircraft_builder/AI_Pilot_Flying_Wing_185g.json`: Sample aircraft design
- `prompts/flight_plan_*.json`: Generated mission plans

## Safety & Security Guidelines

### Operational Safety
- Never compromise safety for mission objectives
- Always maintain proper safety margins (battery, altitude, weather)
- Implement proper emergency procedures
- Validate all automated decisions

### Code Security
- Keep repository private until security validation
- Review all code for potential vulnerabilities
- Maintain separation from GPL-licensed code
- Document all security considerations

### Legal Compliance
- Follow FAA Part 107 regulations
- Respect airspace restrictions
- Maintain proper documentation
- Consider international aviation regulations

## Communication Style

### Technical Discussions
- Use precise aviation and engineering terminology
- Reference specific components by model numbers
- Include safety considerations in all recommendations
- Provide clear step-by-step instructions

### Code Development
- Write clean, well-documented code
- Include comprehensive error handling
- Follow TypeScript/Python best practices
- Maintain consistent coding standards

---

**Remember**: This is a security-sensitive project developing autonomous aircraft systems. Always prioritize safety, security, and regulatory compliance in all development decisions.