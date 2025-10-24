/**
 * Message Broker - Replaces Ivy-OCaml messaging system
 * Provides MQTT + WebSocket communication for Paparazzi components
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import mqtt from 'mqtt';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { brokerLogger as logger } from '../utils/file-logger.js';
import { TelemetrySchema, CommandSchema } from '../types/core.js';
import type { Telemetry, Command } from '../types/core.js';

interface MessageBrokerConfig {
  port: number;
  mqttBrokerUrl?: string | undefined;
  serialPorts?: Array<{
    path: string;
    baudRate: number;
    aircraftId: string;
  }>;
}

export class MessageBroker {
  private app = express();
  private server = createServer(this.app);
  private wss = new WebSocketServer({ server: this.server });
  private mqttClient: mqtt.MqttClient | null = null;
  private serialPorts = new Map<string, SerialPort>();
  private clients = new Set<any>();

  private readonly MQTT_TOPICS = {
    TELEMETRY: 'paparazzi/telemetry/+',
    COMMANDS: 'paparazzi/commands/+',
    STATUS: 'paparazzi/status/+',
    ALERTS: 'paparazzi/alerts/+',
  };

  constructor(
    private config: {
      port: number;
      mqttBrokerUrl?: string;
      serialPorts?: Array<{ path: string; baudRate: number; aircraftId: string }>;
    }
  ) {
    this.setupExpress();
    this.setupWebSocket();
    this.setupMQTT();
    this.setupSerialPorts();
  }

  private setupExpress(): void {
    this.app.use(express.json());
    this.app.use(express.static('public'));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        clients: this.clients.size,
        serialPorts: this.serialPorts.size,
        mqttConnected: this.mqttClient?.connected || false,
      });
    });

    // Message injection endpoint for testing
    this.app.post('/inject/:topic', (req, res) => {
      const { topic } = req.params;
      const message = req.body;
      
      logger.info(`Injecting message to topic: ${topic}`, { message });
      this.broadcast(`paparazzi/${topic}`, message);
      
      res.json({ status: 'sent', topic, message });
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws) => {
      logger.info('WebSocket client connected');
      this.clients.add(ws);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(ws, message);
        } catch (error: any) {
          logger.error('Invalid WebSocket message', { error: error?.message || error });
          ws.send(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error: any) => {
        logger.error('WebSocket error', { error: error?.message || error });
        this.clients.delete(ws);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        timestamp: new Date().toISOString(),
        message: 'Connected to Paparazzi Message Broker',
      }));
    });
  }

  private setupMQTT(): void {
    if (!this.config.mqttBrokerUrl) {
      logger.info('No MQTT broker configured, using internal message routing only');
      return;
    }

    this.mqttClient = mqtt.connect(this.config.mqttBrokerUrl);

    this.mqttClient.on('connect', () => {
      logger.info('Connected to MQTT broker');
      
      // Subscribe to all Paparazzi topics
      Object.values(this.MQTT_TOPICS).forEach(topic => {
        this.mqttClient?.subscribe(topic, (err) => {
          if (err) {
            logger.error(`Failed to subscribe to ${topic}`, { error: err.message });
          } else {
            logger.debug(`Subscribed to ${topic}`);
          }
        });
      });
    });

    this.mqttClient.on('message', (topic, payload) => {
      try {
        const message = JSON.parse(payload.toString());
        logger.debug(`MQTT message received on ${topic}`);
        this.broadcastToWebSocket(topic, message);
      } catch (error: any) {
        logger.error('Invalid MQTT message', { topic, error: error?.message || error });
      }
    });

    this.mqttClient.on('error', (error: any) => {
      logger.error('MQTT error', { error: error?.message || error });
    });
  }

  private setupSerialPorts(): void {
    if (!this.config.serialPorts) return;

    this.config.serialPorts.forEach(({ path, baudRate, aircraftId }) => {
      try {
        const port = new SerialPort({ path, baudRate });
        const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

        parser.on('data', (data) => {
          this.handleSerialData(aircraftId, data);
        });

        port.on('open', () => {
          logger.info(`Serial port opened: ${path}`, { aircraftId, baudRate });
        });

        port.on('error', (error) => {
          logger.error(`Serial port error on ${path}`, { 
            error: error.message, 
            aircraftId 
          });
        });

        this.serialPorts.set(aircraftId, port);
      } catch (error) {
        logger.error(`Failed to open serial port ${path}`, { 
          error: error instanceof Error ? error.message : String(error), 
          aircraftId 
        });
      }
    });
  }

  private handleWebSocketMessage(ws: any, message: any): void {
    logger.debug('WebSocket message received', { type: message.type });

    switch (message.type) {
      case 'subscribe':
        // Handle subscription requests
        ws.subscriptions = ws.subscriptions || new Set();
        if (message.topic) {
          ws.subscriptions.add(message.topic);
          logger.debug(`Client subscribed to ${message.topic}`);
        }
        break;

      case 'command':
        // Validate and forward commands
        try {
          const command = CommandSchema.parse(message.data);
          this.sendCommand(command);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error('Invalid command format', { error: errorMessage });
          ws.send(JSON.stringify({ 
            error: 'Invalid command format', 
            details: errorMessage 
          }));
        }
        break;

      case 'ping':
        ws.send(JSON.stringify({ 
          type: 'pong', 
          timestamp: new Date().toISOString() 
        }));
        break;

      default:
        logger.warn('Unknown WebSocket message type', { type: message.type });
    }
  }

  private handleSerialData(aircraftId: string, data: string): void {
    try {
      // Try to parse as telemetry data
      // This is a simplified parser - real implementation would handle
      // the existing Paparazzi serial protocol
      const telemetryData = this.parseSerialTelemetry(aircraftId, data.trim());
      
      if (telemetryData) {
        const topic = `paparazzi/telemetry/${aircraftId}`;
        this.broadcast(topic, telemetryData);
        logger.info('Telemetry received', { aircraftId, topic });
      }
    } catch (error) {
      logger.error('Failed to parse serial data', { 
        aircraftId, 
        data: data.slice(0, 100), // First 100 chars for debugging
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  private parseSerialTelemetry(aircraftId: string, data: string): Telemetry | null {
    // This is a placeholder for the real Paparazzi protocol parser
    // In the real implementation, this would parse the binary/text protocol
    // from the autopilot and convert it to our standardized JSON format
    
    try {
      // For now, assume JSON format for testing
      if (data.startsWith('{')) {
        const parsed = JSON.parse(data);
        return TelemetrySchema.parse({
          ...parsed,
          aircraftId,
          timestamp: new Date().toISOString(),
        });
      }
      
      // TODO: Implement real Paparazzi protocol parser here
      return null;
    } catch {
      return null;
    }
  }

  private sendCommand(command: Command): void {
    logger.info('Command sent', { 
      commandType: command.commandType, 
      destination: command.destination 
    });

    // Send via MQTT if available
    if (this.mqttClient?.connected) {
      const topic = `paparazzi/commands/${command.destination}`;
      this.mqttClient.publish(topic, JSON.stringify(command));
    }

    // Send via serial if available
    const serialPort = this.serialPorts.get(command.destination);
    if (serialPort && serialPort.isOpen) {
      // Convert command to autopilot format
      const serialCommand = this.formatCommandForSerial(command);
      serialPort.write(serialCommand);
    }

    // Broadcast to WebSocket clients
    this.broadcastToWebSocket(`paparazzi/commands/${command.destination}`, command);
  }

  private formatCommandForSerial(command: Command): string {
    // This would format the command for the autopilot's expected protocol
    // For now, send as JSON with newline terminator
    return JSON.stringify(command) + '\n';
  }

  private broadcast(topic: string, message: any): void {
    // Send via MQTT
    if (this.mqttClient?.connected) {
      this.mqttClient.publish(topic, JSON.stringify(message));
    }

    // Send via WebSocket
    this.broadcastToWebSocket(topic, message);
  }

  private broadcastToWebSocket(topic: string, message: any): void {
    const payload = JSON.stringify({
      topic,
      message,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        // Check if client is subscribed to this topic
        if (!client.subscriptions || client.subscriptions.has(topic) || client.subscriptions.has('*')) {
          client.send(payload);
        }
      }
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, () => {
        logger.info(`Message broker started on port ${this.config.port}`);
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    // Close all serial ports
    this.serialPorts.forEach((port) => {
      if (port.isOpen) {
        port.close();
      }
    });

    // Close MQTT connection
    if (this.mqttClient) {
      this.mqttClient.end();
    }

    // Close WebSocket server
    this.wss.close();

    // Close HTTP server
    this.server.close();

    logger.info('Message broker stopped');
  }
}

// Main entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const broker = new MessageBroker({
    port: parseInt(process.env.BROKER_PORT || '8080'),
    mqttBrokerUrl: process.env.MQTT_URL,
    serialPorts: [
      // Example configuration - would be loaded from config file
      {
        path: process.env.SERIAL_PORT || '/dev/ttyUSB0',
        baudRate: 57600,
        aircraftId: 'aircraft_001',
      },
    ],
  });

  broker.start().catch((error) => {
    logger.error('Failed to start message broker', { error: error.message });
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down message broker...');
    await broker.stop();
    process.exit(0);
  });
}