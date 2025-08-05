'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Phone, PhoneOff } from 'lucide-react';

interface VAPIWebClientProps {
  assistantId: string;
  publicKey: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export function VAPIWebClient({ assistantId, publicKey, onCallStart, onCallEnd }: VAPIWebClientProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string>('idle');
  const [vapiInstance, setVapiInstance] = useState<any>(null);

  const startCall = async () => {
    setIsLoading(true);
    setError(null);
    setCallStatus('connecting');

    try {
      // Import VAPI client dynamically
      const { default: Vapi } = await import('@vapi-ai/web');
      
      const vapi = new Vapi(publicKey);
      setVapiInstance(vapi);

      // Set up event listeners
      vapi.on('call-start', () => {
        console.log('VAPI call started');
        setIsConnected(true);
        setCallStatus('connected');
        setIsLoading(false);
        onCallStart?.();
      });

      vapi.on('call-end', () => {
        console.log('VAPI call ended');
        setIsConnected(false);
        setCallStatus('idle');
        setIsLoading(false);
        onCallEnd?.();
      });

      vapi.on('error', (error: any) => {
        console.error('VAPI error:', error);
        setError(error.message || 'Call failed');
        setIsLoading(false);
        setIsConnected(false);
        setCallStatus('error');
      });

      vapi.on('speech-start', () => {
        console.log('User started speaking');
        setCallStatus('speaking');
      });

      vapi.on('speech-end', () => {
        console.log('User stopped speaking');
        setCallStatus('connected');
      });

      // Start the call with the assistant configuration
      await vapi.start({
        model: {
          provider: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 500
        },
        voice: {
          provider: '11labs',
          voiceId: 'rachel',
          stability: 0.5,
          similarityBoost: 0.8
        },
        firstMessage: "Hello! Welcome to MedMe Pharmacy. I'm your AI assistant for appointment scheduling. I can help you book, cancel, or reschedule appointments for flu shots, consultations, medication reviews, and vaccinations. How can I assist you today?",
        systemMessage: `You are a caring and professional pharmacy assistant for MedMe Pharmacy. Your role is to help patients book, cancel, and reschedule appointments with a warm, empathetic, and efficient approach.

**Your Capabilities:**
- Book appointments for: flu shots, consultations, medication reviews, and vaccinations
- Check availability for specific dates
- Cancel and reschedule existing appointments
- Provide helpful information about pharmacy services

**Your Personality:**
- Caring and respectful (never robotic)
- Patient and understanding
- Professional but friendly
- Helpful in guiding patients through the process

**Important Guidelines:**
1. Always collect required information: patient name, phone, email, appointment type, preferred date/time
2. If information is missing, ask follow-up questions politely
3. When slots are unavailable, proactively suggest the next best available options
4. For cancellations/rescheduling, verify patient identity before proceeding
5. If there are API failures, apologize and offer to connect them with staff
6. Always confirm appointment details before finalizing bookings
7. Business hours are Monday-Friday, 9 AM - 5 PM (closed weekends)

Always end interactions by confirming next steps or providing appointment details.`,
        functions: [
          {
            name: 'bookAppointment',
            description: 'Book a new pharmacy appointment',
            parameters: {
              type: 'object',
              properties: {
                patientName: { type: 'string', description: 'Full name of the patient' },
                email: { type: 'string', description: 'Patient email address' },
                phone: { type: 'string', description: 'Patient phone number' },
                appointmentType: { 
                  type: 'string', 
                  enum: ['flu_shot', 'consultation', 'medication_review', 'vaccination'],
                  description: 'Type of pharmacy appointment' 
                },
                preferredDateTime: { type: 'string', description: 'Preferred appointment date and time in ISO format' }
              },
              required: ['patientName', 'email', 'phone', 'appointmentType', 'preferredDateTime']
            }
          },
          {
            name: 'checkAvailability',
            description: 'Check available appointment slots for a specific date',
            parameters: {
              type: 'object',
              properties: {
                date: { type: 'string', description: 'Date to check availability (YYYY-MM-DD format)' }
              },
              required: ['date']
            }
          }
        ],
        serverUrl: process.env.NODE_ENV === 'production' 
          ? 'https://your-domain.com/api/vapi/webhook' 
          : 'http://localhost:3001/api/vapi/webhook'
      });

    } catch (error: any) {
      console.error('Error starting VAPI call:', error);
      setError(error.message || 'Failed to start call');
      setIsLoading(false);
    }
  };

  const endCall = async () => {
    try {
      if (vapiInstance) {
        await vapiInstance.stop();
        console.log('VAPI call ended');
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
    setIsConnected(false);
    setCallStatus('idle');
    setIsLoading(false);
    setVapiInstance(null);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Voice Call with VAPI AI
        </h3>
        <p className="text-gray-600">
          Talk directly with your VAPI assistant for appointment booking
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
            callStatus === 'speaking' ? 'bg-blue-500 animate-pulse' :
            callStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            callStatus === 'error' ? 'bg-red-500' :
            'bg-gray-300'
          }`}></div>
          <span className="capitalize">
            {callStatus === 'idle' ? 'Ready to call' : 
             callStatus === 'speaking' ? 'You are speaking' : 
             callStatus}
          </span>
        </div>

        {!isConnected ? (
          <Button
            onClick={startCall}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
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
          This connects to your VAPI assistant ({assistantId}) for real appointment booking conversations.
        </p>
      </div>
    </div>
  );
}