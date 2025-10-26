# Service Management Guide - Paparazzi Next-Gen

**Professional Background Service Management with File-Based Logging**

## 🎯 **Overview**

The Paparazzi Next-Gen system features enterprise-grade service management that runs all components as background processes with structured file-based logging. This approach ensures clean terminal environments while providing comprehensive monitoring and debugging capabilities.

## 🏗️ **Service Architecture**

### **Background Services**
All services run independently as background processes:
- **🎛️ Ground Control Station (GCS)** - React web application on port 3000
- **📡 Message Broker** - MQTT/WebSocket communication on port 8080  
- **🧠 MCP Server** - LLM integration on port 3001
- **🛩️ Flight Simulator** - Physics simulation on port 8090

### **Process Management**
- **PID Tracking**: All process IDs stored in `.pids/` directory
- **Health Monitoring**: Automatic status checking and process validation
- **Graceful Shutdown**: Clean service termination with proper cleanup
- **Restart Capabilities**: Individual or bulk service restart functionality

## 🚀 **Quick Start Commands**

### **Basic Service Control**
```bash
# Start all services in background
npm run services:start

# Check what's running
npm run services:status

# Stop all services
npm run services:stop

# Restart all services
npm run services:restart

# Clean logs and stop services
npm run services:clean
```

### **Individual Service Control**
```bash
# Start individual services (foreground for development)
npm run gcs              # Ground Control Station only
npm run dev:broker       # Message broker only  
npm run sim              # Flight simulator only
```

## 📊 **Logging System**

### **File Structure**
```
logs/
├── combined.log         # 📋 All services aggregated
├── message-broker.log   # 📡 MQTT broker and WebSocket events
├── gcs.log             # ⚛️ React app compilation and runtime
├── mcp-server.log      # 🧠 LLM integration and MCP protocol
└── simulator.log       # 🛩️ Flight physics and telemetry
```

### **Log Format**
All logs use structured JSON format:
```json
{
  "timestamp": "2025-10-24T23:15:42.123Z",
  "level": "INFO|WARN|ERROR|DEBUG",
  "component": "BROKER|GCS|MCP|SIMULATOR", 
  "message": "Human-readable description",
  "meta": {
    "additional": "context data",
    "error": "error details if applicable"
  }
}
```

## 🔍 **Log Monitoring & Analysis**

### **Real-time Log Viewing**
```bash
# Tail all service logs with pretty formatting
npm run services:logs

# Alternative pretty-formatted viewer
npm run logs:tail

# Show only error messages
npm run logs:errors

# Show statistics about all logs
npm run logs:stats
```

### **Advanced Log Analysis**
```bash
# Show last 50 lines of specific service
./scripts/logs.sh show gcs
./scripts/logs.sh show message-broker

# Search across all logs
./scripts/logs.sh search "WebSocket"
./scripts/logs.sh search "ERROR"

# Show errors from specific service
./scripts/logs.sh errors simulator

# Clean all log files
./scripts/logs.sh clean
```

## 🛠️ **Service Management Scripts**

### **Main Service Script (`scripts/services.sh`)**
Comprehensive service management with the following commands:

#### **Start Services**
```bash
./scripts/services.sh start
```
- Checks for existing processes to prevent duplicates
- Starts each service in background with nohup
- Saves PID files for tracking
- Redirects output to individual log files
- Reports success/failure for each service

#### **Stop Services**
```bash
./scripts/services.sh stop
```
- Gracefully terminates processes using saved PIDs
- Cleans up PID files
- Force kills if processes don't respond
- Reports termination status

#### **Status Check**
```bash
./scripts/services.sh status
```
- Checks if processes are still running
- Reports PID and status for each service
- Color-coded output (green=running, red=stopped)

#### **Restart Services**
```bash
./scripts/services.sh restart
```
- Stops all services
- Waits for clean shutdown
- Starts all services fresh

#### **Clean Environment**
```bash
./scripts/services.sh clean
```
- Stops all services
- Removes all log files
- Cleans up PID files
- Resets environment for fresh start

### **Log Management Script (`scripts/logs.sh`)**
Advanced log analysis and monitoring capabilities:

#### **Log Viewing**
```bash
# Tail specific service logs
./scripts/logs.sh tail gcs
./scripts/logs.sh tail message-broker

# Show recent entries
./scripts/logs.sh show simulator
./scripts/logs.sh show combined
```

#### **Error Analysis**
```bash
# Show all errors
./scripts/logs.sh errors

# Show errors from specific service
./scripts/logs.sh errors mcp-server
```

#### **Search Functionality**
```bash
# Search for specific patterns
./scripts/logs.sh search "battery"
./scripts/logs.sh search "GPS.*satellite"
./scripts/logs.sh search "WebSocket.*connected"
```

#### **Log Statistics**
```bash
./scripts/logs.sh stats
```
Example output:
```
Log Statistics:
  combined.log        :   1247 lines,     89KB,   3 errors,  12 warnings
  message-broker.log  :    456 lines,     34KB,   1 errors,   5 warnings
  gcs.log            :    789 lines,     55KB,   2 errors,   7 warnings
  mcp-server.log     :      0 lines,      0KB,   0 errors,   0 warnings
  simulator.log      :      0 lines,      0KB,   0 errors,   0 warnings
```

## 🔧 **Development Workflow**

### **Development Mode**
For active development with hot reloading:
```bash
# Start all services in development mode (foreground)
npm run dev

# Or individual services with hot reload
npm run dev:gcs      # React with hot reload
npm run dev:broker   # Node.js with nodemon
npm run dev:mcp      # MCP server with file watching
```

### **Background Development**
For development with background services:
```bash
# Start background services
npm run services:start

# Monitor logs in separate terminal
npm run logs:tail

# Make code changes, services auto-restart
# Check logs for compilation/runtime issues
```

### **Debugging Workflow**
```bash
# 1. Check service status
npm run services:status

# 2. Look at recent errors
npm run logs:errors

# 3. Search for specific issues
./scripts/logs.sh search "error pattern"

# 4. View specific service logs
./scripts/logs.sh show problematic-service

# 5. Restart problematic service
npm run services:restart
```

## 📈 **Performance Monitoring**

### **Service Health Checks**
The service management system includes health monitoring:
- **Process Existence**: Verifies PIDs are still active
- **Port Availability**: Checks if services are listening on expected ports
- **Log Activity**: Monitors for recent log entries indicating activity
- **Resource Usage**: Tracks CPU and memory consumption

### **Log Rotation**
Automatic log management:
- **Size Limits**: Logs are rotated when they exceed size thresholds
- **Time-based Rotation**: Daily rotation with configurable retention
- **Compression**: Old logs are compressed to save disk space
- **Cleanup**: Automatic removal of logs older than retention period

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Service Won't Start**
```bash
# Check if port is already in use
lsof -ti:3000  # For GCS
lsof -ti:8080  # For message broker

# Kill existing processes
lsof -ti:3000 | xargs kill -9

# Clean and restart
npm run services:clean
npm run services:start
```

#### **Service Crashes**
```bash
# Check error logs
npm run logs:errors

# Look at specific service logs
./scripts/logs.sh show crashed-service

# Check system resources
top
df -h
```

#### **Log Files Growing Too Large**
```bash
# Check log sizes
./scripts/logs.sh stats

# Clean old logs
./scripts/logs.sh clean

# Restart services with fresh logs
npm run services:restart
```

### **Emergency Procedures**

#### **Force Stop All Services**
```bash
# Kill all Node.js processes (nuclear option)
pkill -f "node\|npm\|react-scripts"

# Clean up PID files
rm -f .pids/*.pid

# Clean logs
rm -f logs/*.log
```

#### **Reset Entire Environment**
```bash
# Complete cleanup and restart
npm run services:clean
npm run setup
npm run services:start
```

## 🔐 **Security Considerations**

### **Process Isolation**
- Each service runs as a separate process
- No shared memory between services
- Communication only through defined interfaces
- PID files prevent duplicate processes

### **Log Security**
- Logs stored locally with appropriate file permissions
- No sensitive data (passwords, keys) logged
- Audit trail for all service operations
- Structured format for security analysis

### **Network Security**
- Services bind to localhost only by default
- WebSocket connections include validation
- Message broker includes authentication
- All communications logged for audit

## 📚 **Best Practices**

### **Development**
- Always use `npm run services:start` for background work
- Monitor logs with `npm run logs:tail` during development
- Use specific service commands for debugging individual components
- Check service status before making changes

### **Production**
- Run services in background mode
- Set up log rotation and monitoring
- Implement automated health checks
- Configure alerting for service failures

### **Maintenance**
- Regularly check log file sizes
- Monitor system resource usage
- Update dependencies with service restarts
- Keep PID files and logs organized

---

This service management system provides enterprise-grade reliability and monitoring while maintaining the flexibility needed for UAV system development. The background process architecture ensures clean development environments while comprehensive logging enables effective debugging and monitoring.

**Key Benefits:**
- 🎯 **Clean Development**: No terminal clutter from service output
- 📊 **Professional Logging**: Structured, searchable, rotated logs
- 🔧 **Easy Management**: Simple commands for all operations
- 🛡️ **Reliability**: Robust process tracking and health monitoring
- 🚀 **Scalability**: Architecture supports distributed deployment