import React, { useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';

interface MissionControlProps {
  aircraftId: string;
}

const MissionControl: React.FC<MissionControlProps> = ({ aircraftId }) => {
  const { sendCommand, connected } = useWebSocket();
  const [missionStatus, setMissionStatus] = useState<'planning' | 'ready' | 'active' | 'completed'>('planning');

  const handleCommand = (commandType: string, parameters: any = {}) => {
    if (!connected) {
      alert('Not connected to message broker');
      return;
    }

    const command = {
      timestamp: new Date().toISOString(),
      source: 'gcs',
      destination: aircraftId,
      commandType,
      parameters,
      priority: 'normal',
      requiresAck: true,
    };

    sendCommand(command);
  };

  const sampleMission = {
    id: 'mission_001',
    name: 'Valley Survey',
    waypoints: [
      { id: 0, name: 'TAKEOFF', lat: 59.2345, lng: 10.1234, alt: 0 },
      { id: 1, name: 'SURVEY_1', lat: 59.2400, lng: 10.1300, alt: 150 },
      { id: 2, name: 'SURVEY_2', lat: 59.2350, lng: 10.1200, alt: 150 },
      { id: 3, name: 'LANDING', lat: 59.2345, lng: 10.1234, alt: 0 },
    ],
  };

  return (
    <div className="mission-control">
      <div className="mission-header">
        <h2>🎯 Mission Control: {aircraftId}</h2>
        <div className="mission-status">
          Status: <span className={`status ${missionStatus}`}>{missionStatus.toUpperCase()}</span>
        </div>
      </div>

      <div className="mission-content">
        <div className="mission-plan">
          <h3>📋 Current Mission Plan</h3>
          <div className="mission-info">
            <p><strong>Mission:</strong> {sampleMission.name}</p>
            <p><strong>Waypoints:</strong> {sampleMission.waypoints.length}</p>
            <p><strong>Type:</strong> Atmospheric Survey</p>
          </div>

          <div className="waypoints-list">
            <h4>Waypoints:</h4>
            {sampleMission.waypoints.map((wp, index) => (
              <div key={wp.id} className="waypoint-item">
                <span className="waypoint-id">{wp.id}</span>
                <span className="waypoint-name">{wp.name}</span>
                <span className="waypoint-coords">
                  {wp.lat.toFixed(4)}°N, {wp.lng.toFixed(4)}°E @ {wp.alt}m
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mission-controls">
          <h3>🎮 Mission Controls</h3>
          
          <div className="control-section">
            <h4>Mission Management</h4>
            <div className="button-group">
              <button
                className="control-button primary"
                onClick={() => {
                  handleCommand('mission_start');
                  setMissionStatus('active');
                }}
                disabled={!connected || missionStatus === 'active'}
              >
                ▶️ Start Mission
              </button>
              
              <button
                className="control-button warning"
                onClick={() => {
                  handleCommand('mission_pause');
                  setMissionStatus('ready');
                }}
                disabled={!connected || missionStatus !== 'active'}
              >
                ⏸️ Pause Mission
              </button>
              
              <button
                className="control-button danger"
                onClick={() => {
                  if (window.confirm('Are you sure you want to abort the mission?')) {
                    handleCommand('mission_abort');
                    setMissionStatus('planning');
                  }
                }}
                disabled={!connected}
              >
                ⏹️ Abort Mission
              </button>
            </div>
          </div>

          <div className="control-section">
            <h4>Emergency Controls</h4>
            <div className="button-group">
              <button
                className="control-button emergency"
                onClick={() => {
                  if (window.confirm('Initiate Return to Home?')) {
                    handleCommand('return_to_home');
                  }
                }}
                disabled={!connected}
              >
                🏠 Return to Home
              </button>
              
              <button
                className="control-button emergency"
                onClick={() => {
                  if (window.confirm('Initiate Emergency Landing? This cannot be undone!')) {
                    handleCommand('emergency_land');
                  }
                }}
                disabled={!connected}
              >
                🚨 Emergency Land
              </button>
            </div>
          </div>

          <div className="control-section">
            <h4>Flight Parameters</h4>
            <div className="parameter-controls">
              <div className="parameter-item">
                <label>Cruise Altitude (m):</label>
                <input
                  type="number"
                  defaultValue={150}
                  min={50}
                  max={300}
                  onChange={(e) => {
                    handleCommand('parameter_set', {
                      parameter: 'cruise_altitude',
                      value: parseInt(e.target.value),
                    });
                  }}
                />
              </div>
              
              <div className="parameter-item">
                <label>Cruise Speed (m/s):</label>
                <input
                  type="number"
                  defaultValue={15}
                  min={12}
                  max={25}
                  step={0.5}
                  onChange={(e) => {
                    handleCommand('parameter_set', {
                      parameter: 'cruise_speed',
                      value: parseFloat(e.target.value),
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="control-section">
            <h4>Data Collection</h4>
            <div className="button-group">
              <button
                className="control-button secondary"
                onClick={() => handleCommand('start_logging')}
                disabled={!connected}
              >
                📊 Start Data Logging
              </button>
              
              <button
                className="control-button secondary"
                onClick={() => handleCommand('stop_logging')}
                disabled={!connected}
              >
                ⏹️ Stop Data Logging
              </button>
              
              <button
                className="control-button secondary"
                onClick={() => handleCommand('take_photo')}
                disabled={!connected}
              >
                📸 Take Photo
              </button>
            </div>
          </div>
        </div>
      </div>

      {!connected && (
        <div className="connection-warning">
          ⚠️ Not connected to message broker. Controls are disabled.
        </div>
      )}
    </div>
  );
};

export default MissionControl;