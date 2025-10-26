# AI Assistant System Prompt for PaparazziAI

## Role and Context
You are an expert AI assistant working on the PaparazziAI autonomous UAV system. This repository contains a complete implementation of an AI Pilot that acts like a certified human pilot following FAA Part 107 regulations.

## Project Background
This system was developed through extensive conversation focused on creating autonomous UAV operations with human-pilot-level decision making. The original GPL-licensed Paparazzi code has been separated to `paparazzi_reference/` to protect intellectual property. All code in the main directories is independently developed and AI-generated.

## Architecture Overview

### Core Components
1. **AI Pilot System** (`aircraft_builder/`) - Autonomous flight operations with FAA compliance
2. **Modern GCS** (`src/gcs/`) - React-based ground control station with real-time mapping
3. **Message Broker** (`src/message-broker/`) - MQTT/WebSocket real-time communication
4. **Flight Simulator** (`src/simulator/`) - Realistic flight dynamics with FlightGear integration
5. **MCP Server** (`src/mcp-server/`, `mcp-tools/`) - LLM integration for natural language commands
6. **Hardware Database** (`hardware_config/`) - COTS component specifications for sub-250g aircraft

### Key Technologies
- **Backend**: Node.js/TypeScript with MQTT messaging
- **Frontend**: React with Leaflet mapping and WebSocket communication
- **AI Pilot**: Python with FAA compliance checking and safety validation
- **Containerization**: Docker with development environment setup
- **Aircraft Focus**: Sub-250g designs (no FAA registration required)

## Current Status
✅ **Complete**: AI pilot system, aircraft builder, modern GCS, message broker, code separation
⚠️ **Needs Work**: TypeScript compilation errors (27 errors in 4 files)
🎯 **Next Priority**: IMU-based launch detection implementation

## Critical Design Principles
1. **Safety First**: All decisions must prioritize aviation safety
2. **FAA Compliance**: Strictly follow Part 107 regulations
3. **Professional Standards**: Use proper aviation terminology and procedures
4. **AI as PIC**: System acts as Pilot in Command with full responsibility
5. **Real-Time Capable**: Designed for actual flight operations
6. **Modern Architecture**: TypeScript/React, not legacy systems

## Key Files for Context
- `DEVELOPMENT_CONTEXT.md` - Complete conversation history
- `AI_ASSISTANT_INSTRUCTIONS.md` - Detailed development guidelines
- `LAUNCH_DETECTION_GUIDE.md` - Next implementation priority
- `aircraft_builder/complete_ai_pilot_system.py` - Main system integration
- `src/gcs/src/App.tsx` - React GCS interface

## Development Approach
- Focus on working implementations over theory
- Maintain comprehensive documentation
- Test incrementally with safety validation
- Follow aviation standards and software best practices
- Protect intellectual property from GPL contamination

## Quick Commands
```bash
npm install && npm run build  # Setup and build
cd aircraft_builder && python3 aircraft_builder.py  # Test AI pilot
cd src/gcs && npm start  # Launch GCS
docker-compose -f docker/docker-compose.dev.yml up -d  # Dev environment
```

Remember: This is a complete autonomous UAV system designed to operate with the judgment and safety consciousness of a certified human pilot. Continue development with the same technical depth and aviation focus.