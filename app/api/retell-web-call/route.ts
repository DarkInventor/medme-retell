/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/retell';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create_web_call') {
      // Create a web call for browser-based voice interaction
      const voiceAgentId = process.env.RETELL_VOICE_AGENT_ID!;
      
      try {
        // For voice calls via web - updated to use correct API method
        const call = await client.call.createWebCall({
          agent_id: voiceAgentId
        });

        return NextResponse.json({
          success: true,
          call_id: call.call_id,
          access_token: call.access_token,
          // @ts-expect-error ignore this line 
          web_call_url: call.web_call_url,
          agent_id: voiceAgentId
        });

      } catch (retellError: any) {
        console.error('Retell web call error:', retellError);
        
        return NextResponse.json({
          success: false,
          error: retellError.message || 'Failed to create web call',
          error_type: 'retell_api_error'
        }, { status: 400 });
      }
    }

    if (action === 'create_phone_call') {
      // Create a phone call
      const { phone_number } = body;
      
      if (!phone_number) {
        return NextResponse.json({
          error: 'Phone number is required'
        }, { status: 400 });
      }

      try {
        // @ts-expect-error ignore this line 
        const call = await client.call.create({
          from_number: '+1234567890', // Your Retell phone number
          to_number: phone_number,
          agent_id: process.env.RETELL_VOICE_AGENT_ID!,
          metadata: {
            call_type: 'outbound',
            source: 'medme_pharmacy'
          }
        });

        return NextResponse.json({
          success: true,
          call_id: call.call_id,
          status: 'initiated'
        });

      } catch (retellError: any) {
        console.error('Retell phone call error:', retellError);
        return NextResponse.json({
          success: false,
          error: retellError.message || 'Failed to create phone call'
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Retell web call API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}