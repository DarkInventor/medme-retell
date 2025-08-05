export interface Appointment {
  id?: string;
  patientName: string;
  email: string;
  phone: string;
  appointmentType: 'flu_shot' | 'consultation' | 'medication_review' | 'vaccination';
  preferredDateTime: Date;
  confirmedDateTime?: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rescheduled';
  agentNotes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface CalendarAvailability {
  date: string;
  slots: TimeSlot[];
}