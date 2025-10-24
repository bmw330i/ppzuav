import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { DemoDataGenerator } from '../services/DemoDataGenerator';

interface Telemetry {
  timestamp: string;
  aircraftId: string;
  position: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  attitude: {
    roll: number;
    pitch: number;
    yaw: number;
    airspeed?: number;
  };
  speed: {
    airspeed: number;
    groundspeed: number;
    verticalSpeed: number;
  };
  systems: {
    battery: number;
    gpsSatellites: number;
    gpsAccuracy: number;
    datalinkRssi: number;
  };
  environmental?: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
  };
}

interface Alert {
  id: string;
  timestamp: string;
  aircraftId: string;
  level: 'info' | 'warning' | 'caution' | 'critical' | 'emergency';
  message: string;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connected: boolean; // Alias for compatibility
  lastMessage: any | null;
  telemetry: Map<string, Telemetry>;
  alerts: Alert[];
  sendMessage: (message: any) => void;
  sendCommand: (command: any) => void; // Alias for compatibility
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  connect: () => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<Map<string, Telemetry>>(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const brokerUrl = process.env.REACT_APP_BROKER_URL || 'ws://localhost:8080';
    console.log('Connecting to WebSocket:', brokerUrl);

    const newSocket = io(brokerUrl, {
      transports: ['websocket'],
      upgrade: false,
    });

    newSocket.on('connect', () => {
      console.log('Connected to message broker');
      setConnected(true);
      
      // Subscribe to telemetry and alerts
      newSocket.emit('message', {
        type: 'subscribe',
        topic: 'paparazzi/telemetry/+',
      });
      
      newSocket.emit('message', {
        type: 'subscribe',
        topic: 'paparazzi/alerts/+',
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from message broker');
      setConnected(false);
    });

    newSocket.on('message', (data) => {
      try {
        const { topic, message } = JSON.parse(data);
        
        if (topic.startsWith('paparazzi/telemetry/')) {
          const aircraftId = topic.split('/').pop();
          if (aircraftId) {
            setTelemetry(prev => {
              const updated = new Map(prev);
              updated.set(aircraftId, message);
              return updated;
            });
          }
        } else if (topic.startsWith('paparazzi/alerts/')) {
          setAlerts(prev => [message, ...prev.slice(0, 99)]); // Keep last 100 alerts
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const sendCommand = (command: any) => {
    if (socket && connected) {
      socket.emit('message', {
        type: 'command',
        data: command,
      });
    } else {
      console.warn('Cannot send command: not connected to broker');
    }
  };

  const subscribe = (topic: string) => {
    if (socket && connected) {
      socket.emit('message', {
        type: 'subscribe',
        topic,
      });
    }
  };

  const value: WebSocketContextType = {
    socket,
    isConnected: connected,
    connected: connected, // Alias for compatibility
    lastMessage: telemetry,
    telemetry: telemetry,
    alerts: [],
    enableDemoMode: () => {},
    disableDemoMode: () => {},
    sendMessage: sendCommand,
    sendCommand: sendCommand, // Alias for compatibility
    connect: () => {
      // Connect function implementation
      if (!socket?.connected) {
        socket?.connect();
      }
    },
    disconnect: () => {
      // Disconnect function implementation
      if (socket?.connected) {
        socket?.disconnect();
      }
    },
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};