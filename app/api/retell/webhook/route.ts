/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/google-calendar';
import { firebaseDataStore } from '@/lib/firebase-datastore';
import { format, parseISO, isValid } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Retell webhook received:', JSON.stringify(body, null, 2));
    
    // Handle function calls from Retell agent
    if (body.type === 'function_call') {
      return await handleFunctionCall(body);
    }
    
    // Handle other webhook events (call_started, call_ended, etc.)
    if (body.type === 'call_started') {
      console.log('Call started:', body.call_id);
      return NextResponse.json({ received: true });
    }
    
    if (body.type === 'call_ended') {
      console.log('Call ended:', body.call_id, 'Duration:', body.call_analysis?.call_duration_ms);
      return NextResponse.json({ received: true });
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleFunctionCall(body: {
  call_id: string;
  function_name: string;
  parameters: Record<string, unknown>;
  function_call_id: string;
}) {
  const { function_name, parameters, function_call_id } = body;
  
  console.log(`Executing function: ${function_name}`, parameters);

  try {
    let result: any;

    switch (function_name) {
      case 'check_availability':
        result = await checkAvailability(parameters as { date: string });
        break;
      
      case 'book_appointment':
        result = await bookAppointment(parameters as {
          patient_name: string;
          email: string;
          phone: string;
          appointment_type: string;
          preferred_datetime: string;
        });
        break;
      
      case 'find_appointment':
        result = await findAppointment(parameters as {
          patient_name: string;
          phone?: string;
          email?: string;
        });
        break;
      
      case 'cancel_appointment':
        result = await cancelAppointment(parameters as {
          appointment_id?: string;
          patient_name?: string;
        });
        break;
      
      case 'reschedule_appointment':
        result = await rescheduleAppointment(parameters as {
          appointment_id?: string;
          patient_name?: string;
          new_datetime: string;
        });
        break;
      
      default:
        result = {
          success: false,
          message: 'Unknown function requested',
        };
    }

    return NextResponse.json({
      function_call_id,
      result: result.message || result.result || JSON.stringify(result),
    });

  } catch (error) {
    console.error(`Error executing function ${function_name}:`, error);
    
    return NextResponse.json({
      function_call_id,
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
        available_slots: availableSlots.map(slot => ({
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
          suggested_slot: nextSlot.start.toISOString()
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
  patient_name: string;
  email: string;
  phone: string;
  appointment_type: string;
  preferred_datetime: string;
}) {
  try {
    const { patient_name, email, phone, appointment_type, preferred_datetime } = parameters;
    
    const appointmentDate = parseISO(preferred_datetime);
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
          suggested_slot: nextSlot.start.toISOString()
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
      patient_name,
      appointment_type,
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
      patientName: patient_name,
      email,
      phone,
      appointmentType: appointment_type as 'flu_shot' | 'consultation' | 'medication_review' | 'vaccination',
      preferredDateTime: appointmentDate,
      confirmedDateTime: availableSlot.start,
      status: 'confirmed',
      agentNotes: `Appointment booked via Retell AI agent. Calendar Event ID: ${calendarResult.eventId}`
    });

    const appointmentTypeFormatted = appointment_type.replace('_', ' ');
    
    return {
      success: true,
      message: `Perfect! I've successfully booked your ${appointmentTypeFormatted} appointment for ${format(availableSlot.start, 'EEEE, MMMM do \'at\' h:mm a')}. Your appointment confirmation number is ${appointment.id}. You'll receive a calendar invitation at ${email}. Is there anything else I can help you with today?`,
      appointment_id: appointment.id,
      confirmed_datetime: availableSlot.start.toISOString()
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
  patient_name: string;
  phone?: string;
  email?: string;
}) {
  try {
    const { patient_name, phone, email } = parameters;
    
    const appointment = await firebaseDataStore.findAppointmentByPatient(patient_name, phone, email);
    
    if (!appointment) {
      return {
        success: false,
        message: `I couldn't find any appointments under the name ${patient_name}${phone ? ` with phone number ${phone}` : ''}. Could you please double-check the spelling of your name${!phone ? ' and provide your phone number' : ''}? Or you can call our pharmacy directly at (555) 123-4567.`
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
  appointment_id?: string;
  patient_name?: string;
}) {
  try {
    const { appointment_id, patient_name } = parameters;
    
    let appointment;
    if (appointment_id) {
      appointment = await firebaseDataStore.findAppointmentById(appointment_id);
    } else if (patient_name) {
      appointment = await firebaseDataStore.findAppointmentByPatient(patient_name);
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
      agentNotes: (appointment.agentNotes || '') + ` | Cancelled via Retell AI agent on ${format(new Date(), 'yyyy-MM-dd HH:mm')}`
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

async function rescheduleAppointment(parameters: {
  appointment_id?: string;
  patient_name?: string;
  new_datetime: string;
}) {
  try {
    const { appointment_id, patient_name, new_datetime } = parameters;
    
    let appointment;
    if (appointment_id) {
      appointment = await firebaseDataStore.findAppointmentById(appointment_id);
    } else if (patient_name) {
      appointment = await firebaseDataStore.findAppointmentByPatient(patient_name);
    } else {
      return {
        success: false,
        message: 'To reschedule your appointment, I\'ll need either your appointment confirmation number or your full name. Could you please provide one of those?'
      };
    }

    if (!appointment) {
      return {
        success: false,
        message: 'I couldn\'t locate that appointment. Please double-check your confirmation number or name, or call our pharmacy directly at (555) 123-4567 for assistance.'
      };
    }

    const newDate = parseISO(new_datetime);
    if (!isValid(newDate)) {
      return {
        success: false,
        message: 'I apologize, but there seems to be an issue with the new date format. Could you please tell me your preferred new date and time again?'
      };
    }

    // Check if new slot is available
    const slots = await googleCalendarService.getAvailableSlots(newDate);
    const requestedHour = newDate.getHours();
    const availableSlot = slots.find(slot => 
      slot.start.getHours() === requestedHour && slot.available
    );

    if (!availableSlot) {
      const nextSlot = await googleCalendarService.findNextAvailableSlot(newDate);
      if (nextSlot) {
        return {
          success: false,
          message: `I'm sorry, but that new time slot isn't available. The next available appointment is ${format(nextSlot.start, 'EEEE, MMMM do \'at\' h:mm a')}. Would you like me to reschedule to that time instead?`,
          suggested_slot: nextSlot.start.toISOString()
        };
      } else {
        return {
          success: false,
          message: 'I apologize, but we don\'t have any available slots in the next two weeks. Would you prefer to keep your current appointment, or shall I connect you with our staff to discuss other options?'
        };
      }
    }

    // Update appointment
    await firebaseDataStore.updateAppointment(appointment.id!, {
      confirmedDateTime: availableSlot.start,
      status: 'rescheduled',
      agentNotes: (appointment.agentNotes || '') + ` | Rescheduled via Retell AI agent on ${format(new Date(), 'yyyy-MM-dd HH:mm')}`
    });

    const appointmentTypeFormatted = appointment.appointmentType.replace('_', ' ');
    
    return {
      success: true,
      message: `Perfect! I've successfully rescheduled your ${appointmentTypeFormatted} appointment to ${format(availableSlot.start, 'EEEE, MMMM do \'at\' h:mm a')}. You'll receive an updated calendar invitation. Is there anything else I can help you with today?`,
      new_datetime: availableSlot.start.toISOString()
    };

  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return {
      success: false,
      message: 'I apologize, but I encountered an issue while rescheduling your appointment. Please call our pharmacy directly at (555) 123-4567 for immediate assistance.'
    };
  }
}