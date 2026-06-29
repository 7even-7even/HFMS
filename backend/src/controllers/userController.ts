import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import User, { UserRole } from '../models/User';
import PatientProfile from '../models/PatientProfile';
import { AuditLogger } from '../services/AuditLogger';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, active, isOnline } = req.query;

  const filter: any = {};
  if (role) filter.role = role;
  if (active !== undefined) filter.active = active === 'true';
  if (isOnline !== undefined) filter.isOnline = isOnline === 'true';

  try {
    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    let profile = null;
    if (user.role === UserRole.Patient) {
      profile = await PatientProfile.findOne({ userId: user._id })
        .populate('assignedDoctor', 'name email')
        .populate('assignedDietician', 'name email');
    }

    res.status(200).json({ success: true, data: { user, profile } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, role, active, phoneNumber } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, active, phoneNumber },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    await AuditLogger.log(req.user!._id.toString(), 'USER_UPDATED', { targetUserId: user._id, role, active }, req.ip);

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssignedPatients = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;

  try {
    const filter: any = {};
    if (user.role === UserRole.Doctor) {
      filter.assignedDoctor = user._id;
    } else if (user.role === UserRole.Dietician) {
      filter.assignedDietician = user._id;
    }

    const patientProfiles = await PatientProfile.find(filter)
      .populate('userId', 'name email phoneNumber active')
      .populate('assignedDoctor', 'name')
      .populate('assignedDietician', 'name');

    res.status(200).json({ success: true, count: patientProfiles.length, data: patientProfiles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
