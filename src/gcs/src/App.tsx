import React, { useState, useEffect } from 'react';
import './App.css';
import TelemetryDisplay from './components/TelemetryDisplay';
import MapView from './components/MapView';
import MissionControl from './components/MissionControl';
import LLMChat from './components/LLMChat';
import AlertPanel from './components/AlertPanel';
import { WebSocketProvider } from './context/WebSocketContext';

function App() {
  const [selectedAircraft, setSelectedAircraft] = useState('sumo_001');
  const [view, setView] = useState<'map' | 'telemetry' | 'mission' | 'chat'>('map');

  return (
    <WebSocketProvider>
      <div className="App">
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
              className={view === 'chat' ? 'active' : ''}
              onClick={() => setView('chat')}
            >
              AI Assistant
            </button>
          </nav>

          <div className="header-right">
            <select 
              value={selectedAircraft} 
              onChange={(e) => setSelectedAircraft(e.target.value)}
              className="aircraft-selector"
            >
              <option value="sumo_001">SUMO-001</option>
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
    </WebSocketProvider>
  );
}

export default App;
