#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool implementations
import { FlashAutopilotTool } from './tools/flash-autopilot.js';
import { ProvideHumanGuidanceTool } from './tools/provide-human-guidance.js';
import { ConfigureAirframeTool } from './tools/configure-airframe.js';
import { ConfigureXBeeTool } from './tools/configure-xbee.js';
import { EstablishTelemetryTool } from './tools/establish-telemetry.js';
import { CalibrateIMUTool } from './tools/calibrate-imu.js';
import { 
  PrepareFlightTool,
  UploadFlightPlanTool,
  DetectLaunchTool,
  MonitorFlightSafetyTool,
  AnalyzeWildfireTool,
  TrackAircraftAISTool
} from './tools/stub-tools.js';

class PaparazziMCPServer {
  private server: Server;
  private tools: Map<string, any>;

  constructor() {
    this.server = new Server(
      {
        name: 'paparazzi-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize tools
    this.tools = new Map();
    this.registerTools();
    this.setupHandlers();
  }

  private registerTools(): void {
    const toolInstances = [
      new FlashAutopilotTool(),
      ConfigureXBeeTool,
      EstablishTelemetryTool,
      CalibrateIMUTool,
      new PrepareFlightTool(),
      new UploadFlightPlanTool(),
      new DetectLaunchTool(),
      new MonitorFlightSafetyTool(),
      new AnalyzeWildfireTool(),
      new TrackAircraftAISTool(),
      new ProvideHumanGuidanceTool(),
      new ConfigureAirframeTool(),
    ];

    for (const tool of toolInstances) {
      this.tools.set(tool.name, tool);
    }
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = this.tools.get(name);
      if (!tool) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Tool "${name}" not found`
        );
      }

      try {
        const result = await tool.execute(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Paparazzi MCP server running on stdio');
  }
}

// Start the server
const server = new PaparazziMCPServer();
server.run().catch(console.error);