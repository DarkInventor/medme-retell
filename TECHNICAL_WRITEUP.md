# MedMe AI-Powered Appointment Scheduling - Technical Write-up

## Project Overview

This project implements a conversational AI agent for pharmacy appointment scheduling using Retell.ai as the voice/chat platform. The system provides a natural language interface for booking, canceling, and rescheduling pharmacy appointments with full integration to Google Calendar and Firebase data storage.

**Live Demo**: [Deployment URL]  
**GitHub Repository**: https://github.com/[username]/medme-interview  

## Architecture & Key Components

### System Architecture

The application follows a modern full-stack architecture built on Next.js with the following key layers:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                     │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  Voice Interface │  │  Chat Interface  │               │
│  │  (Retell Web SDK)│  │  (Retell API)    │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js API Routes)          │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │ Retell Webhooks  │  │  Web Call API    │              │
│  │   Function Calls │  │                  │              │
│  └──────────────────┘  └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                    │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │ Calendar Service │  │ DataStore Service│              │
│  │ (Google Calendar)│  │   (Firebase)     │              │
│  └──────────────────┘  └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              External Integrations                         │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │   Retell.ai      │  │ Google Calendar  │              │
│  │   Agent API      │  │      API         │              │
│  └──────────────────┘  └──────────────────┘              │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │   Firebase       │  │    Make.com      │              │
│  │   Firestore      │  │ + Google Sheets  │              │
│  └──────────────────┘  └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Retell AI Agent Configuration (`lib/retell-agent.ts`)
- **Purpose**: Defines the conversational AI agent with function calling capabilities
- **Key Features**:
  - Professional voice configuration (OpenAI Alloy voice)
  - Function definitions for appointment operations
  - System prompt with caring, empathetic personality
  - Error handling and graceful fallbacks

#### 2. Google Calendar Integration (`lib/google-calendar.ts`)
- **Purpose**: Manages calendar availability and appointment booking
- **Key Features**:
  - OAuth2 authentication flow
  - Business hours enforcement (9 AM - 5 PM, weekdays only)
  - Conflict detection with existing events
  - Fallback to mock data when API fails

#### 3. Firebase Data Store (`lib/firebase-datastore.ts`)
- **Purpose**: Persistent storage for appointment records and patient data
- **Key Features**:
  - CRUD operations for appointments
  - Patient lookup by name/phone/email
  - Audit trail with agent notes
  - Date/time handling with proper serialization

#### 4. Webhook Handler (`app/api/retell/webhook/route.ts`)
- **Purpose**: Processes function calls from Retell agent
- **Key Functions**:
  - `check_availability`: Queries calendar for open slots
  - `book_appointment`: Creates new appointments
  - `find_appointment`: Locates existing bookings
  - `cancel_appointment`: Cancels bookings
  - `reschedule_appointment`: Moves appointments to new times

#### 5. Frontend Interface (`components/retell-simple-client.tsx`)
- **Purpose**: Web-based voice call interface
- **Features**:
  - Connection status indicators
  - Error handling and user feedback
  - Integration with Retell Web SDK

## Tools/Libraries Chosen & Rationale

### Core Framework
- **Next.js 15.4.5**: 
  - Modern React framework with API routes
  - Server-side rendering capabilities
  - Built-in API endpoint handling for webhooks

### Voice AI Platform
- **Retell.ai**: 
  - **Why chosen**: Native function calling support, voice-ready platform
  - **Alternatives considered**: VAPI, Livekit
  - **Key advantage**: Seamless transition from chat to voice with minimal code changes

### Calendar Integration
- **Google Calendar API**:
  - **Why chosen**: Reliable, well-documented, widely adopted
  - **Integration**: OAuth2 flow with proper token management
  - **Features**: Conflict detection, availability checking, event creation

### Data Storage
- **Firebase Firestore**:
  - **Why chosen**: Real-time database, strong query capabilities, good Next.js integration
  - **Alternatives**: Supabase, Google Sheets, Airtable
  - **Advantages**: NoSQL flexibility, automatic scaling, real-time updates

- **Make.com + Google Sheets Integration**:
  - **Purpose**: Additional data logging and workflow automation
  - **Implementation**: Webhook automation that logs each conversation to Google Sheets
  - **Live Data**: [Appointment Logs Spreadsheet](https://docs.google.com/spreadsheets/d/1vGtbxlwA84X9XxmNA--_5UoMWgEBEfFvZhKymcZhE_w/edit?gid=0#gid=0)
  - **Benefits**: Easy data analysis, business reporting, backup logging

### Frontend Libraries
- **Retell Client JS SDK**: Official SDK for voice/chat integration
- **Tailwind CSS**: Utility-first styling for rapid UI development  
- **Lucide React**: Clean, consistent icon library
- **date-fns**: Robust date manipulation and formatting

### Development Tools
- **TypeScript**: Type safety and better developer experience
- **ESLint**: Code quality and consistency
- **Tailwind CSS**: Rapid UI development

### Automation Tools
- **Make.com**: 
  - **Purpose**: Workflow automation and additional data logging
  - **Integration**: Webhook-triggered automation that logs conversations to Google Sheets
  - **Benefits**: Business reporting, backup logging, easy data analysis

## Integration Snippets

### Make.com Webhook Automation

The system includes an additional data logging layer using Make.com automation platform:

![Make.com Flow](screenshot-make-flow.png)

**Automation Flow**:
1. **Webhooks (Step 1)**: Receives Retell.ai conversation data via custom webhook
2. **Router (Step 2)**: Processes and routes the webhook data  
3. **Google Sheets (Step 6)**: Adds new row to spreadsheet with conversation details

**Live Data**: Each chat conversation automatically creates a new row in the [Appointment Logs Spreadsheet](https://docs.google.com/spreadsheets/d/1vGtbxlwA84X9XxmNA--_5UoMWgEBEfFvZhKymcZhE_w/edit?gid=0#gid=0)

This provides:
- Real-time conversation logging
- Business analytics and reporting
- Backup data storage
- Easy data export capabilities

### Retell Agent Function Definition
```typescript
// Function for booking appointments
{
  type: 'function',
  function: {
    name: 'book_appointment',
    description: 'Book a new appointment for a patient',
    parameters: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full name of the patient' },
        email: { type: 'string', description: 'Patient email address' },
        phone: { type: 'string', description: 'Patient phone number' },
        appointment_type: {
          type: 'string',
          enum: ['flu_shot', 'consultation', 'medication_review', 'vaccination'],
          description: 'Type of pharmacy appointment'
        },
        preferred_datetime: {
          type: 'string',
          description: 'Preferred appointment date and time in ISO format'
        }
      },
      required: ['patient_name', 'email', 'phone', 'appointment_type', 'preferred_datetime']
    }
  }
}
```

### Google Calendar Availability Check
```typescript
async getAvailableSlots(date: Date): Promise<TimeSlot[]> {
  const events = await this.calendar.events.list({
    calendarId: 'primary',
    timeMin: startOfDay(date).toISOString(),
    timeMax: endOfDay(date).toISOString(),
    singleEvents: true,
    orderBy: 'startTime'
  });

  // Generate business hour slots and check conflicts
  for (let hour = 9; hour < 17; hour++) {
    const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0);
    const isAvailable = !events.data.items?.some(event => {
      // Conflict detection logic
    });
  }
}
```

### Firebase Appointment Storage
```typescript
async saveAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
  const docRef = await addDoc(collection(db, 'appointments'), {
    ...appointment,
    createdAt: new Date(),
    preferredDateTime: appointment.preferredDateTime.toISOString()
  });
  
  return { ...appointment, id: docRef.id, createdAt: new Date() };
}
```

## Error-Handling Approach

### Multi-Layer Error Handling

#### 1. **API Layer Errors**
- Webhook function calls wrapped in try-catch blocks
- Graceful degradation with user-friendly messages
- Fallback to human assistance when APIs fail

```typescript
catch (error) {
  return NextResponse.json({
    function_call_id,
    result: 'I apologize, but I encountered a technical issue. Please try again or contact our pharmacy directly at (555) 123-4567 for assistance.'
  });
}
```

#### 2. **Calendar Integration Failures**
- Google Calendar API failures fall back to mock data
- OAuth token refresh handled automatically
- Clear error messages for authentication issues

#### 3. **Data Validation**
- Date format validation using `date-fns` `isValid()`
- Required field checking in webhook handlers  
- Type safety with TypeScript interfaces

#### 4. **Business Logic Errors**
- Weekend scheduling prevention
- Busy slot handling with alternative suggestions
- Patient verification for cancellations/rescheduling

#### 5. **Frontend Error States**
- Connection status indicators
- Error message display
- Retry mechanisms for failed calls

### Error Recovery Strategies

1. **Availability Conflicts**: Automatically suggest next available slot
2. **API Failures**: Provide phone number for human assistance
3. **Missing Information**: Politely request missing details
4. **Authentication Issues**: Clear instructions for re-authentication

## Testing Strategy

### Manual Testing Approach
1. **Happy Path Testing**:
   - Book flu shot appointment for tomorrow at 2 PM
   - Cancel existing appointment by name
   - Reschedule appointment to different time

2. **Edge Case Testing**:
   - Try to book on weekend
   - Request unavailable time slot
   - Cancel non-existent appointment
   - Provide invalid date formats

3. **Integration Testing**:
   - Calendar API connectivity
   - Firebase data persistence
   - Retell webhook functionality

### Test Data Setup
- Pre-populated calendar with busy slots at 10 AM and 2 PM
- Sample appointments in Firebase for testing lookups
- Mock patient data for testing various scenarios

### Known Limitations for Testing
- Google Calendar API requires OAuth setup
- Retell.ai requires webhook URL (use ngrok for local testing)
- Firebase requires project configuration

## "If I Had More Time..." Improvements

### Technical Enhancements
1. **Enhanced Authentication**:
   - Patient verification via SMS/email codes
   - Multi-factor authentication for sensitive operations
   - Session management and user accounts

2. **Advanced Calendar Features**:
   - Multiple calendar support for different services
   - Provider availability management
   - Appointment duration customization
   - Recurring appointment patterns

3. **Better Error Recovery**:
   - Retry mechanisms with exponential backoff
   - Circuit breaker pattern for external APIs
   - Better offline handling
   - Queue system for failed operations

4. **Analytics & Monitoring**:
   - Appointment booking analytics
   - Conversation quality metrics
   - API performance monitoring
   - User satisfaction tracking

### UX/UI Improvements
1. **Rich Web Interface**:
   - Visual calendar widget
   - Appointment history dashboard
   - Real-time availability display
   - Multi-language support

2. **Advanced Conversational Features**:
   - Context retention across sessions
   - Appointment reminders
   - Follow-up scheduling suggestions
   - Integration with pharmacy inventory

### Scalability & Production Readiness
1. **Infrastructure**:
   - Redis caching for calendar data
   - Database indexing optimization
   - CDN for static assets
   - Load balancing for high traffic

2. **Security**:
   - Rate limiting on API endpoints
   - Input sanitization and validation
   - HIPAA compliance considerations
   - Audit logging for all operations

3. **DevOps**:
   - Automated testing pipeline
   - Environment-specific configurations
   - Health check endpoints
   - Monitoring and alerting

## Key Features Delivered

✅ **Natural Language Flow**: Collects appointment type, date/time, patient info  
✅ **Calendar Integration**: Google Calendar API with availability checking  
✅ **Data Storage**: Firebase Firestore for appointment logging  
✅ **Edge Case Handling**: Unavailable slots, missing info, API failures  
✅ **Voice-Ready Architecture**: Built on Retell.ai platform  
✅ **Error Recovery**: Graceful fallbacks and user-friendly messages  
✅ **Business Logic**: Weekend prevention, business hours enforcement  

## Configuration Notes

### Retell.ai Setup
- Agent ID: `agent_fa18dcd11913e3ccde2931ddfc`
- Public Key: `public_key_73c641de4f51ee6bdc6a9`
- Webhook URL: `/api/retell/webhook`

### Environment Variables Required
```
RETELL_API_KEY=key_55cdcd1c37839f5b8e4fd9958827
GOOGLE_CLIENT_SECRET=[your-secret]
GOOGLE_REFRESH_TOKEN=[your-token]
NEXT_PUBLIC_FIREBASE_API_KEY=[your-key]
```

---

**Total Development Time**: ~8 hours  
**Architecture Focus**: Maintainable, scalable, voice-ready  
**Key Differentiator**: Empathetic conversational design with robust error handling