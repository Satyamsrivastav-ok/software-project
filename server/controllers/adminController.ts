import { Response } from 'express';
import {
  UserModel,
  DoctorProfileModel,
  ClinicModel,
  AppointmentModel,
  ReviewModel,
  VerificationRequestModel,
  NotificationModel,
  PrescriptionModel,
  AvailabilityModel
} from '../models/index';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDemoCounts, deleteDemoDataService, seedDemoData } from '../seed/seedData';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = UserModel.countDocuments();
    const totalPatients = UserModel.countDocuments({ role: 'patient' });
    const totalDoctors = DoctorProfileModel.countDocuments();
    const verifiedDoctors = DoctorProfileModel.countDocuments({ verificationStatus: 'verified' });
    const pendingDoctors = DoctorProfileModel.countDocuments(d => ['pending', 'under_review'].includes(d.verificationStatus));
    const totalClinics = ClinicModel.countDocuments();
    const verifiedClinics = ClinicModel.countDocuments({ isVerified: true });
    const totalAppointments = AppointmentModel.countDocuments();
    const completedAppointments = AppointmentModel.countDocuments({ status: 'completed' });
    const cancelledAppointments = AppointmentModel.countDocuments({ status: 'cancelled' });
    const pendingAppointments = AppointmentModel.countDocuments({ status: 'pending' });
    const confirmedAppointments = AppointmentModel.countDocuments({ status: 'confirmed' });

    // Specialization analytics from real data
    const doctors = DoctorProfileModel.getAll();
    const specializationMap: Record<string, number> = {};
    doctors.forEach(d => {
      specializationMap[d.specialization] = (specializationMap[d.specialization] || 0) + 1;
    });

    const specializationsDistribution = Object.keys(specializationMap).map(name => ({
      name,
      count: specializationMap[name]
    }));

    // Appointments by status
    const statusDistribution = [
      { status: 'Confirmed', count: confirmedAppointments },
      { status: 'Completed', count: completedAppointments },
      { status: 'Pending', count: pendingAppointments },
      { status: 'Cancelled', count: cancelledAppointments }
    ];

    // Demo counts
    const demoCounts = getDemoCounts();

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalPatients,
        totalDoctors,
        verifiedDoctors,
        pendingDoctors,
        totalClinics,
        verifiedClinics,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        pendingAppointments,
        confirmedAppointments,
        specializationsDistribution,
        statusDistribution,
        demoCounts
      }
    });
  } catch (err: any) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to calculate dashboard statistics' });
  }
};

export const getDoctorVerifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    let requests = VerificationRequestModel.getAll();

    if (status && status !== 'all') {
      requests = requests.filter(r => r.status === status);
    }

    // Attach doctor profile details
    const populated = requests.map(req => {
      const doc = DoctorProfileModel.findById(req.doctorId);
      return {
        ...req,
        doctor: doc
      };
    });

    return res.status(200).json({
      success: true,
      count: populated.length,
      requests: populated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error fetching verification requests' });
  }
};

export const updateDoctorVerification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params; // verificationRequestId or doctorId
    const {
      status, // 'verified' | 'rejected' | 'under_review' | 'suspended'
      adminNotes,
      medicalRegistrationVerified,
      hospitalVerified,
      identityVerified
    } = req.body;

    let vReq = VerificationRequestModel.findById(id);
    let doctorId = vReq ? vReq.doctorId : id;

    const doctor = DoctorProfileModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const isVerified = status === 'verified';
    const now = new Date().toISOString();

    // Update Doctor Profile
    const updatedDoctor = DoctorProfileModel.findByIdAndUpdate(doctor._id, {
      verificationStatus: status,
      medicalRegistrationVerified: medicalRegistrationVerified !== undefined ? Boolean(medicalRegistrationVerified) : isVerified,
      hospitalVerified: hospitalVerified !== undefined ? Boolean(hospitalVerified) : isVerified,
      identityVerified: identityVerified !== undefined ? Boolean(identityVerified) : isVerified,
      verificationNotes: adminNotes || `Reviewed by administrator on ${new Date().toLocaleDateString()}`,
      verifiedAt: isVerified ? now : undefined
    });

    // Update Verification Request
    if (!vReq) {
      vReq = VerificationRequestModel.findOne({ doctorId: doctor._id });
    }
    if (vReq) {
      VerificationRequestModel.findByIdAndUpdate(vReq._id, {
        status,
        medicalRegistrationVerified: medicalRegistrationVerified !== undefined ? Boolean(medicalRegistrationVerified) : isVerified,
        hospitalVerified: hospitalVerified !== undefined ? Boolean(hospitalVerified) : isVerified,
        identityVerified: identityVerified !== undefined ? Boolean(identityVerified) : isVerified,
        adminNotes: adminNotes || '',
        reviewedBy: req.user?.name || 'Administrator',
        reviewedAt: now
      });
    }

    // Send notification to Doctor
    NotificationModel.create({
      userId: doctor.userId,
      title: isVerified ? 'Professional Verification Approved!' : `Verification Status: ${status}`,
      message: isVerified
        ? 'Congratulations! Your medical credentials have been verified by the platform administrator. You can now publish slots and accept patient bookings.'
        : `Your professional profile verification was set to '${status}'. Reason: ${adminNotes || 'Contact support for details.'}`,
      type: 'verification',
      read: false,
      link: '/doctor-dashboard',
      isDemo: doctor.isDemo
    });

    return res.status(200).json({
      success: true,
      message: `Doctor verification updated to '${status}'.`,
      doctor: updatedDoctor
    });
  } catch (err: any) {
    console.error('updateDoctorVerification error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update verification status.' });
  }
};

export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, search } = req.query;
    let users = UserModel.getAll();

    if (role && role !== 'all') {
      users = users.filter(u => u.role === role);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    const sanitized = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      gender: u.gender,
      isDemo: u.isDemo,
      createdAt: u.createdAt
    }));

    return res.status(200).json({ success: true, count: sanitized.length, users: sanitized });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin' && user.email === 'admin@docpulse.com') {
      return res.status(403).json({ success: false, message: 'Primary administrator cannot be deleted.' });
    }

    UserModel.findByIdAndDelete(id);

    if (user.role === 'doctor') {
      const doc = DoctorProfileModel.findOne({ userId: id });
      if (doc) {
        DoctorProfileModel.findByIdAndDelete(doc._id);
        ClinicModel.deleteMany({ doctorId: doc._id });
        AvailabilityModel.deleteMany({ doctorId: doc._id });
        VerificationRequestModel.deleteMany({ doctorId: doc._id });
      }
    }

    return res.status(200).json({ success: true, message: 'User removed from system.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

export const getAllDoctors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    let doctors = DoctorProfileModel.getAll();

    if (status && status !== 'all') {
      doctors = doctors.filter(d => d.verificationStatus === status);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      doctors = doctors.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.medicalRegistrationNumber.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({ success: true, count: doctors.length, doctors });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve doctors' });
  }
};

export const getAllClinics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clinics = ClinicModel.getAll();
    const doctors = DoctorProfileModel.getAll();

    const populated = clinics.map(c => ({
      ...c,
      doctor: doctors.find(d => d._id === c.doctorId)
    }));

    return res.status(200).json({ success: true, count: populated.length, clinics: populated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve clinics' });
  }
};

export const verifyClinic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isVerified, isActive } = req.body;

    const updated = ClinicModel.findByIdAndUpdate(id, {
      ...(isVerified !== undefined ? { isVerified: Boolean(isVerified) } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Clinic not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Clinic verification and status updated.',
      clinic: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update clinic verification' });
  }
};

export const getAllAppointments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    let appointments = AppointmentModel.getAll();

    if (status && status !== 'all') {
      appointments = appointments.filter(a => a.status === status);
    }

    const doctors = DoctorProfileModel.getAll();
    const clinics = ClinicModel.getAll();

    const populated = appointments.map(apt => ({
      ...apt,
      doctor: doctors.find(d => d._id === apt.doctorId),
      clinic: clinics.find(c => c._id === apt.clinicId)
    }));

    return res.status(200).json({ success: true, count: populated.length, appointments: populated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve appointments' });
  }
};

export const getAllReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviews = ReviewModel.getAll();
    const doctors = DoctorProfileModel.getAll();

    const populated = reviews.map(r => ({
      ...r,
      doctor: doctors.find(d => d._id === r.doctorId)
    }));

    return res.status(200).json({ success: true, count: populated.length, reviews: populated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve reviews' });
  }
};

export const deleteReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const review = ReviewModel.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    ReviewModel.findByIdAndDelete(id);

    // Recalculate doctor rating
    const remaining = ReviewModel.find({ doctorId: review.doctorId });
    const avg = remaining.length > 0
      ? Number((remaining.reduce((s, r) => s + r.rating, 0) / remaining.length).toFixed(1))
      : 0;

    DoctorProfileModel.findByIdAndUpdate(review.doctorId, {
      rating: avg,
      reviewCount: remaining.length
    });

    return res.status(200).json({ success: true, message: 'Review removed by administrator' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
};

// DEMO DATA MANAGEMENT ENDPOINTS (Rules 9, 10, 11)
export const getDemoStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const counts = getDemoCounts();
    return res.status(200).json({ success: true, counts });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error retrieving demo counts' });
  }
};

export const deleteDemoData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { target } = req.params; // 'doctors' | 'patients' | 'clinics' | 'appointments' | 'all'

    if (!['doctors', 'patients', 'clinics', 'appointments', 'all'].includes(target)) {
      return res.status(400).json({
        success: false,
        message: "Invalid target. Must be 'doctors', 'patients', 'clinics', 'appointments', or 'all'."
      });
    }

    const result = deleteDemoDataService(target as any);

    return res.status(200).json({
      success: true,
      message: target === 'all'
        ? 'All demo records have been permanently deleted from the database. Real user accounts and data are unaffected.'
        : `All demo ${target} have been permanently deleted from the database.`,
      result
    });
  } catch (err: any) {
    console.error('deleteDemoData error:', err);
    return res.status(500).json({ success: false, message: 'Failed to execute demo cleanup.' });
  }
};

export const reseedDemoData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await seedDemoData(true);
    return res.status(200).json({
      success: true,
      message: 'Demo dataset successfully restored and populated.',
      result
    });
  } catch (err: any) {
    console.error('reseedDemoData error:', err);
    return res.status(500).json({ success: false, message: 'Failed to repopulate demo data' });
  }
};
