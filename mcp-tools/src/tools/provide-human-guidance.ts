import { BaseTool, HumanInstruction, ReadyButtonConfig, SystemStatus } from '../types.js';

export class ProvideHumanGuidanceTool implements BaseTool {
  name = 'provide_human_guidance';
  description = 'Generate step-by-step instructions for human operator in UAV operations';
  
  inputSchema = {
    type: 'object',
    properties: {
      operation: { 
        type: 'string', 
        enum: ['setup', 'calibration', 'pre-flight', 'launch', 'emergency'],
        description: 'Type of operation requiring guidance'
      },
      currentStep: { type: 'number', description: 'Current step number (optional)' },
      systemStatus: { type: 'object', description: 'Current system status' },
      equipmentAvailable: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'List of available equipment'
      }
    },
    required: ['operation']
  };

  async execute(args: any): Promise<any> {
    const { operation, currentStep = 0, systemStatus, equipmentAvailable = [] } = args;

    try {
      const instructions = this.generateInstructions(operation, equipmentAvailable, systemStatus);
      const readyButton = this.generateReadyButton(operation, instructions, currentStep);
      const safetyWarnings = this.generateSafetyWarnings(operation);
      
      return {
        instructions,
        currentStepIndex: currentStep,
        estimatedTimeRemaining: this.calculateTimeRemaining(instructions, currentStep),
        safetyWarnings,
        readyButton,
        troubleshooting: this.generateTroubleshooting(operation)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private generateInstructions(operation: string, equipment: string[], systemStatus?: any): HumanInstruction[] {
    switch (operation) {
      case 'setup':
        return this.getSetupInstructions(equipment);
      case 'calibration':
        return this.getCalibrationInstructions(equipment);
      case 'pre-flight':
        return this.getPreFlightInstructions(equipment, systemStatus);
      case 'launch':
        return this.getLaunchInstructions();
      case 'emergency':
        return this.getEmergencyInstructions(systemStatus);
      default:
        return [];
    }
  }

  private getSetupInstructions(equipment: string[]): HumanInstruction[] {
    const instructions: HumanInstruction[] = [
      {
        stepNumber: 1,
        title: 'Power On Autopilot',
        description: 'Connect battery to autopilot board and verify power LED is illuminated',
        duration: 30,
        verification: { type: 'visual', description: 'Green power LED should be solid' },
        criticalSafety: true
      },
      {
        stepNumber: 2,
        title: 'Connect USB Cable',
        description: 'Connect USB cable between autopilot and ground station computer',
        duration: 15,
        verification: { type: 'system_check', description: 'Autopilot should appear in device list' },
        criticalSafety: false
      },
      {
        stepNumber: 3,
        title: 'Verify Firmware Flash',
        description: 'Check that green LED blinks 3 times indicating successful firmware flash',
        duration: 45,
        verification: { type: 'visual', description: '3 green LED blinks followed by solid light' },
        criticalSafety: true
      }
    ];

    if (equipment.includes('xbee_modem')) {
      instructions.push({
        stepNumber: 4,
        title: 'Install XBee Modem',
        description: 'Connect XBee modem to ground station USB port and verify driver installation',
        duration: 60,
        verification: { type: 'system_check', description: 'XBee should appear as /dev/ttyUSB0 or similar' },
        criticalSafety: false
      });
    }

    return instructions;
  }

  private getCalibrationInstructions(equipment: string[]): HumanInstruction[] {
    return [
      {
        stepNumber: 1,
        title: 'Position Aircraft Level',
        description: 'Place aircraft on flat, stable surface away from metal objects and electromagnetic interference',
        duration: 60,
        verification: { type: 'measurement', description: 'Aircraft should be within 1 degree of level', tolerance: 1 },
        criticalSafety: true
      },
      {
        stepNumber: 2,
        title: 'Accelerometer Calibration',
        description: 'Keep aircraft completely still for 30 seconds while accelerometer calibrates',
        duration: 30,
        verification: { type: 'system_check', description: 'IMU status should show "calibrating" then "ready"' },
        criticalSafety: true
      },
      {
        stepNumber: 3,
        title: 'Magnetometer Calibration',
        description: 'Slowly rotate aircraft through all orientations in figure-8 pattern for 60 seconds',
        duration: 60,
        verification: { type: 'system_check', description: 'Magnetometer calibration quality > 80%' },
        criticalSafety: true
      },
      {
        stepNumber: 4,
        title: 'Verify Attitude Display',
        description: 'Tilt aircraft and verify attitude display matches physical orientation',
        duration: 30,
        verification: { type: 'visual', description: 'AHRS display should match aircraft attitude' },
        criticalSafety: true
      }
    ];
  }

  private getPreFlightInstructions(equipment: string[], systemStatus?: any): HumanInstruction[] {
    const instructions: HumanInstruction[] = [
      {
        stepNumber: 1,
        title: 'Battery Check',
        description: 'Verify battery voltage is above minimum threshold and connections are secure',
        duration: 30,
        verification: { type: 'measurement', description: 'Battery voltage > 11.1V for 3S LiPo', expectedValue: 11.1 },
        criticalSafety: true
      },
      {
        stepNumber: 2,
        title: 'GPS Signal Check',
        description: 'Wait for GPS to acquire 3D fix with at least 6 satellites',
        duration: 120,
        verification: { type: 'system_check', description: 'GPS status should show "3d_fix" with HDOP < 2.0' },
        criticalSafety: true
      },
      {
        stepNumber: 3,
        title: 'Control Surface Check',
        description: 'Manually move control surfaces and verify they return to neutral position',
        duration: 45,
        verification: { type: 'visual', description: 'All surfaces should move freely and center properly' },
        criticalSafety: true
      },
      {
        stepNumber: 4,
        title: 'Telemetry Link Test',
        description: 'Verify telemetry communication with ground station showing good signal strength',
        duration: 30,
        verification: { type: 'system_check', description: 'Signal strength > -70dBm, packet loss < 5%' },
        criticalSafety: true
      },
      {
        stepNumber: 5,
        title: 'Flight Plan Upload',
        description: 'Upload and verify flight plan is loaded correctly on autopilot',
        duration: 60,
        verification: { type: 'system_check', description: 'Flight plan checksum should match ground station' },
        criticalSafety: true
      }
    ];

    return instructions;
  }

  private getLaunchInstructions(): HumanInstruction[] {
    return [
      {
        stepNumber: 1,
        title: 'Final Safety Check',
        description: 'Verify area is clear of people and obstacles in flight path',
        duration: 30,
        verification: { type: 'visual', description: 'Clear launch corridor with no obstructions' },
        criticalSafety: true
      },
      {
        stepNumber: 2,
        title: 'Arm Autopilot',
        description: 'Switch to AUTO2 mode and arm the autopilot system',
        duration: 15,
        verification: { type: 'system_check', description: 'Autopilot mode should show "AUTO2" and "ARMED"' },
        criticalSafety: true
      },
      {
        stepNumber: 3,
        title: 'Launch Aircraft',
        description: 'For hand launch: Throw aircraft firmly forward and slightly upward at 45-degree angle',
        duration: 5,
        verification: { type: 'system_check', description: 'IMU should detect launch acceleration > 2g' },
        criticalSafety: true
      },
      {
        stepNumber: 4,
        title: 'Monitor Initial Flight',
        description: 'Watch aircraft for first 30 seconds, ready to take manual control if needed',
        duration: 30,
        verification: { type: 'visual', description: 'Aircraft should climb and follow flight plan' },
        criticalSafety: true
      }
    ];
  }

  private getEmergencyInstructions(systemStatus?: any): HumanInstruction[] {
    return [
      {
        stepNumber: 1,
        title: 'Assess Situation',
        description: 'Quickly evaluate aircraft state and immediate threats to safety',
        duration: 10,
        verification: { type: 'user_confirm', description: 'Confirm situation assessment complete' },
        criticalSafety: true
      },
      {
        stepNumber: 2,
        title: 'Switch to Manual Control',
        description: 'Immediately switch to MANUAL mode if aircraft is controllable',
        duration: 5,
        verification: { type: 'system_check', description: 'Control mode should show "MANUAL"' },
        criticalSafety: true
      },
      {
        stepNumber: 3,
        title: 'Execute Emergency Landing',
        description: 'Navigate to nearest safe landing area and execute controlled landing',
        duration: 180,
        verification: { type: 'visual', description: 'Aircraft safely on ground with minimal damage' },
        criticalSafety: true
      },
      {
        stepNumber: 4,
        title: 'Secure Aircraft',
        description: 'Power down all systems and secure aircraft location',
        duration: 30,
        verification: { type: 'visual', description: 'All systems powered down, propeller stopped' },
        criticalSafety: true
      }
    ];
  }

  private generateReadyButton(operation: string, instructions: HumanInstruction[], currentStep: number): ReadyButtonConfig {
    const allStepsComplete = currentStep >= instructions.length;
    
    return {
      enabled: allStepsComplete,
      text: allStepsComplete ? 'Proceed to Next Phase' : `Complete Step ${currentStep + 1}`,
      action: this.getNextAction(operation),
      confirmationRequired: operation === 'launch' || operation === 'emergency',
      confirmationText: operation === 'launch' ? 
        'Confirm aircraft is ready for autonomous flight' :
        operation === 'emergency' ?
        'Confirm emergency procedures have been followed' :
        undefined
    };
  }

  private getNextAction(operation: string): string {
    switch (operation) {
      case 'setup': return 'calibrate_imu';
      case 'calibration': return 'prepare_flight';
      case 'pre-flight': return 'detect_launch';
      case 'launch': return 'monitor_flight_safety';
      case 'emergency': return 'post_emergency_analysis';
      default: return 'continue';
    }
  }

  private generateSafetyWarnings(operation: string): string[] {
    const commonWarnings = [
      'Always maintain visual contact with aircraft',
      'Keep manual control transmitter ready for immediate use',
      'Ensure emergency stop procedures are understood'
    ];

    const operationWarnings: Record<string, string[]> = {
      setup: [
        'Disconnect power before making electrical connections',
        'Verify correct polarity of all connections'
      ],
      calibration: [
        'Calibrate away from metal objects and electronics',
        'Do not move aircraft during accelerometer calibration'
      ],
      pre_flight: [
        'Check weather conditions are within flight envelope',
        'Verify airspace is clear and flight is authorized'
      ],
      launch: [
        'Clear launch area of all personnel',
        'Have emergency contact information readily available'
      ],
      emergency: [
        'Priority is safety of people, then aircraft recovery',
        'Do not attempt recovery in unsafe conditions'
      ]
    };

    return [...commonWarnings, ...(operationWarnings[operation] || [])];
  }

  private calculateTimeRemaining(instructions: HumanInstruction[], currentStep: number): number {
    return instructions
      .slice(currentStep)
      .reduce((total, instruction) => total + instruction.duration, 0) / 60; // Convert to minutes
  }

  private generateTroubleshooting(operation: string) {
    const common = {
      'No telemetry connection': [
        'Check XBee modem connections',
        'Verify baud rate settings match',
        'Ensure XBee modules are paired correctly'
      ],
      'GPS not acquiring fix': [
        'Move to area with clear sky view',
        'Wait longer for satellite acquisition',
        'Check GPS antenna connection'
      ],
      'IMU calibration failing': [
        'Ensure aircraft is on level surface',
        'Remove nearby metal objects',
        'Restart calibration process'
      ]
    };

    return {
      commonIssues: common,
      operationSpecific: this.getOperationTroubleshooting(operation)
    };
  }

  private getOperationTroubleshooting(operation: string) {
    const troubleshooting: Record<string, Record<string, string[]>> = {
      setup: {
        'Autopilot not detected': [
          'Check USB cable connection',
          'Verify driver installation',
          'Try different USB port'
        ]
      },
      launch: {
        'Aircraft not responding to launch': [
          'Verify autopilot is armed',
          'Check flight plan is uploaded',
          'Ensure launch detection threshold is appropriate'
        ]
      }
    };

    return troubleshooting[operation] || {};
  }
}