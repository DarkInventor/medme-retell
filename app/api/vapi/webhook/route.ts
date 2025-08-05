/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/google-calendar';
import { firebaseDataStore } from '@/lib/firebase-datastore';
import { format, parseISO, isValid } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('VAPI webhook received:', JSON.stringify(body, null, 2));
    
    // Handle function calls from VAPI assistant
    if (body.message?.type === 'function-call') {
      return await handleFunctionCall(body);
    }
    
    // Handle other webhook events (call started, ended, etc.)
    if (body.message?.type === 'conversation-update') {
      console.log('VAPI conversation update:', body.message);
      return NextResponse.json({ received: true });
    }
    
    if (body.message?.type === 'status-update') {
      console.log('VAPI status update:', body.message.status);
      return NextResponse.json({ received: true });
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('VAPI webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleFunctionCall(body: {
  message: {
    type: 'function-call';
    functionCall: {
      name: string;
      parameters: Record<string, unknown>;
    };
  };
  call?: { id: string };
}) {
  const { functionCall } = body.message;
  const { name: functionName, parameters } = functionCall;
  
  console.log(`Executing VAPI function: ${functionName}`, parameters);

  try {
    let result: any;

    switch (functionName) {
      case 'checkAvailability':
        result = await checkAvailability(parameters as { date: string });
        break;
      
      case 'bookAppointment':
        result = await bookAppointment(parameters as {
          patientName: string;
          email: string;
          phone: string;
          appointmentType: string;
          preferredDateTime: string;
        });
        break;
      
      case 'findAppointment':
        result = await findAppointment(parameters as {
          patientName: string;
          phone?: string;
          email?: string;
        });
        break;
      
      case 'cancelAppointment':
        result = await cancelAppointment(parameters as {
          appointmentId?: string;
          patientName?: string;
        });
        break;
      
      default:
        result = {
          success: false,
          message: 'I apologize, but I don\'t recognize that function. How can I help you with appointment scheduling?',
        };
    }

    return NextResponse.json({
      result: result.message || result.result || JSON.stringify(result),
    });

  } catch (error) {
    console.error(`Error executing VAPI function ${functionName}:`, error);
    
    return NextResponse.json({
      result: 'I apologize, but I encountered a technical issue. Please try again or contact our pharmacy directly at (555) 123-4567 for assistance.',
    });
  }
}

async function checkAvailability(parameters: { date: string }) {
  try {
    const { date } = parameters;
    const targetDate = parseISO(date);
    
    if (!isValid(targetDate)) {
      return {
        success: false,
        message: 'I apologize, but that date format isn\'t valid. Could you please provide the date in a format like "January 15th" or "01/15/2025"?'
      };
    }

    // Check if it's a weekend
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        success: false,
        message: `I'm sorry, but we're closed on weekends. Our pharmacy is open Monday through Friday, 9 AM to 5 PM. Would you like to check availability for a weekday instead?`
      };
    }

    const slots = await googleCalendarService.getAvailableSlots(targetDate);
    const availableSlots = slots.filter(slot => slot.available);

    if (availableSlots.length > 0) {
      const timesList = availableSlots.map(slot => format(slot.start, 'h:mm a')).join(', ');
      return {
        success: true,
        message: `Great! I have several available slots on ${format(targetDate, 'EEEE, MMMM do')}: ${timesList}. Which time works best for you?`,
        availableSlots: availableSlots.map(slot => ({
          start: slot.start.toISOString(),
          end: slot.end.toISOString()
        }))
      };
    } else {
      // Find next available day
      const nextSlot = await googleCalendarService.findNextAvailableSlot(targetDate);
      if (nextSlot) {
        return {
          success: false,
          message: `I'm sorry, but we don't have any openings on ${format(targetDate, 'EEEE, MMMM do')}. However, I do have availability on ${format(nextSlot.start, 'EEEE, MMMM do \'at\' h:mm a')}. Would that work for you?`,
          suggestedSlot: nextSlot.start.toISOString()
        };
      } else {
        return {
          success: false,
          message: "I'm sorry, but our schedule is quite full for the next two weeks. Let me connect you with our staff who can help find alternative options. Please call us directly at (555) 123-4567."
        };
      }
    }
  } catch (error) {
    console.error('Error checking availability:', error);
    return {
      success: false,
      message: 'I apologize, but I\'m having trouble accessing our calendar right now. Please try again in a moment, or call our pharmacy directly at (555) 123-4567.'
    };
  }
}

async function bookAppointment(parameters: {
  patientName: string;
  email: string;
  phone: string;
  appointmentType: string;
  preferredDateTime: string;
}) {
  try {
    const { patientName, email, phone, appointmentType, preferredDateTime } = parameters;
    
    const appointmentDate = parseISO(preferredDateTime);
    if (!isValid(appointmentDate)) {
      return {
        success: false,
        message: 'I apologize, but there seems to be an issue with the date format. Could you please tell me your preferred date and time again?'
      };
    }

    // Check if slot is available
    const slots = await googleCalendarService.getAvailableSlots(appointmentDate);
    const requestedHour = appointmentDate.getHours();
    const availableSlot = slots.find(slot => 
      slot.start.getHours() === requestedHour && slot.available
    );

    if (!availableSlot) {
      const nextSlot = await googleCalendarService.findNextAvailableSlot(appointmentDate);
      if (nextSlot) {
        return {
          success: false,
          message: `I'm sorry, but that time slot is no longer available. The next available appointment is ${format(nextSlot.start, 'EEEE, MMMM do \'at\' h:mm a')}. Would you like me to book that instead?`,
          suggestedSlot: nextSlot.start.toISOString()
        };
      } else {
        return {
          success: false,
          message: 'I apologize, but we don\'t have any available slots in the next two weeks. Let me connect you with our staff to discuss other options. Please call us at (555) 123-4567.'
        };
      }
    }

    // Book in Google Calendar
    const calendarResult = await googleCalendarService.bookAppointment(
      availableSlot.start,
      availableSlot.end,
      patientName,
      appointmentType,
      email
    );

    if (!calendarResult.success) {
      return {
        success: false,
        message: 'I encountered an issue while booking your appointment in our calendar. Please try again or call us directly at (555) 123-4567.'
      };
    }

    // Save to Firebase
    const appointment = await firebaseDataStore.saveAppointment({
      patientName,
      email,
      phone,
      appointmentType: appointmentType as 'flu_shot' | 'consultation' | 'medication_review' | 'vaccination',
      preferredDateTime: appointmentDate,
      confirmedDateTime: availableSlot.start,
      status: 'confirmed',
      agentNotes: `Appointment booked via VAPI AI agent. Calendar Event ID: ${calendarResult.eventId}`
    });

    const appointmentTypeFormatted = appointmentType.replace('_', ' ');
    
    return {
      success: true,
      message: `Perfect! I've successfully booked your ${appointmentTypeFormatted} appointment for ${format(availableSlot.start, 'EEEE, MMMM do \'at\' h:mm a')}. Your appointment confirmation number is ${appointment.id}. You'll receive a calendar invitation at ${email}. Is there anything else I can help you with today?`,
      appointmentId: appointment.id,
      confirmedDateTime: availableSlot.start.toISOString()
    };

  } catch (error) {
    console.error('Error booking appointment:', error);
    return {
      success: false,
      message: 'I apologize, but I encountered an issue while booking your appointment. Please try again or contact our pharmacy directly at (555) 123-4567.'
    };
  }
}

async function findAppointment(parameters: {
  patientName: string;
  phone?: string;
  email?: string;
}) {
  try {
    const { patientName, phone, email } = parameters;
    
    const appointment = await firebaseDataStore.findAppointmentByPatient(patientName, phone, email);
    
    if (!appointment) {
      return {
        success: false,
        message: `I couldn't find any appointments under the name ${patientName}${phone ? ` with phone number ${phone}` : ''}. Could you please double-check the spelling of your name${!phone ? ' and provide your phone number' : ''}?`
      };
    }

    const datetime = appointment.confirmedDateTime || appointment.preferredDateTime;
    const appointmentTypeFormatted = appointment.appointmentType.replace('_', ' ');
    
    return {
      success: true,
      message: `I found your appointment! You have a ${appointmentTypeFormatted} scheduled for ${format(datetime, 'EEEE, MMMM do \'at\' h:mm a')}. Your appointment confirmation number is ${appointment.id}. The status is ${appointment.status}. Would you like to make any changes to this appointment?`,
      appointment: {
        id: appointment.id,
        type: appointment.appointmentType,
        datetime: datetime.toISOString(),
        status: appointment.status
      }
    };

  } catch (error) {
    console.error('Error finding appointment:', error);
    return {
      success: false,
      message: 'I apologize, but I\'m having trouble accessing our appointment system right now. Please try again in a moment or call our pharmacy directly at (555) 123-4567.'
    };
  }
}

async function cancelAppointment(parameters: {
  appointmentId?: string;
  patientName?: string;
}) {
  try {
    const { appointmentId, patientName } = parameters;
    
    let appointment;
    if (appointmentId) {
      appointment = await firebaseDataStore.findAppointmentById(appointmentId);
    } else if (patientName) {
      appointment = await firebaseDataStore.findAppointmentByPatient(patientName);
    } else {
      return {
        success: false,
        message: 'To cancel your appointment, I\'ll need either your appointment confirmation number or your full name. Could you please provide one of those?'
      };
    }

    if (!appointment) {
      return {
        success: false,
        message: 'I couldn\'t locate that appointment. Please double-check your confirmation number or name, or call our pharmacy directly at (555) 123-4567 for assistance.'
      };
    }

    // Update appointment status
    await firebaseDataStore.updateAppointment(appointment.id!, {
      status: 'cancelled',
      agentNotes: (appointment.agentNotes || '') + ` | Cancelled via VAPI AI agent on ${format(new Date(), 'yyyy-MM-dd HH:mm')}`
    });

    const datetime = appointment.confirmedDateTime || appointment.preferredDateTime;
    const appointmentTypeFormatted = appointment.appointmentType.replace('_', ' ');
    
    return {
      success: true,
      message: `I've successfully cancelled your ${appointmentTypeFormatted} appointment that was scheduled for ${format(datetime, 'EEEE, MMMM do \'at\' h:mm a')}. If you need to schedule a new appointment, I'm happy to help you find an available time. Is there anything else I can assist you with?`
    };

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return {
      success: false,
      message: 'I apologize, but I encountered an issue while cancelling your appointment. Please call our pharmacy directly at (555) 123-4567 for immediate assistance.'
    };
  }
}