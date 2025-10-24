import React, { useRef, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';

interface MapViewProps {
  aircraftId: string;
}

const MapView: React.FC<MapViewProps> = ({ aircraftId }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const aircraftMarker = useRef<any>(null);
  const { telemetry, connected } = useWebSocket();
  const currentTelemetry = telemetry.get(aircraftId);

  useEffect(() => {
    // For now, create a simple mock map
    // In production, you would integrate with Mapbox GL JS or similar
    if (mapContainer.current && !map.current) {
      // This is a placeholder - real implementation would use Mapbox/Leaflet
      const mapDiv = mapContainer.current;
      mapDiv.innerHTML = `
        <div style="
          width: 100%;
          height: 100%;
          background: #2c3e50;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          text-align: center;
        ">
          <div>
            <h3>🗺️ Map View</h3>
            <p>Mapbox integration will be added here</p>
            ${currentTelemetry ? `
              <div style="margin-top: 20px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <h4>Current Position</h4>
                <p>📍 ${currentTelemetry.position.latitude.toFixed(6)}°N, ${currentTelemetry.position.longitude.toFixed(6)}°E</p>
                <p>📏 ${currentTelemetry.position.altitude}m AGL</p>
                <p>🧭 Heading: ${currentTelemetry.attitude.yaw.toFixed(0)}°</p>
              </div>
            ` : `
              <p>Waiting for telemetry data...</p>
            `}
          </div>
        </div>
      `;
    }
  }, [currentTelemetry]);

  if (!connected) {
    return (
      <div className="map-view">
        <div className="status-message">
          <h2>⚠️ Not Connected</h2>
          <p>Cannot display map without connection to message broker</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-view">
      <div className="map-header">
        <h2>🗺️ Map View: {aircraftId}</h2>
        <div className="map-controls">
          <button className="map-button">Center on Aircraft</button>
          <button className="map-button">Show Flight Plan</button>
          <button className="map-button">Toggle Layers</button>
        </div>
      </div>
      
      <div className="map-container" ref={mapContainer} style={{
        width: '100%',
        height: 'calc(100% - 60px)',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }} />
      
      {currentTelemetry && (
        <div className="map-overlay">
          <div className="position-info">
            <span>📍 {currentTelemetry.position.latitude.toFixed(6)}°N, {currentTelemetry.position.longitude.toFixed(6)}°E</span>
            <span>📏 {currentTelemetry.position.altitude}m AGL</span>
            <span>💨 {currentTelemetry.speed.groundspeed.toFixed(1)} m/s</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;