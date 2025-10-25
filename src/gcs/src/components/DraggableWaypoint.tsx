import React, { useRef, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Waypoint, Position } from '../types/mission';

interface DraggableWaypointProps {
  waypoint: Waypoint;
  icon: L.Icon;
  isSelected: boolean;
  isHome?: boolean;
  onDragEnd: (waypointId: string, newPosition: Position) => void;
  onSelect: (waypointId: string) => void;
  onEdit: () => void;
}

const DraggableWaypoint: React.FC<DraggableWaypointProps> = ({
  waypoint,
  icon,
  isSelected,
  isHome = false,
  onDragEnd,
  onSelect,
  onEdit
}) => {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      click() {
        onSelect(waypoint.id);
      },
      dragstart() {
        // Visual feedback when drag starts
        const marker = markerRef.current;
        if (marker) {
          marker.setOpacity(0.7);
        }
      },
      drag() {
        // Optional: Add real-time visual feedback during drag
      },
      dragend() {
        // Reset opacity and handle position update
        const marker = markerRef.current;
        if (marker) {
          marker.setOpacity(1.0);
          const newLatLng = marker.getLatLng();
          const newPosition: Position = {
            latitude: newLatLng.lat,
            longitude: newLatLng.lng,
            altitude: waypoint.position.altitude
          };
          onDragEnd(waypoint.id, newPosition);
        }
      }
    }),
    [waypoint.id, waypoint.position.altitude, onDragEnd, onSelect]
  );

  return (
    <Marker
      ref={markerRef}
      position={[waypoint.position.latitude, waypoint.position.longitude]}
      icon={icon}
      draggable={true}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <div style={{ minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong style={{ marginRight: '0.5rem' }}>
              {isHome ? '🏠' : '📍'} {waypoint.name}
            </strong>
            {isSelected && (
              <span style={{ 
                backgroundColor: 'var(--accent-color)', 
                color: 'white', 
                padding: '0.1rem 0.3rem',
                borderRadius: '3px',
                fontSize: '0.7rem'
              }}>
                Selected
              </span>
            )}
          </div>
          
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <div>📍 {waypoint.position.latitude.toFixed(6)}, {waypoint.position.longitude.toFixed(6)}</div>
            <div>⬆️ {waypoint.position.altitude}m altitude</div>
            {waypoint.actions && waypoint.actions.length > 0 && (
              <div>⚡ {waypoint.actions.length} action(s)</div>
            )}
          </div>

          {isHome ? (
            <div style={{ 
              padding: '0.5rem', 
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
              borderRadius: '4px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              🏠 Home base - Drag to relocate mission center
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                onClick={onEdit}
                style={{ 
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.8rem',
                  backgroundColor: 'var(--accent-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                ✏️ Edit
              </button>
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                fontStyle: 'italic'
              }}>
                🖱️ Drag to move
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default DraggableWaypoint;