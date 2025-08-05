'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, Calendar, Clock, MapPin } from 'lucide-react';
import { VoiceModeToggle } from './voice-mode-toggle';
import { RetellSimpleClient } from './retell-simple-client';
import { VAPIWebClient } from './vapi-web-client';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export interface ChatInterfaceRef {
  setVoiceMode: (mode: 'text' | 'voice_retell' | 'voice_vapi') => void;
}

const ChatInterface = forwardRef<ChatInterfaceRef>((props, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'text' | 'voice_retell' | 'voice_vapi'>('voice_retell');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isInitialized, setIsInitialized] = useState(false);

  // Expose setVoiceMode method to parent component
  useImperativeHandle(ref, () => ({
    setVoiceMode: (mode: 'text' | 'voice_retell' | 'voice_vapi') => {
      setVoiceMode(mode);
      // If switching to text mode, ensure chat is initialized
      if (mode === 'text' && !isInitialized) {
        setIsInitialized(true);
        sendInitialMessage();
      }
    }
  }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation with greeting
  useEffect(() => {
    if (!isInitialized && voiceMode === 'text') {
      setIsInitialized(true);
      // Send a greeting message to start the conversation
      sendInitialMessage();
    }
  }, [isInitialized, voiceMode]);

  const sendInitialMessage = async () => {
    try {
      const response = await fetch('/api/retell-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'hello',
          sessionId: sessionId
        }),
      });

      const data = await response.json();
      
      const botMessage: Message = {
        id: '1',
        type: 'bot',
        content: data.response || 'Hello! How can I help you today?',
        timestamp: new Date()
      };

      setMessages([botMessage]);
    } catch (error) {
      console.error('Error initializing conversation:', error);
      const fallbackMessage: Message = {
        id: '1',
        type: 'bot',
        content: 'Hello! I\'m MedBot, your AI pharmacy assistant. How can I help you today?',
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Connect to Retell AI agent for text chat
      const response = await fetch('/api/retell-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          sessionId: sessionId
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
        } else if (response.status >= 500) {
          throw new Error('Our chat system is experiencing issues. Please try again in a few moments.');
        } else {
          throw new Error('Failed to get response from our assistant. Please try again.');
        }
      }

      const data = await response.json();
      
      // Show the AI assistant response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response || 'I apologize, but I encountered an error processing your request. Please try rephrasing your message.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error connecting to MedBot:', error);
      const errorContent = error instanceof Error ? error.message : 'I apologize, but I encountered a technical issue connecting to MedBot. Please try again or call our pharmacy directly at (555) 123-4567.';
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleVoiceModeChange = (mode: 'text' | 'voice_retell' | 'voice_vapi') => {
    setVoiceMode(mode);
  };

  return (
    <div className="flex flex-col h-[700px] max-w-3xl mx-auto border rounded-lg bg-white shadow-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bot className="w-5 h-5" />
              MedMe Pharmacy Assistant
            </h2>
            <p className="text-sm opacity-90">Book, cancel, or reschedule your appointments</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Mon-Fri 9AM-5PM
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              In-store & Online
            </div>
          </div>
        </div>
      </div>
      
      {/* Voice Mode Toggle */}
      <VoiceModeToggle currentMode={voiceMode} onModeChange={handleVoiceModeChange} />

      {/* Content based on mode */}
      {voiceMode === 'voice_retell' ? (
        <div className="flex-1 p-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Voice Call with Retell AI</h3>
            <p className="text-sm text-gray-600">Talk directly with MedBot using your configured agent</p>
          </div>
          <RetellSimpleClient 
            agentId="agent_fa18dcd11913e3ccde2931ddfc"
            publicKey="public_key_73c641de4f51ee6bdc6a9"
            onCallStart={() => console.log('Retell call started')}
            onCallEnd={() => console.log('Retell call ended')}
          />
        </div>
      ) : voiceMode === 'voice_vapi' ? (
        <div className="flex-1 p-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Voice Call with VAPI AI</h3>
            <p className="text-sm text-gray-600">Talk directly with our pharmacy assistant</p>
          </div>
          <VAPIWebClient 
            assistantId="988f7620-5414-44cb-8aea-e74348857242"
            publicKey="324520e5-2bea-4b84-94ab-8d5f646bafca"
            onCallStart={() => console.log('VAPI call started')}
            onCallEnd={() => console.log('VAPI call ended')}
          />
        </div>
      ) : (
        /* Text Chat Messages */
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.type === 'bot' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                {message.type === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input - only show for text mode */}
      {voiceMode === 'text' && (
        <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here... (e.g., 'I'd like to book a flu shot appointment')"
            className="flex-1 resize-none border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] max-h-32"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Try: &quot;Book flu shot&quot;, &quot;Check availability for tomorrow&quot;, &quot;Cancel my appointment&quot;
        </p>
        </div>
      )}
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;