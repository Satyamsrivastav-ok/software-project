import { Response } from 'express';
import {
  ReviewModel,
  AppointmentModel,
  DoctorProfileModel,
  UserModel
} from '../models/index';
import { AuthenticatedRequest } from '../middleware/auth';

export const createReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only verified patients can submit reviews.'
      });
    }

    const { appointmentId, rating, comment } = req.body;

    if (!appointmentId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID, rating (1-5), and review feedback comment are required.'
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.'
      });
    }

    // Rule 8 check: Ensure appointment exists and was completed by this patient
    const appointment = AppointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (appointment.patientId !== req.user._id) {
      return res.status(403).json({
        success: false,
        message: 'You can only review consultations that you personally attended.'
      });
    }

    if (appointment.status !== 'completed') {
      return res.status(403).json({
        success: false,
        message: `Reviews are only allowed after a consultation is completed. Current appointment status is '${appointment.status}'.`
      });
    }

    // Prevent duplicate reviews for the same appointment
    const existingReview = ReviewModel.findOne({ appointmentId });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a review for this consultation.'
      });
    }

    const newReview = ReviewModel.create({
      appointmentId,
      doctorId: appointment.doctorId,
      patientId: req.user._id,
      patientName: req.user.name,
      rating: Math.round(numRating),
      comment: comment.trim(),
      isDemo: appointment.isDemo
    });

    // Recalculate doctor's aggregate rating
    const allDocReviews = ReviewModel.find({ doctorId: appointment.doctorId });
    const avgRating = allDocReviews.reduce((sum, r) => sum + r.rating, 0) / allDocReviews.length;

    DoctorProfileModel.findByIdAndUpdate(appointment.doctorId, {
      rating: Number(avgRating.toFixed(1)),
      reviewCount: allDocReviews.length
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your verified consultation review has been posted.',
      review: newReview
    });
  } catch (err: any) {
    console.error('createReview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
};

export const getDoctorReviews = async (req: any, res: Response) => {
  try {
    const { doctorId } = req.params;
    const reviews = ReviewModel.find({ doctorId });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to load reviews' });
  }
};

export const respondToReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { doctorResponse } = req.body;

    if (!doctorResponse) {
      return res.status(400).json({ success: false, message: 'Response text required.' });
    }

    const review = ReviewModel.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const doctorProfile = req.doctorProfile || (req.user ? DoctorProfileModel.findOne({ userId: req.user._id }) : null);

    if (review.doctorId !== doctorProfile?._id && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const updated = ReviewModel.findByIdAndUpdate(id, {
      doctorResponse: doctorResponse.trim()
    });

    return res.status(200).json({
      success: true,
      message: 'Response posted to patient review.',
      review: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error responding to review' });
  }
};
