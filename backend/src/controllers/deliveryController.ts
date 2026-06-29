import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import Order from '../models/Order';
import { QRService } from '../services/QRService';
import { broadcastOrderUpdate } from '../socket/socketHandler';
import { AuditLogger } from '../services/AuditLogger';

export const getAssignedDeliveries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ deliveryPartnerId: req.user!._id })
      .populate('patientId', 'name email phoneNumber')
      .populate('mealItems.mealId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptDelivery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryStatus: 'OutForDelivery', preparationStatus: 'ReadyForDelivery' },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name email')
      .populate('mealItems.mealId');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    await AuditLogger.log(req.user!._id.toString(), 'DELIVERY_ACCEPTED', { orderId: order._id }, req.ip);
    broadcastOrderUpdate(order);

    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyDelivery = async (req: AuthRequest, res: Response): Promise<void> => {
  const { qrCodeData, otp, paymentMethod } = req.body;

  try {
    const order = await Order.findById(req.params.id).populate('patientId', 'name email').populate('mealItems.mealId');
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const verification = QRService.verifyDeliveryData(order.qrCodeData, order.verificationOTP, qrCodeData, otp);
    if (!verification.verified) {
      res.status(400).json({ success: false, message: verification.error });
      return;
    }

    order.deliveryStatus = 'Delivered';
    order.preparationStatus = 'Delivered';
    order.deliveredAt = new Date();

    if (order.totalPrice > 0) {
      order.paymentStatus = 'Completed';
    }

    await order.save();

    await AuditLogger.log(req.user!._id.toString(), 'MEAL_DELIVERY_VERIFIED', {
      orderId: order._id,
      verificationMethod: verification.method,
      paymentMethod: paymentMethod || 'Online/Pre-paid',
    }, req.ip);

    broadcastOrderUpdate(order);

    res.status(200).json({ success: true, verifiedMethod: verification.method, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reportFailedDelivery = async (req: AuthRequest, res: Response): Promise<void> => {
  const { failedReason } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryStatus: 'Failed', failedReason },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name email')
      .populate('mealItems.mealId');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    await AuditLogger.log(req.user!._id.toString(), 'DELIVERY_FAILED', { orderId: order._id, failedReason }, req.ip);
    broadcastOrderUpdate(order);

    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
