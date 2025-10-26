#!/bin/bash

# Paparazzi Next-Gen Setup Script for macOS M4
# This script sets up the complete development environment

set -e

echo "🚁 Setting up Paparazzi Next-Gen Development Environment"
echo "=================================================="

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS. Please adapt for your platform."
    exit 1
fi

# Check if we're on ARM64 (Apple Silicon)
if [[ $(uname -m) != "arm64" ]]; then
    echo "⚠️  Warning: This script is optimized for Apple Silicon (M1/M2/M3/M4)"
    echo "   It should still work on Intel Macs, but performance may vary."
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check and install Homebrew
if ! command_exists brew; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "✅ Homebrew already installed"
fi

# Check and install Node.js (via Homebrew for ARM64 optimized version)
if ! command_exists node; then
    echo "📦 Installing Node.js..."
    brew install node
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js already installed: $NODE_VERSION"
    
    # Check if version is 18 or higher
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        echo "⚠️  Node.js version $NODE_VERSION is too old. Please upgrade to v18+"
        echo "   Run: brew upgrade node"
        exit 1
    fi
fi

# Install development tools
echo "📦 Installing development tools..."
brew install git cmake

# Install ARM cross-compilation toolchain
if ! command_exists arm-none-eabi-gcc; then
    echo "📦 Installing ARM cross-compilation toolchain..."
    brew install --cask gcc-arm-embedded
else
    echo "✅ ARM toolchain already installed"
fi

# Install Docker Desktop for development containers
if ! command_exists docker; then
    echo "📦 Installing Docker Desktop..."
    brew install --cask docker
    echo "⚠️  Please start Docker Desktop manually after installation"
else
    echo "✅ Docker already installed"
fi

# Create project directories
echo "📁 Setting up project structure..."
mkdir -p examples/missions
mkdir -p examples/aircraft-configs
mkdir -p scripts
mkdir -p tests

# Install root project dependencies
echo "📦 Installing root project dependencies..."
npm install

# Install sub-project dependencies
echo "📦 Installing message broker dependencies..."
cd src/message-broker && npm install && cd ../..

echo "📦 Installing MCP server dependencies..."
cd src/mcp-server && npm install && cd ../..

# Create example configuration files
echo "📄 Creating example configuration files..."

# Example aircraft configuration
cat > examples/aircraft-configs/sumo-001.json << 'EOL'
{
  "id": "sumo_001",
  "name": "SUMO Atmospheric Research Aircraft",
  "type": "fixed_wing",
  "hardware": {
    "autopilot": "lisa_l",
    "processor": "stm32f4",
    "sensors": ["imu", "gps", "pressure", "temperature", "humidity", "airspeed"],
    "radio": "xbee_pro"
  },
  "flightEnvelope": {
    "airspeed": {
      "minimum": 12.0,
      "maximum": 25.0,
      "cruise": 15.0
    },
    "altitude": {
      "minimum": 50,
      "maximum": 300,
      "cruise": 150
    },
    "bankAngle": {
      "maximum": 45
    },
    "weather": {
      "maxWindSpeed": 15,
      "minVisibility": 1000,
      "maxTurbulence": "moderate"
    }
  }
}
EOL

# Example mission
cat > examples/missions/atmospheric-survey.json << 'EOL'
{
  "id": "atmo_survey_001",
  "name": "Valley Temperature Survey",
  "aircraftId": "sumo_001",
  "waypoints": [
    {
      "id": 0,
      "name": "TAKEOFF",
      "position": {"latitude": 59.2345, "longitude": 10.1234, "altitude": 0},
      "type": "takeoff",
      "actions": ["arm_autopilot", "engine_start"]
    },
    {
      "id": 1,
      "name": "SURVEY_START",
      "position": {"latitude": 59.2400, "longitude": 10.1300, "altitude": 150},
      "type": "survey",
      "actions": ["start_logging", "begin_measurements"]
    },
    {
      "id": 2,
      "name": "SURVEY_END",
      "position": {"latitude": 59.2350, "longitude": 10.1200, "altitude": 150},
      "type": "survey",
      "actions": ["stop_logging"]
    },
    {
      "id": 3,
      "name": "LANDING",
      "position": {"latitude": 59.2345, "longitude": 10.1234, "altitude": 0},
      "type": "landing",
      "actions": ["auto_land"]
    }
  ],
  "parameters": {
    "cruiseSpeed": 15.0,
    "cruiseAltitude": 150,
    "maxAltitude": 300,
    "weatherLimits": {
      "maxWind": 10,
      "minVisibility": 1000
    }
  },
  "createdAt": "2025-10-24T10:00:00Z",
  "updatedAt": "2025-10-24T10:00:00Z"
}
EOL

# Create environment file template
cat > .env.example << 'EOL'
# Paparazzi Next-Gen Environment Configuration

# Development mode
NODE_ENV=development

# Message Broker
BROKER_PORT=8080
MQTT_URL=mqtt://localhost:1883

# MCP Server
MCP_PORT=8081

# Serial Ports (adjust for your setup)
SERIAL_PORT=/dev/tty.usbserial-00000000
SERIAL_BAUDRATE=57600

# Aircraft Configuration
DEFAULT_AIRCRAFT_ID=sumo_001

# Logging
LOG_LEVEL=info

# Security (change in production)
JWT_SECRET=your-secret-key-here
EOL

# Create development environment file
cp .env.example .env

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Start Docker Desktop if you haven't already"
echo ""
echo "2. Start the development environment:"
echo "   npm run docker:dev"
echo ""
echo "3. Or start individual services manually:"
echo "   npm run dev:broker    # Message broker"
echo "   npm run dev:mcp       # MCP server" 
echo "   npm run sim           # Aircraft simulator"
echo ""
echo "4. Open your browser to:"
echo "   http://localhost:3000  # Ground Control Station"
echo "   http://localhost:8080  # Message Broker status"
echo ""
echo "5. Example files created in:"
echo "   examples/aircraft-configs/"
echo "   examples/missions/"
echo ""
echo "📚 Documentation:"
echo "   README.md           # Project overview"
echo "   ARCHITECTURE.md     # System design"
echo "   LLM_GUIDANCE.md     # AI assistant guide"
echo ""
echo "✈️  Happy flying with Paparazzi Next-Gen!"