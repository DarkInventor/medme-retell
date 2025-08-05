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
    
    // Generate response based on conversation flow
    const response = await generateChatResponse(message, conversationContext);
    
    // Add AI response to context
    conversationContext.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });
    
    return NextResponse.json({
      response: response,
      source: 'medme_chat_bot',
      session_id: sessionId
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        response: "I apologize, but I'm having trouble right now. Please try again or call us at (555) 123-4567.",
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

async function generateChatResponse(message: string, context: any): Promise<string> {
  try {
    // Analyze user intent
    const intent = analyzeUserIntent(message, context);
    console.log('Detected intent:', intent, 'for message:', message);
    
    // Generate response based on intent
    return await generateContextualResponse(intent, message, context);
    
  } catch (error) {
    console.error('Error generating chat response:', error);
    return "I apologize, but I'm having trouble processing your request. How can I help you with scheduling an appointment?";
  }
}

function analyzeUserIntent(message: string, context: any): string {
  const lowerMessage = message.toLowerCase();
  
  // First message or greeting
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || context.messages.length <= 1) {
    return 'greeting';
  }
  
  // Booking related
  if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
    return 'booking';
  }
  
  // Service specific
  if (lowerMessage.includes('flu shot') || lowerMessage.includes('vaccination') || lowerMessage.includes('vaccine')) {
    return 'flu_shot';
  }
  if (lowerMessage.includes('consultation') || lowerMessage.includes('consult')) {
    return 'consultation';
  }
  if (lowerMessage.includes('medication review') || lowerMessage.includes('med review')) {
    return 'medication_review';
  }
  
  // Information providing
  if (message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/) || 
      message.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/) ||
      lowerMessage.includes('my name is') ||
      lowerMessage.includes('i am') ||
      lowerMessage.includes('i\'m')) {
    return 'providing_info';
  }
  
  // Date/time related
  if (lowerMessage.includes('tomorrow') || 
      lowerMessage.includes('today') ||
      lowerMessage.includes('monday') || lowerMessage.includes('tuesday') || 
      lowerMessage.includes('wednesday') || lowerMessage.includes('thursday') || 
      lowerMessage.includes('friday') ||
      lowerMessage.includes('am') || lowerMessage.includes('pm') ||
      lowerMessage.includes(':')) {
    return 'datetime_info';
  }
  
  // Availability check
  if (lowerMessage.includes('availability') || lowerMessage.includes('available') || lowerMessage.includes('free')) {
    return 'check_availability';
  }
  
  // Modify appointment
  if (lowerMessage.includes('cancel') || lowerMessage.includes('reschedule')) {
    return 'modify_appointment';
  }
  
  // Confirmation
  if (lowerMessage.includes('yes') || lowerMessage.includes('confirm') || lowerMessage.includes('book it')) {
    return 'confirmation';
  }
  
  return 'general_inquiry';
}

async function generateContextualResponse(intent: string, message: string, context: any): Promise<string> {
  
  switch (intent) {
    case 'greeting':
      return `Hello! 👋 I'm MedBot, your AI pharmacy assistant at MedMe Pharmacy.

I can help you with:
• **Flu shots** and vaccinations
• **Pharmacist consultations** 
• **Medication reviews**
• **Appointment scheduling**

What would you like to help you with today?`;

    case 'booking':
    case 'flu_shot':
    case 'consultation':
    case 'medication_review':
      const serviceType = intent === 'flu_shot' ? 'flu shot' : 
                         intent === 'consultation' ? 'consultation' : 
                         intent === 'medication_review' ? 'medication review' : 'appointment';
      
      if (intent !== 'booking') {
        context.userInfo.appointmentType = intent;
      }
      
      return `Great! I'd be happy to help you book ${serviceType === 'appointment' ? 'an appointment' : `a ${serviceType}`}.

To get started, I'll need:
• Your **full name**
• **Phone number**
• **Email address**
• **Preferred date and time**

You can provide this all at once like:
"My name is John Smith, phone 555-1234, email john@email.com, I'd prefer tomorrow at 2 PM"

What information can you share with me?`;

    case 'providing_info':
    case 'datetime_info':
      return await extractAndConfirmUserInfo(message, context);

    case 'check_availability':
      const dateFromMessage = parseDateTimeFromMessage(message);
      if (dateFromMessage) {
        try {
          const slots = await calendarService.getAvailableSlots(dateFromMessage);
          const availableSlots = slots.filter(slot => slot.available);
          
          if (availableSlots.length > 0) {
            const timesList = availableSlots.slice(0, 4).map(slot => format(slot.start, 'h:mm a')).join(', ');
            return `Great! For **${format(dateFromMessage, 'EEEE, MMMM do')}**, I have these available times:

${timesList}${availableSlots.length > 4 ? ` and ${availableSlots.length - 4} more slots` : ''}

Which time works best for you?`;
          } else {
            return `I'm sorry, but we don't have any openings on ${format(dateFromMessage, 'EEEE, MMMM do')}. 

Our hours are **Monday-Friday, 9 AM - 5 PM** (closed weekends).

Would you like me to check a different date?`;
          }
        } catch (error) {
          return `I'm having trouble checking our calendar right now. Our general hours are Monday-Friday, 9 AM - 5 PM. Would you like to try a specific date?`;
        }
      } else {
        return `I can check our availability! Our pharmacy hours are:

**Monday - Friday:** 9:00 AM - 5:00 PM
**Weekends:** Closed

What date are you interested in? You can say:
• "Tomorrow afternoon"
• "Next Wednesday at 2 PM" 
• "Friday morning"`;
      }

    case 'confirmation':
      if (context.userInfo && hasAllRequiredInfo(context.userInfo)) {
        return await handleAppointmentBooking(context.userInfo);
      } else {
        return `I'd be happy to confirm your appointment! Let me make sure I have all your information first.

Please provide:
• Your full name
• Phone number
• Email address
• Preferred appointment type
• Preferred date and time`;
      }

    case 'modify_appointment':
      return `I can help you ${message.toLowerCase().includes('cancel') ? 'cancel' : 'reschedule'} your appointment.

To look up your appointment, please provide:
• Your **full name**
• **Phone number** OR **email address**

Once I find your appointment, I can ${message.toLowerCase().includes('cancel') ? 'cancel it for you' : 'help you pick a new time'}.`;

    default:
      return `I understand you're asking about "${message}". 

As your pharmacy assistant, I'm here to help with:
• **Booking appointments** (flu shots, consultations, medication reviews)
• **Checking availability** 
• **Managing existing appointments**

How can I assist you with scheduling today?`;
  }
}

async function extractAndConfirmUserInfo(message: string, context: any): Promise<string> {
  // Extract information from the message
  const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const phoneMatch = message.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
  const nameMatch = message.match(/(?:name is|i'm|i am|my name)\s+([A-Za-z\s]+?)(?:,|\s+phone|\s+email|\s+\d|$)/i);
  
  // Store in context
  if (!context.userInfo) context.userInfo = {};
  
  if (emailMatch) context.userInfo.email = emailMatch[1];
  if (phoneMatch) context.userInfo.phone = phoneMatch[1];
  if (nameMatch) context.userInfo.name = nameMatch[1].trim();
  
  // Try to parse date/time
  const dateTimeInfo = parseDateTimeFromMessage(message);
  if (dateTimeInfo) {
    context.userInfo.preferredDateTime = dateTimeInfo;
  }
  
  // Infer appointment type from context
  if (!context.userInfo.appointmentType && context.messages.length > 0) {
    const recentMessages = context.messages.slice(-3);
    for (const msg of recentMessages) {
      const content = msg.content.toLowerCase();
      if (content.includes('flu shot')) {
        context.userInfo.appointmentType = 'flu_shot';
        break;
      } else if (content.includes('consultation')) {
        context.userInfo.appointmentType = 'consultation';
        break;
      } else if (content.includes('medication review')) {
        context.userInfo.appointmentType = 'medication_review';
        break;
      }
    }
  }
  
  let response = `Perfect! Let me collect your information:\n\n`;
  
  if (context.userInfo.name) response += `✅ **Name:** ${context.userInfo.name}\n`;
  if (context.userInfo.phone) response += `✅ **Phone:** ${context.userInfo.phone}\n`;
  if (context.userInfo.email) response += `✅ **Email:** ${context.userInfo.email}\n`;
  if (context.userInfo.appointmentType) response += `✅ **Service:** ${context.userInfo.appointmentType.replace('_', ' ')}\n`;
  if (context.userInfo.preferredDateTime) response += `✅ **Preferred Time:** ${format(context.userInfo.preferredDateTime, 'PPpp')}\n`;
  
  const missing = [];
  if (!context.userInfo.name) missing.push('**full name**');
  if (!context.userInfo.phone) missing.push('**phone number**');
  if (!context.userInfo.email) missing.push('**email address**');
  if (!context.userInfo.appointmentType) missing.push('**appointment type** (flu shot, consultation, or medication review)');
  if (!context.userInfo.preferredDateTime) missing.push('**preferred date and time**');
  
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
      return `I have all your information, but I'm having trouble with our booking system right now. Please call us at (555) 123-4567 and we'll book your appointment right away.

**Your details:** ${context.userInfo.name}, ${context.userInfo.phone}, ${context.userInfo.appointmentType?.replace('_', ' ')} on ${format(context.userInfo.preferredDateTime, 'PPpp')}`;
    }
  }
  
  return response;
}

function parseDateTimeFromMessage(message: string): Date | null {
  const lowerMessage = message.toLowerCase();
  const now = new Date();
  
  // Tomorrow
  if (lowerMessage.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
    const timeMatch = message.match(/(\d{1,2})\s*(am|pm)/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const ampm = timeMatch[2].toLowerCase();
      if (ampm === 'pm' && hour !== 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      tomorrow.setHours(hour, 0, 0, 0);
    } else {
      tomorrow.setHours(14, 0, 0, 0); // Default 2 PM
    }
    return tomorrow;
  }
  
  // Next [day]
  const dayMatch = message.match(/next\s+(monday|tuesday|wednesday|thursday|friday)/i);
  if (dayMatch) {
    const targetDay = dayMatch[1].toLowerCase();
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = daysOfWeek.indexOf(targetDay);
    const currentDayIndex = now.getDay();
    
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd <= 0) daysToAdd += 7;
    
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
      targetDate.setHours(10, 0, 0, 0); // Default 10 AM
    }
    return targetDate;
  }
  
  return null;
}

function hasAllRequiredInfo(userInfo: any): boolean {
  return !!(userInfo.name && userInfo.phone && userInfo.email && userInfo.appointmentType && userInfo.preferredDateTime);
}

async function handleAppointmentBooking(userInfo: any): Promise<string> {
  try {
    // Check availability first (using mock for demo)
    const mockAvailable = Math.random() > 0.3; // 70% chance available
    
    if (!mockAvailable) {
      return `I'm sorry, but ${format(userInfo.preferredDateTime, 'PPpp')} is not available. 

Our next available slots are:
• **${format(addMinutes(userInfo.preferredDateTime, 60), 'PPpp')}**
• **${format(addMinutes(userInfo.preferredDateTime, 120), 'PPpp')}**

Would you like me to book one of these times instead?`;
    }
    
    // Save appointment to datastore
    const appointment: Omit<Appointment, 'id' | 'createdAt'> = {
      patientName: userInfo.name,
      email: userInfo.email,
      phone: userInfo.phone,
      appointmentType: userInfo.appointmentType,
      preferredDateTime: userInfo.preferredDateTime,
      confirmedDateTime: userInfo.preferredDateTime,
      status: 'confirmed',
      agentNotes: `Booked via MedBot Chat Assistant`,
    };
    
    const savedAppointment = await dataStore.saveAppointment(appointment);
    
    return `🎉 **Appointment Confirmed!**

**Details:**
• **Name:** ${userInfo.name}
• **Service:** ${userInfo.appointmentType.replace('_', ' ')}
• **Date & Time:** ${format(userInfo.preferredDateTime, 'PPpp')}
• **Duration:** 30 minutes
• **Confirmation #:** ${savedAppointment.id}

**What's Next:**
• Please arrive 5 minutes early
• Bring valid ID and insurance card
• Call (555) 123-4567 if you need to make changes

Is there anything else I can help you with today?`;
    
  } catch (error) {
    console.error('Appointment booking error:', error);
    return `I have all your information and the slot looks available, but I'm having trouble completing the booking right now. 

Please call us at **(555) 123-4567** and mention:
• **Name:** ${userInfo.name}
• **Service:** ${userInfo.appointmentType?.replace('_', ' ')}
• **Preferred time:** ${format(userInfo.preferredDateTime, 'PPpp')}

Our staff will book this for you right away!`;
  }
}