import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, DoctorProfileModel, IUser, IDoctorProfile } from '../models/index';

const JWT_SECRET = process.env.JWT_SECRET || 'docpulse_super_secret_jwt_key_development_2026';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  doctorProfile?: IDoctorProfile;
}

export function generateToken(user: IUser): string {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Authentication middleware - verifies JWT token from Authorization Bearer header
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token required.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; email: string };
    const user = UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session or user no longer exists.'
      });
    }

    req.user = user;

    if (user.role === 'doctor') {
      const docProfile = DoctorProfileModel.findOne({ userId: user._id });
      if (docProfile) {
        req.doctorProfile = docProfile;
      }
    }

    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token. Please log in again.'
    });
  }
};

// Optional auth - populates req.user if token is valid, but does not block if not
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; email: string };
      const user = UserModel.findById(decoded.id);
      if (user) {
        req.user = user;
        if (user.role === 'doctor') {
          const doc = DoctorProfileModel.findOne({ userId: user._id });
          if (doc) req.doctorProfile = doc;
        }
      }
    } catch {
      // ignore
    }
  }
  next();
};

// Role authorization middleware
export const requireRole = (...allowedRoles: Array<'patient' | 'doctor' | 'admin'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for this resource.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires ${allowedRoles.join(' or ')} permissions. Your role is '${req.user.role}'.`
      });
    }

    next();
  };
};

// Enforces doctor verification (Backend Rule 2 & 3: Unverified doctors cannot accept appointments, publish slots, etc.)
export const requireVerifiedDoctor = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'This operation is restricted to medical doctors.'
    });
  }

  const doctorProfile = req.doctorProfile || DoctorProfileModel.findOne({ userId: req.user._id });
  if (!doctorProfile) {
    return res.status(404).json({
      success: false,
      message: 'Doctor profile not found. Please complete registration.'
    });
  }

  if (doctorProfile.verificationStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: `Action denied. Professional doctor verification required. Current status: ${doctorProfile.verificationStatus}. Verification reviewed by platform administrator.`,
      verificationStatus: doctorProfile.verificationStatus
    });
  }

  req.doctorProfile = doctorProfile;
  next();
};
