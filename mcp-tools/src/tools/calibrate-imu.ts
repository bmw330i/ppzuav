import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import { IMUCalibration, SystemStatus } from '../types.js';

export const CalibrateIMUTool: Tool = {
  name: 'calibrate_imu',
  description: 'Calibrate IMU (accelerometer, gyroscope, magnetometer) for accurate flight attitude',
  inputSchema: {
    type: 'object',
    properties: {
      aircraftId: {
        type: 'integer',
        description: 'Aircraft ID for IMU calibration',
        minimum: 1,
        maximum: 255
      },
      calibrationType: {
        type: 'string',
        enum: ['accelerometer', 'gyroscope', 'magnetometer', 'full'],
        description: 'Type of IMU calibration to perform',
        default: 'full'
      },
      stabilizationTime: {
        type: 'integer',
        description: 'Stabilization time in seconds before each measurement',
        minimum: 5,
        maximum: 30,
        default: 10
      },
      sampleCount: {
        type: 'integer',
        description: 'Number of samples to collect for each position',
        minimum: 50,
        maximum: 500,
        default: 100
      },
      autoMode: {
        type: 'boolean',
        description: 'Automatic calibration with human guidance prompts',
        default: true
      }
    },
    required: ['aircraftId']
  },
  execute: handleCalibrateIMU
};

interface IMUCalibrationParams {
  aircraftId: number;
  calibrationType?: 'accelerometer' | 'gyroscope' | 'magnetometer' | 'full';
  stabilizationTime?: number;
  sampleCount?: number;
  autoMode?: boolean;
}

/**
 * Execute Paparazzi IMU calibration commands
 */
async function runIMUCommand(command: string, args: string[]): Promise<{ success: boolean; output: string; error?: string }> {
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
 * Read raw IMU data for calibration
 */
async function readIMUData(aircraftId: number, duration: number): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Use Paparazzi messages to read IMU data
    const result = await runIMUCommand('./sw/ground_segment/tmtc/messages', [
      '-a', aircraftId.toString(),
      '-m', 'IMU_ACCEL_RAW,IMU_GYRO_RAW,IMU_MAG_RAW',
      '-t', duration.toString()
    ]);

    if (result.success) {
      // Parse IMU data from output
      const lines = result.output.split('\n');
      const imuData: {
        accelerometer: Array<{ x: number; y: number; z: number; timestamp: string }>;
        gyroscope: Array<{ x: number; y: number; z: number; timestamp: string }>;
        magnetometer: Array<{ x: number; y: number; z: number; timestamp: string }>;
      } = {
        accelerometer: [],
        gyroscope: [],
        magnetometer: []
      };

      for (const line of lines) {
        if (line.includes('IMU_ACCEL_RAW')) {
          const accelMatch = line.match(/ax:([0-9.-]+) ay:([0-9.-]+) az:([0-9.-]+)/);
          if (accelMatch) {
            imuData.accelerometer.push({
              x: parseFloat(accelMatch[1]),
              y: parseFloat(accelMatch[2]),
              z: parseFloat(accelMatch[3]),
              timestamp: new Date().toISOString()
            });
          }
        }
        
        if (line.includes('IMU_GYRO_RAW')) {
          const gyroMatch = line.match(/gx:([0-9.-]+) gy:([0-9.-]+) gz:([0-9.-]+)/);
          if (gyroMatch) {
            imuData.gyroscope.push({
              x: parseFloat(gyroMatch[1]),
              y: parseFloat(gyroMatch[2]),
              z: parseFloat(gyroMatch[3]),
              timestamp: new Date().toISOString()
            });
          }
        }
        
        if (line.includes('IMU_MAG_RAW')) {
          const magMatch = line.match(/mx:([0-9.-]+) my:([0-9.-]+) mz:([0-9.-]+)/);
          if (magMatch) {
            imuData.magnetometer.push({
              x: parseFloat(magMatch[1]),
              y: parseFloat(magMatch[2]),
              z: parseFloat(magMatch[3]),
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      return {
        success: true,
        data: imuData
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to read IMU data'
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
 * Calculate accelerometer calibration parameters
 */
function calculateAccelCalibration(data: any[]): { offset: { x: number; y: number; z: number }; scale: { x: number; y: number; z: number } } {
  if (data.length === 0) {
    return {
      offset: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    };
  }

  // Calculate averages for each axis
  const sum = data.reduce((acc, sample) => ({
    x: acc.x + sample.x,
    y: acc.y + sample.y,
    z: acc.z + sample.z
  }), { x: 0, y: 0, z: 0 });

  const avg = {
    x: sum.x / data.length,
    y: sum.y / data.length,
    z: sum.z / data.length
  };

  // For accelerometer, we expect 1g on one axis and 0g on others when level
  // This is a simplified calibration - real calibration needs 6-position measurement
  return {
    offset: {
      x: avg.x,
      y: avg.y,
      z: avg.z - 9.81 // Assuming Z-axis is up, subtract 1g
    },
    scale: { x: 1, y: 1, z: 1 } // Scale factors would be calculated from multiple positions
  };
}

/**
 * Calculate gyroscope calibration (bias removal)
 */
function calculateGyroCalibration(data: any[]): { bias: { x: number; y: number; z: number } } {
  if (data.length === 0) {
    return { bias: { x: 0, y: 0, z: 0 } };
  }

  // Calculate bias (average when stationary)
  const sum = data.reduce((acc, sample) => ({
    x: acc.x + sample.x,
    y: acc.y + sample.y,
    z: acc.z + sample.z
  }), { x: 0, y: 0, z: 0 });

  return {
    bias: {
      x: sum.x / data.length,
      y: sum.y / data.length,
      z: sum.z / data.length
    }
  };
}

/**
 * Generate human-readable calibration instructions
 */
function generateCalibrationInstructions(calibrationType: string, step: number): string[] {
  const instructions: { [key: string]: string[] } = {
    accelerometer: [
      'Place aircraft level on flat surface (Z-axis up)',
      'Place aircraft on left side (Y-axis up)', 
      'Place aircraft on right side (Y-axis down)',
      'Place aircraft nose up (X-axis up)',
      'Place aircraft nose down (X-axis down)',
      'Place aircraft upside down (Z-axis down)'
    ],
    gyroscope: [
      'Keep aircraft completely stationary for gyroscope bias measurement'
    ],
    magnetometer: [
      'Slowly rotate aircraft 360° around X-axis (roll)',
      'Slowly rotate aircraft 360° around Y-axis (pitch)',
      'Slowly rotate aircraft 360° around Z-axis (yaw)',
      'Move aircraft in figure-8 pattern'
    ]
  };

  const steps = instructions[calibrationType] || ['Unknown calibration type'];
  
  if (step < steps.length) {
    return [
      `Calibration Step ${step + 1}/${steps.length}:`,
      steps[step],
      '',
      'Press Enter when ready to continue...'
    ];
  } else {
    return ['Calibration complete!'];
  }
}

/**
 * Write calibration parameters to Paparazzi configuration
 */
async function writeCalibrationConfig(aircraftId: number, calibration: IMUCalibration): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate calibration configuration XML
    const calibConfig = [
      '<!-- Generated IMU Calibration Parameters -->',
      '<section name="IMU" prefix="IMU_">',
      `  <define name="ACCEL_X_NEUTRAL" value="${calibration.accelerometer.offset.x.toFixed(0)}"/>`,
      `  <define name="ACCEL_Y_NEUTRAL" value="${calibration.accelerometer.offset.y.toFixed(0)}"/>`,
      `  <define name="ACCEL_Z_NEUTRAL" value="${calibration.accelerometer.offset.z.toFixed(0)}"/>`,
      `  <define name="ACCEL_X_SENS" value="${calibration.accelerometer.scale.x.toFixed(6)}"/>`,
      `  <define name="ACCEL_Y_SENS" value="${calibration.accelerometer.scale.y.toFixed(6)}"/>`,
      `  <define name="ACCEL_Z_SENS" value="${calibration.accelerometer.scale.z.toFixed(6)}"/>`,
      `  <define name="GYRO_P_NEUTRAL" value="${calibration.gyroscope.bias.x.toFixed(0)}"/>`,
      `  <define name="GYRO_Q_NEUTRAL" value="${calibration.gyroscope.bias.y.toFixed(0)}"/>`,
      `  <define name="GYRO_R_NEUTRAL" value="${calibration.gyroscope.bias.z.toFixed(0)}"/>`,
      `  <define name="MAG_X_NEUTRAL" value="${calibration.magnetometer.offset.x.toFixed(0)}"/>`,
      `  <define name="MAG_Y_NEUTRAL" value="${calibration.magnetometer.offset.y.toFixed(0)}"/>`,
      `  <define name="MAG_Z_NEUTRAL" value="${calibration.magnetometer.offset.z.toFixed(0)}"/>`,
      '</section>'
    ].join('\n');

    // Write to temporary file
    const configFile = `/tmp/imu_calibration_${aircraftId}.xml`;
    const writeResult = await runIMUCommand('echo', [calibConfig, '>', configFile]);

    return {
      success: writeResult.success,
      error: writeResult.error
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Handle IMU calibration process
 */
export async function handleCalibrateIMU(params: IMUCalibrationParams) {
  try {
    const calibrationType = params.calibrationType || 'full';
    const stabilizationTime = params.stabilizationTime || 10;
    const sampleCount = params.sampleCount || 100;
    const autoMode = params.autoMode !== false;

    const calibration: IMUCalibration = {
      accelerometer: {
        offset: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      gyroscope: {
        bias: { x: 0, y: 0, z: 0 }
      },
      magnetometer: {
        offset: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      timestamp: new Date().toISOString(),
      valid: false
    };

    let calibrationSteps: string[] = [];
    let instructions: string[] = [];

    // Determine calibration types to perform
    const typesToCalibrate = calibrationType === 'full' 
      ? ['gyroscope', 'accelerometer', 'magnetometer']
      : [calibrationType];

    // Perform calibration for each type
    for (const type of typesToCalibrate) {
      if (type === 'gyroscope') {
        instructions.push('=== Gyroscope Calibration ===');
        instructions.push('Keep aircraft completely stationary');
        instructions.push(`Collecting ${sampleCount} samples over ${stabilizationTime} seconds...`);
        
        const gyroData = await readIMUData(params.aircraftId, stabilizationTime);
        if (gyroData.success && gyroData.data) {
          const gyroCal = calculateGyroCalibration(gyroData.data.gyroscope);
          calibration.gyroscope = gyroCal;
          instructions.push('✓ Gyroscope calibration completed');
        } else {
          instructions.push(`✗ Gyroscope calibration failed: ${gyroData.error}`);
        }
      }

      if (type === 'accelerometer') {
        instructions.push('=== Accelerometer Calibration ===');
        instructions.push('WARNING: This is a simplified single-position calibration');
        instructions.push('For accurate results, use 6-position calibration procedure');
        
        const accelData = await readIMUData(params.aircraftId, stabilizationTime);
        if (accelData.success && accelData.data) {
          const accelCal = calculateAccelCalibration(accelData.data.accelerometer);
          calibration.accelerometer = accelCal;
          instructions.push('✓ Accelerometer calibration completed (basic)');
        } else {
          instructions.push(`✗ Accelerometer calibration failed: ${accelData.error}`);
        }
      }

      if (type === 'magnetometer') {
        instructions.push('=== Magnetometer Calibration ===');
        instructions.push('WARNING: Magnetometer calibration requires complex movement patterns');
        instructions.push('Consider using dedicated magnetometer calibration tools');
        
        // Simplified magnetometer calibration
        calibration.magnetometer = {
          offset: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        };
        instructions.push('⚠ Magnetometer calibration skipped (requires manual procedure)');
      }
    }

    // Write calibration configuration
    calibration.valid = true;
    const configResult = await writeCalibrationConfig(params.aircraftId, calibration);

    if (configResult.success) {
      instructions.push('✓ Calibration parameters saved to configuration file');
    } else {
      instructions.push(`✗ Failed to save calibration: ${configResult.error}`);
    }

    return {
      success: calibration.valid,
      calibration,
      instructions: instructions.join('\n'),
      configurationFile: `/tmp/imu_calibration_${params.aircraftId}.xml`,
      nextSteps: [
        'Review calibration parameters for accuracy',
        'Update aircraft configuration with new IMU parameters',
        'Perform test flight to verify attitude accuracy',
        'Consider full 6-position accelerometer calibration for best results'
      ],
      warnings: [
        'This is a basic IMU calibration suitable for initial testing',
        'For production use, perform full multi-position calibration',
        'Magnetometer calibration requires dedicated procedure',
        'Verify calibration accuracy before autonomous flight'
      ]
    };

  } catch (error) {
    return {
      success: false,
      error: `IMU calibration failed: ${error}`,
      calibration: null,
      troubleshooting: [
        'Ensure aircraft is connected and telemetry is working',
        'Check that IMU is powered and responding',
        'Verify aircraft is completely stationary during gyro calibration',
        'Ensure no magnetic interference during magnetometer calibration'
      ]
    };
  }
}