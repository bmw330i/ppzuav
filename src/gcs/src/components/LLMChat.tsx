import React, { useState, useRef, useEffect } from 'react';

interface LLMChatProps {
  aircraftId: string;
}

interface ChatMessage {
  id: string;
  timestamp: string;
  sender: 'human' | 'assistant';
  message: string;
  type?: 'command' | 'analysis' | 'suggestion' | 'alert';
}

const LLMChat: React.FC<LLMChatProps> = ({ aircraftId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      timestamp: new Date().toISOString(),
      sender: 'assistant',
      message: `Hello! I'm your AI flight assistant for ${aircraftId}. I can help you with:\n\n• Mission planning and optimization\n• Atmospheric data analysis\n• Flight parameter recommendations\n• Safety monitoring and alerts\n\nHow can I assist with your flight operations today?`,
      type: 'suggestion',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      sender: 'human',
      message: inputMessage.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    // Simulate AI response (in production, this would call the MCP server)
    setTimeout(() => {
      const response = generateMockResponse(userMessage.message, aircraftId);
      setMessages(prev => [...prev, response]);
      setIsProcessing(false);
    }, 1000 + Math.random() * 2000); // Simulate processing time
  };

  const generateMockResponse = (userInput: string, aircraftId: string): ChatMessage => {
    const lowerInput = userInput.toLowerCase();
    
    let response = '';
    let type: ChatMessage['type'] = 'suggestion';

    if (lowerInput.includes('mission') || lowerInput.includes('plan')) {
      response = `I can help you optimize the mission plan for ${aircraftId}. Based on current atmospheric conditions:\n\n• Wind: 8kt from SW - recommend starting from downwind side\n• Visibility: 10km - excellent for survey operations\n• Temperature: -5°C - within normal operating range\n\nWould you like me to suggest waypoint modifications for better fuel efficiency?`;
      type = 'analysis';
    } else if (lowerInput.includes('weather') || lowerInput.includes('atmospheric')) {
      response = `Current atmospheric analysis for ${aircraftId} area:\n\n🌡️ Temperature: -5.2°C (stable)\n💨 Wind: 8.5 m/s from 245° (manageable)\n💧 Humidity: 85% (high, monitor for icing)\n🌍 Pressure: 1013.25 hPa (standard)\n\nConditions are suitable for continued flight operations. Recommend monitoring humidity levels for potential icing at higher altitudes.`;
      type = 'analysis';
    } else if (lowerInput.includes('battery') || lowerInput.includes('fuel')) {
      response = `Current power analysis for ${aircraftId}:\n\n🔋 Battery: 67% remaining\n⏱️ Estimated flight time: 28 minutes at current consumption\n📊 Efficiency: Good (15.2 km per 10% battery)\n\nRecommendation: You have sufficient power for the planned mission with 20% safety margin. Consider reducing cruise speed by 1 m/s to extend range if needed.`;
      type = 'analysis';
    } else if (lowerInput.includes('emergency') || lowerInput.includes('problem')) {
      response = `I'm monitoring all systems for ${aircraftId}. Current status:\n\n✅ All systems nominal\n✅ GPS: 12 satellites, 0.8m accuracy\n✅ Datalink: -68 dBm (strong)\n✅ Flight envelope: Within limits\n\nNo immediate issues detected. If you're experiencing a specific problem, please describe it and I'll provide targeted assistance.`;
      type = 'alert';
    } else if (lowerInput.includes('optimize') || lowerInput.includes('improve')) {
      response = `Optimization suggestions for ${aircraftId}:\n\n1. **Route Efficiency**: Current path has 2 unnecessary turns. I can reduce flight time by 5 minutes.\n2. **Altitude**: Flying at 180m instead of 150m would avoid thermal turbulence.\n3. **Speed**: Reducing cruise speed to 14 m/s would improve fuel efficiency by 12%.\n\nWould you like me to generate an optimized flight plan?`;
      type = 'suggestion';
    } else {
      response = `I understand you're asking about "${userInput}". I'm here to help with ${aircraftId} operations including:\n\n• Flight planning and mission optimization\n• Real-time atmospheric data analysis\n• System health monitoring\n• Emergency procedures\n• Performance optimization\n\nCould you be more specific about what aspect you'd like assistance with?`;
    }

    return {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      sender: 'assistant',
      message: response,
      type,
    };
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'command': return '🎮';
      case 'analysis': return '📊';
      case 'suggestion': return '💡';
      case 'alert': return '⚠️';
      default: return '🤖';
    }
  };

  return (
    <div className="llm-chat">
      <div className="chat-header">
        <h2>🤖 AI Flight Assistant</h2>
        <div className="chat-status">
          <span className="status-indicator online">●</span>
          <span>Connected - {aircraftId}</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            <div className="message-header">
              <span className="message-sender">
                {msg.sender === 'human' ? '👤 You' : `${getMessageIcon(msg.type)} Assistant`}
              </span>
              <span className="message-time">{formatTime(msg.timestamp)}</span>
            </div>
            <div className="message-content">
              {msg.message.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < msg.message.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="message assistant">
            <div className="message-header">
              <span className="message-sender">🤖 Assistant</span>
              <span className="message-time">{formatTime(new Date().toISOString())}</span>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              Analyzing flight data...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="quick-actions">
          <button
            className="quick-action"
            onClick={() => setInputMessage('Analyze current atmospheric conditions')}
            disabled={isProcessing}
          >
            🌡️ Weather
          </button>
          <button
            className="quick-action"
            onClick={() => setInputMessage('Optimize the current mission plan')}
            disabled={isProcessing}
          >
            🎯 Optimize
          </button>
          <button
            className="quick-action"
            onClick={() => setInputMessage('Check system health and battery status')}
            disabled={isProcessing}
          >
            🔋 Status
          </button>
          <button
            className="quick-action"
            onClick={() => setInputMessage('What should I do if there is an emergency?')}
            disabled={isProcessing}
          >
            🚨 Emergency
          </button>
        </div>
        
        <div className="input-area">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about mission planning, weather analysis, system status..."
            disabled={isProcessing}
            className="message-input"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isProcessing}
            className="send-button"
          >
            {isProcessing ? '⏳' : '📤'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LLMChat;