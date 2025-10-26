#!/bin/bash

# Paparazzi Background Services Startup Script
# This script starts all services in the background with proper logging

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_ROOT/logs"
PIDS_DIR="$PROJECT_ROOT/.pids"

# Ensure directories exist
mkdir -p "$LOGS_DIR"
mkdir -p "$PIDS_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to start a service in background
start_service() {
    local service_name="$1"
    local command="$2"
    local log_file="$LOGS_DIR/${service_name}.log"
    local pid_file="$PIDS_DIR/${service_name}.pid"
    
    # Check if service is already running
    if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
        log "${YELLOW}Service ${service_name} is already running (PID: $(cat "$pid_file"))${NC}"
        return 0
    fi
    
    log "Starting ${service_name}..."
    
    # Start service in background
    cd "$PROJECT_ROOT"
    nohup bash -c "$command" > "$log_file" 2>&1 &
    local pid=$!
    
    # Save PID
    echo $pid > "$pid_file"
    
    # Give service a moment to start
    sleep 2
    
    # Check if service is still running
    if kill -0 $pid 2>/dev/null; then
        log "${GREEN}✓ ${service_name} started successfully (PID: $pid)${NC}"
        log "  Log file: $log_file"
    else
        log "${RED}✗ Failed to start ${service_name}${NC}"
        rm -f "$pid_file"
        return 1
    fi
}

# Function to stop a service
stop_service() {
    local service_name="$1"
    local pid_file="$PIDS_DIR/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            log "Stopping ${service_name} (PID: $pid)..."
            kill "$pid"
            sleep 2
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid"
                log "${YELLOW}Force killed ${service_name}${NC}"
            else
                log "${GREEN}✓ ${service_name} stopped${NC}"
            fi
        fi
        rm -f "$pid_file"
    else
        log "${YELLOW}${service_name} is not running${NC}"
    fi
}

# Function to check service status
check_service() {
    local service_name="$1"
    local pid_file="$PIDS_DIR/${service_name}.pid"
    
    if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
        log "${GREEN}✓ ${service_name} is running (PID: $(cat "$pid_file"))${NC}"
        return 0
    else
        log "${RED}✗ ${service_name} is not running${NC}"
        return 1
    fi
}

# Main command handling
case "${1:-start}" in
    start)
        log "${BLUE}Starting Paparazzi Services...${NC}"
        
        # Start Message Broker
        start_service "message-broker" "cd src/message-broker && npm run dev"
        
        # Start GCS (React app)
        start_service "gcs" "cd src/gcs && BROWSER=none npm start"
        
        # Start MCP Server
        start_service "mcp-server" "cd src/mcp-server && npm run dev"
        
        # Start Simulator
        start_service "simulator" "npm run sim"
        
        log "${BLUE}All services started!${NC}"
        log "Use '${0} status' to check service status"
        log "Use '${0} logs' to tail all logs"
        log "Use '${0} stop' to stop all services"
        ;;
        
    stop)
        log "${BLUE}Stopping Paparazzi Services...${NC}"
        
        stop_service "simulator"
        stop_service "mcp-server"
        stop_service "gcs"
        stop_service "message-broker"
        
        log "${BLUE}All services stopped!${NC}"
        ;;
        
    restart)
        log "${BLUE}Restarting Paparazzi Services...${NC}"
        $0 stop
        sleep 3
        $0 start
        ;;
        
    status)
        log "${BLUE}Paparazzi Services Status:${NC}"
        check_service "message-broker"
        check_service "gcs"
        check_service "mcp-server"
        check_service "simulator"
        ;;
        
    logs)
        log "${BLUE}Tailing all service logs... (Ctrl+C to exit)${NC}"
        tail -f "$LOGS_DIR"/*.log
        ;;
        
    clean)
        log "${BLUE}Cleaning logs and PID files...${NC}"
        $0 stop
        rm -f "$LOGS_DIR"/*.log
        rm -f "$PIDS_DIR"/*.pid
        log "${GREEN}✓ Cleaned up${NC}"
        ;;
        
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|clean}"
        echo ""
        echo "Commands:"
        echo "  start    - Start all services in background"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Check service status"
        echo "  logs     - Tail all service logs"
        echo "  clean    - Stop services and clean logs/PIDs"
        exit 1
        ;;
esac