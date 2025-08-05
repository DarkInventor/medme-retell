/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';
import { Phone, PhoneOff } from 'lucide-react';
import { RetellWebClient } from 'retell-client-js-sdk';

interface RetellSimpleClientProps {
  agentId: string;
  publicKey: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export function RetellSimpleClient({ agentId, publicKey, onCallStart, onCallEnd }: RetellSimpleClientProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string>('idle');
  const retellWebClient = useRef<RetellWebClient | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retellWebClient.current) {
        retellWebClient.current.stopCall();
      }
    };
  }, []);

  const startCall = async () => {
    setIsLoading(true);
    setError(null);
    setCallStatus('connecting');

    try {
      // Create web call
      const response = await fetch('/api/retell-web-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_web_call' })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create web call');
      }

      console.log('Web call created:', data);
      console.log('Using access token:', data.access_token.substring(0, 20) + '...');
      console.log('Agent ID:', data.agent_id);
      
      // Initialize Retell Web Client without config first
      retellWebClient.current = new RetellWebClient();
      
      // Set up event listeners
      retellWebClient.current.on('conversationStarted', () => {
        console.log('Conversation started');
        setIsConnected(true);
        setCallStatus('connected');
        setIsLoading(false);
        onCallStart?.();
      });

      retellWebClient.current.on('conversationEnded', () => {
        console.log('Conversation ended');
        setIsConnected(false);
        setCallStatus('idle');
        setIsLoading(false);
        onCallEnd?.();
      });

      retellWebClient.current.on('error', (error) => {
        console.error('Retell client error:', error);
        setError(`Connection failed: ${error.message || 'Please try again'}`);
        setCallStatus('error');
        setIsLoading(false);
        setIsConnected(false);
      });

      retellWebClient.current.on('update', (update) => {
        console.log('Call update:', update);
      });

      // Start the call with access token and additional config
      console.log('Starting call with token...');
      await retellWebClient.current.startCall({
        accessToken: data.access_token,
        sampleRate: 24000,
        captureDeviceId: undefined // Let browser choose microphone
      });
      console.log('Call start initiated');

      setIsLoading(false);
      
    } catch (error: any) {
      console.error('Error starting Retell call:', error);
      setError(error.message || 'Failed to start call');
      setIsLoading(false);
      setCallStatus('error');
    }
  };

  const endCall = async () => {
    if (retellWebClient.current) {
      await retellWebClient.current.stopCall();
    }
    setIsConnected(false);
    setCallStatus('idle');
    setIsLoading(false);
    setError(null);
    onCallEnd?.();
    console.log('Call ended');
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Voice Call with Retell AI
        </h3>
        <p className="text-gray-600">
          Connect to your MedBot agent with Cal.com integration
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {isConnected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 max-w-md">
          <p className="text-green-800 text-sm">
            ✅ Successfully connected to Retell agent: {agentId}
          </p>
          <p className="text-green-600 text-xs mt-1">
            Voice call functionality ready (Web SDK integration needed for full functionality)
          </p>
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className={`w-3 h-3 rounded-full ${
            callStatus === 'connected' ? 'bg-green-500 animate-pulse' :
            callStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            callStatus === 'error' ? 'bg-red-500' :
            'bg-gray-300'
          }`}></div>
          <span className="capitalize">
            {callStatus === 'idle' ? 'Ready to call' : callStatus}
          </span>
        </div>

        {!isConnected ? (
          <Button
            onClick={startCall}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Phone className="w-5 h-5" />
                <span>Start Voice Call</span>
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={endCall}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
          </Button>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 max-w-md">
          Voice Agent: {agentId}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          This creates a web call session. Full audio functionality requires Retell Web SDK integration.
        </p>
      </div>
    </div>
  );
}