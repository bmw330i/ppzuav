import { BaseTool } from '../types.js';
import { spawn } from 'child_process';
import * as path from 'path';

export class FlashAutopilotTool implements BaseTool {
  name = 'flash_autopilot_firmware';
  description = 'Compile and flash firmware to Paparazzi autopilot based on airframe configuration';
  
  inputSchema = {
    type: 'object',
    properties: {
      aircraftId: { type: 'string', description: 'Aircraft identifier' },
      airframeFile: { type: 'string', description: 'Path to XML airframe configuration' },
      target: { type: 'string', enum: ['ap', 'sim', 'fbw'], description: 'Target board type' },
      board: { type: 'string', description: 'Board type (e.g., lisa_m_2.0, tiny_2.11)' },
      forceRebuild: { type: 'boolean', description: 'Force clean rebuild', default: false }
    },
    required: ['aircraftId', 'target', 'board']
  };

  async execute(args: any): Promise<any> {
    const { aircraftId, airframeFile, target, board, forceRebuild = false } = args;
    const paparazziHome = '/Users/david/Documents/bmw330ipaparazzi';

    try {
      const startTime = Date.now();
      
      // Step 1: Clean build if requested
      if (forceRebuild) {
        await this.runCommand('make', ['clean_ac'], paparazziHome, 
          `Cleaning previous build for ${aircraftId}`);
      }

      // Step 2: Compile firmware
      const compileResult = await this.runCommand(
        'make', 
        [`TARGET=${target}`, `AIRCRAFT=${aircraftId}`], 
        paparazziHome,
        `Compiling ${target} target for ${aircraftId}`
      );

      if (!compileResult.success) {
        return {
          success: false,
          error: 'Compilation failed',
          compilationLog: compileResult.output,
          suggestions: this.parseCompilationErrors(compileResult.output)
        };
      }

      // Step 3: Flash firmware
      const flashResult = await this.runCommand(
        'make', 
        [`TARGET=${target}`, `AIRCRAFT=${aircraftId}`, 'upload'], 
        paparazziHome,
        `Flashing firmware to ${board}`
      );

      if (!flashResult.success) {
        return {
          success: false,
          error: 'Flashing failed',
          compilationLog: compileResult.output,
          flashingLog: flashResult.output,
          suggestions: this.parseFlashingErrors(flashResult.output)
        };
      }

      // Step 4: Verify firmware
      const verifyResult = await this.verifyFirmware(aircraftId, target);
      
      const estimatedTime = Math.round((Date.now() - startTime) / 1000);

      return {
        success: true,
        compilationLog: compileResult.output,
        flashingLog: flashResult.output,
        firmwareVersion: this.extractFirmwareVersion(compileResult.output),
        checksum: this.extractChecksum(flashResult.output),
        estimatedTime,
        verificationResult: verifyResult,
        nextSteps: [
          'Connect telemetry modem',
          'Configure XBee communication',
          'Calibrate IMU sensors',
          'Upload flight plan',
          'Perform pre-flight checks'
        ]
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        suggestions: [
          'Check that autopilot is connected via USB',
          'Verify board type matches physical hardware',
          'Ensure Paparazzi environment is properly configured',
          'Check for hardware compatibility issues'
        ]
      };
    }
  }

  private async runCommand(
    command: string, 
    args: string[], 
    cwd: string, 
    description: string
  ): Promise<{ success: boolean; output: string }> {
    return new Promise((resolve) => {
      console.error(`[FLASH] ${description}...`);
      
      const childProcess = spawn(command, args, { 
        cwd, 
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...globalThis.process.env, PAPARAZZI_HOME: cwd, PAPARAZZI_SRC: cwd }
      });

      let output = '';
      let errorOutput = '';

      childProcess.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      childProcess.on('close', (code: number | null) => {
        const fullOutput = output + errorOutput;
        console.error(`[FLASH] ${description} ${code === 0 ? 'completed' : 'failed'}`);
        
        resolve({
          success: code === 0,
          output: fullOutput
        });
      });

      childProcess.on('error', (error: Error) => {
        resolve({
          success: false,
          output: `Process error: ${error.message}`
        });
      });
    });
  }

  private parseCompilationErrors(output: string): string[] {
    const suggestions = [];
    
    if (output.includes('No such file or directory')) {
      suggestions.push('Check that airframe file exists and path is correct');
    }
    
    if (output.includes('undefined reference')) {
      suggestions.push('Missing module or subsystem dependency');
      suggestions.push('Check airframe configuration for required modules');
    }
    
    if (output.includes('error: \'')) {
      suggestions.push('Syntax error in airframe configuration');
      suggestions.push('Validate XML syntax and check for typos');
    }
    
    if (output.includes('Permission denied')) {
      suggestions.push('Check file permissions and USB device access');
    }

    if (suggestions.length === 0) {
      suggestions.push('Review compilation log for specific error details');
    }

    return suggestions;
  }

  private parseFlashingErrors(output: string): string[] {
    const suggestions = [];
    
    if (output.includes('No DFU capable USB device available')) {
      suggestions.push('Put autopilot in DFU mode by holding DFU button during power-on');
      suggestions.push('Check USB cable connection');
    }
    
    if (output.includes('Permission denied')) {
      suggestions.push('Add user to dialout group: sudo usermod -a -G dialout $USER');
      suggestions.push('Install udev rules for autopilot board');
    }
    
    if (output.includes('device not found')) {
      suggestions.push('Ensure autopilot is connected and recognized by system');
      suggestions.push('Try different USB port or cable');
    }
    
    if (output.includes('timeout')) {
      suggestions.push('Flash operation timed out - retry or check hardware');
    }

    if (suggestions.length === 0) {
      suggestions.push('Review flashing log for specific error details');
    }

    return suggestions;
  }

  private extractFirmwareVersion(output: string): string {
    // Look for version information in compilation output
    const versionMatch = output.match(/PPRZ_VERSION_[A-Z]+\s*=\s*(\d+)/g);
    if (versionMatch) {
      return versionMatch.join(' ');
    }

    // Fallback to git hash if available
    const gitMatch = output.match(/git describe.*?([a-f0-9]{7,})/);
    if (gitMatch) {
      return gitMatch[1];
    }

    return 'unknown';
  }

  private extractChecksum(output: string): string {
    // Look for MD5 or other checksums in flash output
    const md5Match = output.match(/MD5:\s*([a-f0-9]{32})/i);
    if (md5Match) {
      return md5Match[1];
    }

    const crcMatch = output.match(/CRC:\s*([a-f0-9]+)/i);
    if (crcMatch) {
      return crcMatch[1];
    }

    return 'unknown';
  }

  private async verifyFirmware(aircraftId: string, target: string): Promise<any> {
    // Basic verification that firmware was flashed successfully
    try {
      const verifyResult = await this.runCommand(
        'make',
        [`TARGET=${target}`, `AIRCRAFT=${aircraftId}`, 'verify'],
        '/Users/david/Documents/bmw330ipaparazzi',
        'Verifying firmware flash'
      );

      return {
        verified: verifyResult.success,
        details: verifyResult.output
      };
    } catch (error) {
      return {
        verified: false,
        error: 'Verification not available',
        details: 'Manual verification recommended'
      };
    }
  }
}