import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import { TelemetryConfig, SystemStatus, SerialConfig } from '../types.js';

export const EstablishTelemetryTool: Tool = {
  name: 'establish_telemetry',
  description: 'Establish telemetry communication between ground station and aircraft autopilot',
  inputSchema: {
    type: 'object',
    properties: {
      aircraftId: {
        type: 'integer',
        description: 'Aircraft ID for telemetry addressing',
        minimum: 1,
        maximum: 255
      },
      telemetryPort: {
        type: 'string',
        description: 'Serial port for telemetry communication',
        default: '/dev/ttyUSB0'
      },
      baudRate: {
        type: 'integer',
        description: 'Telemetry baud rate',
        enum: [9600, 19200, 38400, 57600, 115200],
        default: 57600
      },
      timeout: {
        type: 'integer',
        description: 'Connection timeout in seconds',
        minimum: 5,
        maximum: 60,
        default: 30
      },
      retryCount: {
        type: 'integer',
        description: 'Number of connection retry attempts',
        minimum: 1,
        maximum: 10,
        default: 3
      }
    },
    required: ['aircraftId']
  },
  execute: handleEstablishTelemetry
};

interface TelemetryParams {
  aircraftId: number;
  telemetryPort?: string;
  baudRate?: number;
  timeout?: number;
  retryCount?: number;
}

/**
 * Execute Paparazzi ground station commands
 */
async function runPaparazziCommand(command: string, args: string[]): Promise<{ success: boolean; output: string; error?: string }> {
  return new Promise((resolve) => {
    const process = spawn(command, args, {
      cwd: '/Users/david/Documents/bmw330ipaparazzi'
    });
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      resolve({
        success: code === 0,
        output: stdout,
        error: stderr || undefined
      });
    });

    process.on('error', (error) => {
      resolve({
        success: false,
        output: '',
        error: error.message
      });
    });
  });
}

/**
 * Test serial port connectivity
 */
async function testSerialPort(port: string, baudRate: number): Promise<boolean> {
  try {
    // Check if port exists
    const portCheck = await runPaparazziCommand('ls', [port]);
    if (!portCheck.success) {
      return false;
    }

    // Test port accessibility with stty
    const sttyResult = await runPaparazziCommand('stty', ['-F', port, baudRate.toString()]);
    return sttyResult.success;
  } catch (error) {
    return false;
  }
}

/**
 * Start Paparazzi link process for telemetry
 */
async function startTelemetryLink(config: TelemetryConfig): Promise<{ success: boolean; pid?: number; error?: string }> {
  try {
    // Start Paparazzi link with specified configuration
    const linkArgs = [
      '-udp',
      '-d', config.port,
      '-s', config.baudRate.toString(),
      '-a', config.aircraftId.toString()
    ];

    const result = await runPaparazziCommand('./sw/ground_segment/tmtc/link', linkArgs);

    if (result.success) {
      // Extract process ID from output if available
      const pidMatch = result.output.match(/PID:\s*(\d+)/);
      const pid = pidMatch ? parseInt(pidMatch[1]) : undefined;

      return {
        success: true,
        pid
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to start telemetry link'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Verify telemetry connection by checking for aircraft messages
 */
async function verifyTelemetryConnection(aircraftId: number, timeoutSeconds: number): Promise<{ connected: boolean; lastMessage?: string; error?: string }> {
  try {
    // Use Paparazzi messages tool to check for recent aircraft messages
    const messagesResult = await runPaparazziCommand('./sw/ground_segment/tmtc/messages', [
      '-a', aircraftId.toString(),
      '-t', timeoutSeconds.toString()
    ]);

    if (messagesResult.success && messagesResult.output.includes('ALIVE')) {
      const lastMessage = messagesResult.output.split('\n').filter(line => line.includes('ALIVE')).pop();
      return {
        connected: true,
        lastMessage
      };
    } else {
      return {
        connected: false,
        error: 'No telemetry messages received from aircraft'
      };
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get current system status from telemetry
 */
async function getSystemStatus(aircraftId: number): Promise<SystemStatus> {
  try {
    // Query aircraft status via Paparazzi messages
    const statusResult = await runPaparazziCommand('./sw/ground_segment/tmtc/messages', [
      '-a', aircraftId.toString(),
      '-m', 'AUTOPILOT_VERSION,GPS,ATTITUDE,ENERGY'
    ]);

    const status: SystemStatus = {
      timestamp: new Date().toISOString(),
      aircraftId,
      connection: {
        status: 'unknown',
        lastSeen: new Date().toISOString(),
        signalStrength: 0
      },
      autopilot: {
        mode: 'UNKNOWN',
        armed: false,
        firmware: 'unknown'
      },
      battery: {
        voltage: 0,
        current: 0,
        remaining: 0
      },
      gps: {
        fix: false,
        satellites: 0,
        hdop: 0
      },
      attitude: {
        roll: 0,
        pitch: 0,
        yaw: 0
      },
      errors: [],
      warnings: []
    };

    if (statusResult.success) {
      // Parse telemetry messages to populate status
      const lines = statusResult.output.split('\n');
      
      for (const line of lines) {
        if (line.includes('AUTOPILOT_VERSION')) {
          const versionMatch = line.match(/firmware:(\S+)/);
          if (versionMatch) {
            status.autopilot.firmware = versionMatch[1];
          }
        }
        
        if (line.includes('GPS')) {
          const gpsMatch = line.match(/fix:(\d+).*sats:(\d+)/);
          if (gpsMatch) {
            status.gps.fix = parseInt(gpsMatch[1]) > 0;
            status.gps.satellites = parseInt(gpsMatch[2]);
          }
        }
        
        if (line.includes('ENERGY')) {
          const energyMatch = line.match(/voltage:([0-9.]+).*current:([0-9.]+)/);
          if (energyMatch) {
            status.battery.voltage = parseFloat(energyMatch[1]);
            status.battery.current = parseFloat(energyMatch[2]);
          }
        }
      }
      
      status.connection.status = 'connected';
    } else {
      status.connection.status = 'disconnected';
      status.errors.push('Failed to retrieve system status');
    }

    return status;
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      aircraftId,
      connection: {
        status: 'error',
        lastSeen: new Date().toISOString(),
        signalStrength: 0
      },
      autopilot: {
        mode: 'UNKNOWN',
        armed: false,
        firmware: 'unknown'
      },
      battery: {
        voltage: 0,
        current: 0,
        remaining: 0
      },
      gps: {
        fix: false,
        satellites: 0,
        hdop: 0
      },
      attitude: {
        roll: 0,
        pitch: 0,
        yaw: 0
      },
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: []
    };
  }
}

/**
 * Handle telemetry establishment with retry logic
 */
export async function handleEstablishTelemetry(params: TelemetryParams) {
  try {
    const telemetryPort = params.telemetryPort || '/dev/ttyUSB0';
    const baudRate = params.baudRate || 57600;
    const timeout = params.timeout || 30;
    const retryCount = params.retryCount || 3;

    const config: TelemetryConfig = {
      port: telemetryPort,
      baudRate,
      aircraftId: params.aircraftId,
      protocol: 'paparazzi',
      timeout
    };

    // Test serial port first
    const portTest = await testSerialPort(telemetryPort, baudRate);
    if (!portTest) {
      return {
        success: false,
        error: `Serial port ${telemetryPort} not accessible or not configured properly`,
        config,
        status: null
      };
    }

    let lastError = '';
    let telemetryConnected = false;
    let linkPid: number | undefined;

    // Retry connection attempts
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        // Start telemetry link
        const linkResult = await startTelemetryLink(config);
        
        if (linkResult.success) {
          linkPid = linkResult.pid;
          
          // Wait and verify connection
          await new Promise(resolve => setTimeout(resolve, 3000)); // Give it 3 seconds to establish
          
          const verification = await verifyTelemetryConnection(params.aircraftId, 10);
          
          if (verification.connected) {
            telemetryConnected = true;
            break;
          } else {
            lastError = verification.error || 'Connection verification failed';
          }
        } else {
          lastError = linkResult.error || 'Failed to start telemetry link';
        }
        
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    if (telemetryConnected) {
      // Get current system status
      const status = await getSystemStatus(params.aircraftId);
      
      return {
        success: true,
        config,
        status,
        linkPid,
        instructions: [
          '✓ Telemetry connection established successfully',
          `✓ Aircraft ID ${params.aircraftId} is responding`,
          `✓ Communication via ${telemetryPort} at ${baudRate} baud`,
          '',
          'Next steps:',
          '- Monitor system status for any warnings or errors',
          '- Verify GPS fix and satellite count',
          '- Check battery voltage and current',
          '- Proceed with IMU calibration if needed'
        ].join('\n'),
        nextSteps: [
          'Monitor aircraft system status',
          'Verify GPS functionality',
          'Check battery and power systems',
          'Proceed to IMU calibration if required'
        ]
      };
    } else {
      return {
        success: false,
        error: `Failed to establish telemetry after ${retryCount} attempts. Last error: ${lastError}`,
        config,
        status: null,
        troubleshooting: [
          'Check XBee configuration and power',
          'Verify serial port permissions and connectivity',
          'Ensure aircraft is powered and autopilot is running',
          'Check for interference on XBee channel',
          'Verify matching baud rates on both ends'
        ]
      };
    }

  } catch (error) {
    return {
      success: false,
      error: `Telemetry establishment failed: ${error}`,
      config: null,
      status: null
    };
  }
}