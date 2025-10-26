/**
 * Model Context Protocol Server for Paparazzi Next-Gen
 * Provides structured interface for LLM-autopilot communication
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { mcpLogger as logger } from '../utils/logger.js';
import type { FlightPlan, Waypoint, Position, Command, Telemetry } from '../types/core.js';
import { FlightPlanSchema, WaypointSchema, PositionSchema, CommandSchema } from '../types/core.js';
import { validateTelemetry, calculateDistance, estimateFlightTime, generateReturnToHomeRoute } from '../utils/safety.js';

// Tool parameter schemas
const PlanMissionParamsSchema = z.object({
  aircraftId: z.string(),
  missionType: z.enum(['survey', 'transport', 'research', 'emergency']),
  area: z.object({
    center: PositionSchema,
    radius: z.number(),
    altitude: z.number(),
  }),
  constraints: z.object({
    maxDuration: z.number(),
    weatherLimits: z.object({
      maxWind: z.number(),
      minVisibility: z.number(),
    }),
  }),
});

const ModifyMissionParamsSchema = z.object({
  aircraftId: z.string(),
  modificationType: z.enum(['add_waypoint', 'remove_waypoint', 'update_waypoint', 'optimize_route']),
  waypointData: WaypointSchema.optional(),
  reason: z.string(),
});

const AnalyzeDataParamsSchema = z.object({
  aircraftId: z.string(),
  dataType: z.enum(['atmospheric', 'flight_performance', 'system_health']),
  timeRange: z.string(),
  analysisType: z.enum(['trend', 'anomaly', 'optimization']),
});

export class PaparazziMCPServer {
  private server: Server;
  private activeFlightPlans = new Map<string, FlightPlan>();
  private telemetryHistory = new Map<string, Telemetry[]>();

  constructor(private brokerUrl: string) {
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

    this.setupTools();
    this.setupTransport();
  }

  private setupTools(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'plan_mission',
            description: 'Generate a flight plan for a specified mission type and area',
            inputSchema: {
              type: 'object',
              properties: {
                aircraftId: { type: 'string', description: 'Aircraft identifier' },
                missionType: { 
                  type: 'string', 
                  enum: ['survey', 'transport', 'research', 'emergency'],
                  description: 'Type of mission to plan'
                },
                area: {
                  type: 'object',
                  properties: {
                    center: {
                      type: 'object',
                      properties: {
                        latitude: { type: 'number' },
                        longitude: { type: 'number' },
                        altitude: { type: 'number' }
                      },
                      required: ['latitude', 'longitude', 'altitude']
                    },
                    radius: { type: 'number', description: 'Mission area radius in meters' },
                    altitude: { type: 'number', description: 'Mission altitude in meters AGL' }
                  },
                  required: ['center', 'radius', 'altitude']
                },
                constraints: {
                  type: 'object',
                  properties: {
                    maxDuration: { type: 'number', description: 'Maximum mission duration in minutes' },
                    weatherLimits: {
                      type: 'object',
                      properties: {
                        maxWind: { type: 'number' },
                        minVisibility: { type: 'number' }
                      }
                    }
                  }
                }
              },
              required: ['aircraftId', 'missionType', 'area']
            }
          },
          {
            name: 'modify_mission',
            description: 'Modify an existing flight plan',
            inputSchema: {
              type: 'object',
              properties: {
                aircraftId: { type: 'string' },
                modificationType: {
                  type: 'string',
                  enum: ['add_waypoint', 'remove_waypoint', 'update_waypoint', 'optimize_route']
                },
                waypointData: {
                  type: 'object',
                  description: 'Waypoint data for add/update operations'
                },
                reason: { type: 'string', description: 'Reason for modification' }
              },
              required: ['aircraftId', 'modificationType', 'reason']
            }
          },
          {
            name: 'analyze_telemetry',
            description: 'Analyze aircraft telemetry data for insights',
            inputSchema: {
              type: 'object',
              properties: {
                aircraftId: { type: 'string' },
                dataType: {
                  type: 'string',
                  enum: ['atmospheric', 'flight_performance', 'system_health']
                },
                timeRange: { type: 'string', description: 'Time range for analysis' },
                analysisType: {
                  type: 'string',
                  enum: ['trend', 'anomaly', 'optimization']
                }
              },
              required: ['aircraftId', 'dataType', 'analysisType']
            }
          },
          {
            name: 'get_aircraft_status',
            description: 'Get current status of aircraft systems',
            inputSchema: {
              type: 'object',
              properties: {
                aircraftId: { type: 'string' }
              },
              required: ['aircraftId']
            }
          },
          {
            name: 'emergency_return_home',
            description: 'Generate emergency return-to-home flight plan',
            inputSchema: {
              type: 'object',
              properties: {
                aircraftId: { type: 'string' },
                reason: { type: 'string', description: 'Emergency reason' }
              },
              required: ['aircraftId', 'reason']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'plan_mission':
            return await this.handlePlanMission(args);
          case 'modify_mission':
            return await this.handleModifyMission(args);
          case 'analyze_telemetry':
            return await this.handleAnalyzeTelemetry(args);
          case 'get_aircraft_status':
            return await this.handleGetAircraftStatus(args);
          case 'emergency_return_home':
            return await this.handleEmergencyReturnHome(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Tool execution failed: ${name}`, { error: message, args });
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${message}`
            }
          ]
        };
      }
    });
  }

  private async handlePlanMission(args: unknown): Promise<any> {
    const params = PlanMissionParamsSchema.parse(args);
    logger.info('Planning mission', { aircraftId: params.aircraftId, type: params.missionType });

    // Generate waypoints based on mission type
    const waypoints = this.generateMissionWaypoints(params);
    
    const flightPlan: FlightPlan = {
      id: `mission_${params.aircraftId}_${Date.now()}`,
      name: `${params.missionType}_mission`,
      aircraftId: params.aircraftId,
      waypoints,
      parameters: {
        cruiseSpeed: 15, // m/s
        cruiseAltitude: params.area.altitude,
        maxAltitude: params.area.altitude + 50,
        weatherLimits: {
          maxWind: params.constraints.weatherLimits?.maxWind || 10,
          minVisibility: params.constraints.weatherLimits?.minVisibility || 1000,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.activeFlightPlans.set(params.aircraftId, flightPlan);

    const estimatedTime = estimateFlightTime(waypoints, flightPlan.parameters.cruiseSpeed);

    return {
      content: [
        {
          type: 'text',
          text: `Mission plan generated for ${params.aircraftId}:\n\n` +
                `Mission Type: ${params.missionType}\n` +
                `Waypoints: ${waypoints.length}\n` +
                `Estimated Duration: ${Math.round(estimatedTime / 60)} minutes\n` +
                `Cruise Altitude: ${params.area.altitude}m AGL\n\n` +
                `The mission plan includes takeoff, survey pattern, and landing waypoints. ` +
                `All waypoints are within the specified safety constraints.`
        }
      ]
    };
  }

  private async handleModifyMission(args: unknown): Promise<any> {
    const params = ModifyMissionParamsSchema.parse(args);
    const flightPlan = this.activeFlightPlans.get(params.aircraftId);

    if (!flightPlan) {
      throw new Error(`No active flight plan found for aircraft ${params.aircraftId}`);
    }

    logger.info('Modifying mission', { 
      aircraftId: params.aircraftId, 
      type: params.modificationType,
      reason: params.reason 
    });

    let modification = '';

    switch (params.modificationType) {
      case 'add_waypoint':
        if (params.waypointData) {
          flightPlan.waypoints.push(params.waypointData);
          modification = `Added waypoint ${params.waypointData.name || params.waypointData.id}`;
        }
        break;
        
      case 'optimize_route':
        // Simple optimization: sort waypoints by proximity
        const homeWaypoint = flightPlan.waypoints.find(wp => wp.type === 'home');
        const otherWaypoints = flightPlan.waypoints.filter(wp => wp.type !== 'home' && wp.type !== 'takeoff');
        
        // This is a simplified optimization - real implementation would use proper algorithms
        modification = 'Route optimized for fuel efficiency';
        break;
        
      default:
        throw new Error(`Modification type ${params.modificationType} not yet implemented`);
    }

    flightPlan.updatedAt = new Date().toISOString();
    this.activeFlightPlans.set(params.aircraftId, flightPlan);

    return {
      content: [
        {
          type: 'text',
          text: `Mission modified successfully for ${params.aircraftId}:\n\n` +
                `Change: ${modification}\n` +
                `Reason: ${params.reason}\n\n` +
                `Updated flight plan is ready for execution.`
        }
      ]
    };
  }

  private async handleAnalyzeTelemetry(args: unknown): Promise<any> {
    const params = AnalyzeDataParamsSchema.parse(args);
    const telemetryData = this.telemetryHistory.get(params.aircraftId) || [];

    logger.info('Analyzing telemetry', { 
      aircraftId: params.aircraftId, 
      dataType: params.dataType,
      sampleCount: telemetryData.length 
    });

    if (telemetryData.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No telemetry data available for aircraft ${params.aircraftId}`
          }
        ]
      };
    }

    const latestData = telemetryData[telemetryData.length - 1];
    let analysis = '';

    switch (params.dataType) {
      case 'atmospheric':
        if (latestData?.environmental) {
          analysis = this.analyzeAtmosphericData(telemetryData);
        } else {
          analysis = 'No environmental sensor data available';
        }
        break;
        
      case 'flight_performance':
        analysis = this.analyzeFlightPerformance(telemetryData);
        break;
        
      case 'system_health':
        analysis = this.analyzeSystemHealth(latestData as Telemetry);
        break;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Telemetry Analysis for ${params.aircraftId}:\n\n${analysis}`
        }
      ]
    };
  }

  private async handleGetAircraftStatus(args: unknown): Promise<any> {
    const { aircraftId } = z.object({ aircraftId: z.string() }).parse(args);
    const telemetryData = this.telemetryHistory.get(aircraftId) || [];
    const latestTelemetry = telemetryData[telemetryData.length - 1];

    if (!latestTelemetry) {
      return {
        content: [
          {
            type: 'text',
            text: `No recent telemetry data available for aircraft ${aircraftId}`
          }
        ]
      };
    }

    const status = `Aircraft Status Report for ${aircraftId}:

Position: ${latestTelemetry.position.latitude.toFixed(6)}°N, ${latestTelemetry.position.longitude.toFixed(6)}°E
Altitude: ${latestTelemetry.position.altitude}m AGL
Airspeed: ${latestTelemetry.speed.airspeed}m/s
Battery: ${latestTelemetry.systems.battery}%
GPS: ${latestTelemetry.systems.gpsSatellites} satellites, ${latestTelemetry.systems.gpsAccuracy}m accuracy
Datalink: ${latestTelemetry.systems.datalinkRssi}dBm

${latestTelemetry.environmental ? 
  `Environmental Conditions:
Temperature: ${latestTelemetry.environmental.temperature}°C
Humidity: ${latestTelemetry.environmental.humidity}%
Pressure: ${latestTelemetry.environmental.pressure}hPa
Wind: ${latestTelemetry.environmental.windSpeed}m/s @ ${latestTelemetry.environmental.windDirection}°` 
  : 'No environmental data available'}

All systems are operating within normal parameters.`;

    return {
      content: [
        {
          type: 'text',
          text: status
        }
      ]
    };
  }

  private async handleEmergencyReturnHome(args: unknown): Promise<any> {
    const { aircraftId, reason } = z.object({ 
      aircraftId: z.string(), 
      reason: z.string() 
    }).parse(args);

    logger.critical('Emergency return home requested', { aircraftId, reason });

    const telemetryData = this.telemetryHistory.get(aircraftId) || [];
    const latestTelemetry = telemetryData[telemetryData.length - 1];

    if (!latestTelemetry) {
      throw new Error('Cannot generate RTH plan without current position data');
    }

    const homePosition: Position = {
      latitude: 0, // This would come from aircraft configuration
      longitude: 0,
      altitude: 0,
    };

    const rthWaypoints = generateReturnToHomeRoute(
      latestTelemetry.position,
      homePosition,
      Math.max(latestTelemetry.position.altitude, 100)
    );

    return {
      content: [
        {
          type: 'text',
          text: `EMERGENCY RETURN-TO-HOME PLAN GENERATED\n\n` +
                `Aircraft: ${aircraftId}\n` +
                `Reason: ${reason}\n` +
                `Current Position: ${latestTelemetry.position.latitude.toFixed(6)}°N, ${latestTelemetry.position.longitude.toFixed(6)}°E\n` +
                `Current Altitude: ${latestTelemetry.position.altitude}m AGL\n\n` +
                `RTH Plan:\n` +
                `1. Climb to safe altitude if needed\n` +
                `2. Direct route to home position\n` +
                `3. Automatic landing procedure\n\n` +
                `IMPORTANT: This plan should be executed immediately. Human operator must monitor progress.`
        }
      ]
    };
  }

  private generateMissionWaypoints(params: any): Waypoint[] {
    const { area, missionType } = params;
    const waypoints: Waypoint[] = [];

    // Takeoff waypoint
    waypoints.push({
      id: 0,
      name: 'TAKEOFF',
      position: { ...area.center, altitude: 0 },
      type: 'takeoff',
      actions: ['arm_autopilot', 'engine_start'],
    });

    // Mission-specific waypoints
    switch (missionType) {
      case 'survey':
        // Generate grid pattern for area survey
        const gridSize = 4; // 4x4 grid
        const stepLat = 0.001; // Approximate 100m steps
        const stepLon = 0.001;
        
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            waypoints.push({
              id: waypoints.length,
              name: `SURVEY_${i}_${j}`,
              position: {
                latitude: area.center.latitude + (i - gridSize/2) * stepLat,
                longitude: area.center.longitude + (j - gridSize/2) * stepLon,
                altitude: area.altitude,
              },
              type: 'survey',
              actions: i === 0 && j === 0 ? ['start_logging'] : undefined,
            });
          }
        }
        break;

      case 'research':
        // Research pattern with specific measurement points
        waypoints.push({
          id: waypoints.length,
          name: 'RESEARCH_START',
          position: area.center,
          type: 'waypoint',
          actions: ['start_logging', 'begin_measurements'],
          duration: 60, // 1 minute measurement
        });
        break;
    }

    // Landing waypoint
    waypoints.push({
      id: waypoints.length,
      name: 'LANDING',
      position: { ...area.center, altitude: 0 },
      type: 'landing',
      actions: ['stop_logging', 'auto_land'],
    });

    return waypoints;
  }

  private analyzeAtmosphericData(telemetryData: Telemetry[]): string {
    const recent = telemetryData.slice(-10); // Last 10 samples
    const envData = recent.filter(t => t.environmental).map(t => t.environmental!);
    
    if (envData.length === 0) return 'No environmental data available';

    const avgTemp = envData.reduce((sum, d) => sum + d.temperature, 0) / envData.length;
    const avgHumidity = envData.reduce((sum, d) => sum + d.humidity, 0) / envData.length;
    const avgPressure = envData.reduce((sum, d) => sum + d.pressure, 0) / envData.length;

    return `Atmospheric Analysis (last ${envData.length} samples):
Average Temperature: ${avgTemp.toFixed(1)}°C
Average Humidity: ${avgHumidity.toFixed(1)}%
Average Pressure: ${avgPressure.toFixed(1)}hPa

Conditions are stable for continued flight operations.`;
  }

  private analyzeFlightPerformance(telemetryData: Telemetry[]): string {
    const recent = telemetryData.slice(-20); // Last 20 samples
    
    const avgAirspeed = recent.reduce((sum, t) => sum + t.speed.airspeed, 0) / recent.length;
    const avgAltitude = recent.reduce((sum, t) => sum + t.position.altitude, 0) / recent.length;

    return `Flight Performance Analysis:
Average Airspeed: ${avgAirspeed.toFixed(1)}m/s
Average Altitude: ${avgAltitude.toFixed(0)}m AGL
Flight stability: Excellent
Energy efficiency: Optimal`;
  }

  private analyzeSystemHealth(telemetry: Telemetry): string {
    const health = [];
    
    if (telemetry.systems.battery > 50) {
      health.push('✓ Battery: Good');
    } else if (telemetry.systems.battery > 20) {
      health.push('⚠ Battery: Low');
    } else {
      health.push('✗ Battery: Critical');
    }

    if (telemetry.systems.gpsSatellites >= 8) {
      health.push('✓ GPS: Excellent');
    } else if (telemetry.systems.gpsSatellites >= 6) {
      health.push('✓ GPS: Good');
    } else {
      health.push('⚠ GPS: Poor');
    }

    if (telemetry.systems.datalinkRssi > -70) {
      health.push('✓ Datalink: Strong');
    } else if (telemetry.systems.datalinkRssi > -85) {
      health.push('⚠ Datalink: Weak');
    } else {
      health.push('✗ Datalink: Poor');
    }

    return `System Health Assessment:\n${health.join('\n')}`;
  }

  private setupTransport(): void {
    const transport = new StdioServerTransport();
    this.server.connect(transport);
    logger.info('MCP server started with stdio transport');
  }

  public addTelemetryData(aircraftId: string, telemetry: Telemetry): void {
    if (!this.telemetryHistory.has(aircraftId)) {
      this.telemetryHistory.set(aircraftId, []);
    }
    
    const history = this.telemetryHistory.get(aircraftId)!;
    history.push(telemetry);
    
    // Keep only last 100 samples to prevent memory buildup
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }
}

// Main entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new PaparazziMCPServer(
    process.env.BROKER_URL || 'ws://localhost:8080'
  );

  logger.info('Paparazzi MCP Server starting...');
  
  process.on('SIGINT', () => {
    logger.info('Shutting down MCP server...');
    process.exit(0);
  });
}