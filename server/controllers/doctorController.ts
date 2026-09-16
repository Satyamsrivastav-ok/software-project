import { Request, Response } from 'express';
import {
  DoctorProfileModel,
  ClinicModel,
  ReviewModel,
  UserModel
} from '../models/index';
import { AuthenticatedRequest } from '../middleware/auth';

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const {
      search,
      specialization,
      city,
      minExperience,
      maxFee,
      minRating,
      gender,
      onlineOnly,
      inPersonOnly,
      verifiedOnly = 'false'
    } = req.query;

    let doctors = DoctorProfileModel.getAll();

    // By default, show all doctors so newly registered / pending doctors remain visible
    // with a clear verification banner instead of being silently hidden from the directory.
    if (verifiedOnly === 'true') {
      doctors = doctors.filter(d => d.verificationStatus === 'verified');
    }

    // Specialization filter
    if (specialization && typeof specialization === 'string' && specialization !== 'All') {
      doctors = doctors.filter(d =>
        d.specialization.toLowerCase() === specialization.toLowerCase()
      );
    }

    // Gender filter
    if (gender && typeof gender === 'string' && gender !== 'All') {
      doctors = doctors.filter(d =>
        d.gender?.toLowerCase() === gender.toLowerCase()
      );
    }

    // Minimum Experience
    if (minExperience) {
      const expNum = Number(minExperience);
      if (!isNaN(expNum)) {
        doctors = doctors.filter(d => d.experience >= expNum);
      }
    }

    // Maximum Fee
    if (maxFee) {
      const feeNum = Number(maxFee);
      if (!isNaN(feeNum)) {
        doctors = doctors.filter(d => d.consultationFee <= feeNum);
      }
    }

    // Minimum Rating
    if (minRating) {
      const ratingNum = Number(minRating);
      if (!isNaN(ratingNum)) {
        doctors = doctors.filter(d => d.rating >= ratingNum);
      }
    }

    // Pre-fetch clinics for city / location and consultation type filtering
    const allClinics = ClinicModel.getAll();

    // City filter
    if (city && typeof city === 'string' && city.trim() !== '') {
      const targetCity = city.toLowerCase().trim();
      doctors = doctors.filter(doc => {
        const docClinics = allClinics.filter(c => c.doctorId === doc._id && c.isActive);
        return docClinics.some(c => c.city.toLowerCase().includes(targetCity));
      });
    }

    // Online consultation filter
    if (onlineOnly === 'true') {
      doctors = doctors.filter(doc => {
        const docClinics = allClinics.filter(c => c.doctorId === doc._id && c.isActive);
        return docClinics.some(c => c.onlineConsultation);
      });
    }

    // In-person consultation filter
    if (inPersonOnly === 'true') {
      doctors = doctors.filter(doc => {
        const docClinics = allClinics.filter(c => c.doctorId === doc._id && c.isActive);
        return docClinics.some(c => c.inPersonConsultation);
      });
    }

    // Keyword search across doctor name, specialization, qualification, clinic names, city
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      doctors = doctors.filter(doc => {
        const nameMatch = doc.name.toLowerCase().includes(q);
        const specMatch = doc.specialization.toLowerCase().includes(q);
        const qualMatch = doc.qualification.toLowerCase().includes(q);
        const aboutMatch = doc.about.toLowerCase().includes(q);

        const docClinics = allClinics.filter(c => c.doctorId === doc._id);
        const clinicMatch = docClinics.some(c =>
          c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
        );

        return nameMatch || specMatch || qualMatch || aboutMatch || clinicMatch;
      });
    }

    // Attach primary clinic info and review count to each doctor card
    const enhancedDoctors = doctors.map(doc => {
      const clinics = allClinics.filter(c => c.doctorId === doc._id && c.isActive);
      const primaryClinic = clinics.length > 0 ? clinics[0] : null;

      return {
        ...doc,
        clinicsCount: clinics.length,
        primaryClinic: primaryClinic ? {
          _id: primaryClinic._id,
          name: primaryClinic.name,
          city: primaryClinic.city,
          address: primaryClinic.address,
          openingTime: primaryClinic.openingTime,
          closingTime: primaryClinic.closingTime,
          onlineConsultation: primaryClinic.onlineConsultation
        } : null
      };
    });

    return res.status(200).json({
      success: true,
      count: enhancedDoctors.length,
      doctors: enhancedDoctors
    });
  } catch (err: any) {
    console.error('getDoctors error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctors list'
    });
  }
};

export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctor = DoctorProfileModel.findById(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or has been removed.'
      });
    }

    // Fetch clinics associated with this doctor (Doctors can have multiple clinics)
    const clinics = ClinicModel.find({ doctorId: doctor._id, isActive: true });

    // Fetch completed appointment reviews for this doctor
    const reviews = ReviewModel.find({ doctorId: doctor._id });

    return res.status(200).json({
      success: true,
      doctor: {
        ...doctor,
        clinics,
        reviews
      }
    });
  } catch (err: any) {
    console.error('getDoctorById error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor profile'
    });
  }
};

export const updateDoctorProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only registered doctors can update doctor profiles.'
      });
    }

    const doctorProfile = req.doctorProfile || DoctorProfileModel.findOne({ userId: req.user._id });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile record not found.'
      });
    }

    const {
      name,
      phone,
      specialization,
      qualification,
      experience,
      consultationFee,
      languages,
      about,
      profilePhoto,
      medicalRegistrationNumber,
      medicalCouncil
    } = req.body;

    const updated = DoctorProfileModel.findByIdAndUpdate(doctorProfile._id, {
      ...(name ? { name: name.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(specialization ? { specialization } : {}),
      ...(qualification ? { qualification } : {}),
      ...(experience !== undefined ? { experience: Number(experience) } : {}),
      ...(consultationFee !== undefined ? { consultationFee: Number(consultationFee) } : {}),
      ...(languages ? { languages: Array.isArray(languages) ? languages : [languages] } : {}),
      ...(about !== undefined ? { about } : {}),
      ...(profilePhoto ? { profilePhoto } : {}),
      ...(medicalRegistrationNumber ? { medicalRegistrationNumber: medicalRegistrationNumber.trim() } : {}),
      ...(medicalCouncil ? { medicalCouncil: medicalCouncil.trim() } : {})
    });

    if (name) {
      UserModel.findByIdAndUpdate(req.user._id, { name: name.trim() });
    }

    return res.status(200).json({
      success: true,
      message: 'Professional doctor profile updated successfully.',
      doctor: updated
    });
  } catch (err: any) {
    console.error('updateDoctorProfile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update doctor profile.'
    });
  }
};

export const getSpecializations = async (req: Request, res: Response) => {
  try {
    const doctors = DoctorProfileModel.getAll();
    const counts: Record<string, number> = {};

    const defaultSpecs = [
      'Cardiology',
      'Dermatology',
      'Dentist',
      'Neurology',
      'Orthopedics',
      'Pediatrics',
      'Gynecology',
      'General Physician'
    ];

    defaultSpecs.forEach(spec => { counts[spec] = 0; });

    doctors.forEach(d => {
      if (!d.specialization) return;
      counts[d.specialization] = (counts[d.specialization] || 0) + 1;
    });

    const list = Object.keys(counts)
      .filter(name => counts[name] > 0 || defaultSpecs.includes(name))
      .sort();

    return res.status(200).json({
      success: true,
      specializations: list
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to load specializations' });
  }
};
