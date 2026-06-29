import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import User, { UserRole } from '../models/User';
import Order from '../models/Order';
import AuditLog from '../models/AuditLog';

export const getDashboardMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalPatients = await User.countDocuments({ role: UserRole.Patient, active: true });
    const activeDoctors = await User.countDocuments({ role: UserRole.Doctor, active: true });
    const activeDieticians = await User.countDocuments({ role: UserRole.Dietician, active: true });
    const pantryStaffOnline = await User.countDocuments({ role: UserRole.Pantry, isOnline: true });
    const deliveryPartnersOnline = await User.countDocuments({ role: UserRole.Delivery, isOnline: true });

    const activeOrders = await Order.countDocuments({ preparationStatus: { $ne: 'Delivered' }, deliveryStatus: { $ne: 'Failed' } });
    const pendingDeliveries = await Order.countDocuments({ deliveryStatus: { $in: ['Pending', 'Assigned', 'OutForDelivery'] } });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const ordersToday = await Order.find({ createdAt: { $gte: startOfDay }, paymentStatus: 'Completed' });
    const revenueToday = ordersToday.reduce((acc, order) => acc + order.totalPrice, 0);

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        activeDoctors,
        activeDieticians,
        pantryStaffOnline,
        deliveryPartnersOnline,
        activeOrders,
        pendingDeliveries,
        revenueToday,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const { action, limit = 50, page = 1 } = req.query;

  const filter: any = {};
  if (action) filter.action = action;

  try {
    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: logs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
