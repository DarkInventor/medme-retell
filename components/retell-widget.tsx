'use client';

import { useEffect, useRef } from 'react';

interface RetellWidgetProps {
  agentId: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export function RetellWidget({ agentId, onCallStart, onCallEnd }: RetellWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Retell Web Widget script
    const script = document.createElement('script');
    script.src = 'https://cdn.retellai.com/web-widget/retell-web-widget.js';
    script.async = true;
    
    script.onload = () => {
      // Initialize Retell Widget
      if (window.RetellWebWidget && widgetRef.current) {
        window.RetellWebWidget.create({
          agentId: agentId,
          containerId: widgetRef.current.id,
          onCallStart: onCallStart,
          onCallEnd: onCallEnd,
          theme: {
            primaryColor: '#2563eb',
            backgroundColor: '#ffffff',
            textColor: '#374151'
          }
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [agentId, onCallStart, onCallEnd]);

  return (
    <div className="retell-widget-container">
      <div 
        id="retell-web-widget" 
        ref={widgetRef}
        className="w-full h-[400px] border rounded-lg"
      />
    </div>
  );
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    RetellWebWidget: any;
  }
}