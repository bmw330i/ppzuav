#!/bin/bash

# Log monitoring and utility script for Paparazzi services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_ROOT/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Ensure logs directory exists
mkdir -p "$LOGS_DIR"

# Function to display usage
usage() {
    echo "Usage: $0 [command] [service]"
    echo ""
    echo "Commands:"
    echo "  tail [service]     - Tail logs for specific service or all services"
    echo "  show [service]     - Show last 50 lines of service logs"
    echo "  clean              - Clean all log files"
    echo "  errors [service]   - Show only error lines from logs"
    echo "  stats              - Show log statistics"
    echo "  search <pattern>   - Search for pattern in all logs"
    echo ""
    echo "Services: message-broker, gcs, mcp-server, simulator, combined"
    echo ""
    echo "Examples:"
    echo "  $0 tail gcs              # Tail GCS logs"
    echo "  $0 show message-broker   # Show last 50 lines of broker logs"
    echo "  $0 errors                # Show all errors from all services"
    echo "  $0 search 'WebSocket'    # Search for WebSocket in all logs"
}

# Function to get log file for service
get_log_file() {
    local service="$1"
    case "$service" in
        "message-broker"|"broker")
            echo "$LOGS_DIR/message-broker.log"
            ;;
        "gcs")
            echo "$LOGS_DIR/gcs.log"
            ;;
        "mcp-server"|"mcp")
            echo "$LOGS_DIR/mcp-server.log"
            ;;
        "simulator"|"sim")
            echo "$LOGS_DIR/simulator.log"
            ;;
        "combined"|"all")
            echo "$LOGS_DIR/combined.log"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Function to colorize log levels
colorize_logs() {
    sed -E \
        -e "s/\"level\":\"ERROR\"/$(printf "${RED}")\"level\":\"ERROR\"$(printf "${NC}")/g" \
        -e "s/\"level\":\"WARN\"/$(printf "${YELLOW}")\"level\":\"WARN\"$(printf "${NC}")/g" \
        -e "s/\"level\":\"INFO\"/$(printf "${GREEN}")\"level\":\"INFO\"$(printf "${NC}")/g" \
        -e "s/\"level\":\"DEBUG\"/$(printf "${CYAN}")\"level\":\"DEBUG\"$(printf "${NC}")/g"
}

# Function to pretty print JSON logs
pretty_logs() {
    while IFS= read -r line; do
        if echo "$line" | jq . >/dev/null 2>&1; then
            # It's JSON, pretty print it
            timestamp=$(echo "$line" | jq -r '.timestamp // empty')
            level=$(echo "$line" | jq -r '.level // empty')
            component=$(echo "$line" | jq -r '.component // empty')
            message=$(echo "$line" | jq -r '.message // empty')
            
            case "$level" in
                "ERROR")
                    printf "${RED}[%s]${NC} ${RED}%-5s${NC} ${BLUE}%-10s${NC}: %s\n" \
                        "$(date -d "$timestamp" '+%H:%M:%S' 2>/dev/null || echo "$timestamp")" \
                        "$level" "$component" "$message"
                    ;;
                "WARN")
                    printf "${YELLOW}[%s]${NC} ${YELLOW}%-5s${NC} ${BLUE}%-10s${NC}: %s\n" \
                        "$(date -d "$timestamp" '+%H:%M:%S' 2>/dev/null || echo "$timestamp")" \
                        "$level" "$component" "$message"
                    ;;
                "INFO")
                    printf "${GREEN}[%s]${NC} ${GREEN}%-5s${NC} ${BLUE}%-10s${NC}: %s\n" \
                        "$(date -d "$timestamp" '+%H:%M:%S' 2>/dev/null || echo "$timestamp")" \
                        "$level" "$component" "$message"
                    ;;
                "DEBUG")
                    printf "${CYAN}[%s]${NC} ${CYAN}%-5s${NC} ${BLUE}%-10s${NC}: %s\n" \
                        "$(date -d "$timestamp" '+%H:%M:%S' 2>/dev/null || echo "$timestamp")" \
                        "$level" "$component" "$message"
                    ;;
                *)
                    echo "$line"
                    ;;
            esac
        else
            # Not JSON, print as-is
            echo "$line"
        fi
    done
}

# Main command handling
case "${1:-help}" in
    tail)
        service="${2:-all}"
        if [ "$service" = "all" ]; then
            echo -e "${BLUE}Tailing all service logs... (Ctrl+C to exit)${NC}"
            tail -f "$LOGS_DIR"/*.log | pretty_logs
        else
            log_file=$(get_log_file "$service")
            if [ -n "$log_file" ] && [ -f "$log_file" ]; then
                echo -e "${BLUE}Tailing $service logs... (Ctrl+C to exit)${NC}"
                tail -f "$log_file" | pretty_logs
            else
                echo -e "${RED}Error: Unknown service '$service' or log file not found${NC}"
                exit 1
            fi
        fi
        ;;
        
    show)
        service="${2:-combined}"
        log_file=$(get_log_file "$service")
        if [ -n "$log_file" ] && [ -f "$log_file" ]; then
            echo -e "${BLUE}Last 50 lines of $service logs:${NC}"
            tail -n 50 "$log_file" | pretty_logs
        else
            echo -e "${RED}Error: Unknown service '$service' or log file not found${NC}"
            exit 1
        fi
        ;;
        
    errors)
        service="${2:-all}"
        if [ "$service" = "all" ]; then
            echo -e "${BLUE}All errors from all services:${NC}"
            for log_file in "$LOGS_DIR"/*.log; do
                if [ -f "$log_file" ]; then
                    grep '"level":"ERROR"' "$log_file" | pretty_logs
                fi
            done
        else
            log_file=$(get_log_file "$service")
            if [ -n "$log_file" ] && [ -f "$log_file" ]; then
                echo -e "${BLUE}Errors from $service:${NC}"
                grep '"level":"ERROR"' "$log_file" | pretty_logs
            else
                echo -e "${RED}Error: Unknown service '$service' or log file not found${NC}"
                exit 1
            fi
        fi
        ;;
        
    clean)
        echo -e "${BLUE}Cleaning all log files...${NC}"
        rm -f "$LOGS_DIR"/*.log
        echo -e "${GREEN}✓ All log files cleaned${NC}"
        ;;
        
    stats)
        echo -e "${BLUE}Log Statistics:${NC}"
        for log_file in "$LOGS_DIR"/*.log; do
            if [ -f "$log_file" ]; then
                filename=$(basename "$log_file")
                lines=$(wc -l < "$log_file")
                size=$(ls -lah "$log_file" | awk '{print $5}')
                errors=$(grep -c '"level":"ERROR"' "$log_file" || echo "0")
                warnings=$(grep -c '"level":"WARN"' "$log_file" || echo "0")
                
                printf "  %-20s: %6s lines, %8s, %3s errors, %3s warnings\n" \
                    "$filename" "$lines" "$size" "$errors" "$warnings"
            fi
        done
        ;;
        
    search)
        pattern="$2"
        if [ -z "$pattern" ]; then
            echo -e "${RED}Error: Search pattern required${NC}"
            usage
            exit 1
        fi
        
        echo -e "${BLUE}Searching for '$pattern' in all logs:${NC}"
        grep -n "$pattern" "$LOGS_DIR"/*.log | pretty_logs
        ;;
        
    help|*)
        usage
        ;;
esac