import React, { useState, useEffect } from 'react';
import './App.css';
import TelemetryDisplay from './components/TelemetryDisplay';
import MapView from './components/MapView';
import MissionControl from './components/MissionControl';
import MissionPlanner from './components/MissionPlanner';
import LLMChat from './components/LLMChat';
import AlertPanel from './components/AlertPanel';
import { WebSocketProvider } from './context/WebSocketContext';
import { TelemetryProvider } from './context/TelemetryContext';
import { DemoDataGenerator } from './services/DemoDataGenerator';

function App() {
  const [selectedAircraft, setSelectedAircraft] = useState('sumo_001');
  const [view, setView] = useState<'map' | 'telemetry' | 'mission' | 'planner' | 'chat'>('map');
  const [demoMode, setDemoMode] = useState(false);
  const [demoGenerator] = useState(() => new DemoDataGenerator());

  // Handle demo mode toggle
  useEffect(() => {
    if (demoMode) {
      demoGenerator.start();
      setSelectedAircraft('demo_aircraft');
    } else {
      demoGenerator.stop();
      setSelectedAircraft('sumo_001');
    }
    
    return () => {
      demoGenerator.stop();
    };
  }, [demoMode, demoGenerator]);

  return (
    <WebSocketProvider>
      <TelemetryProvider aircraftId={selectedAircraft}>
        <div className="app">
        <header className="app-header">
          <div className="header-left">
            <h1>🚁 Paparazzi Next-Gen</h1>
            <span className="version">v5.0.0</span>
          </div>
          
          <nav className="header-nav">
            <button 
              className={view === 'map' ? 'active' : ''}
              onClick={() => setView('map')}
            >
              Map
            </button>
            <button 
              className={view === 'telemetry' ? 'active' : ''}
              onClick={() => setView('telemetry')}
            >
              Telemetry
            </button>
            <button 
              className={view === 'mission' ? 'active' : ''}
              onClick={() => setView('mission')}
            >
              Mission
            </button>
            <button 
              className={view === 'planner' ? 'active' : ''}
              onClick={() => setView('planner')}
            >
              🎯 Planner
            </button>
            <button 
              className={view === 'chat' ? 'active' : ''}
              onClick={() => setView('chat')}
            >
              AI Assistant
            </button>
          </nav>

          <div className="header-right">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
              />
              Demo Mode
            </label>
            
            <select 
              value={selectedAircraft} 
              onChange={(e) => setSelectedAircraft(e.target.value)}
              className="aircraft-selector"
              disabled={demoMode}
            >
              <option value="sumo_001">SUMO-001</option>
              <option value="demo_aircraft">Demo Aircraft</option>
              <option value="sim_aircraft_001">Simulator</option>
            </select>
            <div className="connection-status online">●</div>
          </div>
        </header>

        <main className="app-main">
          <div className="main-content">
            {view === 'map' && <MapView aircraftId={selectedAircraft} />}
            {view === 'telemetry' && <TelemetryDisplay aircraftId={selectedAircraft} />}
            {view === 'mission' && <MissionControl aircraftId={selectedAircraft} />}
            {view === 'planner' && <MissionPlanner />}
            {view === 'chat' && <LLMChat aircraftId={selectedAircraft} />}
          </div>
          
          <aside className="sidebar">
            <AlertPanel aircraftId={selectedAircraft} />
          </aside>
        </main>

        <footer className="app-footer">
          <div className="footer-status">
            <span>Connected to Message Broker</span>
            <span>Aircraft: {selectedAircraft}</span>
            <span>Last Update: {new Date().toLocaleTimeString()}</span>
          </div>
        </footer>
        </div>
      </TelemetryProvider>
    </WebSocketProvider>
  );
}

export default App;
