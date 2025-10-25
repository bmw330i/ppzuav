import React, { useEffect, useState } from 'react';
import { ADSBService } from '../services/ADSBService';

const ADSBStatus: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing...');
  const [aircraftCount, setAircraftCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const adsbService = ADSBService.getInstance();
    
    const unsubscribe = adsbService.onAircraftUpdate((aircraftList) => {
      setAircraftCount(aircraftList.length);
      setLastUpdate(new Date());
      setConnectionStatus(adsbService.isConnected() ? 'Connected' : 'Disconnected');
    });

    // Initial status check
    setConnectionStatus(adsbService.isConnected() ? 'Connected' : 'Disconnected');
    setAircraftCount(adsbService.getAircraft().length);

    return unsubscribe;
  }, []);

  const startDemo = () => {
    ADSBService.getInstance().startDemoMode();
    console.log('🎮 Demo mode activated from status panel');
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '1rem',
      borderRadius: '8px',
      fontSize: '0.9rem',
      minWidth: '200px',
      zIndex: 1000,
      fontFamily: 'monospace'
    }}>
      <h4 style={{ margin: '0 0 0.5rem 0', color: '#60a5fa' }}>ADS-B Status</h4>
      <div>
        <strong>Connection:</strong> 
        <span style={{ 
          color: connectionStatus === 'Connected' ? '#10b981' : '#ef4444',
          marginLeft: '0.5rem'
        }}>
          {connectionStatus}
        </span>
      </div>
      <div><strong>Aircraft:</strong> {aircraftCount}</div>
      <div>
        <strong>Last Update:</strong> 
        {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
      </div>
      
      <button 
        onClick={startDemo}
        style={{
          marginTop: '0.5rem',
          padding: '0.25rem 0.5rem',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.8rem'
        }}
      >
        🎮 Start Demo
      </button>
      
      <div style={{ 
        fontSize: '0.7rem', 
        marginTop: '0.5rem', 
        color: '#9ca3af',
        borderTop: '1px solid #374151',
        paddingTop: '0.5rem'
      }}>
        Open browser console (F12) to see detailed ADS-B connection logs
      </div>
    </div>
  );
};

export default ADSBStatus;