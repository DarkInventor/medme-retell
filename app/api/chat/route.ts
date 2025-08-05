import { NextRequest, NextResponse } from 'next/server';
import { firebaseDataStore } from '@/lib/firebase-datastore';
import { googleCalendarService } from '@/lib/google-calendar';
import { format, parseISO, isValid, addDays } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, user_id } = body;

    if (!message) {
      return NextResponse.json({
        error: 'Message is required'
      }, { status: 400 });
    }

    // Process the message and generate a response
    const response = await processUserMessage(message.toLowerCase(), user_id);
    
    return NextResponse.json({
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processUserMessage(message: string, userId?: string): Promise<string> {
  // Book appointments
  if (message.includes('book') || message.includes('schedule') || message.includes('appointment')) {
    if (message.includes('flu shot') || message.includes('flu')) {
      return "Perfect! I'd love to help you book a flu shot appointment. 💉\n\nTo get started, I'll need:\n📋 **Your Information:**\n• Full name\n• Phone number  \n• Email address\n• Preferred date and time\n\nOur flu shots are available Monday-Friday, 9 AM to 5 PM. What date works best for you?\n\n*Example: \"My name is John Smith, phone 555-1234, email john@email.com, I'd like a flu shot on January 15th at 2 PM\"*";
    }
    
    if (message.includes('consultation')) {
      return "Great choice! I can help you book a pharmacy consultation. 💬\n\nFor your consultation appointment, I'll need:\n📋 **Your Details:**\n• Full name\n• Phone number\n• Email address  \n• Preferred date and time\n• Brief description of what you'd like to discuss\n\nConsultations are available Monday-Friday, 9 AM to 5 PM. When would work best for you?";
    }
    
    return "I'd be happy to help you book an appointment! 📅\n\n**Available Services:**\n💉 **Flu Shots** - Quick and convenient\n💬 **Consultations** - Health discussions with our pharmacist\n💊 **Medication Reviews** - Review your current medications  \n🩹 **Vaccinations** - Various immunizations\n\nWhich service interests you? I'll also need your name, phone, email, and preferred time.";
  }

  // Check availability
  if (message.includes('available') || message.includes('availability') || message.includes('free') || message.includes('open')) {
    return "I can check our availability for you! 📅\n\n**How to tell me your preferred date:**\n• Specific date: \"January 15th\" or \"01/15/2025\"\n• Relative: \"tomorrow\", \"next Tuesday\", \"this week\"\n\n🕘 **Our Hours:** Monday-Friday, 9 AM to 5 PM\n🚫 **Closed:** Weekends\n\nWhat date are you interested in?";
  }

  // Cancel appointments  
  if (message.includes('cancel')) {
    return "I can help you cancel your appointment. ❌\n\nTo look up your appointment, I'll need:\n🔍 **Either:**\n• Your appointment confirmation number, OR\n• Your full name and phone number\n\nWhich would you prefer to provide?";
  }

  // Reschedule
  if (message.includes('reschedule') || message.includes('change') || message.includes('move')) {
    return "I can help you reschedule your appointment! 🔄\n\nPlease provide:\n📝 **Required:**\n• Your appointment confirmation number OR full name\n• Your preferred new date and time\n\nI'll check availability and update that for you.";
  }

  // Greetings
  if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message.includes('good morning') || message.includes('good afternoon')) {
    return "Hello! Welcome to MedMe Pharmacy! 👋\n\nI'm your AI assistant for appointment scheduling. I can help you:\n\n✅ **Book new appointments**\n✅ **Check availability**  \n✅ **Cancel appointments**\n✅ **Reschedule appointments**\n\n💉 **Services:** Flu shots, consultations, medication reviews, and vaccinations\n\nHow can I assist you today?";
  }

  // Help
  if (message.includes('help') || message.includes('what can you do')) {
    return "I'm here to make appointment scheduling easy! 🤖\n\n📅 **What I can do:**\n• **Book appointments** - Tell me the service and preferred time\n• **Check availability** - I'll show you open slots\n• **Cancel appointments** - Provide confirmation number or name\n• **Reschedule appointments** - Give me your details and new time\n\n**Available Services:**\n💉 Flu shots\n💬 Health consultations\n💊 Medication reviews  \n🩹 Various vaccinations\n\n**Example:** \"Book a flu shot for John Smith, 555-1234, john@email.com, January 15th at 2 PM\"\n\nWhat would you like to do?";
  }

  // Hours
  if (message.includes('hours') || message.includes('open') || message.includes('closed') || message.includes('time')) {
    return "🕘 **MedMe Pharmacy Hours:**\n\n**Monday - Friday:** 9:00 AM - 5:00 PM\n**Weekends:** Closed\n\nAppointments can be scheduled during business hours. Would you like to book an appointment?";
  }

  // Try to extract appointment details if the message contains contact info
  if (message.includes('@') || message.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/)) {
    return await handleAppointmentBooking(message);
  }

  // Default response
  return "I'm here to help you with appointment scheduling at MedMe Pharmacy! 🏥\n\n**Quick Examples:**\n• \"Book a flu shot appointment\"\n• \"Check availability for tomorrow\"  \n• \"Cancel my appointment\"\n• \"What are your hours?\"\n\nWhat can I help you with today?";
}

async function handleAppointmentBooking(message: string): Promise<string> {
  try {
    // Extract information using regex patterns
    const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const phoneMatch = message.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
    const nameMatch = message.match(/(?:name is|i'm|i am)\s+([A-Za-z\s]+?)(?:,|\s+phone|\s+email|\s+\d|$)/i);
    
    const email = emailMatch ? emailMatch[1] : null;
    const phone = phoneMatch ? phoneMatch[1] : null;
    const name = nameMatch ? nameMatch[1].trim() : null;

    if (!email || !phone || !name) {
      return "I can see you're trying to book an appointment! I have some of your details, but I need:\n\n📋 **Complete Information:**\n• Full name\n• Phone number\n• Email address\n• Appointment type (flu shot, consultation, etc.)\n• Preferred date and time\n\n*Please provide any missing details.*";
    }

    // For now, return confirmation that we got the info
    // In a real implementation, this would integrate with your calendar system
    return `Great! I have your information:\n\n📋 **Details Received:**\n• Name: ${name}\n• Phone: ${phone}\n• Email: ${email}\n\nNow I need:\n• **Appointment type** (flu shot, consultation, medication review, or vaccination)\n• **Preferred date and time**\n\nExample: \"Flu shot on January 15th at 2 PM\"\n\nWhat type of appointment and when would you prefer?`;

  } catch (error) {
    console.error('Error handling appointment booking:', error);
    return "I encountered an issue processing your appointment request. Please try again or call us directly at (555) 123-4567.";
  }
}