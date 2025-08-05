import { NextRequest, NextResponse } from 'next/server';
import { vapiClient } from '@/lib/vapi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, phone_number } = body;

    if (type === 'web_call') {
      // Create a web call for voice chat in browser
      const call = await vapiClient.createWebCall();
      return NextResponse.json({
        success: true,
        call_id: call.id,
        web_call_url: call.webCallUrl,
        public_key: vapiClient.getPublicKey()
      });
    }

    if (type === 'phone_call' && phone_number) {
      // Create a phone call
      const call = await vapiClient.createCall(phone_number);
      return NextResponse.json({
        success: true,
        call_id: call.id,
        status: call.status
      });
    }

    return NextResponse.json({
      error: 'Invalid request type'
    }, { status: 400 });

  } catch (error) {
    console.error('VAPI API error:', error);
    return NextResponse.json(
      { error: 'Failed to create voice call' },
      { status: 500 }
    );
  }
}