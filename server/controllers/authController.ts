import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  UserModel,
  DoctorProfileModel,
  VerificationRequestModel,
  NotificationModel
} from '../models/index';
import { generateToken, AuthenticatedRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      role = 'patient',
      phone,
      gender,
      // Doctor-specific fields
      specialization,
      qualification,
      experience,
      consultationFee,
      medicalRegistrationNumber,
      medicalCouncil,
      languages,
      about,
      profilePhoto
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    const existingUser = UserModel.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please log in.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User (isDemo: false for real registrations!)
    const user = UserModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role === 'doctor' ? 'doctor' : 'patient',
      phone: phone || '',
      gender: gender || 'Prefer not to say',
      avatar: profilePhoto || '',
      isDemo: false
    });

    let doctorProfile = null;

    if (role === 'doctor') {
      if (!medicalRegistrationNumber || !medicalCouncil || !specialization) {
        // Rollback user if missing critical doctor info
        UserModel.findByIdAndDelete(user._id);
        return res.status(400).json({
          success: false,
          message: 'Medical registration number, medical council, and specialization are required for doctors.'
        });
      }

      doctorProfile = DoctorProfileModel.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: phone || '',
        gender: gender || 'Other',
        specialization: specialization || 'General Physician',
        qualification: qualification || 'MBBS',
        experience: Number(experience) || 1,
        consultationFee: Number(consultationFee) || 500,
        medicalRegistrationNumber: medicalRegistrationNumber.trim(),
        medicalCouncil: medicalCouncil.trim(),
        languages: Array.isArray(languages) ? languages : ['English'],
        about: about || '',
        profilePhoto: profilePhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
        verificationStatus: 'pending', // Unverified on initial registration
        medicalRegistrationVerified: false,
        hospitalVerified: false,
        identityVerified: false,
        verificationNotes: 'Initial registration submitted for administrator review.',
        rating: 0,
        reviewCount: 0,
        isDemo: false
      });

      // Create Verification Request for Admin review
      VerificationRequestModel.create({
        doctorId: doctorProfile._id,
        doctorName: doctorProfile.name,
        medicalRegistrationNumber: doctorProfile.medicalRegistrationNumber,
        medicalCouncil: doctorProfile.medicalCouncil,
        qualification: doctorProfile.qualification,
        specialization: doctorProfile.specialization,
        status: 'pending',
        medicalRegistrationVerified: false,
        hospitalVerified: false,
        identityVerified: false,
        adminNotes: 'Awaiting platform administrator verification review.',
        submittedAt: new Date().toISOString(),
        isDemo: false
      });

      // Create welcome notification
      NotificationModel.create({
        userId: user._id,
        title: 'Doctor Account Created',
        message: 'Your registration details have been submitted. Professional verification is currently pending administrator review.',
        type: 'verification',
        read: false,
        link: '/doctor-dashboard',
        isDemo: false
      });
    } else {
      NotificationModel.create({
        userId: user._id,
        title: 'Welcome to DocPulse',
        message: 'Your patient account is ready. Explore top verified doctors and easily schedule consultations.',
        type: 'system',
        read: false,
        link: '/find-doctors',
        isDemo: false
      });
    }

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: role === 'doctor'
        ? 'Doctor registration successful. Your profile is under administrator verification review.'
        : 'Patient account created successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        avatar: user.avatar,
        isDemo: user.isDemo
      },
      doctorProfile
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = DoctorProfileModel.findOne({ userId: user._id });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        avatar: user.avatar,
        isDemo: user.isDemo
      },
      doctorProfile
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = DoctorProfileModel.findOne({ userId: user._id });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        avatar: user.avatar,
        isDemo: user.isDemo
      },
      doctorProfile
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { name, phone, gender, avatar } = req.body;
    const updatedUser = UserModel.findByIdAndUpdate(req.user._id, {
      ...(name ? { name: name.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(gender ? { gender } : {}),
      ...(avatar ? { avatar } : {})
    });

    let updatedDoctorProfile = null;
    if (req.user.role === 'doctor') {
      const doc = DoctorProfileModel.findOne({ userId: req.user._id });
      if (doc) {
        const {
          specialization,
          qualification,
          experience,
          consultationFee,
          languages,
          about,
          medicalRegistrationNumber,
          medicalCouncil
        } = req.body;

        updatedDoctorProfile = DoctorProfileModel.findByIdAndUpdate(doc._id, {
          ...(name ? { name: name.trim() } : {}),
          ...(phone !== undefined ? { phone: phone.trim() } : {}),
          ...(specialization ? { specialization } : {}),
          ...(qualification ? { qualification } : {}),
          ...(experience !== undefined ? { experience: Number(experience) } : {}),
          ...(consultationFee !== undefined ? { consultationFee: Number(consultationFee) } : {}),
          ...(languages ? { languages: Array.isArray(languages) ? languages : [languages] } : {}),
          ...(about !== undefined ? { about } : {}),
          ...(avatar ? { profilePhoto: avatar } : {}),
          ...(medicalRegistrationNumber ? { medicalRegistrationNumber: medicalRegistrationNumber.trim() } : {}),
          ...(medicalCouncil ? { medicalCouncil: medicalCouncil.trim() } : {})
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        role: updatedUser?.role,
        phone: updatedUser?.phone,
        gender: updatedUser?.gender,
        avatar: updatedUser?.avatar,
        isDemo: updatedUser?.isDemo
      },
      doctorProfile: updatedDoctorProfile
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error updating profile' });
  }
};
