import React, { useEffect, useState } from 'react';
import { ADSBService, type ADSBAircraft, type CollisionWarning } from '../services/ADSBService';
import './ADSBDisplay.css';

interface ADSBDisplayProps {
  ownPosition?: { latitude: number; longitude: number; altitude: number };
  onAircraftSelect?: (aircraft: ADSBAircraft) => void;
  showOnMap?: boolean;
}

const ADSBDisplay: React.FC<ADSBDisplayProps> = ({ 
  ownPosition, 
  onAircraftSelect,
  showOnMap = true 
}) => {
  const [aircraft, setAircraft] = useState<ADSBAircraft[]>([]);
  const [warnings, setWarnings] = useState<CollisionWarning[]>([]);
  const [connected, setConnected] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const adsbService = ADSBService.getInstance();
    
    // Subscribe to aircraft updates
    const unsubscribeAircraft = adsbService.onAircraftUpdate((aircraftList) => {
      setAircraft(aircraftList);
      setConnected(adsbService.isConnected());
    });

    // Subscribe to collision warnings
    const unsubscribeWarnings = adsbService.onCollisionWarning((warningList) => {
      setWarnings(warningList);
    });

    // Update own position for collision detection
    if (ownPosition) {
      adsbService.updateOwnPosition(ownPosition, ownPosition.altitude);
    }

    return () => {
      unsubscribeAircraft();
      unsubscribeWarnings();
    };
  }, [ownPosition]);

  const handleAircraftClick = (aircraftData: ADSBAircraft) => {
    setSelectedAircraft(aircraftData.icao);
    onAircraftSelect?.(aircraftData);
  };

  const handleDemoToggle = () => {
    if (!demoMode) {
      ADSBService.getInstance().startDemoMode();
    }
    setDemoMode(!demoMode);
  };

  const getAgeColor = (lastSeen: number): string => {
    const age = (Date.now() - lastSeen) / 1000; // Age in seconds
    if (age < 5) return '#4ade80';    // Green - fresh
    if (age < 15) return '#fbbf24';   // Yellow - aging
    if (age < 30) return '#f97316';   // Orange - old
    return '#ef4444';                 // Red - very old
  };

  const getSeverityColor = (severity: CollisionWarning['severity']): string => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const formatAltitude = (altitude: number): string => {
    if (altitude > 1000) {
      return `FL${Math.round(altitude / 30.48 / 100)}`; // Flight Level
    } else {
      return `${Math.round(altitude)}m`;
    }
  };

  return (
    <div className="adsb-display">
      <div className="adsb-header">
        <h3>
          📡 ADS-B Traffic
          <span className={`connection-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? ' ●' : ' ○'}
          </span>
        </h3>
        
        <div className="adsb-controls">
          <button 
            onClick={handleDemoToggle}
            className={`demo-button ${demoMode ? 'active' : ''}`}
            title="Toggle demo mode with simulated traffic"
          >
            {demoMode ? '🎮 Demo' : '📡 Live'}
          </button>
          
          <span className="aircraft-count">
            {aircraft.length} aircraft
          </span>
        </div>
      </div>

      {/* Collision Warnings */}
      {warnings.length > 0 && (
        <div className="collision-warnings">
          <h4 style={{ color: '#dc2626', margin: '0 0 0.5rem 0' }}>
            ⚠️ Traffic Alerts ({warnings.length})
          </h4>
          {warnings.slice(0, 3).map((warning, index) => (
            <div 
              key={warning.targetIcao}
              className="warning-item"
              style={{ 
                backgroundColor: getSeverityColor(warning.severity) + '20',
                border: `1px solid ${getSeverityColor(warning.severity)}`,
                borderRadius: '4px',
                padding: '0.5rem',
                marginBottom: '0.25rem',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ fontWeight: 'bold', color: getSeverityColor(warning.severity) }}>
                {warning.severity.toUpperCase()}: {warning.targetCallsign}
              </div>
              <div>
                Distance: {formatDistance(warning.distance)} | 
                Bearing: {Math.round(warning.bearing)}° | 
                ETA: {Math.round(warning.timeToClosestApproach)}s
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aircraft List */}
      <div className="aircraft-list">
        {aircraft.length === 0 ? (
          <div className="no-aircraft" style={{ 
            textAlign: 'center', 
            color: 'var(--text-muted)', 
            padding: '2rem',
            fontStyle: 'italic'
          }}>
            {connected ? 'No aircraft detected' : 'Connecting to ADS-B receiver...'}
          </div>
        ) : (
          aircraft
            .sort((a, b) => {
              // Sort by distance if we have own position, otherwise by callsign
              if (ownPosition) {
                const distA = Math.sqrt(
                  Math.pow(a.position.latitude - ownPosition.latitude, 2) +
                  Math.pow(a.position.longitude - ownPosition.longitude, 2)
                );
                const distB = Math.sqrt(
                  Math.pow(b.position.latitude - ownPosition.latitude, 2) +
                  Math.pow(b.position.longitude - ownPosition.longitude, 2)
                );
                return distA - distB;
              }
              return a.callsign.localeCompare(b.callsign);
            })
            .map((aircraftData) => (
              <div
                key={aircraftData.icao}
                className={`aircraft-item ${selectedAircraft === aircraftData.icao ? 'selected' : ''}`}
                onClick={() => handleAircraftClick(aircraftData)}
                style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  backgroundColor: selectedAircraft === aircraftData.icao ? 'var(--bg-secondary)' : 'transparent'
                }}
              >
                <div className="aircraft-header">
                  <div className="aircraft-callsign" style={{ fontWeight: 'bold' }}>
                    {aircraftData.callsign || 'Unknown'}
                    {aircraftData.emergency && <span style={{ color: '#dc2626' }}> 🚨</span>}
                  </div>
                  
                  <div className="aircraft-status">
                    <span 
                      className="age-indicator"
                      style={{ 
                        color: getAgeColor(aircraftData.lastSeen),
                        fontSize: '0.8rem'
                      }}
                    >
                      ●
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {aircraftData.icao}
                    </span>
                  </div>
                </div>

                <div className="aircraft-details" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.25rem'
                }}>
                  <div>Alt: {formatAltitude(aircraftData.altitude)}</div>
                  <div>Speed: {Math.round(aircraftData.velocity.speed * 1.944)} kt</div>
                  <div>Track: {Math.round(aircraftData.velocity.track)}°</div>
                  <div>Squawk: {aircraftData.squawk || 'N/A'}</div>
                </div>

                {ownPosition && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--text-muted)',
                    marginTop: '0.25rem'
                  }}>
                    Distance: {formatDistance(
                      Math.sqrt(
                        Math.pow((aircraftData.position.latitude - ownPosition.latitude) * 111320, 2) +
                        Math.pow((aircraftData.position.longitude - ownPosition.longitude) * 111320, 2)
                      )
                    )}
                  </div>
                )}

                {aircraftData.onGround && (
                  <div style={{ 
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontStyle: 'italic',
                    marginTop: '0.25rem'
                  }}>
                    On Ground
                  </div>
                )}
              </div>
            ))
        )}
      </div>

      <div className="adsb-footer" style={{ 
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        padding: '0.5rem',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        {connected ? (
          <span>🟢 Real-time ADS-B data</span>
        ) : (
          <span>🔴 No ADS-B receiver connection</span>
        )}
        {demoMode && <span> | 🎮 Demo Mode Active</span>}
      </div>
    </div>
  );
};

export default ADSBDisplay;