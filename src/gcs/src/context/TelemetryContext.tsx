import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWebSocket } from './WebSocketContext';
import { TelemetrySchema } from '../types/core';
import type { Telemetry } from '../types/core';

interface TelemetryContextType {
  currentTelemetry: Telemetry | null;
  telemetryHistory: Telemetry[];
  lastUpdate: Date | null;
  isConnected: boolean;
}

const TelemetryContext = createContext<TelemetryContextType | null>(null);

interface TelemetryProviderProps {
  children: ReactNode;
  aircraftId: string;
}

export const TelemetryProvider: React.FC<TelemetryProviderProps> = ({ children, aircraftId }) => {
  const { lastMessage, isConnected } = useWebSocket();
  const [currentTelemetry, setCurrentTelemetry] = useState<Telemetry | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<Telemetry[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'telemetry') {
      try {
        // Validate the telemetry data
        const telemetryData = TelemetrySchema.parse(lastMessage.data);
        
        // Only process if it's for our aircraft
        if (telemetryData.aircraftId === aircraftId) {
          setCurrentTelemetry(telemetryData);
          setLastUpdate(new Date());
          
          // Add to history (keep last 100 entries)
          setTelemetryHistory(prev => {
            const newHistory = [...prev, telemetryData];
            return newHistory.slice(-100);
          });
        }
      } catch (error) {
        console.error('Invalid telemetry data received:', error);
      }
    }
  }, [lastMessage, aircraftId]);

  const value: TelemetryContextType = {
    currentTelemetry,
    telemetryHistory,
    lastUpdate,
    isConnected,
  };

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = (): TelemetryContextType => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};

export default TelemetryContext;