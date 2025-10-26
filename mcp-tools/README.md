# Paparazzi MCP Tools

A Model Context Protocol (MCP) server that provides LLM-controlled tools for autonomous UAV operations using the Paparazzi autopilot system.

## Overview

This MCP server enables Large Language Models to autonomously control UAV operations from firmware compilation and flashing to mission execution and safety monitoring. The system is designed to minimize human intervention while maintaining critical safety oversight.

## Features

### 🚁 **Complete Autopilot Control**
- **Firmware Management**: Compile and flash Paparazzi firmware to autopilots
- **Airframe Configuration**: Generate and modify XML configurations 
- **XBee Setup**: Configure wireless telemetry modems
- **Telemetry**: Establish and monitor communication links

### 🧭 **Flight Operations**
- **IMU Calibration**: Accelerometer, gyroscope, and magnetometer calibration
- **Flight Planning**: Upload and manage autonomous missions
- **Launch Detection**: Automatic flight initiation via IMU monitoring
- **Safety Monitoring**: Real-time flight envelope and emergency protocols

### 🔥 **Mission Capabilities**
- **Wildfire Detection**: Air quality sampling and fire monitoring
- **AIS Integration**: Aircraft collision avoidance using transponder data
- **Human Guidance**: Step-by-step safety instructions when needed

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   LLM Client    │────│  MCP Protocol    │────│ Paparazzi UAV   │
│   (Claude/GPT)  │    │  (This Server)   │    │   Hardware      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ├── Firmware Compilation
                                ├── XBee Configuration  
                                ├── Telemetry Management
                                ├── IMU Calibration
                                ├── Flight Planning
                                ├── Safety Monitoring
                                └── Human Interface
```

## Installation

### Prerequisites

- Node.js 18+ and npm
- Paparazzi UAV system installed
- XBee modules for telemetry
- Compatible autopilot hardware

### Setup

```bash
# Clone and install
git clone <repository>
cd mcp-tools
npm install

# Build the project
npm run build

# Test the server
npm test
```

## Usage

### Starting the MCP Server

```bash
npm start
```

The server runs on stdio and communicates via the MCP protocol.

### Available Tools

#### 1. **flash_autopilot_firmware**
Compile and flash Paparazzi firmware to autopilot hardware.

```json
{
  "aircraftId": 1,
  "firmwareTarget": "ap",
  "boardType": "lisa_l",
  "flashMethod": "jtag"
}
```

#### 2. **configure_xbee_modems**
Set up XBee wireless modems for telemetry communication.

```json
{
  "aircraftId": 1,
  "networkId": 3332,
  "channel": 12,
  "baudRate": 57600
}
```

#### 3. **establish_telemetry**
Create telemetry link between ground station and aircraft.

```json
{
  "aircraftId": 1,
  "telemetryPort": "/dev/ttyUSB0",
  "timeout": 30
}
```

#### 4. **calibrate_imu**
Perform IMU sensor calibration for accurate attitude estimation.

```json
{
  "aircraftId": 1,
  "calibrationType": "full",
  "autoMode": true
}
```

#### 5. **upload_flight_plan**
Load autonomous mission waypoints to the autopilot.

```json
{
  "aircraftId": 1,
  "flightPlanPath": "./conf/flight_plans/basic.xml"
}
```

#### 6. **detect_launch**
Monitor IMU for automatic flight initiation.

```json
{
  "aircraftId": 1,
  "sensitivity": "medium"
}
```

#### 7. **monitor_flight_safety**
Real-time safety monitoring with emergency protocols.

```json
{
  "aircraftId": 1,
  "envelope": {
    "maxAltitude": 150,
    "maxDistance": 1000
  }
}
```

#### 8. **analyze_wildfire_risk**
Environmental monitoring for wildfire detection missions.

```json
{
  "aircraftId": 1,
  "sensorTypes": ["air_quality", "temperature", "camera"]
}
```

#### 9. **track_aircraft_ais**
Monitor AIS transponder data for collision avoidance.

```json
{
  "aircraftId": 1,
  "radius": 5000
}
```

#### 10. **provide_human_guidance**
Generate step-by-step instructions for human operators.

```json
{
  "operation": "firmware_flash",
  "context": "Initial setup for new aircraft"
}
```

#### 11. **configure_airframe**
Generate and modify Paparazzi airframe XML configurations.

```json
{
  "aircraftId": 1,
  "airframeName": "Multiplex_EasyStar",
  "subsystems": ["attitude", "navigation", "telemetry"]
}
```

#### 12. **prepare_flight_checklist**
Create comprehensive pre-flight verification procedures.

```json
{
  "aircraftId": 1,
  "missionType": "survey"
}
```

## Safety Features

### 🛡️ **Built-in Safety**
- **Human Oversight**: Critical operations require human confirmation
- **Flight Envelopes**: Automatic altitude and distance limits
- **Emergency Protocols**: Immediate landing and recovery procedures
- **Real-time Monitoring**: Continuous system health checks

### ⚠️ **Warning Systems**
- Battery voltage monitoring
- GPS signal quality checks  
- Communication link status
- Weather condition alerts

## Example LLM Workflow

```markdown
**Mission**: Wildfire air quality sampling in California

1. **LLM**: "I need to prepare aircraft ID 5 for a wildfire detection mission"
   
2. **MCP Tools Execute**:
   - `flash_autopilot_firmware` → Compile and flash latest firmware
   - `configure_xbee_modems` → Set up 57600 baud telemetry  
   - `establish_telemetry` → Verify communication link
   - `calibrate_imu` → Perform full sensor calibration
   - `configure_airframe` → Set up air quality sensors
   - `upload_flight_plan` → Load waypoint mission
   - `provide_human_guidance` → "Please verify aircraft is ready and clear for takeoff"

3. **Human**: "Aircraft checked, conditions are safe"

4. **LLM**: "Initiating autonomous mission"
   - `detect_launch` → Monitor for takeoff
   - `monitor_flight_safety` → Track flight envelope
   - `analyze_wildfire_risk` → Collect air quality data
   - `track_aircraft_ais` → Avoid manned aircraft

5. **Mission Complete**: Autonomous landing and data retrieval
```

## Development

### Project Structure

```
mcp-tools/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── types.ts              # TypeScript interfaces  
│   └── tools/
│       ├── flash-autopilot.ts
│       ├── configure-xbee.ts
│       ├── establish-telemetry.ts
│       ├── calibrate-imu.ts
│       ├── configure-airframe.ts
│       ├── provide-human-guidance.ts
│       └── stub-tools.ts     # Remaining tool implementations
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Tools

1. Define tool interface in `types.ts`
2. Create tool implementation in `tools/`
3. Register tool in `index.ts`
4. Add tests and documentation

### Testing

```bash
# Run TypeScript compiler check
npm run type-check

# Test individual tools
npm run test-tools

# Integration testing with real hardware
npm run test-hardware
```

## Hardware Requirements

### Minimum Setup
- Paparazzi-compatible autopilot (Lisa/L, Apogee, etc.)
- XBee Pro 900HP modules (2x for ground/air)
- USB-to-serial adapter
- Compatible aircraft platform

### Recommended Setup
- High-gain XBee antennas
- External GPS module
- Air quality sensors (PM2.5, CO, temperature)
- HD camera for visual navigation
- AIS receiver for traffic monitoring

## Troubleshooting

### Common Issues

**Telemetry Connection Failed**
```bash
# Check XBee configuration
ls /dev/ttyUSB*
sudo chmod 666 /dev/ttyUSB0

# Verify Paparazzi installation
./paparazzi --version
```

**Firmware Compilation Errors**
```bash
# Update toolchain
sudo apt update && sudo apt install gcc-arm-none-eabi

# Clean build
make clean_ac
```

**IMU Calibration Issues**
- Ensure aircraft is completely stationary
- Remove all magnetic interference
- Perform calibration on level surface
- Follow 6-position accelerometer procedure

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-tool`)
3. Commit changes (`git commit -am 'Add new autonomous capability'`)
4. Push to branch (`git push origin feature/new-tool`)
5. Create Pull Request

## License

MIT License - see LICENSE file for details.

## Safety Notice

⚠️ **IMPORTANT**: This system controls autonomous aircraft. Always:
- Follow local aviation regulations
- Maintain visual line of sight when required
- Have manual override capability
- Test thoroughly in safe environments
- Never operate near airports without permission

## Support

- GitHub Issues: Report bugs and feature requests
- Wiki: Detailed configuration guides
- Discussions: Community support and examples

---

*"The future of UAV operations: LLMs in command, humans in oversight, technology in service."*