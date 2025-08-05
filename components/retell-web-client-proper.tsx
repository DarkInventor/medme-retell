/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';
import { Phone, PhoneOff } from 'lucide-react';

interface RetellWebClientProps {
  agentId: string;
  publicKey: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export function RetellWebClientProper({ agentId, publicKey, onCallStart, onCallEnd }: RetellWebClientProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string>('idle');
  const retellClientRef = useRef<any>(null);

  const startCall = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Import Retell client dynamically
      const { RetellWebClient } = await import('retell-client-js-sdk');
      
      // Create web call first
      const response = await fetch('/api/retell-web-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_web_call' })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create web call');
      }

      // Initialize Retell Web Client
      retellClientRef.current = new RetellWebClient();

      // Set up event listeners
      retellClientRef.current.on('call_started', () => {
        console.log('Retell call started');
        setIsConnected(true);
        setCallStatus('connected');
        setIsLoading(false);
        onCallStart?.();
      });

      retellClientRef.current.on('call_ended', () => {
        console.log('Retell call ended');
        setIsConnected(false);
        setCallStatus('idle');
        onCallEnd?.();
      });

      retellClientRef.current.on('error', (error: any) => {
        console.error('Retell error:', error);
        setError(error.message || 'Call failed');
        setIsLoading(false);
        setIsConnected(false);
        setCallStatus('error');
      });

      retellClientRef.current.on('update', (update: any) => {
        console.log('Retell update:', update);
        if (update.transcript) {
          console.log('Transcript:', update.transcript);
        }
      });

      // Start the call
      await retellClientRef.current.startCall({
        callId: data.call_id,
        sampleRate: 24000,
        enableUpdate: true
      });

    } catch (error: any) {
      console.error('Error starting Retell call:', error);
      setError(error.message || 'Failed to start call');
      setIsLoading(false);
    }
  };

  const endCall = () => {
    if (retellClientRef.current) {
      retellClientRef.current.stopCall();
    }
    setIsConnected(false);
    setCallStatus('idle');
    setIsLoading(false);
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (retellClientRef.current) {
        retellClientRef.current.stopCall();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Voice Call with MedBot
        </h3>
        <p className="text-gray-600">
          Talk directly with your Retell AI agent with Cal.com integration
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
          This connects to your MedBot agent ({agentId}) with real Cal.com integration for appointment booking.
        </p>
      </div>
    </div>
  );
}