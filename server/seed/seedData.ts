import bcrypt from 'bcryptjs';
import {
  UserModel,
  DoctorProfileModel,
  ClinicModel,
  AvailabilityModel,
  AppointmentModel,
  PrescriptionModel,
  ReviewModel,
  NotificationModel,
  VerificationRequestModel
} from '../models/index';
import { dbStore } from '../db/database';

export async function seedDemoData(force = false) {
  // If already seeded and not force, skip
  const existingAdmin = UserModel.findOne({ email: 'admin@docpulse.com' });
  if (existingAdmin && !force) {
    return {
      message: 'Demo data already present',
      counts: getDemoCounts()
    };
  }

  // Clear existing demo data if forced
  if (force) {
    deleteDemoDataService('all');
  }

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', salt);
  const doctorPasswordHash = await bcrypt.hash('DoctorPassword123!', salt);
  const patientPasswordHash = await bcrypt.hash('PatientPassword123!', salt);

  // 1. Admin User
  const adminUser = UserModel.create({
    name: 'Chief Medical Administrator',
    email: 'admin@docpulse.com',
    password: adminPasswordHash,
    role: 'admin',
    phone: '+1 800-555-0199',
    gender: 'Other',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    isDemo: true
  });

  // 2. Demo Doctors
  const doctorData = [
    {
      name: 'Dr. Rahul Sharma',
      email: 'dr.rahul@docpulse.com',
      gender: 'Male',
      phone: '+91 98765 43210',
      specialization: 'Cardiology',
      qualification: 'MBBS, MD (Cardiology), FACC',
      experience: 14,
      consultationFee: 800,
      medicalRegistrationNumber: 'MCI-74892-DL',
      medicalCouncil: 'Delhi Medical Council',
      languages: ['English', 'Hindi'],
      about: 'Senior Interventional Cardiologist with over 14 years of clinical experience in coronary angiograms, stenting, heart failure management, and preventive cardiac wellness.',
      profilePhoto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
      verificationStatus: 'verified' as const,
      medicalRegistrationVerified: true,
      hospitalVerified: true,
      identityVerified: true,
      verificationNotes: 'Verified via state medical council register document check.',
      verifiedAt: '2026-01-15T10:00:00.000Z',
      rating: 4.9,
      reviewCount: 18
    },
    {
      name: 'Dr. Priya Mehta',
      email: 'dr.priya@docpulse.com',
      gender: 'Female',
      phone: '+91 98111 22334',
      specialization: 'Dermatology',
      qualification: 'MBBS, DVD, MD (Dermatology)',
      experience: 9,
      consultationFee: 700,
      medicalRegistrationNumber: 'MMC-45129-MH',
      medicalCouncil: 'Maharashtra Medical Council',
      languages: ['English', 'Hindi', 'Marathi'],
      about: 'Renowned dermatologist and aesthetic specialist focusing on clinical dermatology, psoriasis treatments, chronic eczema, and laser cosmetic therapies.',
      profilePhoto: 'https://images.unsplash.com/photo-1594824813589-cf7283626127?w=300&auto=format&fit=crop&q=80',
      verificationStatus: 'verified' as const,
      medicalRegistrationVerified: true,
      hospitalVerified: true,
      identityVerified: true,
      verificationNotes: 'Verified credentials and council license validated.',
      verifiedAt: '2026-02-10T11:30:00.000Z',
      rating: 4.8,
      reviewCount: 14
    },
    {
      name: 'Dr. Amitav Sen',
      email: 'dr.amitav@docpulse.com',
      gender: 'Male',
      phone: '+91 98222 33445',
      specialization: 'Orthopedics',
      qualification: 'MBBS, MS (Orthopedics), MCh',
      experience: 16,
      consultationFee: 950,
      medicalRegistrationNumber: 'WMC-88312-WB',
      medicalCouncil: 'West Bengal Medical Council',
      languages: ['English', 'Bengali', 'Hindi'],
      about: 'Orthopedic and joint replacement surgeon specializing in minimally invasive knee and hip arthroplasty, sports injury rehabilitation, and arthritis care.',
      profilePhoto: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
      verificationStatus: 'verified' as const,
      medicalRegistrationVerified: true,
      hospitalVerified: true,
      identityVerified: true,
      verificationNotes: 'Institutional credentials verified.',
      verifiedAt: '2026-01-20T14:00:00.000Z',
      rating: 4.7,
      reviewCount: 11
    },
    {
      name: 'Dr. Sneha Kulkarni',
      email: 'dr.sneha@docpulse.com',
      gender: 'Female',
      phone: '+91 98333 44556',
      specialization: 'Pediatrics',
      qualification: 'MBBS, DCH, MD (Pediatrics)',
      experience: 11,
      consultationFee: 600,
      medicalRegistrationNumber: 'KMC-99120-KA',
      medicalCouncil: 'Karnataka Medical Council',
      languages: ['English', 'Kannada', 'Hindi'],
      about: 'Passionate pediatrician with deep expertise in neonatal intensive care, pediatric immunization, childhood asthma, and developmental milestones tracking.',
      profilePhoto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
      verificationStatus: 'verified' as const,
      medicalRegistrationVerified: true,
      hospitalVerified: true,
      identityVerified: true,
      verificationNotes: 'Council certificate confirmed.',
      verifiedAt: '2026-02-18T09:15:00.000Z',
      rating: 4.9,
      reviewCount: 15
    },
    {
      name: 'Dr. Rajesh Patel',
      email: 'dr.rajesh@docpulse.com',
      gender: 'Male',
      phone: '+91 98444 55667',
      specialization: 'Neurology',
      qualification: 'MBBS, MD (General Medicine), DM (Neurology)',
      experience: 13,
      consultationFee: 1000,
      medicalRegistrationNumber: 'GMC-66231-GJ',
      medicalCouncil: 'Gujarat Medical Council',
      languages: ['English', 'Gujarati', 'Hindi'],
      about: 'Consultant Neurologist focusing on epilepsy disorders, stroke prevention, migraine protocols, and neurodegenerative movement management.',
      profilePhoto: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
      verificationStatus: 'verified' as const,
      medicalRegistrationVerified: true,
      hospitalVerified: true,
      identityVerified: true,
      verificationNotes: 'Verified by administrator.',
      verifiedAt: '2026-03-01T16:00:00.000Z',
      rating: 4.6,
      reviewCount: 9
    },
    {
      name: 'Dr. Ananya Roy (Pending Verification)',
      email: 'dr.ananya@docpulse.com',
      gender: 'Female',
      phone: '+91 98555 66778',
      specialization: 'Gynecology',
      qualification: 'MBBS, MS (Obstetrics & Gynecology)',
      experience: 7,
      consultationFee: 750,
      medicalRegistrationNumber: 'DMC-81992-DL',
      medicalCouncil: 'Delhi Medical Council',
      languages: ['English', 'Hindi'],
      about: 'Obstetrician and gynecologist specializing in high-risk pregnancy management, laparoscopy, and reproductive endocrine health.',
      profilePhoto: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=300&auto=format&fit=crop&q=80',
      verificationStatus: 'pending' as const,
      medicalRegistrationVerified: false,
      hospitalVerified: false,
      identityVerified: false,
      verificationNotes: 'Documents submitted for administrator review.',
      rating: 0,
      reviewCount: 0
    },
    {
      name: 'Dr. Vikram Malhotra (Under Review)',
      email: 'dr.vikram@docpulse.com',
      gender: 'Male',
      phone: '+91 98666 77889',
      specialization: 'Dentist',
      qualification: 'BDS, MDS (Prosthodontics)',
      experience: 8,
      consultationFee: 500,
      medicalRegistrationNumber: 'DDC-34981-DL',
      medicalCouncil: 'Delhi Dental Council',
      languages: ['English', 'Hindi', 'Punjabi'],
      about: 'Prosthodontist and implantologist with expertise in aesthetic smile designing, full-mouth restorations, and root canal therapy.',
      profilePhoto: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&auto=format&fit=crop&q=80',
      verificationStatus: 'under_review' as const,
      medicalRegistrationVerified: true,
      hospitalVerified: false,
      identityVerified: false,
      verificationNotes: 'Dental council document under cross-verification.',
      rating: 0,
      reviewCount: 0
    }
  ];

  const createdDoctors: Array<{ user: any; profile: any }> = [];

  for (const doc of doctorData) {
    const user = UserModel.create({
      name: doc.name,
      email: doc.email,
      password: doctorPasswordHash,
      role: 'doctor',
      phone: doc.phone,
      gender: doc.gender as any,
      avatar: doc.profilePhoto,
      isDemo: true
    });

    const profile = DoctorProfileModel.create({
      userId: user._id,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      gender: doc.gender,
      specialization: doc.specialization,
      qualification: doc.qualification,
      experience: doc.experience,
      consultationFee: doc.consultationFee,
      medicalRegistrationNumber: doc.medicalRegistrationNumber,
      medicalCouncil: doc.medicalCouncil,
      languages: doc.languages,
      about: doc.about,
      profilePhoto: doc.profilePhoto,
      verificationStatus: doc.verificationStatus,
      medicalRegistrationVerified: doc.medicalRegistrationVerified,
      hospitalVerified: doc.hospitalVerified,
      identityVerified: doc.identityVerified,
      verificationNotes: doc.verificationNotes,
      verifiedAt: doc.verifiedAt,
      rating: doc.rating,
      reviewCount: doc.reviewCount,
      isDemo: true
    });

    // Create verification request record for all doctors
    VerificationRequestModel.create({
      doctorId: profile._id,
      doctorName: profile.name,
      medicalRegistrationNumber: profile.medicalRegistrationNumber,
      medicalCouncil: profile.medicalCouncil,
      qualification: profile.qualification,
      specialization: profile.specialization,
      status: doc.verificationStatus,
      medicalRegistrationVerified: doc.medicalRegistrationVerified,
      hospitalVerified: doc.hospitalVerified,
      identityVerified: doc.identityVerified,
      adminNotes: doc.verificationNotes || 'Verification reviewed by platform administrator',
      reviewedBy: doc.verificationStatus === 'verified' ? 'Admin' : undefined,
      submittedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      reviewedAt: doc.verifiedAt,
      isDemo: true
    });

    createdDoctors.push({ user, profile });
  }

  // 3. Demo Clinics (Multiple clinics per doctor demonstration)
  // Dr. Rahul Sharma has 2 clinics:
  const rahulProfile = createdDoctors[0].profile;
  const clinicRahul1 = ClinicModel.create({
    doctorId: rahulProfile._id,
    name: 'Sharma Heart & Vascular Clinic',
    type: 'Private Clinic',
    description: 'Premier cardiac diagnostics clinic offering 2D Echocardiography, TMT, Holter monitoring, and preventive vascular assessments.',
    address: 'Plot 42, Block C, Greater Kailash I',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110048',
    phone: '+91 11 4123 9900',
    email: 'contact@sharmaheartclinic.com',
    website: 'https://sharmaheartclinic.com',
    images: ['https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80'],
    facilities: ['ECG & Echo Lab', 'Pharmacy', 'Air Conditioned Waiting Area', 'Wheelchair Accessible', 'Cardiology Diagnostics'],
    consultationTypes: ['In-Person', 'Online Video'],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    openingTime: '09:00 AM',
    closingTime: '01:00 PM',
    emergencyAvailable: false,
    onlineConsultation: true,
    inPersonConsultation: true,
    isVerified: true,
    isActive: true,
    isDemo: true
  });

  const clinicRahul2 = ClinicModel.create({
    doctorId: rahulProfile._id,
    name: 'City Heart Institute & Medicare',
    type: 'Hospital Affiliated',
    description: 'Tertiary cardiac super-specialty center with 24/7 cath lab emergency cover, day-care beds, and rehabilitation facilities.',
    address: 'Sector 62, Institutional Area',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201309',
    phone: '+91 120 6789 000',
    email: 'noida@cityheartinstitute.org',
    website: 'https://cityheartinstitute.org',
    images: ['https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80'],
    facilities: ['24/7 Emergency', 'Cath Lab', 'Ambulance Service', 'In-House Pharmacy', 'Valet Parking'],
    consultationTypes: ['In-Person'],
    workingDays: ['Monday', 'Wednesday', 'Friday'],
    openingTime: '04:00 PM',
    closingTime: '08:00 PM',
    emergencyAvailable: true,
    onlineConsultation: false,
    inPersonConsultation: true,
    isVerified: true,
    isActive: true,
    isDemo: true
  });

  // Dr. Priya Mehta clinic
  const priyaProfile = createdDoctors[1].profile;
  const clinicPriya = ClinicModel.create({
    doctorId: priyaProfile._id,
    name: 'SkinLuxe Dermatology & Laser Studio',
    type: 'Specialty Center',
    description: 'Advanced clinical dermatology, allergy testing, acne scar resurfacing, and comprehensive hair restoration treatments.',
    address: 'Suite 204, Pinnacle Heights, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    phone: '+91 22 2640 5511',
    email: 'info@skinluxestudio.com',
    website: 'https://skinluxestudio.com',
    images: ['https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80'],
    facilities: ['US-FDA Laser Suites', 'Private Consultation Rooms', 'Dermatopathology Lab', 'Medical Skin Spa'],
    consultationTypes: ['In-Person', 'Online Video'],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    openingTime: '10:00 AM',
    closingTime: '06:00 PM',
    emergencyAvailable: false,
    onlineConsultation: true,
    inPersonConsultation: true,
    isVerified: true,
    isActive: true,
    isDemo: true
  });

  // Dr. Amitav Sen clinic
  const amitavProfile = createdDoctors[2].profile;
  const clinicAmitav = ClinicModel.create({
    doctorId: amitavProfile._id,
    name: 'Apex Ortho & Joint Care Clinic',
    type: 'Specialty Center',
    description: 'Specialized orthopedic clinic for chronic joint pain, arthritis management, post-op physiotherapy, and digital X-ray diagnostics.',
    address: '14/B, Salt Lake Sector V',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700091',
    phone: '+91 33 2357 1122',
    email: 'saltlake@apexortho.in',
    images: ['https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80'],
    facilities: ['Digital X-Ray', 'Physiotherapy Unit', 'Wheelchair Ramp', 'Plaster Room'],
    consultationTypes: ['In-Person'],
    workingDays: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
    openingTime: '09:30 AM',
    closingTime: '04:30 PM',
    emergencyAvailable: true,
    onlineConsultation: false,
    inPersonConsultation: true,
    isVerified: true,
    isActive: true,
    isDemo: true
  });

  // Dr. Sneha Kulkarni clinic
  const snehaProfile = createdDoctors[3].profile;
  const clinicSneha = ClinicModel.create({
    doctorId: snehaProfile._id,
    name: 'Little Blossoms Child & Wellness Clinic',
    type: 'Private Clinic',
    description: 'Child-friendly pediatric clinic providing routine vaccinations, growth monitoring, newborn wellness, and pediatric dietary advice.',
    address: '88, 100 Feet Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    phone: '+91 80 4115 8899',
    email: 'care@littleblossoms.clinic',
    images: ['https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&auto=format&fit=crop&q=80'],
    facilities: ['Kid Play Area', 'Vaccine Cold Storage', 'Nursing Room', 'Nebulization Station'],
    consultationTypes: ['In-Person', 'Online Video'],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    openingTime: '09:00 AM',
    closingTime: '02:00 PM',
    emergencyAvailable: true,
    onlineConsultation: true,
    inPersonConsultation: true,
    isVerified: true,
    isActive: true,
    isDemo: true
  });

  // Dr. Rajesh Patel clinic
  const rajeshProfile = createdDoctors[4].profile;
  const clinicRajesh = ClinicModel.create({
    doctorId: rajeshProfile._id,
    name: 'NeuroVibe Brain & Spine Centre',
    type: 'Polyclinic',
    description: 'Modern outpatient neurology clinic offering EEG, nerve conduction studies, and comprehensive headache clinics.',
    address: '401, S.G. Highway, Bodakdev',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380054',
    phone: '+91 79 2685 4400',
    email: 'support@neurovibe.com',
    images: ['https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80'],
    facilities: ['EEG Lab', 'Electromyography (EMG)', 'Rehabilitation Suite'],
    consultationTypes: ['In-Person', 'Online Video'],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    openingTime: '10:00 AM',
    closingTime: '05:00 PM',
    emergencyAvailable: false,
    onlineConsultation: true,
    inPersonConsultation: true,
    isVerified: true,
    isActive: true,
    isDemo: true
  });

  // Unverified Dr. Ananya Roy Clinic (cannot accept appointments until verified)
  const ananyaProfile = createdDoctors[5].profile;
  const clinicAnanya = ClinicModel.create({
    doctorId: ananyaProfile._id,
    name: 'Ananya Women Care Clinic',
    type: 'Private Clinic',
    description: 'Obstetrics and gynecological care setup.',
    address: '12, South Extension Part II',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110049',
    phone: '+91 11 2625 3344',
    email: 'ananyacare@gmail.com',
    images: ['https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80'],
    facilities: ['Ultrasound Sonography', 'Waiting Room'],
    consultationTypes: ['In-Person'],
    workingDays: ['Monday', 'Wednesday', 'Friday'],
    openingTime: '10:00 AM',
    closingTime: '02:00 PM',
    emergencyAvailable: false,
    onlineConsultation: false,
    inPersonConsultation: true,
    isVerified: false,
    isActive: true,
    isDemo: true
  });

  // 4. Availability configurations for verified doctors
  const demoClinics = [
    { doctor: rahulProfile, clinic: clinicRahul1 },
    { doctor: rahulProfile, clinic: clinicRahul2 },
    { doctor: priyaProfile, clinic: clinicPriya },
    { doctor: amitavProfile, clinic: clinicAmitav },
    { doctor: snehaProfile, clinic: clinicSneha },
    { doctor: rajeshProfile, clinic: clinicRajesh }
  ];

  for (const item of demoClinics) {
    AvailabilityModel.create({
      doctorId: item.doctor._id,
      clinicId: item.clinic._id,
      workingDays: item.clinic.workingDays,
      startTime: item.clinic.openingTime,
      endTime: item.clinic.closingTime,
      slotDuration: 30,
      breakTimes: [{ startTime: '01:00 PM', endTime: '02:00 PM' }],
      blockedDates: [],
      holidayDates: [],
      isDemo: true
    });
  }

  // 5. Demo Patients (10 diverse patients)
  const patientData = [
    { name: 'Priya Sharma', email: 'patient.priya@docpulse.com', phone: '+91 91234 56780', gender: 'Female' },
    { name: 'Kavita Rao', email: 'patient.kavita@docpulse.com', phone: '+91 91234 56781', gender: 'Female' },
    { name: 'Rohan Verma', email: 'patient.rohan@docpulse.com', phone: '+91 91234 56782', gender: 'Male' },
    { name: 'Sunil Kapoor', email: 'patient.sunil@docpulse.com', phone: '+91 91234 56783', gender: 'Male' },
    { name: 'Meera Nair', email: 'patient.meera@docpulse.com', phone: '+91 91234 56784', gender: 'Female' },
    { name: 'Arjun Das', email: 'patient.arjun@docpulse.com', phone: '+91 91234 56785', gender: 'Male' },
    { name: 'Deepika Joshi', email: 'patient.deepika@docpulse.com', phone: '+91 91234 56786', gender: 'Female' },
    { name: 'Vikram Bedi', email: 'patient.vikram@docpulse.com', phone: '+91 91234 56787', gender: 'Male' },
    { name: 'Pooja Iyer', email: 'patient.pooja@docpulse.com', phone: '+91 91234 56788', gender: 'Female' },
    { name: 'Naveen Reddy', email: 'patient.naveen@docpulse.com', phone: '+91 91234 56789', gender: 'Male' }
  ];

  const createdPatients: any[] = [];
  for (const p of patientData) {
    const user = UserModel.create({
      name: p.name,
      email: p.email,
      password: patientPasswordHash,
      role: 'patient',
      phone: p.phone,
      gender: p.gender as any,
      isDemo: true
    });
    createdPatients.push(user);
  }

  // 6. Demo Appointments (Upcoming, Completed, Cancelled)
  // Patient Priya has multiple appointments
  const priya = createdPatients[0];
  const rohan = createdPatients[2];
  const kavita = createdPatients[1];

  // Helper date generators relative to today
  const today = new Date();
  const formatDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  // Appointment 1: Completed with Dr. Rahul Sharma (Priya Sharma) -> Has prescription and review
  const apt1 = AppointmentModel.create({
    patientId: priya._id,
    doctorId: rahulProfile._id,
    clinicId: clinicRahul1._id,
    date: formatDate(-5),
    startTime: '10:00 AM',
    endTime: '10:30 AM',
    consultationType: 'In-Person',
    reason: 'Routine quarterly cardiac health evaluation and blood pressure checkup',
    status: 'completed',
    paymentStatus: 'paid',
    notes: 'Patient presented with mild morning hypertension. ECG performed and normal.',
    patientName: priya.name,
    patientEmail: priya.email,
    patientPhone: priya.phone || '+91 91234 56780',
    isDemo: true
  });

  // Prescription for apt1
  const pres1 = PrescriptionModel.create({
    appointmentId: apt1._id,
    doctorId: rahulProfile._id,
    patientId: priya._id,
    clinicId: clinicRahul1._id,
    symptoms: 'Mild morning headache, intermittent palpitations during stair climbing.',
    diagnosis: 'Stage 1 Essential Hypertension (mild), sinus tachycardia with stress.',
    consultationNotes: 'Advised lifestyle modification, low-sodium DASH diet, 40 min brisk walking.',
    medicines: [
      { name: 'Telmisartan 40mg', dosage: '1 tablet once daily', duration: '30 days', instructions: 'Take in the morning after breakfast' },
      { name: 'Metoprolol Succinate 25mg', dosage: '1 tablet daily', duration: '15 days', instructions: 'Take in the morning' }
    ],
    advice: 'Maintain daily blood pressure log in morning and evening. Avoid excessive caffeine.',
    followUpDate: formatDate(25),
    isDemo: true
  });

  // Link prescriptionId to appointment
  AppointmentModel.findByIdAndUpdate(apt1._id, { prescriptionId: pres1._id });

  // Review for apt1 (Completed appointment satisfies Rule 8!)
  ReviewModel.create({
    appointmentId: apt1._id,
    doctorId: rahulProfile._id,
    patientId: priya._id,
    patientName: priya.name,
    rating: 5,
    comment: 'Dr. Rahul is extremely thorough, reassuring, and attentive. He listened carefully to all my symptoms and explained the blood pressure management plan with immense clarity.',
    doctorResponse: 'Thank you Priya for your kind feedback. Keep up with the daily morning walks and monitor the BP log.',
    isDemo: true
  });

  // Appointment 2: Upcoming with Dr. Priya Mehta (Priya Sharma)
  AppointmentModel.create({
    patientId: priya._id,
    doctorId: priyaProfile._id,
    clinicId: clinicPriya._id,
    date: formatDate(3),
    startTime: '11:30 AM',
    endTime: '12:00 PM',
    consultationType: 'In-Person',
    reason: 'Follow-up for eczema flare-up and customized skincare regimen',
    status: 'confirmed',
    paymentStatus: 'at_clinic',
    patientName: priya.name,
    patientEmail: priya.email,
    patientPhone: priya.phone || '+91 91234 56780',
    isDemo: true
  });

  // Appointment 3: Completed with Dr. Priya Mehta (Kavita Rao) -> Has review
  const apt3 = AppointmentModel.create({
    patientId: kavita._id,
    doctorId: priyaProfile._id,
    clinicId: clinicPriya._id,
    date: formatDate(-10),
    startTime: '02:00 PM',
    endTime: '02:30 PM',
    consultationType: 'In-Person',
    reason: 'Adult acne and hyperpigmentation treatment',
    status: 'completed',
    paymentStatus: 'paid',
    notes: 'Chemical peel session 1 done. Excellent tolerance.',
    patientName: kavita.name,
    patientEmail: kavita.email,
    patientPhone: kavita.phone || '+91 91234 56781',
    isDemo: true
  });

  ReviewModel.create({
    appointmentId: apt3._id,
    doctorId: priyaProfile._id,
    patientId: kavita._id,
    patientName: kavita.name,
    rating: 5,
    comment: 'Dr. Priya Mehta solved my stubborn acne issues within weeks. Truly a miraculous difference. The clinic is spotless and state-of-the-art!',
    isDemo: true
  });

  // Appointment 4: Upcoming with Dr. Amitav Sen (Rohan Verma)
  AppointmentModel.create({
    patientId: rohan._id,
    doctorId: amitavProfile._id,
    clinicId: clinicAmitav._id,
    date: formatDate(1),
    startTime: '10:30 AM',
    endTime: '11:00 AM',
    consultationType: 'In-Person',
    reason: 'Right knee pain post football weekend match',
    status: 'confirmed',
    paymentStatus: 'at_clinic',
    patientName: rohan.name,
    patientEmail: rohan.email,
    patientPhone: rohan.phone || '+91 91234 56782',
    isDemo: true
  });

  // Appointment 5: Completed with Dr. Sneha Kulkarni (Sunil Kapoor for child)
  const apt5 = AppointmentModel.create({
    patientId: createdPatients[3]._id,
    doctorId: snehaProfile._id,
    clinicId: clinicSneha._id,
    date: formatDate(-3),
    startTime: '10:00 AM',
    endTime: '10:30 AM',
    consultationType: 'In-Person',
    reason: 'Child 2-year routine vaccination and fever check',
    status: 'completed',
    paymentStatus: 'paid',
    notes: 'Vaccine administered: MMR booster. Child alert and playful.',
    patientName: createdPatients[3].name,
    patientEmail: createdPatients[3].email,
    patientPhone: createdPatients[3].phone || '+91 91234 56783',
    isDemo: true
  });

  ReviewModel.create({
    appointmentId: apt5._id,
    doctorId: snehaProfile._id,
    patientId: createdPatients[3]._id,
    patientName: createdPatients[3].name,
    rating: 5,
    comment: 'Dr. Sneha was so gentle with our toddler! Not a single tear during vaccination. Highly recommend to all parents in Indiranagar.',
    isDemo: true
  });

  // Appointment 6: Cancelled appointment demonstration
  AppointmentModel.create({
    patientId: priya._id,
    doctorId: rahulProfile._id,
    clinicId: clinicRahul2._id,
    date: formatDate(-15),
    startTime: '05:00 PM',
    endTime: '05:30 PM',
    consultationType: 'In-Person',
    reason: 'Annual preventive cardiovascular checkup',
    status: 'cancelled',
    cancellationReason: 'Work travel emergency',
    paymentStatus: 'unpaid',
    patientName: priya.name,
    patientEmail: priya.email,
    patientPhone: priya.phone || '+91 91234 56780',
    isDemo: true
  });

  // 7. Demo Notifications
  NotificationModel.create({
    userId: priya._id,
    title: 'Appointment Confirmed',
    message: `Your appointment with Dr. Priya Mehta on ${formatDate(3)} at 11:30 AM is confirmed.`,
    type: 'appointment',
    read: false,
    link: '/dashboard',
    isDemo: true
  });

  NotificationModel.create({
    userId: rahulProfile.userId,
    title: 'New Patient Booking',
    message: 'Patient Priya Sharma scheduled a consultation at Sharma Heart & Vascular Clinic.',
    type: 'appointment',
    read: true,
    link: '/doctor-dashboard',
    isDemo: true
  });

  NotificationModel.create({
    userId: adminUser._id,
    title: 'Doctor Verification Request Pending',
    message: 'Dr. Ananya Roy submitted medical council registration details for verification.',
    type: 'verification',
    read: false,
    link: '/admin',
    isDemo: true
  });

  console.log('[Seed] Demo data successfully initialized.');
  return {
    message: 'Demo data successfully populated',
    counts: getDemoCounts()
  };
}

export function getDemoCounts() {
  return {
    demoDoctors: DoctorProfileModel.countDocuments({ isDemo: true }),
    demoPatients: UserModel.countDocuments({ role: 'patient', isDemo: true }),
    demoClinics: ClinicModel.countDocuments({ isDemo: true }),
    demoAppointments: AppointmentModel.countDocuments({ isDemo: true }),
    demoReviews: ReviewModel.countDocuments({ isDemo: true }),
    totalDemoRecords:
      DoctorProfileModel.countDocuments({ isDemo: true }) +
      UserModel.countDocuments({ isDemo: true }) +
      ClinicModel.countDocuments({ isDemo: true }) +
      AppointmentModel.countDocuments({ isDemo: true }) +
      ReviewModel.countDocuments({ isDemo: true }) +
      PrescriptionModel.countDocuments({ isDemo: true })
  };
}

export function deleteDemoDataService(target: 'doctors' | 'patients' | 'clinics' | 'appointments' | 'all') {
  let deletedDoctors = 0;
  let deletedPatients = 0;
  let deletedClinics = 0;
  let deletedAppointments = 0;
  let deletedReviews = 0;

  if (target === 'doctors' || target === 'all') {
    // Delete demo doctor profiles and their associated demo user records
    const demoDocs = DoctorProfileModel.find({ isDemo: true });
    const userIds = demoDocs.map(d => d.userId);
    UserModel.deleteMany(u => u.isDemo && userIds.includes(u._id));
    deletedDoctors = DoctorProfileModel.deleteMany({ isDemo: true });
    VerificationRequestModel.deleteMany({ isDemo: true });
    AvailabilityModel.deleteMany({ isDemo: true });
  }

  if (target === 'patients' || target === 'all') {
    deletedPatients = UserModel.deleteMany(u => u.isDemo && u.role === 'patient');
  }

  if (target === 'clinics' || target === 'all') {
    deletedClinics = ClinicModel.deleteMany({ isDemo: true });
  }

  if (target === 'appointments' || target === 'all') {
    deletedAppointments = AppointmentModel.deleteMany({ isDemo: true });
    PrescriptionModel.deleteMany({ isDemo: true });
  }

  if (target === 'all') {
    deletedReviews = ReviewModel.deleteMany({ isDemo: true });
    NotificationModel.deleteMany({ isDemo: true });
  }

  return {
    deleted: {
      deletedDoctors,
      deletedPatients,
      deletedClinics,
      deletedAppointments,
      deletedReviews
    },
    updatedCounts: getDemoCounts()
  };
}
