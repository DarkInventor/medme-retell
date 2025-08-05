/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from 'googleapis';
import { addHours, format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { TimeSlot, CalendarAvailability } from './types';

const GOOGLE_CLIENT_ID = '480478905629-r1iosri24cjpfm9p1ilpo3krk1v1iqjm.apps.googleusercontent.com';

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export class GoogleCalendarService {
  private calendar: any;
  private auth: any;

  constructor() {
    // Initialize OAuth2 client
    this.auth = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000'
    );

    // Set refresh token if available
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      this.auth.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });
    }

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  async initializeWithAccessToken(accessToken: string) {
    this.auth.setCredentials({
      access_token: accessToken
    });
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  async getAvailableSlots(date: Date, calendarId: string = 'primary'): Promise<TimeSlot[]> {
    try {
      const startTime = startOfDay(date);
      const endTime = endOfDay(date);

      // Get existing events for the day
      const response = await this.calendar.events.list({
        calendarId: calendarId,
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      
      // Generate business hour slots (9 AM - 5 PM)
      const slots: TimeSlot[] = [];
      const businessStartHour = 9;
      const businessEndHour = 17;
      
      for (let hour = businessStartHour; hour < businessEndHour; hour++) {
        const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0);
        const slotEnd = addHours(slotStart, 1);
        
        // Skip past slots
        if (isBefore(slotStart, new Date())) {
          continue;
        }
        
        // Check if slot conflicts with existing events
        const isAvailable = !events.some((event: any) => {
          if (!event.start?.dateTime || !event.end?.dateTime) return false;
          
          const eventStart = parseISO(event.start.dateTime);
          const eventEnd = parseISO(event.end.dateTime);
          
          return (isBefore(slotStart, eventEnd) && isAfter(slotEnd, eventStart));
        });
        
        slots.push({
          start: slotStart,
          end: slotEnd,
          available: isAvailable
        });
      }
      
      return slots;
    } catch (error) {
      console.error('Error fetching calendar availability:', error);
      // Fallback to mock data if API fails
      return this.getMockSlots(date);
    }
  }

  async getAvailabilityForDays(startDate: Date, days: number = 7, calendarId: string = 'primary'): Promise<CalendarAvailability[]> {
    const availability: CalendarAvailability[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        availability.push({
          date: format(date, 'yyyy-MM-dd'),
          slots: []
        });
        continue;
      }
      
      const slots = await this.getAvailableSlots(date, calendarId);
      
      availability.push({
        date: format(date, 'yyyy-MM-dd'),
        slots
      });
    }
    
    return availability;
  }

  async bookAppointment(
    slotStart: Date, 
    slotEnd: Date, 
    patientName: string, 
    appointmentType: string,
    patientEmail: string,
    calendarId: string = 'primary'
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const event = {
        summary: `${appointmentType.replace('_', ' ')} - ${patientName}`,
        description: `Appointment type: ${appointmentType.replace('_', ' ')}\nPatient: ${patientName}\nEmail: ${patientEmail}`,
        start: {
          dateTime: slotStart.toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: slotEnd.toISOString(),
          timeZone: 'America/New_York',
        },
        attendees: [
          { email: patientEmail }
        ],
      };

      const response = await this.calendar.events.insert({
        calendarId: calendarId,
        resource: event,
      });

      return {
        success: true,
        eventId: response.data.id
      };
    } catch (error) {
      console.error('Error booking appointment:', error);
      return {
        success: false,
        error: 'Failed to book appointment in calendar'
      };
    }
  }

  async findNextAvailableSlot(preferredDate: Date, calendarId: string = 'primary'): Promise<TimeSlot | null> {
    // Look for next available slot within 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date(preferredDate);
      date.setDate(preferredDate.getDate() + i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }
      
      const slots = await this.getAvailableSlots(date, calendarId);
      const availableSlot = slots.find(slot => slot.available);
      
      if (availableSlot) {
        return availableSlot;
      }
    }
    
    return null;
  }

  async cancelAppointment(eventId: string, calendarId: string = 'primary'): Promise<boolean> {
    try {
      await this.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId,
      });
      return true;
    } catch (error) {
      console.error('Error canceling appointment:', error);
      return false;
    }
  }

  async updateAppointment(
    eventId: string, 
    newStart: Date, 
    newEnd: Date, 
    calendarId: string = 'primary'
  ): Promise<boolean> {
    try {
      const event = await this.calendar.events.get({
        calendarId: calendarId,
        eventId: eventId,
      });

      const updatedEvent = {
        ...event.data,
        start: {
          dateTime: newStart.toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: newEnd.toISOString(),
          timeZone: 'America/New_York',
        },
      };

      await this.calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: updatedEvent,
      });

      return true;
    } catch (error) {
      console.error('Error updating appointment:', error);
      return false;
    }
  }

  // Fallback mock data if Google Calendar API fails
  private getMockSlots(date: Date): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const busyTimes = [
      { hour: 10 }, // 10-11 AM busy
      { hour: 14 }, // 2-3 PM busy
    ];
    
    for (let hour = 9; hour < 17; hour++) {
      const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0);
      const slotEnd = addHours(slotStart, 1);
      
      if (isBefore(slotStart, new Date())) continue;
      
      const isAvailable = !busyTimes.some(busy => busy.hour === hour);
      
      slots.push({
        start: slotStart,
        end: slotEnd,
        available: isAvailable
      });
    }
    
    return slots;
  }

  // Get authorization URL for OAuth flow
  getAuthUrl(): string {
    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
  }

  // Exchange authorization code for tokens
  async getAccessToken(code: string) {
    const { tokens } = await this.auth.getToken(code);
    this.auth.setCredentials(tokens);
    return tokens;
  }
}

export const googleCalendarService = new GoogleCalendarService();