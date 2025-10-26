import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { GeocodingService } from '../services/GeocodingService';
import { GeolocationService } from '../services/GeolocationService';
import WaypointEditor from './WaypointEditor';
import DraggableWaypoint from './DraggableWaypoint';
import type { 
  FlightPlan, 
  Waypoint, 
  Position, 
  MissionPlannerState,
  GeocodeResult 
} from '../types/mission';

// Custom icons for mission planning
const homeIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L22 12H17V20H7V12H2L12 2Z" fill="#00ff00" stroke="#000" stroke-width="1"/>
      <circle cx="12" cy="12" r="2" fill="#000"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const waypointIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#ff6b35" stroke="#000" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="#fff"/>
    </svg>
  `),
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const selectedWaypointIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#ffff00" stroke="#000" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="#000"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

interface MissionPlannerProps {
  className?: string;
}

const MissionPlanner: React.FC<MissionPlannerProps> = ({ className }) => {
  const [state, setState] = useState<MissionPlannerState>({
    currentPlan: null,
    homeLocation: { latitude: 48.8566, longitude: 2.3522, altitude: 0 },
    homeLocationSource: 'ip',
    selectedWaypoint: null,
    selectedBlock: null,
    editMode: 'view',
    mapZoom: 15,
    mapCenter: { latitude: 48.8566, longitude: 2.3522, altitude: 0 }
  });

  const [homeLocationInput, setHomeLocationInput] = useState('');
  const [isGeocodingHome, setIsGeocodingHome] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');

  const geocodingService = GeocodingService.getInstance();
  const geolocationService = GeolocationService.getInstance();

  // Initialize home location from IP geolocation
  useEffect(() => {
    const unsubscribe = geolocationService.onLocationUpdate((location) => {
      setState(prev => {
        const newState = {
          ...prev,
          homeLocation: location.position,
          homeLocationSource: location.source as any,
          mapCenter: location.position
        };
        
        // Initialize default flight plan with actual home coordinates
        if (!prev.currentPlan) {
          const newPlan: FlightPlan = {
            id: `mission_${Date.now()}`,
            name: 'New Mission',
            home: location.position,
            max_dist_from_home: 1000,
            ground_alt: 0,
            security_height: 25,
            alt: 100,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            waypoints: [
              {
                id: 'home',
                name: 'HOME',
                position: location.position,
                x: 0,
                y: 0,
                color: '#00ff00'
              },
              {
                id: 'stdby',
                name: 'STDBY',
                position: {
                  latitude: location.position.latitude + 0.0007,
                  longitude: location.position.longitude,
                  altitude: location.position.altitude + 100
                },
                x: 0,
                y: 75,
                color: '#ffff00'
              }
            ],
            blocks: [
              {
                id: 'standby',
                name: 'Standby',
                actions: [
                  {
                    type: 'circle',
                    wp: 'stdby',
                    radius: 75,
                    vmode: 'alt'
                  }
                ]
              }
            ]
          };
          
          newState.currentPlan = newPlan;
        }
        
        return newState;
      });
    });

    return unsubscribe;
  }, [geolocationService]);

  // Handle home location input (zipcode, address, or coordinates)
  const handleHomeLocationSubmit = async () => {
    if (!homeLocationInput.trim()) return;

    setIsGeocodingHome(true);
    setGeocodingError('');

    try {
      let result: GeocodeResult;

      if (homeLocationInput.match(/^-?\d+\.?\d*[,\s]+-?\d+\.?\d*$/)) {
        result = geocodingService.parseCoordinates(homeLocationInput);
      } else if (homeLocationInput.match(/^\d{5}(-\d{4})?$/)) {
        result = await geocodingService.geocodeZipcode(homeLocationInput, 'US');
      } else {
        result = await geocodingService.geocodeAddress(homeLocationInput);
      }

      if (result.success && result.position) {
        setState(prev => ({
          ...prev,
          homeLocation: result.position!,
          homeLocationSource: 'manual',
          mapCenter: result.position!
        }));

        if (state.currentPlan) {
          const updatedPlan = {
            ...state.currentPlan,
            home: result.position!,
            updatedAt: new Date().toISOString()
          };
          setState(prev => ({ ...prev, currentPlan: updatedPlan }));
        }

        setHomeLocationInput('');
      } else {
        setGeocodingError(result.error || 'Failed to geocode location');
      }
    } catch (error) {
      setGeocodingError(error instanceof Error ? error.message : 'Geocoding failed');
    } finally {
      setIsGeocodingHome(false);
    }
  };

  // Update a waypoint
  const updateWaypoint = useCallback((updatedWaypoint: Waypoint) => {
    if (!state.currentPlan) return;

    const updatedPlan = {
      ...state.currentPlan,
      waypoints: state.currentPlan.waypoints.map(wp => 
        wp.id === updatedWaypoint.id ? updatedWaypoint : wp
      ),
      updatedAt: new Date().toISOString()
    };

    setState(prev => ({ ...prev, currentPlan: updatedPlan }));
  }, [state.currentPlan]);

  // Delete a waypoint
  const deleteWaypoint = useCallback((waypointId: string) => {
    if (!state.currentPlan) return;

    const updatedPlan = {
      ...state.currentPlan,
      waypoints: state.currentPlan.waypoints.filter(wp => wp.id !== waypointId),
      updatedAt: new Date().toISOString()
    };

    setState(prev => ({ 
      ...prev, 
      currentPlan: updatedPlan,
      selectedWaypoint: null 
    }));
  }, [state.currentPlan]);

  // Handle waypoint drag end
  const handleWaypointDrag = useCallback((waypointId: string, newPosition: Position) => {
    if (!state.currentPlan) return;

    const updatedWaypoints = state.currentPlan.waypoints.map(wp =>
      wp.id === waypointId ? { ...wp, position: newPosition } : wp
    );

    const updatedPlan = {
      ...state.currentPlan,
      waypoints: updatedWaypoints,
      updatedAt: new Date().toISOString()
    };

    // If home waypoint is moved, update mission home coordinates
    if (waypointId === 'home') {
      const updatedPlanWithHome = {
        ...updatedPlan,
        home: newPosition
      };
      
      setState(prev => ({
        ...prev,
        currentPlan: updatedPlanWithHome,
        homeLocation: newPosition,
        mapCenter: newPosition
      }));
    } else {
      setState(prev => ({ ...prev, currentPlan: updatedPlan }));
    }
  }, [state.currentPlan]);

  // Component to handle map events
  const MapEventHandler: React.FC = () => {
    const map = useMap();

    useEffect(() => {
      const mapClickHandler = (e: L.LeafletMouseEvent) => {
        if (state.editMode !== 'waypoints' || !state.currentPlan) return;

        const newWaypoint: Waypoint = {
          id: `wp_${Date.now()}`,
          name: `WP${state.currentPlan.waypoints.length}`,
          position: {
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
            altitude: state.currentPlan.alt
          },
          color: '#ff6b35'
        };

        const updatedPlan = {
          ...state.currentPlan,
          waypoints: [...state.currentPlan.waypoints, newWaypoint],
          updatedAt: new Date().toISOString()
        };

        setState(prev => ({
          ...prev,
          currentPlan: updatedPlan,
          selectedWaypoint: newWaypoint.id
        }));
      };

      map.on('click', mapClickHandler);
      return () => {
        map.off('click', mapClickHandler);
      };
    });

    useEffect(() => {
      map.setView([state.mapCenter.latitude, state.mapCenter.longitude], state.mapZoom);
    }, [map]);

    return null;
  };

  // Generate waypoint path for visualization
  const waypointPath = state.currentPlan?.waypoints
    .filter(wp => wp.id !== 'home')
    .map(wp => [wp.position.latitude, wp.position.longitude] as [number, number]) || [];

  return (
    <div className={`mission-planner ${className || ''}`}>
      {/* Header and Controls */}
      <div className="mission-planner-header" style={{ 
        padding: '1rem', 
        backgroundColor: 'var(--bg-secondary)', 
        borderBottom: '1px solid var(--border-color)' 
      }}>
        <h2>🎯 Mission Planner</h2>
        
        {/* Home Location Setting */}
        <div className="home-location-controls" style={{ 
          marginTop: '1rem', 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div className="home-location-info">
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              🏠 Home: {state.homeLocation.latitude.toFixed(6)}, {state.homeLocation.longitude.toFixed(6)}
              <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }}>
                ({state.homeLocationSource.toUpperCase()})
              </span>
            </span>
          </div>
          
          <div className="home-location-input" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Enter zipcode, address, or coordinates (lat, lon)"
              value={homeLocationInput}
              onChange={(e) => setHomeLocationInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleHomeLocationSubmit()}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                width: '300px',
                fontSize: '0.9rem'
              }}
              disabled={isGeocodingHome}
            />
            <button
              onClick={handleHomeLocationSubmit}
              disabled={isGeocodingHome || !homeLocationInput.trim()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--accent-color)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {isGeocodingHome ? '📍...' : '📍 Set Home'}
            </button>
          </div>
          
          {geocodingError && (
            <span style={{ color: 'var(--error-color)', fontSize: '0.8rem' }}>
              ⚠️ {geocodingError}
            </span>
          )}
        </div>

        {/* Edit Mode Controls */}
        <div className="edit-mode-controls" style={{ 
          marginTop: '1rem', 
          display: 'flex', 
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.9rem', marginRight: '0.5rem' }}>Mode:</span>
          {(['view', 'waypoints', 'blocks', 'sectors'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setState(prev => ({ ...prev, editMode: mode }))}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.8rem',
                backgroundColor: state.editMode === mode ? 'var(--accent-color)' : 'var(--bg-secondary)',
                color: state.editMode === mode ? 'white' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
          
          {state.editMode === 'waypoints' && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>
              💡 Click on map to add waypoints | Drag waypoints to move
            </span>
          )}
        </div>

        {/* Mission Info */}
        {state.currentPlan && (
          <div className="mission-info" style={{ 
            marginTop: '1rem', 
            fontSize: '0.9rem', 
            color: 'var(--text-secondary)' 
          }}>
            📋 {state.currentPlan.name} | 
            📍 {state.currentPlan.waypoints.length} waypoints | 
            📊 {state.currentPlan.blocks.length} blocks |
            🛡️ Max distance: {state.currentPlan.max_dist_from_home}m
          </div>
        )}
      </div>

      {/* Mission Planning Map */}
      <div className="mission-map" style={{ height: 'calc(100vh - 250px)', position: 'relative' }}>
        <MapContainer
          center={[state.mapCenter.latitude, state.mapCenter.longitude]}
          zoom={state.mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <MapEventHandler />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Draggable waypoints */}
          {state.currentPlan?.waypoints.map((waypoint) => (
            <DraggableWaypoint
              key={waypoint.id}
              waypoint={waypoint}
              icon={waypoint.id === 'home' ? homeIcon : 
                    state.selectedWaypoint === waypoint.id ? selectedWaypointIcon : waypointIcon}
              isSelected={state.selectedWaypoint === waypoint.id}
              isHome={waypoint.id === 'home'}
              onDragEnd={handleWaypointDrag}
              onSelect={(id) => setState(prev => ({ ...prev, selectedWaypoint: id }))}
              onEdit={() => setState(prev => ({ ...prev, selectedWaypoint: waypoint.id }))}
            />
          ))}

          {/* Mission path visualization */}
          {waypointPath.length > 1 && (
            <Polyline 
              positions={waypointPath}
              color="#ff6b35"
              weight={3}
              opacity={0.7}
              dashArray="5, 10"
            />
          )}
        </MapContainer>
      </div>

      {/* Mission Summary */}
      <div className="mission-summary" style={{ 
        padding: '1rem', 
        backgroundColor: 'var(--bg-secondary)', 
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'space-between' }}>
          <span>🎯 Mode: <strong>{state.editMode}</strong></span>
          <span>📍 Waypoints: <strong>{state.currentPlan?.waypoints.length || 0}</strong></span>
          <span>📊 Blocks: <strong>{state.currentPlan?.blocks.length || 0}</strong></span>
          <span>🗺️ Zoom: <strong>{state.mapZoom}</strong></span>
        </div>
      </div>

      {/* Waypoint Editor Overlay */}
      {state.selectedWaypoint && state.currentPlan && (
        <WaypointEditor
          waypoint={state.currentPlan.waypoints.find(wp => wp.id === state.selectedWaypoint) || null}
          flightPlan={state.currentPlan}
          onUpdate={updateWaypoint}
          onDelete={deleteWaypoint}
          onClose={() => setState(prev => ({ ...prev, selectedWaypoint: null }))}
        />
      )}
    </div>
  );
};

export default MissionPlanner;