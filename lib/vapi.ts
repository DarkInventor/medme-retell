/* eslint-disable @typescript-eslint/no-unused-vars */
// VAPI AI Client for Voice Integration
export class VAPIClient {
  private privateKey: string;
  private publicKey: string;
  private baseUrl = 'https://api.vapi.ai';

  constructor() {
    this.privateKey = process.env.VAPI_PRIVATE_KEY || '';
    this.publicKey = process.env.VAPI_PUBLIC_KEY || '';
    
    if (!this.privateKey) {
      console.warn('VAPI_PRIVATE_KEY not found in environment variables');
    }
    if (!this.publicKey) {
      console.warn('VAPI_PUBLIC_KEY not found in environment variables');
    }
  }

  // Create a voice call
  async createCall(phoneNumber: string, assistantId?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.privateKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assistantId: assistantId,
          customer: {
            number: phoneNumber
          },
          assistant: assistantId ? undefined : this.getDefaultAssistant()
        })
      });

      if (!response.ok) {
        throw new Error(`VAPI API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating VAPI call:', error);
      throw error;
    }
  }

  // Create a web call for voice chat
  async createWebCall(assistantId?: string) {
    try {
      if (!this.privateKey) {
        throw new Error('VAPI_PRIVATE_KEY is required but not configured');
      }

      const response = await fetch(`${this.baseUrl}/call/web`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.privateKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assistant: this.getDefaultAssistant(),
          metadata: {
            source: 'medme_pharmacy_web',
            type: 'appointment_booking'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('VAPI API error response:', errorText);
        throw new Error(`VAPI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating VAPI web call:', error);
      throw error;
    }
  }

  // Get public key for frontend
  getPublicKey() {
    return this.publicKey;
  }

  // Default assistant configuration for MedMe Pharmacy
  private getDefaultAssistant() {
    return {
      model: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 500
      },
      voice: {
        provider: '11labs',
        voiceId: 'rachel', // Professional female voice
        stability: 0.5,
        similarityBoost: 0.8
      },
      firstMessage: "Hello! Welcome to MedMe Pharmacy. I'm your AI assistant for appointment scheduling. I can help you book, cancel, or reschedule appointments for flu shots, consultations, medication reviews, and vaccinations. How can I assist you today?",
      systemMessage: `You are a caring and professional pharmacy assistant for MedMe Pharmacy. Your role is to help patients book, cancel, and reschedule appointments with a warm, empathetic, and efficient approach.

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

Always end interactions by confirming next steps or providing appointment details.`,
      functions: [
        {
          name: 'bookAppointment',
          description: 'Book a new pharmacy appointment',
          parameters: {
            type: 'object',
            properties: {
              patientName: { type: 'string', description: 'Full name of the patient' },
              email: { type: 'string', description: 'Patient email address' },
              phone: { type: 'string', description: 'Patient phone number' },
              appointmentType: { 
                type: 'string', 
                enum: ['flu_shot', 'consultation', 'medication_review', 'vaccination'],
                description: 'Type of pharmacy appointment' 
              },
              preferredDateTime: { type: 'string', description: 'Preferred appointment date and time in ISO format' }
            },
            required: ['patientName', 'email', 'phone', 'appointmentType', 'preferredDateTime']
          }
        },
        {
          name: 'checkAvailability',
          description: 'Check available appointment slots for a specific date',
          parameters: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'Date to check availability (YYYY-MM-DD format)' }
            },
            required: ['date']
          }
        },
        {
          name: 'findAppointment',
          description: 'Find existing appointments for a patient',
          parameters: {
            type: 'object',
            properties: {
              patientName: { type: 'string', description: 'Full name of the patient' },
              phone: { type: 'string', description: 'Patient phone number (optional)' },
              email: { type: 'string', description: 'Patient email address (optional)' }
            },
            required: ['patientName']
          }
        },
        {
          name: 'cancelAppointment',
          description: 'Cancel an existing appointment',
          parameters: {
            type: 'object',
            properties: {
              patientName: { type: 'string', description: 'Patient name (optional if appointmentId provided)' },
              appointmentId: { type: 'string', description: 'Appointment ID (optional if patientName provided)' }
            }
          }
        }
      ],
      // Configure webhook for function calls
      serverUrl: process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com/api/vapi/webhook' 
        : 'http://localhost:3000/api/vapi/webhook'
    };
  }
}

export const vapiClient = new VAPIClient();