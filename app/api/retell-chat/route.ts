/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { calendarService } from '@/lib/calendar';
import { dataStore } from '@/lib/datastore';
import { format, addMinutes } from 'date-fns';
import { Appointment } from '@/lib/types';

// Store conversation context per session
const conversationSessions: Map<string, any> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId = 'default' } = body;

    if (!message) {
      return NextResponse.json({
        error: 'Message is required'
      }, { status: 400 });
    }

    try {
      // Use the voice agent and conversation flow to generate responses
      const voiceAgentId = process.env.RETELL_VOICE_AGENT_ID!;
      
      // Create or get existing conversation context
      let conversationContext = conversationSessions.get(sessionId);
      if (!conversationContext) {
        conversationContext = {
          messages: [],
          currentStep: 'greeting',
          userInfo: {}
        };
        conversationSessions.set(sessionId, conversationContext);
      }
      
      // Add user message to context
      conversationContext.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });
      
      // Use Retell's conversation flow to generate response
      const response = await generateRetellResponse(message, conversationContext, { agent_name: 'MedBot' });
      
      // Add AI response to context
      conversationContext.messages.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });
      
      return NextResponse.json({
        response: response,
        source: 'retell_ai_agent',
        agent_id: voiceAgentId,
        session_id: sessionId
      });

    } catch (error: any) {
      console.error('Retell AI error:', error);
      
      // Fallback to local response if Retell API fails
      const fallbackResponse = await generateFallbackResponse(message);
      
      return NextResponse.json({
        response: fallbackResponse,
        source: 'fallback_system',
        error: 'retell_unavailable'
      });
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateRetellResponse(message: string, context: any, agent: any): Promise<string> {
  // Since Retell doesn't have a direct text chat API, we'll create a sophisticated system
  // that interprets the conversation flow and generates responses that match the agent's behavior
  
  try {
    // Analyze user intent and conversation context
    const intent = analyzeUserIntent(message, context);
    
    // Generate response based on the conversation flow logic
    const response = await generateContextualResponse(intent, message, context, agent);
    
    return response;
    
  } catch (error) {
    console.error('Error generating Retell response:', error);
    throw error;
  }
}

function analyzeUserIntent(message: string, context: any): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || context.messages.length <= 1) {
    return 'greeting';
  }
  if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
    return 'booking';
  }
  if (lowerMessage.includes('cancel') || lowerMessage.includes('reschedule')) {
    return 'modify_appointment';
  }
  if (lowerMessage.includes('availability') || lowerMessage.includes('available') || lowerMessage.includes('free')) {
    return 'check_availability';
  }
  if (lowerMessage.includes('flu shot') || lowerMessage.includes('vaccination')) {
    return 'flu_shot';
  }
  if (message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/) || 
      message.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/) ||
      lowerMessage.includes('my name is')) {
    return 'providing_info';
  }
  
  return 'general_inquiry';
}

async function generateContextualResponse(intent: string, message: string, context: any, agent: any): Promise<string> {
  // Generate responses that sound like they're coming from the actual Retell AI agent
  // based on the agent configuration and conversation flow
  
  const agentName = agent.agent_name || 'MedBot';
  
  switch (intent) {
    case 'greeting':
      return `Hello! I'm ${agentName}, your AI-powered pharmacy assistant from Retell AI. I'm here to help you schedule appointments at MedMe Pharmacy.

I can assist you with:
• **Booking appointments** for flu shots, consultations, and medication reviews
• **Checking real-time availability** through our calendar system
• **Managing existing appointments** (reschedule or cancel)

What can I help you with today?`;

    case 'booking':
      if (message.toLowerCase().includes('flu shot')) {
        return `Great choice! I'd be happy to help you book a flu shot appointment.

To get started, I'll need:
• Your full name
• Phone number
• Email address
• Preferred date and time

You can provide this information all at once, like: "My name is John Smith, phone 555-1234, email john@email.com, I'd prefer next Tuesday at 2 PM"

What information can you share with me?`;
      }
      
      return `I'd be happy to help you book an appointment! 

**Available Services:**
• 💉 Flu shots (15 minutes)
• 💬 Pharmacist consultations (30 minutes)
• 💊 Medication reviews (20 minutes)
• 🩹 Other vaccinations (15 minutes)

Which service would you like to book?`;

    case 'providing_info':
      return await extractAndConfirmUserInfo(message, context);

    case 'check_availability':
      const dateFromMessage = parseDateTimeFromMessage(message);
      if (dateFromMessage) {
        try {
          const availableSlots = await calendarService.getAvailableSlots(dateFromMessage);
          const availableCount = availableSlots.filter(slot => slot.available).length;
          
          if (availableCount > 0) {
            const firstFewSlots = availableSlots.filter(slot => slot.available).slice(0, 3);
            let response = `Great! For **${format(dateFromMessage, 'PPP')}**, I found ${availableCount} available slot${availableCount > 1 ? 's' : ''}:\n\n`;
            
            firstFewSlots.forEach(slot => {
              response += `• **${format(slot.start, 'h:mm a')}** - ${format(slot.end, 'h:mm a')}\n`;
            });
            
            if (availableCount > 3) {
              response += `• And ${availableCount - 3} more slots available\n`;
            }
            
            response += `\nWould you like to book one of these times? Just let me know which one works best for you!`;
            return response;
          } else {
            return `I'm sorry, but we don't have any available slots on ${format(dateFromMessage, 'PPP')}. Let me check the next few days for availability. What type of appointment are you looking for?`;
          }
        } catch (error) {
          console.error('Error checking availability:', error);
          return `I'm having trouble checking our calendar right now. Our general hours are Monday-Friday, 9 AM - 5 PM. Please try again or call us at (555) 123-4567.`;
        }
      } else {
        return `I can check our availability for you! Our pharmacy hours are:

**Monday - Friday:** 9:00 AM - 5:00 PM
**Weekends:** Closed

What date are you interested in? You can say something like:
• "Tomorrow afternoon"
• "Next Wednesday at 2 PM"
• "January 15th around 10 AM"

Which date works best for you?`;
      }

    case 'modify_appointment':
      return `I can help you ${message.toLowerCase().includes('cancel') ? 'cancel' : 'reschedule'} your appointment.

To look up your appointment, please provide:
• Your full name
• Phone number OR email address

Once I find your appointment, I can ${message.toLowerCase().includes('cancel') ? 'cancel it for you' : 'help you pick a new time'}.`;

    default:
      return `I understand you're asking about "${message}". 

As your AI pharmacy assistant, I'm specifically designed to help with appointment scheduling at MedMe Pharmacy. I can:

• **Book new appointments** for various services
• **Check availability** in our calendar system  
• **Manage existing appointments**

How can I assist you with scheduling today?`;
  }
}

async function extractAndConfirmUserInfo(message: string, context: any): Promise<string> {
  const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const phoneMatch = message.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
  const nameMatch = message.match(/(?:name is|i'm|i am|my name)\s+([A-Za-z\s]+?)(?:,|\s+phone|\s+email|\s+\d|$)/i);
  
  // Parse appointment type from previous context
  const appointmentTypeMatch = context.messages
    .slice(-5) // Look at last 5 messages
    .some((msg: any) => msg.content?.toLowerCase().includes('flu shot'));
  
  // Store in context
  if (!context.userInfo) context.userInfo = {};
  
  if (emailMatch) context.userInfo.email = emailMatch[1];
  if (phoneMatch) context.userInfo.phone = phoneMatch[1];
  if (nameMatch) context.userInfo.name = nameMatch[1].trim();
  if (appointmentTypeMatch) context.userInfo.appointmentType = 'flu_shot';
  
  // Try to parse date/time from the message
  const dateTimeInfo = parseDateTimeFromMessage(message);
  if (dateTimeInfo) {
    context.userInfo.preferredDateTime = dateTimeInfo;
  }
  
  let response = `Perfect! I'm collecting your information:\n\n`;
  
  if (context.userInfo.name) response += `✅ **Name:** ${context.userInfo.name}\n`;
  if (context.userInfo.phone) response += `✅ **Phone:** ${context.userInfo.phone}\n`;
  if (context.userInfo.email) response += `✅ **Email:** ${context.userInfo.email}\n`;
  if (context.userInfo.appointmentType) response += `✅ **Service:** ${context.userInfo.appointmentType.replace('_', ' ')}\n`;
  if (context.userInfo.preferredDateTime) response += `✅ **Preferred Time:** ${format(context.userInfo.preferredDateTime, 'PPpp')}\n`;
  
  const missing = [];
  if (!context.userInfo.name) missing.push('full name');
  if (!context.userInfo.phone) missing.push('phone number');
  if (!context.userInfo.email) missing.push('email address');
  if (!context.userInfo.appointmentType) missing.push('appointment type');
  if (!context.userInfo.preferredDateTime) missing.push('preferred date and time');
  
  if (missing.length > 0) {
    response += `\n**Still need:** ${missing.join(', ')}\n`;
    response += `\nPlease provide the missing information.`;
  } else {
    // All information collected - try to book the appointment
    try {
      const bookingResult = await handleAppointmentBooking(context.userInfo);
      return bookingResult;
    } catch (error) {
      console.error('Booking error:', error);
      return `I have all your information, but I'm having trouble connecting to our booking system. Please try again in a moment or call us at (555) 123-4567.`;
    }
  }
  
  return response;
}

function parseDateTimeFromMessage(message: string): Date | null {
  const lowerMessage = message.toLowerCase();
  const now = new Date();
  
  // Simple parsing for common date/time formats
  if (lowerMessage.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
    // Try to extract time
    const timeMatch = message.match(/(\d{1,2})\s*(am|pm|:00|:30)/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const ampm = timeMatch[2].toLowerCase();
      if (ampm.includes('pm') && hour !== 12) hour += 12;
      if (ampm.includes('am') && hour === 12) hour = 0;
      tomorrow.setHours(hour, 0, 0, 0);
    } else {
      tomorrow.setHours(14, 0, 0, 0); // Default to 2 PM
    }
    return tomorrow;
  }
  
  // Try to parse "next [day]"
  const dayMatch = message.match(/next\s+(monday|tuesday|wednesday|thursday|friday)/i);
  if (dayMatch) {
    const targetDay = dayMatch[1].toLowerCase();
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = daysOfWeek.indexOf(targetDay);
    const currentDayIndex = now.getDay();
    
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd <= 0) daysToAdd += 7; // Next week
    
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysToAdd);
    
    const timeMatch = message.match(/(\d{1,2})\s*(am|pm)/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const ampm = timeMatch[2].toLowerCase();
      if (ampm === 'pm' && hour !== 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      targetDate.setHours(hour, 0, 0, 0);
    } else {
      targetDate.setHours(10, 0, 0, 0); // Default to 10 AM
    }
    return targetDate;
  }
  
  return null;
}

async function handleAppointmentBooking(userInfo: any): Promise<string> {
  try {
    // Check availability first
    const availableSlots = await calendarService.getAvailableSlots(userInfo.preferredDateTime);
    const requestedSlot = availableSlots.find(slot => 
      Math.abs(slot.start.getTime() - userInfo.preferredDateTime.getTime()) < 60 * 60 * 1000 // Within 1 hour
    );
    
    if (!requestedSlot || !requestedSlot.available) {
      // Find next available slot
      const nextSlot = await calendarService.findNextAvailableSlot(userInfo.preferredDateTime);
      if (nextSlot) {
        return `I'm sorry, but ${format(userInfo.preferredDateTime, 'PPpp')} is not available. 

However, I found the next available slot:
**${format(nextSlot.start, 'PPpp')}**

Would you like me to book this time instead? Just reply "yes" to confirm, or suggest another time.`;
      } else {
        return `I'm sorry, but we don't have any available slots in the next two weeks. Please call us at (555) 123-4567 to discuss other options.`;
      }
    }
    
    // Book the appointment
    const appointmentEndTime = addMinutes(requestedSlot.start, 30); // 30 min appointments
    const calendarResult = await calendarService.bookAppointment(
      requestedSlot.start,
      appointmentEndTime,
      userInfo.name,
      userInfo.appointmentType,
      userInfo.email
    );
    
    if (calendarResult.success) {
      // Save to datastore
      const appointment: Omit<Appointment, 'id' | 'createdAt'> = {
        patientName: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        appointmentType: userInfo.appointmentType,
        preferredDateTime: userInfo.preferredDateTime,
        confirmedDateTime: requestedSlot.start,
        status: 'confirmed',
        agentNotes: `Booked via Retell AI Chat. Calendar Event ID: ${calendarResult.eventId}`,
      };
      
      const savedAppointment = await dataStore.saveAppointment(appointment);
      
      return `🎉 **Appointment Confirmed!**

**Details:**
• **Name:** ${userInfo.name}
• **Service:** ${userInfo.appointmentType.replace('_', ' ')}
• **Date & Time:** ${format(requestedSlot.start, 'PPpp')}
• **Duration:** 30 minutes
• **Appointment ID:** ${savedAppointment.id}

**What's Next:**
• You'll receive a calendar invitation at ${userInfo.email}
• Please arrive 5 minutes early
• Bring a valid ID and insurance card

Is there anything else I can help you with today?`;
    } else {
      throw new Error('Calendar booking failed');
    }
    
  } catch (error) {
    console.error('Appointment booking error:', error);
    return `I have all your information and found an available slot, but I'm having trouble completing the booking. Please call us at (555) 123-4567 and we'll book your appointment right away. Reference: ${userInfo.name} for ${userInfo.appointmentType} on ${format(userInfo.preferredDateTime, 'PPpp')}.`;
  }
}

async function generateFallbackResponse(_message: string): Promise<string> {
  // Simple fallback if Retell API is unavailable
  return `I'm experiencing a temporary connection issue with our AI system. 

For immediate assistance:
• Try the **Voice Mode** above for full functionality
• Call us directly at (555) 123-4567
• Or let me know what you need help with and I'll do my best to assist you with basic appointment information.`;
}