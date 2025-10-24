import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';

interface TelemetryDisplayProps {
  aircraftId: string;
}

const TelemetryDisplay: React.FC<TelemetryDisplayProps> = ({ aircraftId }) => {
  const { telemetry, connected } = useWebSocket();
  const currentTelemetry = telemetry.get(aircraftId);

  if (!connected) {
    return (
      <div className="telemetry-display">
        <div className="status-message">
          <h2>⚠️ Not Connected</h2>
          <p>Connecting to message broker...</p>
        </div>
      </div>
    );
  }

  if (!currentTelemetry) {
    return (
      <div className="telemetry-display">
        <div className="status-message">
          <h2>📡 Waiting for Telemetry</h2>
          <p>No data received from {aircraftId}</p>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="telemetry-display">
      <div className="telemetry-header">
        <h2>📊 Aircraft Telemetry: {aircraftId}</h2>
        <span className="last-update">Last Update: {formatTime(currentTelemetry.timestamp)}</span>
      </div>

      <div className="telemetry-grid">
        {/* Position Information */}
        <div className="telemetry-section">
          <h3>🌍 Position</h3>
          <div className="telemetry-item">
            <label>Latitude:</label>
            <span>{currentTelemetry.position.latitude.toFixed(6)}°</span>
          </div>
          <div className="telemetry-item">
            <label>Longitude:</label>
            <span>{currentTelemetry.position.longitude.toFixed(6)}°</span>
          </div>
          <div className="telemetry-item">
            <label>Altitude:</label>
            <span>{currentTelemetry.position.altitude.toFixed(1)}m AGL</span>
          </div>
        </div>

        {/* Attitude Information */}
        <div className="telemetry-section">
          <h3>✈️ Attitude</h3>
          <div className="telemetry-item">
            <label>Roll:</label>
            <span>{currentTelemetry.attitude.roll.toFixed(1)}°</span>
          </div>
          <div className="telemetry-item">
            <label>Pitch:</label>
            <span>{currentTelemetry.attitude.pitch.toFixed(1)}°</span>
          </div>
          <div className="telemetry-item">
            <label>Yaw:</label>
            <span>{currentTelemetry.attitude.yaw.toFixed(1)}°</span>
          </div>
        </div>

        {/* Speed Information */}
        <div className="telemetry-section">
          <h3>💨 Speed</h3>
          <div className="telemetry-item">
            <label>Airspeed:</label>
            <span>{currentTelemetry.speed.airspeed.toFixed(1)} m/s</span>
          </div>
          <div className="telemetry-item">
            <label>Ground Speed:</label>
            <span>{currentTelemetry.speed.groundspeed.toFixed(1)} m/s</span>
          </div>
          <div className="telemetry-item">
            <label>Vertical Speed:</label>
            <span>{currentTelemetry.speed.verticalSpeed.toFixed(1)} m/s</span>
          </div>
        </div>

        {/* System Health */}
        <div className="telemetry-section">
          <h3>🔋 Systems</h3>
          <div className="telemetry-item">
            <label>Battery:</label>
            <span className={`battery-level ${currentTelemetry.systems.battery < 30 ? 'low' : 'good'}`}>
              {currentTelemetry.systems.battery.toFixed(0)}%
            </span>
          </div>
          <div className="telemetry-item">
            <label>GPS Satellites:</label>
            <span className={currentTelemetry.systems.gpsSatellites >= 8 ? 'good' : 'warning'}>
              {currentTelemetry.systems.gpsSatellites}
            </span>
          </div>
          <div className="telemetry-item">
            <label>GPS Accuracy:</label>
            <span>{currentTelemetry.systems.gpsAccuracy.toFixed(1)}m</span>
          </div>
          <div className="telemetry-item">
            <label>Datalink RSSI:</label>
            <span>{currentTelemetry.systems.datalinkRssi}dBm</span>
          </div>
        </div>

        {/* Environmental Data (if available) */}
        {currentTelemetry.environmental && (
          <div className="telemetry-section">
            <h3>🌡️ Environment</h3>
            <div className="telemetry-item">
              <label>Temperature:</label>
              <span>{currentTelemetry.environmental.temperature.toFixed(1)}°C</span>
            </div>
            <div className="telemetry-item">
              <label>Humidity:</label>
              <span>{currentTelemetry.environmental.humidity.toFixed(1)}%</span>
            </div>
            <div className="telemetry-item">
              <label>Pressure:</label>
              <span>{currentTelemetry.environmental.pressure.toFixed(1)} hPa</span>
            </div>
            <div className="telemetry-item">
              <label>Wind Speed:</label>
              <span>{currentTelemetry.environmental.windSpeed.toFixed(1)} m/s</span>
            </div>
            <div className="telemetry-item">
              <label>Wind Direction:</label>
              <span>{currentTelemetry.environmental.windDirection.toFixed(0)}°</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelemetryDisplay;