/* eslint-disable @typescript-eslint/no-namespace */
'use client';

import { useEffect } from 'react';

interface VAPIWidgetProps {
  assistantId: string;
  publicKey: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export function VAPIWidget({ assistantId, publicKey, onCallStart, onCallEnd }: VAPIWidgetProps) {
  useEffect(() => {
    // Load VAPI Widget script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js';
    script.async = true;
    script.type = 'text/javascript';
    
    script.onload = () => {
      console.log('VAPI script loaded');
    };

    script.onerror = () => {
      console.error('Failed to load VAPI script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="vapi-widget-container w-full h-full">
      {/* @ts-expect-error ignore this line */}
      <vapi-widget 
        assistant-id={assistantId}
        public-key={publicKey}
        className="w-full h-full"
      />
    </div>
  );
}

// Extend JSX namespace for custom elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'vapi-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'assistant-id': string;
        'public-key': string;
      };
    }
  }
}