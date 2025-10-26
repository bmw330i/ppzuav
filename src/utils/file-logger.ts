import fs from 'fs';
import path from 'path';

interface LogLevel {
  ERROR: number;
  WARN: number;
  INFO: number;
  DEBUG: number;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

export class FileLogger {
  private logDir: string;
  private logLevel: number;
  private component: string;

  constructor(component: string, logLevel: keyof LogLevel = 'INFO') {
    this.component = component;
    this.logLevel = LOG_LEVELS[logLevel];
    this.logDir = path.join(process.cwd(), 'logs');
    
    // Ensure logs directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeLog(level: keyof LogLevel, message: string, meta?: any): void {
    if (LOG_LEVELS[level] > this.logLevel) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      component: this.component,
      message,
      ...(meta && { meta })
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Write to component-specific log file
    const logFile = path.join(this.logDir, `${this.component.toLowerCase()}.log`);
    fs.appendFileSync(logFile, logLine);
    
    // Also write to combined log
    const combinedLogFile = path.join(this.logDir, 'combined.log');
    fs.appendFileSync(combinedLogFile, logLine);

    // For development, also output to console if DEBUG level
    if (this.logLevel >= LOG_LEVELS.DEBUG) {
      const colorCode = this.getColorCode(level);
      console.log(`${colorCode}[${timestamp}] ${level.padEnd(5)} ${this.component.padEnd(10)}: ${message}${meta ? ' ' + JSON.stringify(meta) : ''}\x1b[0m`);
    }
  }

  private getColorCode(level: keyof LogLevel): string {
    switch (level) {
      case 'ERROR': return '\x1b[31m'; // Red
      case 'WARN': return '\x1b[33m';  // Yellow
      case 'INFO': return '\x1b[36m';  // Cyan
      case 'DEBUG': return '\x1b[90m'; // Gray
      default: return '\x1b[0m';       // Reset
    }
  }

  error(message: string, meta?: any): void {
    this.writeLog('ERROR', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.writeLog('WARN', message, meta);
  }

  info(message: string, meta?: any): void {
    this.writeLog('INFO', message, meta);
  }

  debug(message: string, meta?: any): void {
    this.writeLog('DEBUG', message, meta);
  }

  // Create a child logger with additional context
  child(childComponent: string): FileLogger {
    const childLogger = new FileLogger(`${this.component}:${childComponent}`, 'INFO');
    return childLogger;
  }

  // Log rotation - keep last N days
  rotate(daysToKeep: number = 7): void {
    const now = Date.now();
    const cutoffTime = now - (daysToKeep * 24 * 60 * 60 * 1000);

    try {
      const files = fs.readdirSync(this.logDir);
      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const stats = fs.statSync(filePath);
          if (stats.mtime.getTime() < cutoffTime) {
            fs.unlinkSync(filePath);
            this.info(`Rotated old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      this.error('Failed to rotate logs', { error });
    }
  }
}

// Pre-configured loggers for common components
export const brokerLogger = new FileLogger('BROKER', 'INFO');
export const gcsLogger = new FileLogger('GCS', 'INFO');
export const simulatorLogger = new FileLogger('SIMULATOR', 'INFO');
export const mcpLogger = new FileLogger('MCP', 'INFO');

// Export logger factory
export function createLogger(component: string, level: keyof LogLevel = 'INFO'): FileLogger {
  return new FileLogger(component, level);
}