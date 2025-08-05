/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Phone, MessageSquare } from 'lucide-react';

interface VoiceModeToggleProps {
  onModeChange: (mode: 'voice_retell' | 'voice_vapi') => void;
  currentMode: 'voice_retell' | 'voice_vapi';
}

export function VoiceModeToggle({ onModeChange, currentMode }: VoiceModeToggleProps) {
  const [isCallActive, setIsCallActive] = useState(false);

  const handleModeChange = (mode: 'voice_retell' | 'voice_vapi') => {
    onModeChange(mode);
    // @ts-ignore
    if (mode === 'text') {
      setIsCallActive(false);
    }
  };

  const handleVoiceCall = async (provider: 'retell' | 'vapi') => {
    if (isCallActive) {
      // End call
      setIsCallActive(false);
      // @ts-ignore
      onModeChange('text');
      return;
    }

    // Simply switch to the voice mode - the widgets will handle the actual calls
    if (provider === 'retell') {
      onModeChange('voice_retell');
      setIsCallActive(true);
      console.log('Retell voice mode activated - using web widget');
    } else if (provider === 'vapi') {
      onModeChange('voice_vapi');
      setIsCallActive(true);
      console.log('VAPI voice mode activated - using web widget');
    }
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-gray-50 border-b">
      <span className="text-sm font-medium text-gray-700">Mode:</span>
      
      {/* Text Chat */}
      {/* <Button
        variant={currentMode === 'text' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleModeChange('text')}
        className="flex items-center gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        Text Chat
      </Button> */}

      {/* Retell AI Voice */}
      <Button
        variant={currentMode === 'voice_retell' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVoiceCall('retell')}
        className="flex items-center gap-2"
        disabled={isCallActive && currentMode !== 'voice_retell'}
      >
        {isCallActive && currentMode === 'voice_retell' ? (
          <>
            <MicOff className="w-4 h-4" />
            End Call
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            Retell Voice
          </>
        )}
      </Button>

      {/* VAPI AI Voice */}
      <Button
        variant={currentMode === 'voice_vapi' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVoiceCall('vapi')}
        className="flex items-center gap-2"
        disabled={isCallActive && currentMode !== 'voice_vapi'}
      >
        {isCallActive && currentMode === 'voice_vapi' ? (
          <>
            <PhoneOff className="w-4 h-4" />
            End Call
          </>
        ) : (
          <>
            <Phone className="w-4 h-4" />
            VAPI Voice
          </>
        )}
      </Button>

      {isCallActive && (
        <div className="flex items-center gap-2 ml-4">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-red-600 font-medium">Call Active</span>
        </div>
      )}
    </div>
  );
}

// Fix missing import
import { PhoneOff } from 'lucide-react';