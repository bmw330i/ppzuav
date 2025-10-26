import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';

interface MCPIntegrationProps {
  aircraftId: string;
}

interface MCPTool {
  name: string;
  description: string;
  icon: string;
  category: 'hardware' | 'flight' | 'mission' | 'safety';
  status: 'idle' | 'running' | 'success' | 'error';
  lastRun?: string;
  result?: any;
}

const MCPIntegration: React.FC<MCPIntegrationProps> = ({ aircraftId }) => {
  const { connected } = useWebSocket();
  const [tools, setTools] = useState<MCPTool[]>([
    {
      name: 'flash_autopilot_firmware',
      description: 'Compile and flash Paparazzi firmware to autopilot',
      icon: '⚡',
      category: 'hardware',
      status: 'idle'
    },
    {
      name: 'configure_xbee_modems',
      description: 'Set up XBee wireless modems for telemetry',
      icon: '📡',
      category: 'hardware',
      status: 'idle'
    },
    {
      name: 'establish_telemetry',
      description: 'Create telemetry link between ground station and aircraft',
      icon: '🔗',
      category: 'hardware',
      status: 'idle'
    },
    {
      name: 'calibrate_imu',
      description: 'Calibrate IMU sensors for accurate attitude',
      icon: '🎯',
      category: 'hardware',
      status: 'idle'
    },
    {
      name: 'upload_flight_plan',
      description: 'Load autonomous mission waypoints',
      icon: '📋',
      category: 'flight',
      status: 'idle'
    },
    {
      name: 'detect_launch',
      description: 'Monitor IMU for automatic flight initiation',
      icon: '🚀',
      category: 'flight',
      status: 'idle'
    },
    {
      name: 'monitor_flight_safety',
      description: 'Real-time safety monitoring with emergency protocols',
      icon: '🛡️',
      category: 'safety',
      status: 'idle'
    },
    {
      name: 'analyze_wildfire_risk',
      description: 'Environmental monitoring for wildfire detection',
      icon: '🔥',
      category: 'mission',
      status: 'idle'
    },
    {
      name: 'track_aircraft_ais',
      description: 'Monitor AIS transponder data for collision avoidance',
      icon: '✈️',
      category: 'safety',
      status: 'idle'
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [mcpConnected, setMcpConnected] = useState(false);
  const [aiMode, setAiMode] = useState(false);

  // Mock MCP connection check
  useEffect(() => {
    const checkMCPConnection = async () => {
      try {
        // In a real implementation, this would check the MCP server
        const response = await fetch('http://localhost:3001/mcp/health').catch(() => null);
        setMcpConnected(!!response);
      } catch {
        setMcpConnected(false);
      }
    };

    checkMCPConnection();
    const interval = setInterval(checkMCPConnection, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const executeMCPTool = async (toolName: string, params: any = {}) => {
    setTools(prev => prev.map(tool => 
      tool.name === toolName 
        ? { ...tool, status: 'running' as const }
        : tool
    ));

    try {
      // In a real implementation, this would call the MCP server
      console.log(`Executing MCP tool: ${toolName}`, { aircraftId, ...params });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult = {
        success: true,
        message: `${toolName} completed successfully for aircraft ${aircraftId}`,
        timestamp: new Date().toISOString(),
        data: {
          aircraftId,
          toolName,
          ...params
        }
      };

      setTools(prev => prev.map(tool => 
        tool.name === toolName 
          ? { 
              ...tool, 
              status: 'success' as const,
              lastRun: new Date().toISOString(),
              result: mockResult
            }
          : tool
      ));

    } catch (error) {
      setTools(prev => prev.map(tool => 
        tool.name === toolName 
          ? { 
              ...tool, 
              status: 'error' as const,
              lastRun: new Date().toISOString(),
              result: { error: String(error) }
            }
          : tool
      ));
    }
  };

  const executeAIMission = async () => {
    setAiMode(true);
    
    // Sequential execution of tools for wildfire mission
    const missionSequence = [
      'flash_autopilot_firmware',
      'configure_xbee_modems', 
      'establish_telemetry',
      'calibrate_imu',
      'upload_flight_plan',
      'detect_launch',
      'monitor_flight_safety',
      'analyze_wildfire_risk',
      'track_aircraft_ais'
    ];

    for (const toolName of missionSequence) {
      await executeMCPTool(toolName, { 
        aircraftId,
        missionType: 'wildfire_detection',
        autoMode: true
      });
      
      // Wait between tools
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setAiMode(false);
  };

  const getStatusColor = (status: MCPTool['status']) => {
    switch (status) {
      case 'idle': return '#6b7280';
      case 'running': return '#3b82f6';
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: MCPTool['status']) => {
    switch (status) {
      case 'idle': return '⚪';
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  const filteredTools = selectedCategory === 'all' 
    ? tools 
    : tools.filter(tool => tool.category === selectedCategory);

  return (
    <div className="component-panel">
      <div className="mcp-header">
        <h2>🤖 AI Control Center</h2>
        <div className="mcp-status">
          <span className={`status-indicator ${mcpConnected ? 'online' : 'offline'}`}></span>
          MCP {mcpConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* AI Mission Control */}
      <div className="ai-mission-control" style={{ 
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        color: 'white'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>🚁 Autonomous Mission Control</h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
          Let AI handle complete UAV operations from firmware flashing to mission execution.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={executeAIMission}
            disabled={aiMode || !mcpConnected}
            style={{
              padding: '0.75rem 1.5rem',
              background: aiMode ? '#6b7280' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: aiMode ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            {aiMode ? '🔄 AI Mission Running...' : '🚀 Start AI Mission'}
          </button>
          
          <div style={{ fontSize: '0.85rem' }}>
            Target: <strong>{aircraftId}</strong> | 
            Mission: <strong>Wildfire Detection</strong>
          </div>
        </div>
      </div>

      {/* Tool Categories */}
      <div className="tool-categories" style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        {['all', 'hardware', 'flight', 'mission', 'safety'].map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: '0.25rem 0.75rem',
              border: '1px solid var(--border-color)',
              background: selectedCategory === category ? 'var(--accent-color)' : 'var(--bg-secondary)',
              color: selectedCategory === category ? 'white' : 'var(--text-primary)',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              textTransform: 'capitalize'
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* MCP Tools Grid */}
      <div className="mcp-tools-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem',
        maxHeight: '60vh',
        overflowY: 'auto'
      }}>
        {filteredTools.map((tool) => (
          <div
            key={tool.name}
            className="mcp-tool-card"
            style={{
              padding: '1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <div className="tool-header" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <div className="tool-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{tool.icon}</span>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {tool.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              
              <div className="tool-status" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                fontSize: '0.8rem'
              }}>
                {getStatusIcon(tool.status)}
                <span style={{ color: getStatusColor(tool.status) }}>{tool.status}</span>
              </div>
            </div>

            <p style={{ 
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)', 
              margin: '0 0 1rem 0',
              lineHeight: '1.4'
            }}>
              {tool.description}
            </p>

            <div className="tool-actions" style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => executeMCPTool(tool.name)}
                disabled={tool.status === 'running' || !mcpConnected}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  background: tool.status === 'running' ? '#6b7280' : 'var(--accent-color)',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: tool.status === 'running' ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                {tool.status === 'running' ? 'Running...' : 'Execute'}
              </button>
              
              {tool.lastRun && (
                <button
                  style={{
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                  title={`Last run: ${new Date(tool.lastRun).toLocaleString()}`}
                >
                  📊
                </button>
              )}
            </div>

            {tool.result && (
              <div className="tool-result" style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                background: tool.status === 'success' ? '#10b98120' : '#ef444420',
                borderRadius: '4px',
                fontSize: '0.75rem'
              }}>
                <strong>Result:</strong> {tool.result.message || tool.result.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MCPIntegration;