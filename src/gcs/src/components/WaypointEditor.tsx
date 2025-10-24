import React from 'react';
import type { Waypoint, WaypointAction, FlightPlan } from '../types/mission';
import { WAYPOINT_ACTION_TEMPLATES } from '../types/mission';

interface WaypointEditorProps {
  waypoint: Waypoint | null;
  flightPlan: FlightPlan | null;
  onUpdate: (waypoint: Waypoint) => void;
  onDelete: (waypointId: string) => void;
  onClose: () => void;
}

const WaypointEditor: React.FC<WaypointEditorProps> = ({
  waypoint,
  flightPlan,
  onUpdate,
  onDelete,
  onClose
}) => {
  if (!waypoint || !flightPlan) return null;

  const handleFieldChange = (field: keyof Waypoint, value: any) => {
    const updatedWaypoint = { ...waypoint, [field]: value };
    onUpdate(updatedWaypoint);
  };

  const handlePositionChange = (field: 'latitude' | 'longitude' | 'altitude', value: number) => {
    const updatedWaypoint = {
      ...waypoint,
      position: {
        ...waypoint.position,
        [field]: value
      }
    };
    onUpdate(updatedWaypoint);
  };

  const addAction = (actionTemplate: WaypointAction) => {
    const actions = waypoint.actions || [];
    const newAction = { ...actionTemplate, id: `action_${Date.now()}` };
    handleFieldChange('actions', [...actions, newAction]);
  };

  const updateAction = (index: number, updatedAction: WaypointAction) => {
    const actions = [...(waypoint.actions || [])];
    actions[index] = updatedAction;
    handleFieldChange('actions', actions);
  };

  const removeAction = (index: number) => {
    const actions = [...(waypoint.actions || [])];
    actions.splice(index, 1);
    handleFieldChange('actions', actions);
  };

  const waypointOptions = flightPlan.waypoints.map(wp => ({
    value: wp.id,
    label: wp.name
  }));

  return (
    <div className="waypoint-editor" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '80vh',
      overflowY: 'auto',
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
          📍 Edit Waypoint
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: 'var(--text-secondary)'
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '1rem' }}>
        {/* Basic Properties */}
        <div className="property-group" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Properties</h4>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Name:
            </label>
            <input
              type="text"
              value={waypoint.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Color:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['#ff6b35', '#ffff00', '#00ff00', '#0066ff', '#ff00ff', '#00ffff'].map(color => (
                <button
                  key={color}
                  onClick={() => handleFieldChange('color', color)}
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: color,
                    border: waypoint.color === color ? '2px solid #000' : '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Position */}
        <div className="property-group" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Position</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                Latitude:
              </label>
              <input
                type="number"
                step="0.000001"
                value={waypoint.position.latitude}
                onChange={(e) => handlePositionChange('latitude', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                Longitude:
              </label>
              <input
                type="number"
                step="0.000001"
                value={waypoint.position.longitude}
                onChange={(e) => handlePositionChange('longitude', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
              Altitude (m):
            </label>
            <input
              type="number"
              step="1"
              value={waypoint.position.altitude}
              onChange={(e) => handlePositionChange('altitude', parseFloat(e.target.value))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '0.8rem'
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="property-group" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Actions</h4>
            <div style={{ position: 'relative' }}>
              <select
                onChange={(e) => {
                  const template = WAYPOINT_ACTION_TEMPLATES[e.target.value as keyof typeof WAYPOINT_ACTION_TEMPLATES];
                  if (template) addAction(template);
                  e.target.value = '';
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.8rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--accent-color)',
                  color: 'white'
                }}
              >
                <option value="">+ Add Action</option>
                <option value="takeoff">Takeoff</option>
                <option value="landing">Landing</option>
                <option value="circle">Circle</option>
                <option value="survey">Survey</option>
                <option value="go">Go To</option>
                <option value="stay">Stay/Loiter</option>
              </select>
            </div>
          </div>

          {waypoint.actions && waypoint.actions.length > 0 ? (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {waypoint.actions.map((action, index) => (
                <div
                  key={index}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                    backgroundColor: 'var(--bg-primary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {action.type}
                    </span>
                    <button
                      onClick={() => removeAction(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--error-color)',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Action-specific parameters */}
                  {action.type === 'circle' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem' }}>Radius (m):</label>
                        <input
                          type="number"
                          value={action.radius || 50}
                          onChange={(e) => updateAction(index, { ...action, radius: parseInt(e.target.value) })}
                          style={{ width: '100%', padding: '0.25rem', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem' }}>Altitude (m):</label>
                        <input
                          type="number"
                          value={action.altitude || waypoint.position.altitude}
                          onChange={(e) => updateAction(index, { ...action, altitude: parseInt(e.target.value) })}
                          style={{ width: '100%', padding: '0.25rem', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>
                  )}

                  {action.type === 'go' && (
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>Target Waypoint:</label>
                      <select
                        value={action.wp || ''}
                        onChange={(e) => updateAction(index, { ...action, wp: e.target.value })}
                        style={{ width: '100%', padding: '0.25rem', fontSize: '0.8rem' }}
                      >
                        <option value="">Select waypoint...</option>
                        {waypointOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {action.type === 'survey_rectangle' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem' }}>Grid (m):</label>
                        <input
                          type="number"
                          value={action.grid || 50}
                          onChange={(e) => updateAction(index, { ...action, grid: parseInt(e.target.value) })}
                          style={{ width: '100%', padding: '0.25rem', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem' }}>Orientation:</label>
                        <select
                          value={action.orientation === 0 ? 'NS' : 'WE'}
                          onChange={(e) => updateAction(index, { ...action, orientation: e.target.value === 'NS' ? 0 : 90 })}
                          style={{ width: '100%', padding: '0.25rem', fontSize: '0.8rem' }}
                        >
                          <option value="NS">North-South</option>
                          <option value="WE">West-East</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: '1rem', 
              textAlign: 'center', 
              color: 'var(--text-muted)', 
              fontSize: '0.9rem',
              fontStyle: 'italic' 
            }}>
              No actions defined. Add actions to control aircraft behavior at this waypoint.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onDelete(waypoint.id)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--error-color)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            🗑️ Delete
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaypointEditor;