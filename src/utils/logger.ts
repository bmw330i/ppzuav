/**
 * Logging utilities with structured output for debugging and monitoring
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: Record<string, unknown>;
  aircraftId?: string;
}

class Logger {
  private minLevel: LogLevel = LogLevel.INFO;
  private component: string;

  constructor(component: string) {
    this.component = component;
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>, aircraftId?: string): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
      ...(data && { data }),
      ...(aircraftId && { aircraftId }),
    };

    const levelName = LogLevel[level];
    const colorCode = this.getColorCode(level);
    const resetColor = '\x1b[0m';
    
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    const aircraftStr = aircraftId ? ` [${aircraftId}]` : '';
    
    console.log(
      `${colorCode}[${entry.timestamp}] ${levelName.padEnd(8)} ${this.component}${aircraftStr}: ${message}${dataStr}${resetColor}`
    );

    // In production, you might want to send to a logging service
    // this.sendToLoggingService(entry);
  }

  private getColorCode(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m';  // Green
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      case LogLevel.CRITICAL: return '\x1b[35m'; // Magenta
      default: return '\x1b[0m'; // Reset
    }
  }

  debug(message: string, data?: Record<string, unknown>, aircraftId?: string): void {
    this.log(LogLevel.DEBUG, message, data, aircraftId);
  }

  info(message: string, data?: Record<string, unknown>, aircraftId?: string): void {
    this.log(LogLevel.INFO, message, data, aircraftId);
  }

  warn(message: string, data?: Record<string, unknown>, aircraftId?: string): void {
    this.log(LogLevel.WARN, message, data, aircraftId);
  }

  error(message: string, data?: Record<string, unknown>, aircraftId?: string): void {
    this.log(LogLevel.ERROR, message, data, aircraftId);
  }

  critical(message: string, data?: Record<string, unknown>, aircraftId?: string): void {
    this.log(LogLevel.CRITICAL, message, data, aircraftId);
  }

  // Flight-specific logging methods
  flightEvent(event: string, aircraftId: string, data?: Record<string, unknown>): void {
    this.info(`FLIGHT: ${event}`, data, aircraftId);
  }

  safetyAlert(message: string, aircraftId: string, data?: Record<string, unknown>): void {
    this.error(`SAFETY: ${message}`, data, aircraftId);
  }

  missionUpdate(message: string, aircraftId: string, data?: Record<string, unknown>): void {
    this.info(`MISSION: ${message}`, data, aircraftId);
  }

  telemetryReceived(aircraftId: string, messageCount: number): void {
    this.debug(`Telemetry received`, { messageCount }, aircraftId);
  }

  commandSent(command: string, aircraftId: string, data?: Record<string, unknown>): void {
    this.info(`Command sent: ${command}`, data, aircraftId);
  }
}

// Create component-specific loggers
export const createLogger = (component: string): Logger => new Logger(component);

// Pre-configured loggers for common components
export const gcsLogger = createLogger('GCS');
export const mcpLogger = createLogger('MCP');
export const brokerLogger = createLogger('BROKER');
export const simLogger = createLogger('SIM');
export const radioLogger = createLogger('RADIO');