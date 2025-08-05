import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { Appointment } from './types';

export class FirebaseDataStore {
  private appointmentsCollection = 'appointments';

  async saveAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    try {
      const docRef = await addDoc(collection(db, this.appointmentsCollection), {
        ...appointment,
        createdAt: new Date(),
        preferredDateTime: appointment.preferredDateTime.toISOString(),
        confirmedDateTime: appointment.confirmedDateTime?.toISOString() || null,
      });

      const newAppointment: Appointment = {
        ...appointment,
        id: docRef.id,
        createdAt: new Date()
      };

      console.log('Saved appointment to Firebase:', newAppointment);
      return newAppointment;
    } catch (error) {
      console.error('Error saving appointment:', error);
      throw new Error('Failed to save appointment');
    }
  }

  async findAppointmentByPatient(patientName: string, phone?: string, email?: string): Promise<Appointment | null> {
    try {
      let q = query(
        collection(db, this.appointmentsCollection),
        where('patientName', '==', patientName)
      );

      if (phone) {
        q = query(q, where('phone', '==', phone));
      }
      if (email) {
        q = query(q, where('email', '==', email));
      }

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const docData = querySnapshot.docs[0].data();
      return {
        ...docData,
        id: querySnapshot.docs[0].id,
        createdAt: docData.createdAt.toDate(),
        preferredDateTime: new Date(docData.preferredDateTime),
        confirmedDateTime: docData.confirmedDateTime ? new Date(docData.confirmedDateTime) : undefined,
        updatedAt: docData.updatedAt ? docData.updatedAt.toDate() : undefined,
      } as Appointment;
    } catch (error) {
      console.error('Error finding appointment:', error);
      return null;
    }
  }

  async findAppointmentById(id: string): Promise<Appointment | null> {
    try {
      const docRef = doc(db, this.appointmentsCollection, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const docData = docSnap.data();
      return {
        ...docData,
        id: docSnap.id,
        createdAt: docData.createdAt.toDate(),
        preferredDateTime: new Date(docData.preferredDateTime),
        confirmedDateTime: docData.confirmedDateTime ? new Date(docData.confirmedDateTime) : undefined,
        updatedAt: docData.updatedAt ? docData.updatedAt.toDate() : undefined,
      } as Appointment;
    } catch (error) {
      console.error('Error finding appointment by ID:', error);
      return null;
    }
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    try {
      const docRef = doc(db, this.appointmentsCollection, id);
      
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: new Date(),
      };

      // Convert dates to ISO strings for Firestore
      if (updates.preferredDateTime) {
        updateData.preferredDateTime = updates.preferredDateTime.toISOString();
      }
      if (updates.confirmedDateTime) {
        updateData.confirmedDateTime = updates.confirmedDateTime.toISOString();
      }

      await updateDoc(docRef, updateData);
      
      // Return updated document
      return await this.findAppointmentById(id);
    } catch (error) {
      console.error('Error updating appointment:', error);
      return null;
    }
  }

  async getAllAppointments(): Promise<Appointment[]> {
    try {
      const q = query(
        collection(db, this.appointmentsCollection),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          ...docData,
          id: doc.id,
          createdAt: docData.createdAt.toDate(),
          preferredDateTime: new Date(docData.preferredDateTime),
          confirmedDateTime: docData.confirmedDateTime ? new Date(docData.confirmedDateTime) : undefined,
          updatedAt: docData.updatedAt ? docData.updatedAt.toDate() : undefined,
        } as Appointment;
      });
    } catch (error) {
      console.error('Error getting all appointments:', error);
      return [];
    }
  }

  async deleteAppointment(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.appointmentsCollection, id);
      await deleteDoc(docRef);
      console.log('Deleted appointment with id:', id);
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }
  }

  async findRecentAppointmentsByPatient(patientName: string, phone?: string): Promise<Appointment[]> {
    try {
      let q = query(
        collection(db, this.appointmentsCollection),
        where('patientName', '==', patientName),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      if (phone) {
        q = query(
          collection(db, this.appointmentsCollection),
          where('patientName', '==', patientName),
          where('phone', '==', phone),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          ...docData,
          id: doc.id,
          createdAt: docData.createdAt.toDate(),
          preferredDateTime: new Date(docData.preferredDateTime),
          confirmedDateTime: docData.confirmedDateTime ? new Date(docData.confirmedDateTime) : undefined,
          updatedAt: docData.updatedAt ? docData.updatedAt.toDate() : undefined,
        } as Appointment;
      });
    } catch (error) {
      console.error('Error finding recent appointments:', error);
      return [];
    }
  }
}

export const firebaseDataStore = new FirebaseDataStore();