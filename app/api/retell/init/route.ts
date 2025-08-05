import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateAgent } from '@/lib/retell-agent';

export async function POST(request: NextRequest) {
  try {
    console.log('Initializing Retell agent...');
    
    const agent = await getOrCreateAgent();
    
    console.log('Retell agent initialized successfully:', {
      agent_id: agent.agent_id,
      agent_name: agent.agent_name,
      voice_id: agent.voice_id
    });
    
    return NextResponse.json({
      success: true,
      agent: {
        id: agent.agent_id,
        name: agent.agent_name,
        voice_id: agent.voice_id,
        webhook_url: agent.webhook_url
      },
      message: 'Retell agent initialized successfully'
    });
    
  } catch (error) {
    console.error('Error initializing Retell agent:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize Retell agent',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current agent status
    const agent = await getOrCreateAgent();
    
    return NextResponse.json({
      agent: {
        id: agent.agent_id,
        name: agent.agent_name,
        voice_id: agent.voice_id,
        webhook_url: agent.webhook_url,
        status: 'active'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get agent status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}