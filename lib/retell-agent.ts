import client from './retell';

// Define the agent configuration for Retell.ai
export const RETELL_AGENT_CONFIG = {
  agent_name: 'MedMe Pharmacy Assistant',
  voice_id: 'openai-alloy', // Professional, caring voice
  language: 'en-US',
  response_engine: {
    type: 'retell-llm',
    llm_id: 'gpt-4o-mini'
  },
  // Function calling tools that the agent can use
  tools: [
    {
      type: 'function',
      function: {
        name: 'check_availability',
        description: 'Check available appointment slots for a specific date',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'The date to check availability for in YYYY-MM-DD format',
            },
          },
          required: ['date'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'book_appointment',
        description: 'Book a new appointment for a patient',
        parameters: {
          type: 'object',
          properties: {
            patient_name: {
              type: 'string',
              description: 'Full name of the patient',
            },
            email: {
              type: 'string',
              description: 'Patient email address',
            },
            phone: {
              type: 'string',
              description: 'Patient phone number',
            },
            appointment_type: {
              type: 'string',
              enum: ['flu_shot', 'consultation', 'medication_review', 'vaccination'],
              description: 'Type of pharmacy appointment',
            },
            preferred_datetime: {
              type: 'string',
              description: 'Preferred appointment date and time in ISO format',
            },
          },
          required: ['patient_name', 'email', 'phone', 'appointment_type', 'preferred_datetime'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'find_appointment',
        description: 'Find existing appointments for a patient',
        parameters: {
          type: 'object',
          properties: {
            patient_name: {
              type: 'string',
              description: 'Full name of the patient',
            },
            phone: {
              type: 'string',
              description: 'Patient phone number (optional)',
            },
            email: {
              type: 'string',
              description: 'Patient email address (optional)',
            },
          },
          required: ['patient_name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'cancel_appointment',
        description: 'Cancel an existing appointment',
        parameters: {
          type: 'object',
          properties: {
            appointment_id: {
              type: 'string',
              description: 'Unique appointment ID (optional if patient info provided)',
            },
            patient_name: {
              type: 'string',
              description: 'Full name of the patient (optional if appointment_id provided)',
            },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'reschedule_appointment',
        description: 'Reschedule an existing appointment to a new time',
        parameters: {
          type: 'object',
          properties: {
            appointment_id: {
              type: 'string',
              description: 'Unique appointment ID (optional if patient info provided)',
            },
            patient_name: {
              type: 'string',
              description: 'Full name of the patient (optional if appointment_id provided)',
            },
            new_datetime: {
              type: 'string',
              description: 'New preferred appointment date and time in ISO format',
            },
          },
          required: ['new_datetime'],
        },
      },
    },
  ],
  // Agent personality and instructions
  system_prompt: `You are a caring and professional pharmacy assistant for MedMe Pharmacy. Your role is to help patients book, cancel, and reschedule appointments with a warm, empathetic, and efficient approach.

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

**Example Conversations:**
- "I'd be happy to help you book that flu shot! Could you please provide your full name, phone number, and email address?"
- "Let me check our availability for tomorrow... I see we have openings at 10 AM, 1 PM, and 3 PM. Which works best for you?"
- "I'm sorry, that time slot isn't available. However, I have an opening at 2 PM the same day. Would that work for you?"

Always end interactions by confirming next steps or providing appointment details.`,

  // Webhook URL for function calls
  webhook_url: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com/api/retell/webhook' 
    : 'http://localhost:3000/api/retell/webhook',

  // Additional configuration
  enable_backchannel: true,
  ambient_sound: 'office',
  interruption_sensitivity: 0.7,
  responsiveness: 0.8,
  voice_temperature: 0.7,
  voice_speed: 1.0,
};

// Function to create or update the Retell agent
export async function createRetellAgent() {
  try {
    const agent = await client.agent.create(RETELL_AGENT_CONFIG);
    console.log('Retell agent created:', agent);
    return agent;
  } catch (error) {
    console.error('Error creating Retell agent:', error);
    throw error;
  }
}

// Function to get existing agent or create new one
export async function getOrCreateAgent() {
  try {
    // Try to get existing agents
    const agents = await client.agent.list();
    
    // Look for our MedMe agent
    const existingAgent = agents.find((agent: any) => 
      agent.agent_name === 'MedMe Pharmacy Assistant'
    );
    
    if (existingAgent) {
      console.log('Using existing Retell agent:', existingAgent.agent_id);
      return existingAgent;
    } else {
      console.log('Creating new Retell agent...');
      return await createRetellAgent();
    }
  } catch (error) {
    console.error('Error managing Retell agent:', error);
    throw error;
  }
}

// Function to create a phone call with the agent
export async function createPhoneCall(phoneNumber: string) {
  try {
    const agent = await getOrCreateAgent();
    
    const call = await client.call.create({
      from_number: '+1234567890', // Your Retell phone number
      to_number: phoneNumber,
      agent_id: agent.agent_id,
      metadata: {
        patient_phone: phoneNumber,
        call_type: 'outbound_appointment'
      }
    });
    
    return call;
  } catch (error) {
    console.error('Error creating phone call:', error);
    throw error;
  }
}

// Function to create a web call (for chat interface)
export async function createWebCall() {
  try {
    // Use the correct chat agent ID
    const AGENT_ID = 'agent_fbb60038c52a7d59652b0532c9';
    
    const call = await client.call.createWebCall({
      agent_id: AGENT_ID,
      metadata: {
        call_type: 'web_chat_appointment',
        source: 'medme_website'
      }
    });
    
    return call;
  } catch (error) {
    console.error('Error creating web call:', error);
    throw error;
  }
}

// Function to create a web call for voice interface
export async function createVoiceWebCall() {
  try {
    // Use the voice agent ID from environment variable
    const AGENT_ID = process.env.RETELL_VOICE_AGENT_ID || 'agent_fa18dcd11913e3ccde2931ddfc';
    
    const call = await client.call.createWebCall({
      agent_id: AGENT_ID,
      metadata: {
        call_type: 'web_voice_appointment',
        source: 'medme_website'
      }
    });
    
    return call;
  } catch (error) {
    console.error('Error creating voice web call:', error);
    throw error;
  }
}