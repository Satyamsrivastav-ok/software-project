import { Response } from 'express';
import {
  PrescriptionModel,
  AppointmentModel,
  DoctorProfileModel,
  ClinicModel,
  UserModel,
  NotificationModel
} from '../models/index';
import { AuthenticatedRequest } from '../middleware/auth';

export const createPrescription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only licensed doctors can issue prescriptions.' });
    }

    const doctorProfile = req.doctorProfile || DoctorProfileModel.findOne({ userId: req.user._id });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    if (doctorProfile.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Action denied. Only verified doctors can conduct consultations and prescribe medications.'
      });
    }

    const {
      appointmentId,
      symptoms,
      diagnosis,
      consultationNotes,
      medicines,
      advice,
      followUpDate
    } = req.body;

    if (!appointmentId || !diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID and clinical diagnosis are required.'
      });
    }

    const appointment = AppointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment record not found.' });
    }

    if (appointment.doctorId !== doctorProfile._id) {
      return res.status(403).json({ success: false, message: 'Unauthorized for this appointment.' });
    }

    const newPrescription = PrescriptionModel.create({
      appointmentId,
      doctorId: doctorProfile._id,
      patientId: appointment.patientId,
      clinicId: appointment.clinicId,
      symptoms: symptoms || '',
      diagnosis: diagnosis.trim(),
      consultationNotes: consultationNotes || '',
      medicines: Array.isArray(medicines) ? medicines : [],
      advice: advice || 'Take medications as instructed. Rest adequately.',
      followUpDate: followUpDate || '',
      isDemo: appointment.isDemo
    });

    // Mark appointment as completed and link prescription
    AppointmentModel.findByIdAndUpdate(appointmentId, {
      status: 'completed',
      prescriptionId: newPrescription._id
    });

    // Notify patient that prescription is available
    NotificationModel.create({
      userId: appointment.patientId,
      title: 'Prescription Issued',
      message: `${doctorProfile.name} has finalized your consultation notes and issued a digital prescription.`,
      type: 'appointment',
      read: false,
      link: `/prescriptions/${newPrescription._id}`,
      isDemo: appointment.isDemo
    });

    return res.status(201).json({
      success: true,
      message: 'Prescription generated and consultation marked as completed.',
      prescription: newPrescription
    });
  } catch (err: any) {
    console.error('createPrescription error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create prescription.' });
  }
};

export const getPrescriptionById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const prescription = PrescriptionModel.findById(id);

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found.' });
    }

    const doctor = DoctorProfileModel.findById(prescription.doctorId);
    const clinic = ClinicModel.findById(prescription.clinicId);
    const patient = UserModel.findById(prescription.patientId);
    const appointment = AppointmentModel.findById(prescription.appointmentId);

    return res.status(200).json({
      success: true,
      prescription: {
        ...prescription,
        doctor,
        clinic,
        appointment,
        patient: patient ? {
          _id: patient._id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          gender: patient.gender
        } : null
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error retrieving prescription.' });
  }
};

export const getMyPrescriptions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    let prescriptions = [];
    if (req.user.role === 'patient') {
      prescriptions = PrescriptionModel.find({ patientId: req.user._id });
    } else if (req.user.role === 'doctor') {
      const doc = req.doctorProfile || DoctorProfileModel.findOne({ userId: req.user._id });
      if (doc) prescriptions = PrescriptionModel.find({ doctorId: doc._id });
    } else {
      prescriptions = PrescriptionModel.getAll();
    }

    const allDoctors = DoctorProfileModel.getAll();
    const allClinics = ClinicModel.getAll();

    const populated = prescriptions.map(p => ({
      ...p,
      doctor: allDoctors.find(d => d._id === p.doctorId),
      clinic: allClinics.find(c => c._id === p.clinicId)
    }));

    return res.status(200).json({
      success: true,
      count: populated.length,
      prescriptions: populated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve prescriptions.' });
  }
};
