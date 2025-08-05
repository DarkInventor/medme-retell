/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MessageCircle, Phone, X, Send } from 'lucide-react';
import { RetellWebClient } from './retell-web-client';
import { VAPIWebClient } from './vapi-web-client';

const VoiceWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{text: string, sender: 'user' | 'bot'}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatCallId, setChatCallId] = useState<string | null>(null);

  // No need to load scripts, components handle their own SDK loading

  const handleVapiVoice = async () => {
    console.log('VAPI Voice activated');
    setIsLoading(true);
    setIsOpen(false);
    setActiveWidget('vapi-voice');
    setIsLoading(false);
  };

  const handleRetellChat = async () => {
    console.log('Retell Chat activated');
    setIsLoading(true);
    setIsOpen(false);
    
    try {
      // Use the simple chat that actually works
      const response = await fetch('/api/chat-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'Hello, I need help with pharmacy appointments',
          sessionId: 'user_' + Date.now()
        }),
      });
      
      const data = await response.json();
      console.log('Chat session created:', data);
      
      setChatCallId(data.session_id || 'default');
      // Add initial greeting from the AI
      setChatMessages([
        { text: data.response || "Hi! I'm your MedMe pharmacy assistant. I can help you book, cancel, or reschedule appointments. How can I assist you today?", sender: 'bot' }
      ]);
      setActiveWidget('retell-chat');
    } catch (error) {
      console.error('Error starting chat:', error);
      // Fallback message
      setChatMessages([
        { text: "Hi! I'm your MedMe pharmacy assistant. I can help you book, cancel, or reschedule appointments. How can I assist you today?", sender: 'bot' }
      ]);
      setActiveWidget('retell-chat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetellVoice = () => {
    console.log('Retell Voice activated');
    setIsOpen(false);
    setActiveWidget('retell-voice');
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message immediately
    setChatMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    
    // Send message to simple chat API
    try {
      const response = await fetch('/api/chat-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          sessionId: chatCallId || 'default'
        }),
      });
      
      const data = await response.json();
      console.log('Chat response:', data);
      
      if (data.response) {
        // Add AI response
        setChatMessages(prev => [...prev, { 
          text: data.response, 
          sender: 'bot' 
        }]);
      } else {
        // Fallback response if API fails
        setChatMessages(prev => [...prev, { 
          text: "I apologize, but I'm having trouble processing your request right now. Please try again or call us directly.", 
          sender: 'bot' 
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Error fallback
      setChatMessages(prev => [...prev, { 
        text: "I'm having trouble connecting right now. Please try again or call us at (555) 123-4567.", 
        sender: 'bot' 
      }]);
    }
  };

  const closeWidget = () => {
    setIsOpen(false);
    setActiveWidget(null);
  };

  return (
    <>
      {/* Main Widget Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* Options Menu */}
          {isOpen && (
            <div className="absolute bottom-16 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[200px] animate-in slide-in-from-bottom-2 duration-200">
              <div className="space-y-1">
                {/* VAPI Voice Option */}
                {/* <button
                  onClick={handleVapiVoice}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200 group disabled:opacity-50"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                    <Mic className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">VAPI Voice</div>
                    <div className="text-xs text-gray-500">Advanced voice assistant</div>
                  </div>
                  {isLoading && <div className="ml-auto w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
                </button> */}

                {/* Retell Chat Option */}
                <button
                  onClick={handleRetellChat}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200 group disabled:opacity-50"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Retell Chat</div>
                    <div className="text-xs text-gray-500">Text conversation</div>
                  </div>
                  {isLoading && <div className="ml-auto w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>}
                </button>

                {/* Retell Voice Option */}
                <button
                  onClick={handleRetellVoice}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200 group disabled:opacity-50"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                    <Phone className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Retell Voice</div>
                    <div className="text-xs text-gray-500">Voice calling</div>
                  </div>
                  {isLoading && <div className="ml-auto w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>}
                </button>
              </div>
            </div>
          )}

          {/* Main Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`
              flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110
              ${isOpen 
                ? 'bg-gray-700 hover:bg-gray-800' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              }
            `}
          >
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Chat Widget - Small widget above button */}
      {activeWidget === 'retell-chat' && (
        <div className="absolute bottom-20 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 w-80 h-96 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-green-50 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="font-medium text-gray-900 text-sm">MedBot Chat</span>
            </div>
            <button
              onClick={closeWidget}
              className="p-1 hover:bg-green-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto">
            {chatMessages.map((message, index) => (
              <div key={index} className={`mb-3 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block max-w-[80%] p-2 rounded-lg text-sm ${
                  message.sender === 'user' 
                    ? 'bg-green-500 text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          
          {/* Input */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="Type your message..." 
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button 
                onClick={handleChatSend}
                className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Widget Overlays */}
      {(activeWidget === 'vapi-voice' || activeWidget === 'retell-voice') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeWidget === 'vapi-voice' ? 'VAPI Voice Assistant' : 'Retell Voice Assistant'}
              </h3>
              <button
                onClick={closeWidget}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {activeWidget === 'vapi-voice' && (
                <VAPIWebClient
                  assistantId="your_vapi_assistant_id"
                  publicKey="324520e5-2bea-4b84-94ab-8d5f646bafca"
                  onCallStart={() => console.log('VAPI call started')}
                  onCallEnd={() => {
                    console.log('VAPI call ended');
                    closeWidget();
                  }}
                />
              )}
              
              {activeWidget === 'retell-voice' && (
                <RetellWebClient
                  agentId="agent_fa18dcd11913e3ccde2931ddfc"
                  publicKey="public_key_73c641de4f51ee6bdc6a9"
                  onCallStart={() => console.log('Voice call started')}
                  onCallEnd={() => {
                    console.log('Voice call ended');
                    closeWidget();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceWidget;