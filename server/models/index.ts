import { dbStore, generateObjectId, isValidObjectId } from '../db/database';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'patient' | 'doctor' | 'admin';
  phone?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  avatar?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IDoctorProfile {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  medicalRegistrationNumber: string;
  medicalCouncil: string;
  languages: string[];
  about: string;
  profilePhoto: string;
  verificationStatus: 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';
  medicalRegistrationVerified: boolean;
  hospitalVerified: boolean;
  identityVerified: boolean;
  verificationNotes?: string;
  verifiedAt?: string;
  rating: number;
  reviewCount: number;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IClinic {
  _id: string;
  doctorId: string; // DoctorProfile _id or User _id
  name: string;
  type: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  images: string[];
  facilities: string[];
  consultationTypes: string[]; // e.g. ['In-Person', 'Online Video']
  workingDays: string[];
  openingTime: string;
  closingTime: string;
  emergencyAvailable: boolean;
  onlineConsultation: boolean;
  inPersonConsultation: boolean;
  isVerified: boolean;
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAvailability {
  _id: string;
  doctorId: string; // DoctorProfile _id
  clinicId?: string; // Optional specific clinic or doctor-wide
  workingDays: string[];
  startTime: string; // e.g. "09:00 AM"
  endTime: string;   // e.g. "06:00 PM"
  slotDuration: number; // in minutes, e.g. 30
  breakTimes: Array<{ startTime: string; endTime: string }>;
  blockedDates: string[]; // YYYY-MM-DD
  holidayDates: string[]; // YYYY-MM-DD
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAppointment {
  _id: string;
  patientId: string; // User _id
  doctorId: string;  // DoctorProfile _id
  clinicId: string;  // Clinic _id
  date: string;      // YYYY-MM-DD
  startTime: string; // e.g. "10:00 AM"
  endTime: string;   // e.g. "10:30 AM"
  consultationType: 'In-Person' | 'Online Video';
  reason: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected' | 'rescheduled' | 'no_show';
  paymentStatus: 'unpaid' | 'paid' | 'at_clinic';
  notes?: string;
  prescriptionId?: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  cancellationReason?: string;
  rescheduleRequest?: {
    requestedDate: string;
    requestedTime: string;
    reason: string;
  };
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IPrescription {
  _id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  clinicId: string;
  symptoms: string;
  diagnosis: string;
  consultationNotes: string;
  medicines: Array<{
    name: string;
    dosage: string;
    duration: string;
    instructions: string;
  }>;
  advice: string;
  followUpDate?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IReview {
  _id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  rating: number; // 1 - 5
  comment: string;
  doctorResponse?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'verification' | 'clinic' | 'system';
  read: boolean;
  link?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IVerificationRequest {
  _id: string;
  doctorId: string;
  doctorName: string;
  medicalRegistrationNumber: string;
  medicalCouncil: string;
  qualification: string;
  specialization: string;
  hospitalAffiliation?: string;
  status: 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';
  medicalRegistrationVerified: boolean;
  hospitalVerified: boolean;
  identityVerified: boolean;
  adminNotes?: string;
  reviewedBy?: string;
  submittedAt: string;
  reviewedAt?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Generic Model Factory providing familiar Mongoose operations
class CollectionModel<T extends { _id: string; isDemo: boolean; createdAt: string; updatedAt: string }> {
  constructor(private collectionKey: keyof import('../db/database').DatabaseStore) {}

  public getAll(): T[] {
    return dbStore.getCollection<T>(this.collectionKey);
  }

  public find(filter: Partial<T> | ((item: T) => boolean) = {}): T[] {
    const all = this.getAll();
    if (typeof filter === 'function') {
      return all.filter(filter);
    }
    return all.filter(item => {
      for (const key in filter) {
        if (filter[key] !== undefined && (item as any)[key] !== filter[key]) {
          return false;
        }
      }
      return true;
    });
  }

  public findOne(filter: Partial<T> | ((item: T) => boolean)): T | null {
    const results = this.find(filter);
    return results.length > 0 ? results[0] : null;
  }

  public findById(id: string): T | null {
    if (!id) return null;
    const all = this.getAll();
    return all.find(item => item._id === id) || null;
  }

  public create(data: Omit<T, '_id' | 'createdAt' | 'updatedAt'> & { _id?: string }): T {
    const now = new Date().toISOString();
    const newItem = {
      ...data,
      _id: data._id || generateObjectId(),
      isDemo: data.isDemo !== undefined ? Boolean(data.isDemo) : false,
      createdAt: now,
      updatedAt: now
    } as T;

    const all = this.getAll();
    all.push(newItem);
    dbStore.setCollection(this.collectionKey, all);
    return newItem;
  }

  public findByIdAndUpdate(id: string, updates: Partial<T>): T | null {
    const all = this.getAll();
    const index = all.findIndex(item => item._id === id);
    if (index === -1) return null;

    const updated = {
      ...all[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    all[index] = updated;
    dbStore.setCollection(this.collectionKey, all);
    return updated;
  }

  public findByIdAndDelete(id: string): boolean {
    const all = this.getAll();
    const initialLen = all.length;
    const filtered = all.filter(item => item._id !== id);
    if (filtered.length !== initialLen) {
      dbStore.setCollection(this.collectionKey, filtered);
      return true;
    }
    return false;
  }

  public deleteMany(filter: Partial<T> | ((item: T) => boolean)): number {
    const all = this.getAll();
    const initialLen = all.length;
    let remaining: T[];

    if (typeof filter === 'function') {
      remaining = all.filter(item => !filter(item));
    } else {
      remaining = all.filter(item => {
        for (const key in filter) {
          if (filter[key] !== undefined && (item as any)[key] === filter[key]) {
            return false; // match filter = delete
          }
        }
        return true;
      });
    }

    const deletedCount = initialLen - remaining.length;
    if (deletedCount > 0) {
      dbStore.setCollection(this.collectionKey, remaining);
    }
    return deletedCount;
  }

  public countDocuments(filter: Partial<T> | ((item: T) => boolean) = {}): number {
    return this.find(filter).length;
  }
}

export const UserModel = new CollectionModel<IUser>('users');
export const DoctorProfileModel = new CollectionModel<IDoctorProfile>('doctorProfiles');
export const ClinicModel = new CollectionModel<IClinic>('clinics');
export const AvailabilityModel = new CollectionModel<IAvailability>('availabilities');
export const AppointmentModel = new CollectionModel<IAppointment>('appointments');
export const PrescriptionModel = new CollectionModel<IPrescription>('prescriptions');
export const ReviewModel = new CollectionModel<IReview>('reviews');
export const NotificationModel = new CollectionModel<INotification>('notifications');
export const VerificationRequestModel = new CollectionModel<IVerificationRequest>('verificationRequests');

export { isValidObjectId };
