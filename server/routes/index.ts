import { Router } from 'express';
import { register, login, me, updateProfile } from '../controllers/authController';
import {
  getDoctors,
  getDoctorById,
  updateDoctorProfile,
  getSpecializations
} from '../controllers/doctorController';
import {
  getClinics,
  getClinicById,
  getMyClinics,
  createClinic,
  updateClinic,
  deleteClinic
} from '../controllers/clinicController';
import {
  getDoctorSlots,
  getMyAvailability,
  updateAvailability
} from '../controllers/availabilityController';
import {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  requestReschedule
} from '../controllers/appointmentController';
import {
  createPrescription,
  getPrescriptionById,
  getMyPrescriptions
} from '../controllers/prescriptionController';
import {
  createReview,
  getDoctorReviews,
  respondToReview
} from '../controllers/reviewController';
import {
  getDashboardStats,
  getDoctorVerifications,
  updateDoctorVerification,
  getAllUsers,
  deleteUser,
  getAllDoctors,
  getAllClinics,
  verifyClinic,
  getAllAppointments,
  getAllReviews,
  deleteReview,
  getDemoStats,
  deleteDemoData,
  reseedDemoData
} from '../controllers/adminController';
import { getMyNotifications, markAsRead } from '../controllers/notificationController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// ==========================================
// AUTHENTICATION & USER PROFILE
// ==========================================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, me);
router.put('/auth/profile', requireAuth, updateProfile);

// ==========================================
// DOCTORS & DISCOVERY
// ==========================================
router.get('/doctors', getDoctors);
router.get('/doctors/specializations', getSpecializations);
router.get('/doctors/:id', getDoctorById);
router.put('/doctors/profile/update', requireAuth, requireRole('doctor'), updateDoctorProfile);

// ==========================================
// CLINICS (Multi-Clinic & Independent Creation)
// ==========================================
router.get('/clinics', getClinics);
router.get('/clinics/my', requireAuth, requireRole('doctor'), getMyClinics);
router.get('/clinics/:id', getClinicById);
router.post('/clinics', requireAuth, requireRole('doctor'), createClinic);
router.put('/clinics/:id', requireAuth, updateClinic);
router.delete('/clinics/:id', requireAuth, deleteClinic);

// ==========================================
// AVAILABILITY & TIME SLOTS
// ==========================================
router.get('/availability/doctor/:doctorId', getDoctorSlots);
router.get('/availability/my', requireAuth, requireRole('doctor'), getMyAvailability);
router.post('/availability', requireAuth, requireRole('doctor'), updateAvailability);

// ==========================================
// APPOINTMENTS
// ==========================================
router.post('/appointments', requireAuth, requireRole('patient'), bookAppointment);
router.get('/appointments/my', requireAuth, getMyAppointments);
router.get('/appointments/:id', requireAuth, getAppointmentById);
router.put('/appointments/:id/status', requireAuth, updateAppointmentStatus);
router.post('/appointments/:id/cancel', requireAuth, cancelAppointment);
router.post('/appointments/:id/reschedule', requireAuth, requestReschedule);

// ==========================================
// PRESCRIPTIONS
// ==========================================
router.post('/prescriptions', requireAuth, requireRole('doctor'), createPrescription);
router.get('/prescriptions/my', requireAuth, getMyPrescriptions);
router.get('/prescriptions/:id', requireAuth, getPrescriptionById);

// ==========================================
// REVIEWS
// ==========================================
router.post('/reviews', requireAuth, requireRole('patient'), createReview);
router.get('/reviews/doctor/:doctorId', getDoctorReviews);
router.post('/reviews/:id/respond', requireAuth, requireRole('doctor', 'admin'), respondToReview);

// ==========================================
// NOTIFICATIONS
// ==========================================
router.get('/notifications', requireAuth, getMyNotifications);
router.put('/notifications/:id/read', requireAuth, markAsRead);

// ==========================================
// ADMIN DASHBOARD & VERIFICATION MANAGEMENT
// ==========================================
router.get('/admin/stats', requireAuth, requireRole('admin'), getDashboardStats);
router.get('/admin/verifications', requireAuth, requireRole('admin'), getDoctorVerifications);
router.put('/admin/verifications/:id', requireAuth, requireRole('admin'), updateDoctorVerification);
router.get('/admin/users', requireAuth, requireRole('admin'), getAllUsers);
router.delete('/admin/users/:id', requireAuth, requireRole('admin'), deleteUser);
router.get('/admin/doctors', requireAuth, requireRole('admin'), getAllDoctors);
router.get('/admin/clinics', requireAuth, requireRole('admin'), getAllClinics);
router.put('/admin/clinics/:id/verify', requireAuth, requireRole('admin'), verifyClinic);
router.get('/admin/appointments', requireAuth, requireRole('admin'), getAllAppointments);
router.get('/admin/reviews', requireAuth, requireRole('admin'), getAllReviews);
router.delete('/admin/reviews/:id', requireAuth, requireRole('admin'), deleteReview);

// Demo Data Control (Physical Deletion & Inspection)
router.get('/admin/demo/counts', requireAuth, requireRole('admin'), getDemoStats);
router.delete('/admin/demo/:target', requireAuth, requireRole('admin'), deleteDemoData);
router.post('/admin/demo/seed', requireAuth, requireRole('admin'), reseedDemoData);

export default router;
