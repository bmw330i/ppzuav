/**
 * Paparazzi Next-Gen Flight Simulator
 * Modern TypeScript replacement for OCaml SITL/HITL simulation
 * 
 * Features:
 * - Software In The Loop (SITL) simulation
 * - Hardware In The Loop (HITL) simulation 
 * - Realistic flight physics model
 * - Flight plan execution simulation
 * - Integration with GCS for real-time monitoring
 * - WebSocket communication for live telemetry
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { FlightModel } from './flight-model.js';
import { GPSSimulator } from './gps-simulator.js';
import { EnvironmentModel } from './environment-model.js';
import { FlightPlanExecutor } from './flight-plan-executor.js';
import { TelemetryGenerator } from './telemetry-generator.js';
import { simulatorLogger as logger } from '../utils/file-logger.js';
import type { 
  SimulatorConfig, 
  SimulationState, 
  FlightPlan, 
  Telemetry,
  Command 
} from '../types/core.js';

interface SimulatorInstance {
  id: string;
  aircraftId: string;
  flightModel: FlightModel;
  gpsSimulator: GPSSimulator;
  environment: EnvironmentModel;
  flightPlan?: FlightPlan;
  state: SimulationState;
  lastUpdate: Date;
}

export class FlightSimulator {
  private config: SimulatorConfig;
  private server: any;
  private wss: WebSocketServer | null = null;
  private simulators = new Map<string, SimulatorInstance>();
  private simulationTimer: NodeJS.Timeout | null = null;
  private telemetryGenerator: TelemetryGenerator;

  constructor(config: SimulatorConfig) {
    this.config = config;
    this.telemetryGenerator = new TelemetryGenerator();
    
    // Setup Express server for web interface
    const app = express();
    app.use(express.json());
    app.use(express.static('public/simulator'));
    
    // REST API endpoints
    app.get('/api/simulators', this.getSimulators.bind(this));
    app.post('/api/simulators', this.createSimulator.bind(this));
    app.delete('/api/simulators/:id', this.deleteSimulator.bind(this));
    app.post('/api/simulators/:id/start', this.startSimulation.bind(this));
    app.post('/api/simulators/:id/stop', this.stopSimulation.bind(this));
    app.post('/api/simulators/:id/load-flight-plan', this.loadFlightPlan.bind(this));
    app.post('/api/simulators/:id/command', this.sendCommand.bind(this));
    
    this.server = createServer(app);
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Start WebSocket server for real-time communication
        this.wss = new WebSocketServer({ server: this.server });
        this.setupWebSocketHandlers();
        
        // Start HTTP server
        this.server.listen(this.config.port, () => {
          logger.info(`Flight Simulator started on port ${this.config.port}`);
          
          // Start simulation loop
          this.startSimulationLoop();
          resolve();
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    // Stop simulation loop
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
    
    // Close all simulators
    for (const simulator of this.simulators.values()) {
      await this.stopSimulatorInstance(simulator);
    }
    
    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }
    
    // Close HTTP server
    if (this.server) {
      this.server.close();
    }
    
    logger.info('Flight Simulator stopped');
  }

  private setupWebSocketHandlers(): void {
    if (!this.wss) return;
    
    this.wss.on('connection', (ws) => {
      logger.info('Simulator WebSocket client connected');
      
      // Send current simulator states
      const states = Array.from(this.simulators.values()).map(sim => ({
        id: sim.id,
        aircraftId: sim.aircraftId,
        state: sim.state,
        lastUpdate: sim.lastUpdate
      }));
      
      ws.send(JSON.stringify({
        type: 'simulator_states',
        data: states
      }));
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(ws, message);
        } catch (error) {
          logger.error('Invalid WebSocket message', { 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      });
      
      ws.on('close', () => {
        logger.info('Simulator WebSocket client disconnected');
      });
    });
  }

  private handleWebSocketMessage(ws: any, message: any): void {
    switch (message.type) {
      case 'subscribe_telemetry':
        // Client wants to receive telemetry for specific aircraft
        const aircraftId = message.aircraftId;
        // Store subscription (would implement proper subscription management)
        break;
        
      case 'send_command':
        // Client sending command to aircraft
        this.processCommand(message.command);
        break;
    }
  }

  private startSimulationLoop(): void {
    // Run simulation at configurable frequency (default 50Hz)
    const interval = 1000 / (this.config.simulationFrequency || 50);
    
    this.simulationTimer = setInterval(() => {
      this.updateAllSimulations();
    }, interval);
  }

  private updateAllSimulations(): void {
    const now = new Date();
    
    for (const simulator of this.simulators.values()) {
      if (simulator.state.isRunning) {
        this.updateSimulation(simulator, now);
      }
    }
  }

  private updateSimulation(simulator: SimulatorInstance, now: Date): void {
    const deltaTime = (now.getTime() - simulator.lastUpdate.getTime()) / 1000;
    
    // Update flight model physics
    simulator.flightModel.update(deltaTime);
    
    // Update GPS simulation
    simulator.gpsSimulator.update(deltaTime, simulator.flightModel.getPosition());
    
    // Update environment (wind, turbulence, etc.)
    simulator.environment.update(deltaTime);
    
    // Execute flight plan if loaded
    if (simulator.flightPlan) {
      const executor = new FlightPlanExecutor(simulator.flightPlan);
      const navCommands = executor.update(deltaTime, simulator.flightModel.getState());
      
      // Apply navigation commands to flight model
      simulator.flightModel.applyNavigationCommands(navCommands);
    }
    
    // Generate telemetry data
    const telemetry = this.telemetryGenerator.generate(
      simulator.aircraftId,
      simulator.flightModel.getState(),
      simulator.gpsSimulator.getState(),
      simulator.environment.getState()
    );
    
    // Broadcast telemetry via WebSocket
    this.broadcastTelemetry(telemetry);
    
    simulator.lastUpdate = now;
  }

  private broadcastTelemetry(telemetry: Telemetry): void {
    if (!this.wss) return;
    
    const message = JSON.stringify({
      type: 'telemetry',
      data: telemetry
    });
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }

  private async processCommand(command: Command): Promise<void> {
    const simulator = this.simulators.get(command.destination);
    if (simulator) {
      simulator.flightModel.processCommand(command);
      logger.info('Command processed', { 
        aircraftId: command.destination, 
        command: command.type 
      });
    }
  }

  // REST API handlers
  private getSimulators(req: any, res: any): void {
    const simulators = Array.from(this.simulators.values()).map(sim => ({
      id: sim.id,
      aircraftId: sim.aircraftId,
      state: sim.state,
      lastUpdate: sim.lastUpdate
    }));
    
    res.json(simulators);
  }

  private createSimulator(req: any, res: any): void {
    const { aircraftId, initialPosition, aircraftType } = req.body;
    
    const simulatorId = `sim_${Date.now()}`;
    const simulator: SimulatorInstance = {
      id: simulatorId,
      aircraftId,
      flightModel: new FlightModel({
        aircraftType,
        initialPosition,
        mass: 2.5, // kg
        maxThrust: 15.0, // N
        dragCoefficient: 0.05
      }),
      gpsSimulator: new GPSSimulator(initialPosition),
      environment: new EnvironmentModel({
        windSpeed: 5.0, // m/s
        windDirection: 45, // degrees
        turbulenceLevel: 0.1
      }),
      state: {
        isRunning: false,
        totalTime: 0,
        flightPhase: 'ground'
      },
      lastUpdate: new Date()
    };
    
    this.simulators.set(simulatorId, simulator);
    
    logger.info('Simulator created', { id: simulatorId, aircraftId });
    res.json({ id: simulatorId, status: 'created' });
  }

  private deleteSimulator(req: any, res: any): void {
    const { id } = req.params;
    
    if (this.simulators.has(id)) {
      this.simulators.delete(id);
      logger.info('Simulator deleted', { id });
      res.json({ status: 'deleted' });
    } else {
      res.status(404).json({ error: 'Simulator not found' });
    }
  }

  private startSimulation(req: any, res: any): void {
    const { id } = req.params;
    const simulator = this.simulators.get(id);
    
    if (simulator) {
      simulator.state.isRunning = true;
      simulator.lastUpdate = new Date();
      logger.info('Simulation started', { id });
      res.json({ status: 'started' });
    } else {
      res.status(404).json({ error: 'Simulator not found' });
    }
  }

  private stopSimulation(req: any, res: any): void {
    const { id } = req.params;
    const simulator = this.simulators.get(id);
    
    if (simulator) {
      simulator.state.isRunning = false;
      logger.info('Simulation stopped', { id });
      res.json({ status: 'stopped' });
    } else {
      res.status(404).json({ error: 'Simulator not found' });
    }
  }

  private loadFlightPlan(req: any, res: any): void {
    const { id } = req.params;
    const { flightPlan } = req.body;
    const simulator = this.simulators.get(id);
    
    if (simulator) {
      simulator.flightPlan = flightPlan;
      logger.info('Flight plan loaded', { id, waypoints: flightPlan.waypoints.length });
      res.json({ status: 'loaded' });
    } else {
      res.status(404).json({ error: 'Simulator not found' });
    }
  }

  private sendCommand(req: any, res: any): void {
    const { id } = req.params;
    const { command } = req.body;
    const simulator = this.simulators.get(id);
    
    if (simulator) {
      this.processCommand({
        ...command,
        destination: simulator.aircraftId
      });
      res.json({ status: 'sent' });
    } else {
      res.status(404).json({ error: 'Simulator not found' });
    }
  }

  private async stopSimulatorInstance(simulator: SimulatorInstance): Promise<void> {
    simulator.state.isRunning = false;
    // Additional cleanup if needed
  }
}

// Main entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const simulator = new FlightSimulator({
    port: parseInt(process.env.SIMULATOR_PORT || '8090'),
    simulationFrequency: 50, // Hz
    enableFlightGear: process.env.ENABLE_FLIGHTGEAR === 'true'
  });

  simulator.start().catch((error) => {
    logger.error('Failed to start flight simulator', { error: error.message });
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down flight simulator...');
    await simulator.stop();
    process.exit(0);
  });
}