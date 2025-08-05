# MedMe Pharmacy AI Appointment Scheduling System

## Demo

🚀 **Live Demo**: [http://localhost:3000](http://localhost:3000)

A conversational AI agent built with Next.js and Retell.ai that automates pharmacy appointment scheduling with natural language processing, Firebase authentication, and intelligent edge case handling.

## Overview

This system enables patients to book, cancel, and reschedule pharmacy appointments through natural conversation. It integrates with calendar systems, maintains secure data storage, and handles edge cases gracefully to provide a seamless user experience.

## Architecture & Key Components

### Frontend Architecture
- **Next.js 15** with TypeScript and Tailwind CSS
- **Component Structure**:
  - `AuthProvider` - Firebase authentication context
  - `AuthGuard` - Protected route wrapper
  - `ChatInterface` - Real-time messaging UI
  - `shadcn/ui` components for consistent design

### Backend Architecture
- **API Route**: `/api/retell` - Handles all conversational AI requests
- **Services Layer**:
  - `CalendarService` - Mock calendar with realistic availability slots
  - `FirebaseDataStore` - Firestore integration for persistent storage
  - `RetellClient` - AI conversation processing

### Data Flow
```
User Input → Chat Interface → API Route → Intent Recognition → 
Service Layer → Firebase/Calendar → Response Generation → UI Update
```

## Core Features Implemented

### ✅ Natural Language Conversation Flow
- **Intent Recognition**: Detects booking, canceling, rescheduling requests
- **Information Extraction**: Collects patient details, appointment types, dates
- **Contextual Responses**: Provides helpful guidance and clarification

### ✅ Authentication & Security
- **Firebase Google Auth**: Secure user authentication
- **Protected Routes**: Prevents unauthorized access
- **User Context**: Associates appointments with authenticated users

### ✅ Appointment Management
- **Booking**: Flu shots, consultations, medication reviews, vaccinations
- **Availability Checking**: Real-time slot availability
- **Cancellation**: Find and cancel existing appointments
- **Rescheduling**: Move appointments to new times

### ✅ Data Persistence
- **Firebase Firestore**: Scalable document database
- **Appointment Logging**: Complete audit trail with timestamps
- **Search Capabilities**: Find appointments by patient details

### ✅ Edge Case Handling
- **Unavailable Slots**: Suggests next available alternatives
- **Missing Information**: Prompts for required details
- **API Failures**: Graceful error handling with fallback options
- **Input Validation**: Handles malformed requests safely

## Tools & Libraries Chosen

### Core Framework
- **Next.js 15**: Latest features, app router, TypeScript support
- **Reason**: Modern React framework with excellent API routes and SSR capabilities

### AI Integration
- **Retell.ai SDK**: Conversational AI platform
- **Reason**: Voice-ready architecture, easy text-to-voice migration path

### Authentication
- **Firebase Auth**: Google OAuth integration
- **Reason**: Reliable, secure, handles complex auth flows

### Database
- **Firebase Firestore**: NoSQL document database
- **Reason**: Real-time capabilities, scalable, integrates well with Auth

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built accessible components
- **Reason**: Rapid development, consistent design system

### Date Handling
- **date-fns**: Modern date utility library
- **Reason**: Lightweight, immutable, excellent TypeScript support

## Integration Examples

### Calendar Service (Mock Implementation)
```typescript
// Realistic business hours with pre-populated busy slots
const slots = await calendarService.getAvailableSlots(date);
const nextSlot = await calendarService.findNextAvailableSlot(preferredDate);
```

### Firebase Firestore Integration
```typescript
// Save appointment with automatic ID generation
const appointment = await firebaseDataStore.saveAppointment({
  patientName, email, phone, appointmentType,
  preferredDateTime, status: 'confirmed'
});
```

### Conversational AI Processing
```typescript
// Intent-based routing with parameter extraction
switch (intent) {
  case 'book_appointment':
    return await bookAppointment({ patient_name, appointment_type, preferred_datetime });
}
```

## Error Handling Approach

### 1. **API Level Error Handling**
- Validates input parameters and data types
- Returns structured error responses
- Handles database connection failures
- Rate limiting protection

### 2. **Service Level Error Handling**
- Calendar availability conflicts
- Double-booking prevention
- Data consistency checks
- External service timeouts

### 3. **UI Error Handling**
- Network request failures
- Invalid user inputs
- Loading states and timeouts
- User-friendly error messages

### 4. **Conversational Error Recovery**
- Unclear intent recognition
- Missing required information
- Invalid date/time formats
- Appointment not found scenarios

## Testing the System

### Manual Test Scenarios

1. **Happy Path Booking**:
   - Input: "I'd like to book a flu shot for tomorrow at 2 PM"
   - Expected: Checks availability, confirms booking, provides appointment ID

2. **Unavailable Slot**:
   - Input: "Book consultation for [busy time]"
   - Expected: Suggests next available alternative

3. **Missing Information**:
   - Input: "Cancel my appointment"
   - Expected: Requests appointment ID or patient details

4. **Rescheduling**:
   - Input: "Move my appointment to next week"
   - Expected: Finds existing appointment, checks new availability

### Pre-populated Test Data
- **Busy Slots**: Today 10-11 AM, 2-3 PM; Tomorrow 9-10 AM; Day+2 4-5 PM
- **Available Hours**: Monday-Friday 9 AM - 5 PM (weekends closed)
- **Test User**: Use Google auth to sign in

## Getting Started

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google to test the system.

## Demo Instructions

1. **Start the Application**: `pnpm run dev`
2. **Access Demo**: Visit [http://localhost:3000](http://localhost:3000)
3. **Sign In**: Use Google authentication
4. **Test Conversations**:
   - "Book a flu shot appointment"
   - "Check availability for tomorrow"
   - "Cancel my appointment" (after booking one)

## Production Considerations

### If I Had More Time...

#### 1. **Enhanced AI Capabilities**
- Natural language date parsing ("next Tuesday", "tomorrow afternoon")
- Multi-turn conversation memory
- Sentiment analysis for better customer service
- Voice integration with Retell.ai's voice API

#### 2. **Real Integration Replacements**
- **Google Calendar API**: Replace mock calendar with real Google Calendar
- **Calendly Integration**: Direct booking through Calendly webhooks
- **SMS Notifications**: Twilio integration for appointment reminders
- **Email Confirmations**: SendGrid for professional communications

#### 3. **Advanced Features**
- **Recurring Appointments**: Support for regular medication reviews
- **Waitlist Management**: Automatic rebooking when slots open
- **Multi-location Support**: Different pharmacy branches
- **Insurance Verification**: Integration with health insurance APIs

#### 4. **Operational Improvements**
- **Admin Dashboard**: Staff interface for appointment management
- **Analytics & Reporting**: Usage metrics and insights
- **A/B Testing**: Conversation flow optimization
- **Load Testing**: Performance under high usage

#### 5. **Security Enhancements**
- **HIPAA Compliance**: Healthcare data protection
- **Audit Logging**: Complete interaction tracking
- **Rate Limiting**: Per-user API quotas
- **Data Encryption**: End-to-end message encryption

## Technical Debt & Known Limitations

1. **Mock Services**: Calendar and some integrations are simulated
2. **Simple State Management**: Could benefit from Redux/Zustand for complex flows
3. **Basic Error Recovery**: More sophisticated retry mechanisms needed
4. **Limited Testing**: Unit and integration tests should be added
5. **Accessibility**: Screen reader and keyboard navigation improvements

---

**Built with ❤️ for MedMe Pharmacy**  
*Transforming community health through intelligent automation.*
