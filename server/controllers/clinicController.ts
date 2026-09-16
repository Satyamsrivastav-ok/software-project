import { Request, Response } from 'express';
import {
  ClinicModel,
  DoctorProfileModel,
  AvailabilityModel,
  AppointmentModel
} from '../models/index';
import { AuthenticatedRequest } from '../middleware/auth';

export const getClinics = async (req: Request, res: Response) => {
  try {
    const { search, city, type, activeOnly = 'true' } = req.query;

    let clinics = ClinicModel.getAll();

    if (activeOnly === 'true') {
      clinics = clinics.filter(c => c.isActive);
    }

    if (city && typeof city === 'string' && city.trim() !== '') {
      clinics = clinics.filter(c => c.city.toLowerCase().includes(city.toLowerCase().trim()));
    }

    if (type && typeof type === 'string' && type !== 'All') {
      clinics = clinics.filter(c => c.type.toLowerCase() === type.toLowerCase());
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      clinics = clinics.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.facilities.some(f => f.toLowerCase().includes(q))
      );
    }

    // Attach doctor info to clinic
    const enhanced = clinics.map(c => {
      const doctor = DoctorProfileModel.findById(c.doctorId);
      return {
        ...c,
        doctor: doctor ? {
          _id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
          rating: doctor.rating,
          reviewCount: doctor.reviewCount,
          verificationStatus: doctor.verificationStatus,
          profilePhoto: doctor.profilePhoto
        } : null
      };
    });

    return res.status(200).json({
      success: true,
      count: enhanced.length,
      clinics: enhanced
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve clinics' });
  }
};

export const getClinicById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clinic = ClinicModel.findById(id);

    if (!clinic) {
      return res.status(404).json({ success: false, message: 'Clinic not found.' });
    }

    const doctor = DoctorProfileModel.findById(clinic.doctorId);
    const availability = AvailabilityModel.findOne({ clinicId: clinic._id }) ||
                         AvailabilityModel.findOne({ doctorId: clinic.doctorId });

    return res.status(200).json({
      success: true,
      clinic: {
        ...clinic,
        doctor: doctor ? {
          _id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
          qualification: doctor.qualification,
          experience: doctor.experience,
          consultationFee: doctor.consultationFee,
          rating: doctor.rating,
          reviewCount: doctor.reviewCount,
          verificationStatus: doctor.verificationStatus,
          profilePhoto: doctor.profilePhoto,
          about: doctor.about
        } : null,
        availability
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to load clinic' });
  }
};

export const getMyClinics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Access restricted to doctors.' });
    }

    const doctorProfile = req.doctorProfile || DoctorProfileModel.findOne({ userId: req.user._id });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const clinics = ClinicModel.find({ doctorId: doctorProfile._id });

    return res.status(200).json({
      success: true,
      count: clinics.length,
      clinics
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch your clinics.' });
  }
};

export const createClinic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only registered doctors can create clinics.' });
    }

    const doctorProfile = req.doctorProfile || DoctorProfileModel.findOne({ userId: req.user._id });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const {
      name,
      type = 'Private Clinic',
      description = '',
      address,
      city,
      state,
      pincode,
      phone,
      email,
      website = '',
      images = [],
      facilities = [],
      consultationTypes = ['In-Person'],
      workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      openingTime = '09:00 AM',
      closingTime = '05:00 PM',
      emergencyAvailable = false,
      onlineConsultation = false,
      inPersonConsultation = true
    } = req.body;

    if (!name || !address || !city || !state || !pincode || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Clinic name, address, city, state, pincode, and contact phone are required.'
      });
    }

    const newClinic = ClinicModel.create({
      doctorId: doctorProfile._id,
      name: name.trim(),
      type: type || 'Private Clinic',
      description: description || '',
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : doctorProfile.email,
      website: website || '',
      images: Array.isArray(images) && images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80'
      ],
      facilities: Array.isArray(facilities) ? facilities : ['Air Conditioned Waiting Area', 'Wheelchair Accessible'],
      consultationTypes: Array.isArray(consultationTypes) ? consultationTypes : ['In-Person'],
      workingDays: Array.isArray(workingDays) ? workingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      openingTime: openingTime || '09:00 AM',
      closingTime: closingTime || '05:00 PM',
      emergencyAvailable: Boolean(emergencyAvailable),
      onlineConsultation: Boolean(onlineConsultation),
      inPersonConsultation: Boolean(inPersonConsultation),
      isVerified: false, // Clinics default to unverified pending review
      isActive: true,
      isDemo: false
    });

    // Auto-create initial availability schedule for this clinic
    AvailabilityModel.create({
      doctorId: doctorProfile._id,
      clinicId: newClinic._id,
      workingDays: newClinic.workingDays,
      startTime: newClinic.openingTime,
      endTime: newClinic.closingTime,
      slotDuration: 30,
      breakTimes: [{ startTime: '01:00 PM', endTime: '02:00 PM' }],
      blockedDates: [],
      holidayDates: [],
      isDemo: false
    });

    return res.status(201).json({
      success: true,
      message: 'Clinic registered successfully. Schedule and facilities configured.',
      clinic: newClinic
    });
  } catch (err: any) {
    console.error('createClinic error:', err);
    return res.status(500).json({ success: false, message: 'Server error while creating clinic.' });
  }
};

export const updateClinic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clinic = ClinicModel.findById(id);

    if (!clinic) {
      return res.status(404).json({ success: false, message: 'Clinic not found.' });
    }

    const doctorProfile = req.doctorProfile || (req.user ? DoctorProfileModel.findOne({ userId: req.user._id }) : null);

    // Verify ownership or admin permission
    if (req.user?.role !== 'admin' && clinic.doctorId !== doctorProfile?._id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own clinic details.'
      });
    }

    const updated = ClinicModel.findByIdAndUpdate(id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Clinic updated successfully.',
      clinic: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update clinic.' });
  }
};

export const deleteClinic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clinic = ClinicModel.findById(id);

    if (!clinic) {
      return res.status(404).json({ success: false, message: 'Clinic not found.' });
    }

    const doctorProfile = req.doctorProfile || (req.user ? DoctorProfileModel.findOne({ userId: req.user._id }) : null);

    if (req.user?.role !== 'admin' && clinic.doctorId !== doctorProfile?._id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own clinics.'
      });
    }

    ClinicModel.findByIdAndDelete(id);
    AvailabilityModel.deleteMany({ clinicId: id });

    return res.status(200).json({
      success: true,
      message: 'Clinic removed successfully.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete clinic.' });
  }
};
