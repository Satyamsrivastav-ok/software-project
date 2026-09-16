export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  phone?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  avatar?: string;
  isDemo?: boolean;
  createdAt?: string;
}

export interface DoctorProfile {
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
  clinicsCount?: number;
  primaryClinic?: {
    _id: string;
    name: string;
    city: string;
    address: string;
    openingTime: string;
    closingTime: string;
    onlineConsultation: boolean;
  } | null;
  clinics?: Clinic[];
  reviews?: Review[];
  isDemo?: boolean;
  createdAt?: string;
}

export interface Clinic {
  _id: string;
  doctorId: string;
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
  consultationTypes: string[];
  workingDays: string[];
  openingTime: string;
  closingTime: string;
  emergencyAvailable: boolean;
  onlineConsultation: boolean;
  inPersonConsultation: boolean;
  isVerified: boolean;
  isActive: boolean;
  doctor?: DoctorProfile | null;
  isDemo?: boolean;
  createdAt?: string;
}

export interface Slot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bookedReason?: string;
}

export interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
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
  doctor?: DoctorProfile;
  clinic?: Clinic;
  patient?: User;
  isDemo?: boolean;
  createdAt?: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  _id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  clinicId: string;
  symptoms: string;
  diagnosis: string;
  consultationNotes: string;
  medicines: Medicine[];
  advice: string;
  followUpDate?: string;
  doctor?: DoctorProfile;
  clinic?: Clinic;
  patient?: User;
  appointment?: Appointment;
  isDemo?: boolean;
  createdAt: string;
}

export interface Review {
  _id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  rating: number;
  comment: string;
  doctorResponse?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'verification' | 'clinic' | 'system';
  read: boolean;
  link?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface VerificationRequest {
  _id: string;
  doctorId: string;
  doctorName: string;
  medicalRegistrationNumber: string;
  medicalCouncil: string;
  qualification: string;
  specialization: string;
  status: 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';
  medicalRegistrationVerified: boolean;
  hospitalVerified: boolean;
  identityVerified: boolean;
  adminNotes?: string;
  reviewedBy?: string;
  submittedAt: string;
  reviewedAt?: string;
  doctor?: DoctorProfile;
  isDemo?: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  verifiedDoctors: number;
  pendingDoctors: number;
  totalClinics: number;
  verifiedClinics: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  specializationsDistribution: Array<{ name: string; count: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  demoCounts: {
    demoDoctors: number;
    demoPatients: number;
    demoClinics: number;
    demoAppointments: number;
    demoReviews: number;
    totalDemoRecords: number;
  };
}
