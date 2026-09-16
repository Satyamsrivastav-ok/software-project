import { Request, Response } from 'express';
import {
  AvailabilityModel,
  DoctorProfileModel,
  AppointmentModel,
  ClinicModel
} from '../models/index';
import { AuthenticatedRequest } from '../middleware/auth';

// Helper to convert time strings like "09:30 AM" to minutes from midnight
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

// Helper to format minutes from midnight back to "09:30 AM"
function minutesToTime(mins: number): string {
  let hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  const period = hours >= 12 ? 'PM' : 'AM';

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const hrStr = hours < 10 ? `0${hours}` : `${hours}`;
  return `${hrStr}:${minStr} ${period}`;
}

export const getDoctorSlots = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { date, clinicId } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and target date (YYYY-MM-DD) are required.'
      });
    }

    const doctor = DoctorProfileModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Rule 2 & 3: Unverified doctors must NOT publish slots or accept appointments
    if (doctor.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: `Doctor is currently ${doctor.verificationStatus}. Appointment slots can only be published by verified doctors. Verification reviewed by platform administrator.`,
        isVerified: false
      });
    }

    // Find availability settings
    let availability = null;
    if (clinicId) {
      availability = AvailabilityModel.findOne({ doctorId, clinicId: clinicId as string });
    }
    if (!availability) {
      availability = AvailabilityModel.findOne({ doctorId });
    }

    // Fallback default schedule if not explicitly set
    const schedule = availability || {
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      slotDuration: 30,
      breakTimes: [{ startTime: '01:00 PM', endTime: '02:00 PM' }],
      blockedDates: [],
      holidayDates: []
    };

    const targetDate = new Date(date as string);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Check if target date is a blocked date or holiday
    const dateStr = date as string;
    const isBlocked = (schedule.blockedDates || []).includes(dateStr);
    const isHoliday = (schedule.holidayDates || []).includes(dateStr);
    const isWorkingDay = (schedule.workingDays || []).includes(dayName);

    if (isBlocked || isHoliday || !isWorkingDay) {
      return res.status(200).json({
        success: true,
        isAvailable: false,
        reason: isBlocked
          ? 'Doctor has marked this specific date as unavailable.'
          : isHoliday
          ? 'Doctor is on scheduled holiday on this date.'
          : `Doctor does not practice on ${dayName}s.`,
        slots: []
      });
    }

    // Generate slots
    const startMins = timeToMinutes(schedule.startTime || '09:00 AM');
    const endMins = timeToMinutes(schedule.endTime || '05:00 PM');
    const duration = schedule.slotDuration || 30;

    const breaks = (schedule.breakTimes || []).map(b => ({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime)
    }));

    // Find all existing booked appointments for this doctor on this date
    const bookedAppointments = AppointmentModel.find(a =>
      a.doctorId === doctorId &&
      a.date === dateStr &&
      ['pending', 'confirmed', 'completed'].includes(a.status)
    );

    const bookedTimes = new Set(bookedAppointments.map(a => a.startTime));

    const slots: Array<{
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      bookedReason?: string;
    }> = [];

    for (let cur = startMins; cur + duration <= endMins; cur += duration) {
      const slotStart = cur;
      const slotEnd = cur + duration;

      // Check if slot overlaps with break time
      const inBreak = breaks.some(b => slotStart < b.end && slotEnd > b.start);
      if (inBreak) continue;

      const startTimeFormatted = minutesToTime(slotStart);
      const endTimeFormatted = minutesToTime(slotEnd);

      const isBooked = bookedTimes.has(startTimeFormatted);

      slots.push({
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        isAvailable: !isBooked,
        bookedReason: isBooked ? 'Slot already reserved by another patient' : undefined
      });
    }

    return res.status(200).json({
      success: true,
      isAvailable: true,
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        consultationFee: doctor.consultationFee
      },
      date: dateStr,
      dayName,
      slotDuration: duration,
      slots
    });
  } catch (err: any) {
    console.error('getDoctorSlots error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate availability slots.' });
  }
};

export const getMyAvailability = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Access restricted to doctors.' });
    }

    const doctorProfile = req.doctorProfile || DoctorProfileModel.findOne({ userId: req.user._id });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const schedules = AvailabilityModel.find({ doctorId: doctorProfile._id });

    return res.status(200).json({
      success: true,
      schedules
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to load availability.' });
  }
};

export const updateAvailability = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Access restricted to doctors.' });
    }

    const doctorProfile = req.doctorProfile || DoctorProfileModel.findOne({ userId: req.user._id });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const {
      clinicId,
      workingDays,
      startTime,
      endTime,
      slotDuration,
      breakTimes,
      blockedDates,
      holidayDates
    } = req.body;

    const query: any = { doctorId: doctorProfile._id };
    if (clinicId) query.clinicId = clinicId;

    let existing = AvailabilityModel.findOne(query);

    if (existing) {
      const updated = AvailabilityModel.findByIdAndUpdate(existing._id, {
        ...(workingDays ? { workingDays } : {}),
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
        ...(slotDuration !== undefined ? { slotDuration: Number(slotDuration) } : {}),
        ...(breakTimes ? { breakTimes } : {}),
        ...(blockedDates ? { blockedDates } : {}),
        ...(holidayDates ? { holidayDates } : {})
      });

      return res.status(200).json({
        success: true,
        message: 'Availability schedule updated successfully.',
        schedule: updated
      });
    } else {
      const created = AvailabilityModel.create({
        doctorId: doctorProfile._id,
        clinicId: clinicId || undefined,
        workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: startTime || '09:00 AM',
        endTime: endTime || '05:00 PM',
        slotDuration: slotDuration || 30,
        breakTimes: breakTimes || [{ startTime: '01:00 PM', endTime: '02:00 PM' }],
        blockedDates: blockedDates || [],
        holidayDates: holidayDates || [],
        isDemo: false
      });

      return res.status(201).json({
        success: true,
        message: 'Availability schedule created successfully.',
        schedule: created
      });
    }
  } catch (err: any) {
    console.error('updateAvailability error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save availability.' });
  }
};
