import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';

interface Alert {
  id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  category: 'system' | 'flight' | 'communication' | 'battery' | 'weather';
  title: string;
  message: string;
  acknowledged: boolean;
  source: string;
}

const AlertPanel: React.FC = () => {
  const telemetry = useTelemetry();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | Alert['severity']>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  // Generate alerts based on telemetry data
  useEffect(() => {
    if (!telemetry) return;

    const newAlerts: Alert[] = [];
    const now = new Date().toISOString();

    // Battery alerts
    if (telemetry.battery?.percentage !== undefined) {
      if (telemetry.battery.percentage < 20) {
        newAlerts.push({
          id: `battery_${telemetry.battery.percentage}`,
          timestamp: now,
          severity: telemetry.battery.percentage < 10 ? 'critical' : 'warning',
          category: 'battery',
          title: 'Low Battery',
          message: `Battery at ${telemetry.battery.percentage}%. Consider returning to base.`,
          acknowledged: false,
          source: 'Battery Monitor',
        });
      }
    }

    // GPS alerts
    if (telemetry.gps?.satellites !== undefined && telemetry.gps.satellites < 6) {
      newAlerts.push({
        id: `gps_${telemetry.gps.satellites}`,
        timestamp: now,
        severity: telemetry.gps.satellites < 4 ? 'warning' : 'info',
        category: 'system',
        title: 'GPS Signal',
        message: `Only ${telemetry.gps.satellites} satellites available. Navigation accuracy may be reduced.`,
        acknowledged: false,
        source: 'GPS System',
      });
    }

    // Communication alerts
    if (telemetry.communication?.rssi !== undefined && telemetry.communication.rssi < -90) {
      newAlerts.push({
        id: `comm_${telemetry.communication.rssi}`,
        timestamp: now,
        severity: telemetry.communication.rssi < -100 ? 'warning' : 'info',
        category: 'communication',
        title: 'Weak Signal',
        message: `Communication signal at ${telemetry.communication.rssi} dBm. Risk of connection loss.`,
        acknowledged: false,
        source: 'Radio Link',
      });
    }

    // Flight envelope alerts
    if (telemetry.attitude?.airspeed !== undefined) {
      if (telemetry.attitude.airspeed > 25) { // Assuming max safe speed
        newAlerts.push({
          id: `speed_${telemetry.attitude.airspeed}`,
          timestamp: now,
          severity: 'warning',
          category: 'flight',
          title: 'High Airspeed',
          message: `Airspeed ${telemetry.attitude.airspeed.toFixed(1)} m/s exceeds recommended maximum.`,
          acknowledged: false,
          source: 'Flight Controller',
        });
      }
    }

    // Update alerts, removing duplicates based on ID
    setAlerts(prev => {
      const alertMap = new Map();
      
      // Keep existing acknowledged alerts
      prev.forEach(alert => {
        if (alert.acknowledged) {
          alertMap.set(alert.id, alert);
        }
      });
      
      // Add new alerts
      newAlerts.forEach(alert => {
        alertMap.set(alert.id, alert);
      });
      
      return Array.from(alertMap.values()).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });
  }, [telemetry]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const clearAcknowledged = () => {
    setAlerts(prev => prev.filter(alert => !alert.acknowledged));
  };

  const filteredAlerts = alerts.filter(alert => {
    if (!showAcknowledged && alert.acknowledged) return false;
    if (filter === 'all') return true;
    return alert.severity === filter;
  });

  const getAlertIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'emergency': return '🚨';
      case 'critical': return '🔴';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const getCategoryIcon = (category: Alert['category']) => {
    switch (category) {
      case 'system': return '⚙️';
      case 'flight': return '✈️';
      case 'communication': return '📡';
      case 'battery': return '🔋';
      case 'weather': return '🌤️';
      default: return '📝';
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'emergency': return '#ff0000';
      case 'critical': return '#ff4444';
      case 'warning': return '#ffaa00';
      case 'info': return '#0088ff';
      default: return '#666666';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;
  const criticalCount = alerts.filter(alert => 
    !alert.acknowledged && (alert.severity === 'critical' || alert.severity === 'emergency')
  ).length;

  return (
    <div className="alert-panel">
      <div className="alert-header">
        <h2>
          🚨 Alerts
          {unacknowledgedCount > 0 && (
            <span className="alert-count">
              {unacknowledgedCount}
              {criticalCount > 0 && <span className="critical-count">!</span>}
            </span>
          )}
        </h2>
        
        <div className="alert-controls">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="filter-select"
          >
            <option value="all">All Alerts</option>
            <option value="emergency">Emergency</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={(e) => setShowAcknowledged(e.target.checked)}
            />
            Show Acknowledged
          </label>
          
          <button 
            className="clear-button"
            onClick={clearAcknowledged}
            disabled={alerts.filter(a => a.acknowledged).length === 0}
          >
            Clear Acknowledged
          </button>
        </div>
      </div>

      <div className="alert-summary">
        <div className="summary-item emergency">
          <span className="summary-count">
            {alerts.filter(a => !a.acknowledged && a.severity === 'emergency').length}
          </span>
          <span className="summary-label">Emergency</span>
        </div>
        <div className="summary-item critical">
          <span className="summary-count">
            {alerts.filter(a => !a.acknowledged && a.severity === 'critical').length}
          </span>
          <span className="summary-label">Critical</span>
        </div>
        <div className="summary-item warning">
          <span className="summary-count">
            {alerts.filter(a => !a.acknowledged && a.severity === 'warning').length}
          </span>
          <span className="summary-label">Warning</span>
        </div>
        <div className="summary-item info">
          <span className="summary-count">
            {alerts.filter(a => !a.acknowledged && a.severity === 'info').length}
          </span>
          <span className="summary-label">Info</span>
        </div>
      </div>

      <div className="alert-list">
        {filteredAlerts.length === 0 ? (
          <div className="no-alerts">
            <span className="no-alerts-icon">✅</span>
            <div className="no-alerts-text">
              <strong>All Clear</strong>
              <br />
              No active alerts matching current filter
            </div>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`alert-item ${alert.severity} ${alert.acknowledged ? 'acknowledged' : ''}`}
              style={{ borderLeftColor: getSeverityColor(alert.severity) }}
            >
              <div className="alert-content">
                <div className="alert-icons">
                  <span className="severity-icon">{getAlertIcon(alert.severity)}</span>
                  <span className="category-icon">{getCategoryIcon(alert.category)}</span>
                </div>
                
                <div className="alert-text">
                  <div className="alert-title">
                    <strong>{alert.title}</strong>
                    <span className="alert-time">{formatTime(alert.timestamp)}</span>
                  </div>
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-source">Source: {alert.source}</div>
                </div>
                
                <div className="alert-actions">
                  {!alert.acknowledged && (
                    <button
                      className="acknowledge-button"
                      onClick={() => acknowledgeAlert(alert.id)}
                      title="Acknowledge Alert"
                    >
                      ✓
                    </button>
                  )}
                  {alert.acknowledged && (
                    <span className="acknowledged-indicator" title="Acknowledged">
                      ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {unacknowledgedCount > 0 && (
        <div className="alert-footer">
          <div className="alert-warning">
            ⚠️ {unacknowledgedCount} unacknowledged alert{unacknowledgedCount !== 1 ? 's' : ''}
            {criticalCount > 0 && (
              <span className="critical-warning">
                - {criticalCount} require immediate attention
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertPanel;