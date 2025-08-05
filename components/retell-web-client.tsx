/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';
import { Phone, PhoneOff } from 'lucide-react';
// Import Retell Client from the installed package
import { RetellWebClient as RetellClient } from 'retell-client-js-sdk';

interface RetellWebClientProps {
  agentId: string;
  publicKey: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export function RetellWebClient({ agentId, publicKey, onCallStart, onCallEnd }: RetellWebClientProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string>('idle');
  const retellWebClientRef = useRef<RetellClient | null>(null);

  useEffect(() => {
    // Initialize Retell Web Client using the installed package
   
    try {
      retellWebClientRef.current = new RetellClient();
      
      // Set up event listeners
      retellWebClientRef.current.on('call_started', () => {
        console.log('Retell call started');
        setIsConnected(true);
        setCallStatus('connected');
        setIsLoading(false);
        onCallStart?.();
      });
      
      retellWebClientRef.current.on('call_ended', () => {
        console.log('Retell call ended');
        setIsConnected(false);
        setCallStatus('idle');
        setIsLoading(false);
        onCallEnd?.();
      });
      
      retellWebClientRef.current.on('error', (error: any) => {
        console.error('Retell Web Client error:', error);
        setError(error.message || 'Voice call failed');
        setIsLoading(false);
        setIsConnected(false);
        setCallStatus('error');
      });
      
      retellWebClientRef.current.on('update', (update: any) => {
        console.log('Retell call update:', update);
        if (update.callStatus) {
          setCallStatus(update.callStatus);
        }
      });
      console.log('Retell Web Client initialized successfully');
    } catch (initError) {
      console.error('Failed to initialize Retell Web Client:', initError);
      setError('Failed to initialize voice client');
    }

    return () => {
      // Cleanup
      if (retellWebClientRef.current) {
        try {
          retellWebClientRef.current.stopCall();
        } catch (cleanupError) {
          console.warn('Error during cleanup:', cleanupError);
        }
      }
    };
  }, [publicKey, onCallStart, onCallEnd]);

  const startCall = async () => {
    if (!retellWebClientRef.current) {
      setError('Voice client not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCallStatus('connecting');

    try {
      // First create a web call to get access token
      const response = await fetch('/api/retell-web-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_web_call' })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create web call');
      }

      // Start the call with the access token
      await retellWebClientRef.current.startCall({
        accessToken: data.access_token
      });
      console.log('Retell call started with agent:', agentId);

    } catch (error: any) {
      console.error('Error starting Retell call:', error);
      setError(error.message || 'Failed to start voice call');
      setIsLoading(false);
      setCallStatus('error');
    }
  };

  const endCall = () => {
    if (retellWebClientRef.current) {
      retellWebClientRef.current.stopCall();
    }
    setIsConnected(false);
    setCallStatus('idle');
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Voice Call with MedBot
        </h3>
        <p className="text-gray-600">
          Talk directly with your Retell AI agent for appointment booking
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-md">
          <p className="text-red-800 text-sm">{error}</p>
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
          This connects to your MedBot agent (agent_ef0ef58837be02eb838ac59335) with real Cal.com integration for appointment booking.
        </p>
      </div>
    </div>
  );
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    RetellClient: any;
  }
}