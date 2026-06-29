import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';
import PatientProfile from '../models/PatientProfile';
import { AuthRequest } from '../middlewares/auth';
import { AuditLogger } from '../services/AuditLogger';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'production_super_secret_jwt_key_hfms_2026', {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, phoneNumber, patientDetails } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || UserRole.Patient,
      phoneNumber,
    });

    let profile = null;

    if (user.role === UserRole.Patient) {
      if (!patientDetails || !patientDetails.patientId || !patientDetails.hospitalRegNumber || !patientDetails.assignedDoctor || !patientDetails.assignedDietician || !patientDetails.wardNumber || !patientDetails.bedNumber) {
        await User.findByIdAndDelete(user._id);
        res.status(400).json({
          success: false,
          message: 'Patient registration requires mandatory fields: patientId, hospitalRegNumber, assignedDoctor, assignedDietician, wardNumber, bedNumber',
        });
        return;
      }

      profile = await PatientProfile.create({
        userId: user._id,
        patientId: patientDetails.patientId,
        hospitalRegNumber: patientDetails.hospitalRegNumber,
        assignedDoctor: patientDetails.assignedDoctor,
        assignedDietician: patientDetails.assignedDietician,
        wardNumber: patientDetails.wardNumber,
        bedNumber: patientDetails.bedNumber,
        diseaseType: patientDetails.diseaseType || 'General',
        recoveryStage: patientDetails.recoveryStage || 'Recovering',
        ageGroup: patientDetails.ageGroup || 'Adult',
        allergies: patientDetails.allergies || [],
        medicalRestrictions: patientDetails.medicalRestrictions || [],
      });
    }

    await AuditLogger.log(user._id.toString(), 'USER_REGISTERED', { role: user.role, email }, req.ip);

    res.status(201).json({
      success: true,
      token: generateToken(user._id.toString()),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        profile,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (!user.active) {
      res.status(403).json({ success: false, message: 'User account is deactivated' });
      return;
    }

    let profile = null;
    if (user.role === UserRole.Patient) {
      profile = await PatientProfile.findOne({ userId: user._id })
        .populate('assignedDoctor', 'name email')
        .populate('assignedDietician', 'name email');
    }

    await AuditLogger.log(user._id.toString(), 'USER_LOGIN', { role: user.role, email }, req.ip);

    res.status(200).json({
      success: true,
      token: generateToken(user._id.toString()),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        isOnline: user.isOnline,
        profile,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let profile = null;
    if (user.role === UserRole.Patient) {
      profile = await PatientProfile.findOne({ userId: user._id })
        .populate('assignedDoctor', 'name email')
        .populate('assignedDietician', 'name email');
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        isOnline: user.isOnline,
        profile,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
