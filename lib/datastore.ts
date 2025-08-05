import { Appointment } from './types';

// Mock data store for demo purposes
// In production, this would integrate with Google Sheets, Airtable, or a database
export class DataStore {
  private appointments: Appointment[] = [];
  private nextId = 1;

  async saveAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    const newAppointment: Appointment = {
      ...appointment,
      id: this.nextId.toString(),
      createdAt: new Date(),
    };
    
    this.appointments.push(newAppointment);
    this.nextId++;
    
    // In production, this would save to external service
    console.log('Saved appointment:', newAppointment);
    
    return newAppointment;
  }

  async findAppointmentByPatient(patientName: string, phone?: string, email?: string): Promise<Appointment | null> {
    return this.appointments.find(apt => 
      apt.patientName.toLowerCase() === patientName.toLowerCase() &&
      (phone ? apt.phone === phone : true) &&
      (email ? apt.email === email : true)
    ) || null;
  }

  async findAppointmentById(id: string): Promise<Appointment | null> {
    return this.appointments.find(apt => apt.id === id) || null;
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    const index = this.appointments.findIndex(apt => apt.id === id);
    if (index === -1) return null;
    
    this.appointments[index] = {
      ...this.appointments[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    console.log('Updated appointment:', this.appointments[index]);
    return this.appointments[index];
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return [...this.appointments];
  }

  async deleteAppointment(id: string): Promise<boolean> {
    const index = this.appointments.findIndex(apt => apt.id === id);
    if (index === -1) return false;
    
    this.appointments.splice(index, 1);
    console.log('Deleted appointment with id:', id);
    return true;
  }
}

export const dataStore = new DataStore();