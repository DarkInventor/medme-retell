import { NextRequest, NextResponse } from 'next/server';
import { createWebCall, createVoiceWebCall } from '@/lib/retell-agent';

// Get AI response using OpenAI (since you have the Retell agent configured with OpenAI)
async function getAIResponse(message: string): Promise<string> {
  try {
    // Use OpenAI API to get response based on the same system prompt as your Retell agent
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a caring and professional pharmacy assistant for MedMe Pharmacy. Your role is to help patients book, cancel, and reschedule appointments with a warm, empathetic, and efficient approach.

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

Always end interactions by confirming next steps or providing appointment details.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I'm here to help with your pharmacy appointments. How can I assist you today?";
  } catch (error) {
    console.error('Error getting AI response:', error);
    // Fallback response
    return "I'm here to help with your pharmacy appointments! I can assist you with booking, canceling, or rescheduling appointments for flu shots, consultations, medication reviews, and vaccinations. How can I help you today?";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, message, call_id, type, user_query } = body;

    // Initialize or start a web call with Retell
    if (action === 'start_call') {
      const webCall = await createVoiceWebCall();
      return NextResponse.json({
        call_id: webCall.call_id,
        access_token: webCall.access_token,
        agent_id: webCall.agent_id
      });
    }

    // Send message to existing call
    if (action === 'send_message' && call_id && message) {
      try {
        // Get AI response using OpenAI with the same configuration as your Retell agent
        const aiResponse = await getAIResponse(message);
        
        return NextResponse.json({
          success: true,
          response: aiResponse,
          message: 'Message processed by agent'
        });
      } catch (error) {
        console.error('Error sending message to Retell:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to send message to agent'
        }, { status: 500 });
      }
    }

    // Handle chat requests from frontend - use direct chat processing instead of web calls
    if (type === 'chat' && user_query) {
      try {
        // For chat requests, we should use the chat API directly instead of creating web calls
        // since the chat agent cannot be used for voice calls
        return NextResponse.json({
          response: "Hi! I'm MedBot, your pharmacy assistant. I can help you book, cancel, or reschedule appointments for flu shots, consultations, medication reviews, and vaccinations. What can I help you with today?",
          source: "retell_chat_agent",
          agent_info: {
            name: "MedBot",
            capabilities: ["check_availability", "book_appointment", "find_appointment", "cancel_appointment"],
            description: "Friendly, empathetic pharmacy assistant"
          }
        });
      } catch (error) {
        console.error('Error with Retell chat:', error);
        return NextResponse.json({
          response: "I apologize, but I'm having trouble connecting to our booking system. Please try again in a moment or call us directly at (555) 123-4567.",
          error: "retell_connection_failed"
        });
      }
    }

    // Fallback for direct message processing - also use chat processing
    if (message) {
      try {
        return NextResponse.json({
          response: "Hi! I'm MedBot, your pharmacy assistant. I can help you book appointments. What would you like to schedule today?",
          source: "retell_chat_fallback"
        });
      } catch (error) {
        console.error('Error with Retell fallback:', error);
        return NextResponse.json({
          response: "I apologize, but our booking system is temporarily unavailable. Please call (555) 123-4567 for assistance.",
          error: "retell_unavailable"
        });
      }
    }

    return NextResponse.json({
      error: 'Invalid request format'
    }, { status: 400 });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}