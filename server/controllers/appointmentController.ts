import { Response } from 'express';
import {
  AppointmentModel,
  DoctorProfileModel,
  ClinicModel,
  UserModel,
  NotificationModel
} from '../models/index';
import { AuthenticatedRequest } from '../middleware/auth';

export const bookAppointment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Rule 1: Only authenticated patients can book appointments
    if (!req.user || req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only registered patients can book appointments. Please log in as a patient.'
      });
    }

    const {
      doctorId,
      clinicId,
      date,
      startTime,
      endTime,
      consultationType = 'In-Person',
      reason,
      patientPhone
    } = req.body;

    if (!doctorId || !clinicId || !date || !startTime || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Doctor, clinic, date, start time, and reason for consultation are required.'
      });
    }

    // Rule 2 & 3: Check doctor verification status
    const doctor = DoctorProfileModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    if (doctor.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: `Appointment booking rejected. Doctor is currently '${doctor.verificationStatus}'. Only platform-verified doctors can receive appointments. Verification reviewed by platform administrator.`
      });
    }

    // Validate Clinic
    const clinic = ClinicModel.findById(clinicId);
    if (!clinic || !clinic.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Selected clinic is inactive or not found.'
      });
    }

    // Rule 7 & Double-booking prevention:
    // Check if slot is already reserved for this doctor on this date and time
    const existingConflict = AppointmentModel.findOne(a =>
      a.doctorId === doctorId &&
      a.date === date &&
      a.startTime === startTime &&
      ['pending', 'confirmed', 'completed'].includes(a.status)
    );

    if (existingConflict) {
      return res.status(409).json({
        success: false,
        message: `Double-booking prevented: The slot ${startTime} on ${date} is already reserved by another patient. Please select an alternate available time.`
      });
    }

    // Calculate endTime if not provided (default 30 mins)
    let computedEndTime = endTime;
    if (!computedEndTime) {
      const match = startTime.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (match) {
        let h = parseInt(match[1], 10);
        let m = parseInt(match[2], 10) + 30;
        let p = match[3].toUpperCase();
        if (m >= 60) {
          m -= 60;
          h += 1;
          if (h === 12 && p === 'AM') p = 'PM';
          else if (h > 12) h = 1;
        }
        computedEndTime = `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m} ${p}`;
      } else {
        computedEndTime = startTime;
      }
    }

    const appointment = AppointmentModel.create({
      patientId: req.user._id,
      doctorId: doctor._id,
      clinicId: clinic._id,
      date,
      startTime,
      endTime: computedEndTime,
      consultationType: consultationType as any,
      reason: reason.trim(),
      status: 'confirmed', // Auto-confirm verified doctor slot
      paymentStatus: 'at_clinic',
      patientName: req.user.name,
      patientEmail: req.user.email,
      patientPhone: patientPhone || req.user.phone || '',
      isDemo: false
    });

    // Notify doctor
    NotificationModel.create({
      userId: doctor.userId,
      title: 'New Appointment Scheduled',
      message: `Patient ${req.user.name} booked a consultation at ${clinic.name} for ${date} at ${startTime}.`,
      type: 'appointment',
      read: false,
      link: '/doctor-dashboard',
      isDemo: false
    });

    // Notify patient
    NotificationModel.create({
      userId: req.user._id,
      title: 'Appointment Confirmed',
      message: `Your appointment with ${doctor.name} at ${clinic.name} on ${date} at ${startTime} has been confirmed.`,
      type: 'appointment',
      read: false,
      link: '/dashboard',
      isDemo: false
    });

    return res.status(201).json({
      success: true,
      message: 'Appointment confirmed successfully!',
      appointment
    });
  } catch (err: any) {
    console.error('bookAppointment error:', err);
    return res.status(500).json({ success: false, message: 'Server error while booking appointment.' });
  }
};

export const getMyAppointments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let appointments = [];
    const allDoctors = DoctorProfileModel.getAll();
    const allClinics = ClinicModel.getAll();

    if (req.user.role === 'patient') {
      appointments = AppointmentModel.find({ patientId: req.user._id });
    } else if (req.user.role === 'doctor') {
      const docProfile = req.doctorProfile || DoctorProfileModel.findOne({ userId: req.user._id });
      if (!docProfile) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found' });
      }
      appointments = AppointmentModel.find({ doctorId: docProfile._id });
    } else if (req.user.role === 'admin') {
      appointments = AppointmentModel.getAll();
    }

    // Sort by date descending
    appointments.sort((a, b) => new Date(b.date + ' ' + b.startTime).getTime() - new Date(a.date + ' ' + a.startTime).getTime());

    // Populate doctor & clinic info
    const populated = appointments.map(apt => {
      const doctor = allDoctors.find(d => d._id === apt.doctorId);
      const clinic = allClinics.find(c => c._id === apt.clinicId);
      return {
        ...apt,
        doctor: doctor ? {
          _id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
          consultationFee: doctor.consultationFee,
          profilePhoto: doctor.profilePhoto,
          verificationStatus: doctor.verificationStatus
        } : null,
        clinic: clinic ? {
          _id: clinic._id,
          name: clinic.name,
          address: clinic.address,
          city: clinic.city,
          phone: clinic.phone
        } : null
      };
    });

    return res.status(200).json({
      success: true,
      count: populated.length,
      appointments: populated
    });
  } catch (err: any) {
    console.error('getMyAppointments error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve appointments' });
  }
};

export const getAppointmentById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const appointment = AppointmentModel.findById(id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const doctor = DoctorProfileModel.findById(appointment.doctorId);
    const clinic = ClinicModel.findById(appointment.clinicId);
    const patient = UserModel.findById(appointment.patientId);

    return res.status(200).json({
      success: true,
      appointment: {
        ...appointment,
        doctor,
        clinic,
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
    return res.status(500).json({ success: false, message: 'Error loading appointment' });
  }
};

export const updateAppointmentStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, cancellationReason } = req.body;

    const appointment = AppointmentModel.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Role checks
    const doctorProfile = req.user?.role === 'doctor'
      ? (req.doctorProfile || DoctorProfileModel.findOne({ userId: req.user._id }))
      : null;

    // Rule 2 check: Unverified doctors cannot accept or manage appointments
    if (req.user?.role === 'doctor') {
      if (!doctorProfile || doctorProfile._id !== appointment.doctorId) {
        return res.status(403).json({ success: false, message: 'Unauthorized for this appointment.' });
      }
      if (doctorProfile.verificationStatus !== 'verified') {
        return res.status(403).json({
          success: false,
          message: 'Operation denied. Unverified doctors cannot accept or conduct appointments.'
        });
      }
    }

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'rescheduled', 'no_show'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status '${status}'.` });
    }

    const updated = AppointmentModel.findByIdAndUpdate(id, {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(cancellationReason !== undefined ? { cancellationReason } : {})
    });

    // Send notification to patient
    NotificationModel.create({
      userId: appointment.patientId,
      title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your appointment on ${appointment.date} at ${appointment.startTime} has been updated to '${status}'.`,
      type: 'appointment',
      read: false,
      link: '/dashboard',
      isDemo: appointment.isDemo
    });

    return res.status(200).json({
      success: true,
      message: `Appointment updated to ${status}`,
      appointment: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error updating appointment status' });
  }
};

export const cancelAppointment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = AppointmentModel.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const doctorProfile = req.user?.role === 'doctor'
      ? (req.doctorProfile || DoctorProfileModel.findOne({ userId: req.user._id }))
      : null;

    const isPatientOwner = req.user?.role === 'patient' && appointment.patientId === req.user._id;
    const isDoctorOwner = req.user?.role === 'doctor' && appointment.doctorId === doctorProfile?._id;
    const isAdmin = req.user?.role === 'admin';

    if (!isPatientOwner && !isDoctorOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this appointment.' });
    }

    const updated = AppointmentModel.findByIdAndUpdate(id, {
      status: 'cancelled',
      cancellationReason: reason || 'Cancelled by user'
    });

    // Notify counterpart
    const targetUserId = isPatientOwner
      ? DoctorProfileModel.findById(appointment.doctorId)?.userId
      : appointment.patientId;

    if (targetUserId) {
      NotificationModel.create({
        userId: targetUserId,
        title: 'Appointment Cancelled',
        message: `Appointment for ${appointment.date} at ${appointment.startTime} was cancelled: ${reason || 'No reason provided'}.`,
        type: 'appointment',
        read: false,
        link: isPatientOwner ? '/doctor-dashboard' : '/dashboard',
        isDemo: appointment.isDemo
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully.',
      appointment: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to cancel appointment.' });
  }
};

export const requestReschedule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { requestedDate, requestedTime, reason } = req.body;

    if (!requestedDate || !requestedTime) {
      return res.status(400).json({
        success: false,
        message: 'Requested date and time are required.'
      });
    }

    const appointment = AppointmentModel.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (req.user?.role !== 'patient' || appointment.patientId !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Only booking patient can request reschedule.' });
    }

    // Check slot availability
    const conflict = AppointmentModel.findOne(a =>
      a.doctorId === appointment.doctorId &&
      a.date === requestedDate &&
      a.startTime === requestedTime &&
      ['pending', 'confirmed', 'completed'].includes(a.status)
    );

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'The requested reschedule slot is already occupied.'
      });
    }

    const updated = AppointmentModel.findByIdAndUpdate(id, {
      date: requestedDate,
      startTime: requestedTime,
      status: 'rescheduled',
      rescheduleRequest: {
        requestedDate,
        requestedTime,
        reason: reason || 'Patient requested reschedule'
      }
    });

    const doc = DoctorProfileModel.findById(appointment.doctorId);
    if (doc) {
      NotificationModel.create({
        userId: doc.userId,
        title: 'Appointment Rescheduled',
        message: `Patient ${req.user.name} rescheduled their visit to ${requestedDate} at ${requestedTime}.`,
        type: 'appointment',
        read: false,
        link: '/doctor-dashboard',
        isDemo: appointment.isDemo
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully.',
      appointment: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to reschedule appointment.' });
  }
};
