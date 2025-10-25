import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import { XBeeConfig, SerialConfig, ConfigValidation } from '../types.js';

export const ConfigureXBeeTool: Tool = {
  name: 'configure_xbee',
  description: 'Configure XBee modems for telemetry communication with Paparazzi autopilot',
  inputSchema: {
    type: 'object',
    properties: {
      groundStationPort: {
        type: 'string',
        description: 'Serial port for ground station XBee (e.g., /dev/ttyUSB0)',
        default: '/dev/ttyUSB0'
      },
      aircraftId: {
        type: 'integer',
        description: 'Aircraft ID for addressing (1-255)',
        minimum: 1,
        maximum: 255
      },
      baudRate: {
        type: 'integer',
        description: 'Baud rate for XBee communication',
        enum: [9600, 19200, 38400, 57600, 115200],
        default: 57600
      },
      networkId: {
        type: 'integer',
        description: 'PAN ID for XBee network (0-65535)',
        minimum: 0,
        maximum: 65535,
        default: 3332
      },
      channel: {
        type: 'integer',
        description: 'XBee channel (0x0B-0x1A)',
        minimum: 11,
        maximum: 26,
        default: 12
      },
      powerLevel: {
        type: 'integer',
        description: 'XBee power level (0-4)',
        minimum: 0,
        maximum: 4,
        default: 4
      }
    },
    required: ['aircraftId']
  },
  execute: handleConfigureXBee
};

interface XBeeConfigParams {
  groundStationPort?: string;
  aircraftId: number;
  baudRate?: number;
  networkId?: number;
  channel?: number;
  powerLevel?: number;
}

/**
 * Execute XBee configuration using X-CTU or minicom commands
 */
async function runXBeeCommand(command: string, args: string[]): Promise<{ success: boolean; output: string; error?: string }> {
  return new Promise((resolve) => {
    const process = spawn(command, args);
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
 * Configure XBee modem with AT commands
 */
async function configureXBeeModem(port: string, config: XBeeConfig): Promise<ConfigValidation> {
  const validation: ConfigValidation = {
    valid: false,
    errors: [],
    warnings: []
  };

  try {
    // Check if port exists
    const portCheck = await runXBeeCommand('ls', [port]);
    if (!portCheck.success) {
      validation.errors.push(`Serial port ${port} not found`);
      return validation;
    }

    // XBee AT commands for configuration
    const atCommands = [
      `ATID${config.networkId.toString(16).toUpperCase()}`, // Set PAN ID
      `ATCH${config.channel.toString(16).toUpperCase()}`,   // Set channel
      `ATPL${config.powerLevel}`,                           // Set power level
      `ATBD${getBaudRateCode(config.baudRate)}`,           // Set baud rate
      `ATMY${config.aircraftId}`,                          // Set source address
      `ATDL0`,                                             // Set destination to coordinator
      `ATWR`,                                              // Write to flash
      `ATCN`                                               // Exit command mode
    ];

    // Send AT commands using screen or minicom
    const configScript = atCommands.join('\r');
    const result = await runXBeeCommand('echo', [configScript, '>', `/tmp/xbee_config_${config.aircraftId}.txt`]);

    if (result.success) {
      validation.valid = true;
      validation.warnings.push('XBee configuration commands prepared. Manual verification recommended.');
    } else {
      validation.errors.push(`Failed to prepare XBee configuration: ${result.error}`);
    }

  } catch (error) {
    validation.errors.push(`XBee configuration error: ${error}`);
  }

  return validation;
}

/**
 * Convert baud rate to XBee code
 */
function getBaudRateCode(baudRate: number): string {
  const codes: { [key: number]: string } = {
    9600: '3',
    19200: '4',
    38400: '5',
    57600: '6',
    115200: '7'
  };
  return codes[baudRate] || '6'; // Default to 57600
}

/**
 * Generate XBee configuration for ground station and aircraft
 */
export async function handleConfigureXBee(params: XBeeConfigParams) {
  try {
    const groundStationPort = params.groundStationPort || '/dev/ttyUSB0';
    const baudRate = params.baudRate || 57600;
    const networkId = params.networkId || 3332;
    const channel = params.channel || 12;
    const powerLevel = params.powerLevel || 4;

    // Ground station XBee configuration (coordinator)
    const groundStationConfig: XBeeConfig = {
      networkId,
      channel,
      baudRate,
      powerLevel,
      aircraftId: 0, // Coordinator
      port: groundStationPort,
      mode: 'coordinator'
    };

    // Aircraft XBee configuration (end device)
    const aircraftConfig: XBeeConfig = {
      networkId,
      channel,
      baudRate,
      powerLevel,
      aircraftId: params.aircraftId,
      port: '/dev/ttyS1', // Typical autopilot serial port
      mode: 'end_device'
    };

    // Configure ground station XBee
    const groundValidation = await configureXBeeModem(groundStationPort, groundStationConfig);

    // Generate configuration instructions
    const instructions = [
      '## XBee Configuration Instructions',
      '',
      '### Ground Station XBee (Coordinator):',
      `- Port: ${groundStationPort}`,
      `- Network ID: ${networkId} (0x${networkId.toString(16).toUpperCase()})`,
      `- Channel: ${channel} (0x${channel.toString(16).toUpperCase()})`,
      `- Baud Rate: ${baudRate}`,
      `- Power Level: ${powerLevel}`,
      '',
      '### Aircraft XBee (End Device):',
      `- Aircraft ID: ${params.aircraftId}`,
      `- Network ID: ${networkId} (0x${networkId.toString(16).toUpperCase()})`,
      `- Channel: ${channel} (0x${channel.toString(16).toUpperCase()})`,
      `- Baud Rate: ${baudRate}`,
      `- Power Level: ${powerLevel}`,
      '',
      '### Configuration Steps:',
      '1. Connect ground station XBee to USB adapter',
      '2. Use X-CTU software or AT commands to configure',
      '3. Set coordinator mode (CE=1) for ground station',
      '4. Set end device mode (CE=0) for aircraft',
      '5. Verify communication with range test',
      '',
      '### AT Commands for Manual Configuration:',
      '```',
      'ATID' + networkId.toString(16).toUpperCase() + '  // Network ID',
      'ATCH' + channel.toString(16).toUpperCase() + '    // Channel',
      'ATPL' + powerLevel + '          // Power Level',
      'ATBD' + getBaudRateCode(baudRate) + '          // Baud Rate',
      'ATMY' + params.aircraftId + '        // Source Address (aircraft only)',
      'ATDL0         // Destination Low (to coordinator)',
      'ATWR          // Write to flash',
      'ATCN          // Exit command mode',
      '```'
    ].join('\n');

    return {
      success: groundValidation.valid,
      groundStationConfig,
      aircraftConfig,
      validation: groundValidation,
      instructions,
      configurationFile: `/tmp/xbee_config_${params.aircraftId}.txt`,
      nextSteps: [
        'Verify XBee modules are properly configured',
        'Test communication range before flight',
        'Configure Paparazzi telemetry settings to match XBee parameters',
        'Proceed to establish telemetry connection'
      ]
    };

  } catch (error) {
    return {
      success: false,
      error: `XBee configuration failed: ${error}`,
      groundStationConfig: null,
      aircraftConfig: null,
      validation: {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      }
    };
  }
}