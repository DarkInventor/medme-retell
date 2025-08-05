/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export interface ChatMessage {
  user_message: string;
  bot_response: string;
  timestamp: any;
  user_id?: string;
  session_id: string;
  source: 'text_chat' | 'voice_call';
  agent_id?: string;
}

export interface CallRecord {
  call_id: string;
  agent_id: string;
  call_type: 'retell' | 'vapi';
  status: 'started' | 'ended' | 'failed';
  start_time: any;
  end_time?: any;
  duration_ms?: number;
  user_id?: string;
  metadata?: any;
}

export interface AppointmentRecord {
  patient_name: string;
  email: string;
  phone: string;
  appointment_type: 'flu_shot' | 'consultation' | 'medication_review' | 'vaccination';
  preferred_datetime: Date;
  confirmed_datetime?: Date;
  status: 'requested' | 'confirmed' | 'cancelled' | 'completed';
  source: 'text_chat' | 'retell_voice' | 'vapi_voice';
  agent_notes?: string;
  google_calendar_event_id?: string;
  call_id?: string;
  session_id: string;
}

class FirebaseLogger {
  // Log chat messages
  async logChatMessage(message: ChatMessage) {
    try {
      const docRef = await addDoc(collection(db, 'chat_messages'), {
        ...message,
        timestamp: serverTimestamp()
      });
      console.log('Chat message logged:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error logging chat message:', error);
      throw error;
    }
  }

  // Log call records
  async logCallStart(callData: Omit<CallRecord, 'start_time'>) {
    try {
      const docRef = await addDoc(collection(db, 'call_records'), {
        ...callData,
        start_time: serverTimestamp(),
        status: 'started'
      });
      console.log('Call start logged:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error logging call start:', error);
      throw error;
    }
  }

  // Update call record when call ends
  async logCallEnd(callId: string, endData: { duration_ms?: number; metadata?: any }) {
    try {
      const q = query(collection(db, 'call_records'), where('call_id', '==', callId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const callDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'call_records', callDoc.id), {
          status: 'ended',
          end_time: serverTimestamp(),
          ...endData
        });
        console.log('Call end logged for:', callId);
      }
    } catch (error) {
      console.error('Error logging call end:', error);
      throw error;
    }
  }

  // Log appointment requests
  async logAppointmentRequest(appointment: Omit<AppointmentRecord, 'timestamp'>) {
    try {
      const docRef = await addDoc(collection(db, 'appointments'), {
        ...appointment,
        timestamp: serverTimestamp(),
        status: 'requested'
      });
      console.log('Appointment request logged:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error logging appointment:', error);
      throw error;
    }
  }

  // Update appointment status
  async updateAppointmentStatus(appointmentId: string, updates: Partial<AppointmentRecord>) {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        ...updates,
        updated_at: serverTimestamp()
      });
      console.log('Appointment updated:', appointmentId);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  // Get recent chat history for context
  async getChatHistory(sessionId: string, limit = 10) {
    try {
      const q = query(
        collection(db, 'chat_messages'),
        where('session_id', '==', sessionId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }
}

export const firebaseLogger = new FirebaseLogger();