import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useWebSocket } from '../context/WebSocketContext';
import { GeolocationService, type GeolocationResult } from '../services/GeolocationService';
import { ADSBService, type ADSBAircraft } from '../services/ADSBService';
import { DemoDataGenerator } from '../services/DemoDataGenerator';
import type { Position } from '../types/core';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom aircraft icon
const aircraftIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L13.09 8.26L20 9L14.74 12L16 18.74L12 16L8 18.74L9.26 12L4 9L10.91 8.26L12 2Z" fill="#ff6b35" stroke="#000" stroke-width="1"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// Custom ground station icon
const groundStationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" fill="#4ade80" stroke="#000" stroke-width="1"/>
    </svg>
  `),
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

// ADS-B aircraft icon
const adsbAircraftIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="#3b82f6" stroke="#fff" stroke-width="1"/>
    </svg>
  `),
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -9],
});

// Emergency aircraft icon
const emergencyAircraftIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="#dc2626" stroke="#fff" stroke-width="1"/>
    </svg>
  `),
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

interface MapViewProps {
  aircraftId: string;
}

// Component to update map center when geolocation changes
const MapCenterUpdater: React.FC<{ position: Position; zoom: number }> = ({ position, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView([position.latitude, position.longitude], zoom);
  }, [map, position.latitude, position.longitude, zoom]);
  
  return null;
};

const MapView: React.FC<MapViewProps> = ({ aircraftId }) => {
  const { telemetry, connected } = useWebSocket();
  const currentTelemetry = telemetry.get(aircraftId);
  
  const [mapCenter, setMapCenter] = useState<Position>({
    latitude: 48.8566, // Default to Paris
    longitude: 2.3522,
    altitude: 0
  });
  const [mapZoom, setMapZoom] = useState(10);
  const [groundStationLocation, setGroundStationLocation] = useState<GeolocationResult | null>(null);
  const [flightPath, setFlightPath] = useState<Position[]>([]);
  const [showDemo, setShowDemo] = useState(false);
  const [demoTelemetry, setDemoTelemetry] = useState<any>(null);
  const [demoDataGenerator] = useState(() => new DemoDataGenerator());
  const [adsbAircraft, setAdsbAircraft] = useState<ADSBAircraft[]>([]);
  const [showAdsb, setShowAdsb] = useState(true);

  // Initialize geolocation
  useEffect(() => {
    const geoService = GeolocationService.getInstance();
    
    const unsubscribe = geoService.onLocationUpdate((location) => {
      setGroundStationLocation(location);
      
      // If no aircraft telemetry yet, center map on ground station
      if (!currentTelemetry && !showDemo) {
        setMapCenter(location.position);
        setMapZoom(geoService.getRecommendedZoom());
      }
      
      console.log('Ground station location updated:', location);
    });

    return unsubscribe;
  }, [currentTelemetry, showDemo]);

  // Initialize ADS-B service
  useEffect(() => {
    const adsbService = ADSBService.getInstance();
    
    const unsubscribeAdsb = adsbService.onAircraftUpdate((aircraftList) => {
      setAdsbAircraft(aircraftList);
    });

    // Update our position for ADS-B collision detection
    const activeTelemetry = showDemo ? demoTelemetry : currentTelemetry;
    if (activeTelemetry?.position) {
      adsbService.updateOwnPosition(activeTelemetry.position, activeTelemetry.position.altitude);
    }

    return unsubscribeAdsb;
  }, [currentTelemetry, demoTelemetry, showDemo]);

  // Demo mode management
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (showDemo) {
      // Generate initial demo data
      setDemoTelemetry(demoDataGenerator.generateTelemetry());
      
      // Update demo data every 500ms
      interval = setInterval(() => {
        const newDemoTelemetry = demoDataGenerator.generateTelemetry();
        console.log('Generated demo telemetry:', newDemoTelemetry);
        setDemoTelemetry(newDemoTelemetry);
      }, 500);
    } else {
      setDemoTelemetry(null);
      setFlightPath([]); // Clear flight path when switching modes
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showDemo, demoDataGenerator]);

  // Update flight path when telemetry changes
  useEffect(() => {
    const activeTelemetry = showDemo ? demoTelemetry : currentTelemetry;
    
    if (activeTelemetry?.position) {
      setFlightPath(prev => {
        const newPath = [...prev, activeTelemetry.position];
        // Keep only last 100 points to prevent memory issues
        return newPath.slice(-100);
      });
      
      // Center map on aircraft if telemetry is available
      setMapCenter(activeTelemetry.position);
      setMapZoom(15); // Closer zoom for aircraft tracking
    }
  }, [currentTelemetry, demoTelemetry, showDemo]);

  // Demo mode handler
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (showDemo) {
      interval = setInterval(() => {
        const telemetryData = demoDataGenerator.generateTelemetry();
        setDemoTelemetry(telemetryData);
      }, 100); // Update every 100ms for smooth animation
    } else {
      setDemoTelemetry(null);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showDemo, demoDataGenerator]);

  // Generate flight path line
  const flightPathCoords: [number, number][] = flightPath.map(pos => [pos.latitude, pos.longitude]);
  
  // Get active telemetry data (demo or real)
  const activeTelemetry = showDemo ? demoTelemetry : currentTelemetry;

  return (
    <div className="component-panel" style={{ height: '100%' }}>
      <h2>🗺️ Map View {showDemo && '(Demo Mode)'}</h2>
      
            <div className="map-controls" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div className="connection-status">
          <span className={`status-indicator ${connected ? 'online' : 'offline'}`}></span>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
        
        <button 
          onClick={() => {
            console.log('Demo mode toggle clicked. Current state:', showDemo);
            setShowDemo(!showDemo);
          }}
          style={{ 
            padding: '0.25rem 0.5rem', 
            fontSize: '0.8rem',
            backgroundColor: showDemo ? 'var(--accent-color)' : 'var(--bg-secondary)',
            color: showDemo ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showDemo ? '🎮 Demo Mode' : '📡 Live Data'}
        </button>
        
        <button 
          onClick={() => setShowAdsb(!showAdsb)}
          style={{ 
            padding: '0.25rem 0.5rem', 
            fontSize: '0.8rem',
            backgroundColor: showAdsb ? 'var(--accent-color)' : 'var(--bg-secondary)',
            color: showAdsb ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showAdsb ? '📡 ADS-B ON' : '📡 ADS-B OFF'}
        </button>
        
        {groundStationLocation && (
          <div className="ground-station-info" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            📍 GCS: {groundStationLocation.city}, {groundStationLocation.country}
            {groundStationLocation.source === 'ip' && ' (IP)'}
            {groundStationLocation.source === 'gps' && ' (GPS)'}
          </div>
        )}
        
        {activeTelemetry && (
          <div className="aircraft-info" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            ✈️ Alt: {activeTelemetry.position.altitude.toFixed(1)}m | 
            Speed: {activeTelemetry.speed.groundspeed.toFixed(1)}m/s
          </div>
        )}
      </div>

      <div style={{ height: 'calc(100% - 120px)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <MapContainer
          center={[mapCenter.latitude, mapCenter.longitude]}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <MapCenterUpdater position={mapCenter} zoom={mapZoom} />
          
          {/* OpenStreetMap tiles - free and no API key required */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          
          {/* Satellite imagery option (comment out the above and uncomment this for satellite view) */}
          {/*
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={17}
          />
          */}
          
          {/* Ground station marker */}
          {groundStationLocation && (
            <Marker 
              position={[groundStationLocation.position.latitude, groundStationLocation.position.longitude]}
              icon={groundStationIcon}
            >
              <Popup>
                <div>
                  <strong>Ground Control Station</strong><br/>
                  Location: {groundStationLocation.city}, {groundStationLocation.country}<br/>
                  Source: {groundStationLocation.source.toUpperCase()}<br/>
                  Accuracy: ±{(groundStationLocation.accuracy || 0) / 1000}km
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Aircraft marker */}
          {activeTelemetry && (
            <Marker 
              position={[activeTelemetry.position.latitude, activeTelemetry.position.longitude]}
              icon={aircraftIcon}
            >
              <Popup>
                <div>
                  <strong>{aircraftId}</strong><br/>
                  Altitude: {activeTelemetry.position.altitude.toFixed(1)}m<br/>
                  Speed: {activeTelemetry.speed.groundspeed.toFixed(1)}m/s<br/>
                  Heading: {activeTelemetry.attitude.yaw.toFixed(1)}°<br/>
                  Battery: {activeTelemetry.systems.battery}%<br/>
                  GPS: {activeTelemetry.systems.gpsSatellites} sats
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* ADS-B Aircraft markers */}
          {showAdsb && adsbAircraft.map((aircraft) => (
            <Marker 
              key={aircraft.icao}
              position={[aircraft.position.latitude, aircraft.position.longitude]}
              icon={aircraft.emergency ? emergencyAircraftIcon : adsbAircraftIcon}
            >
              <Popup>
                <div>
                  <strong>ADS-B: {aircraft.callsign}</strong><br/>
                  ICAO: {aircraft.icao}<br/>
                  Altitude: {Math.round(aircraft.altitude)}m<br/>
                  Speed: {Math.round(aircraft.velocity.speed * 1.944)} knots<br/>
                  Track: {Math.round(aircraft.velocity.track)}°<br/>
                  Squawk: {aircraft.squawk || 'N/A'}<br/>
                  Category: {aircraft.category}<br/>
                  {aircraft.emergency && <span style={{ color: '#dc2626', fontWeight: 'bold' }}>🚨 EMERGENCY</span>}
                  {aircraft.onGround && <span style={{ color: '#6b7280' }}>On Ground</span>}
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Flight path */}
          {flightPathCoords.length > 1 && (
            <Polyline 
              positions={flightPathCoords}
              color="#ff6b35"
              weight={3}
              opacity={0.7}
            />
          )}
        </MapContainer>
      </div>
      
      {/* Map legend */}
      <div className="map-legend" style={{ 
        marginTop: '0.5rem', 
        fontSize: '0.8rem', 
        color: 'var(--text-muted)',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <span>🟢 Ground Station</span>
        <span>🔶 Our Aircraft</span>
        <span>🔵 ADS-B Traffic</span>
        <span>🔴 Emergency</span>
        <span style={{ color: '#ff6b35' }}>── Flight Path</span>
        {showAdsb && <span>({adsbAircraft.length} aircraft)</span>}
      </div>
    </div>
  );
};

export default MapView;