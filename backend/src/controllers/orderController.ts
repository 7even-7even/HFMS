import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import Order from '../models/Order';
import MealItem from '../models/MealItem';
import PatientProfile from '../models/PatientProfile';
import DietPlan from '../models/DietPlan';
import { UserRole } from '../models/User';
import { AllergyDetector } from '../services/AllergyDetector';
import { QRService } from '../services/QRService';
import { broadcastOrderUpdate } from '../socket/socketHandler';
import { AuditLogger } from '../services/AuditLogger';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const { mealItems, customNotes } = req.body;
  const patientId = req.user!._id;

  try {
    if (!mealItems || mealItems.length === 0) {
      res.status(400).json({ success: false, message: 'No meal items provided' });
      return;
    }

    const profile = await PatientProfile.findOne({ userId: patientId });
    const dietPlan = await DietPlan.findOne({ patientId, status: { $in: ['Active', 'Modified'] } });

    let totalPrice = 0;
    let requiresDieticianApproval = false;
    const warningsList: string[] = [];

    for (const item of mealItems) {
      const meal = await MealItem.findById(item.mealId);
      if (!meal) {
        res.status(404).json({ success: false, message: `Meal ID ${item.mealId} not found` });
        return;
      }
      totalPrice += (meal.price || 0) * (item.quantity || 1);

      const validation = AllergyDetector.validateMealForPatient(meal, profile, dietPlan, customNotes);
      if (!validation.isSafe) {
        requiresDieticianApproval = true;
        warningsList.push(...validation.warnings);
      }
    }

    const orderType = customNotes ? 'CustomRequest' : 'Standard';
    const dieticianApproval = requiresDieticianApproval ? 'Pending' : 'NotRequired';

    // Generate Verification OTP and temporary QR Data string
    const verificationOTP = QRService.generateOTP();
    const tempOrderId = 'TEMP_' + Date.now();
    const dietPlanId = dietPlan ? dietPlan._id.toString() : 'NO_PLAN';
    const qrCodeData = QRService.generateQRData(patientId.toString(), tempOrderId, dietPlanId);

    const order = await Order.create({
      patientId,
      mealItems,
      totalPrice,
      orderType,
      customNotes,
      dieticianApproval,
      preparationStatus: 'Received',
      deliveryStatus: 'Pending',
      qrCodeData,
      verificationOTP,
      paymentStatus: 'Pending',
    });

    // Update qrCodeData with actual order._id
    order.qrCodeData = QRService.generateQRData(patientId.toString(), order._id.toString(), dietPlanId);
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('patientId', 'name email')
      .populate('mealItems.mealId');

    await AuditLogger.log(patientId.toString(), 'ORDER_PLACED', { orderId: order._id, orderType, dieticianApproval }, req.ip);
    broadcastOrderUpdate(populatedOrder);

    res.status(201).json({
      success: true,
      warnings: warningsList,
      requiresDieticianApproval,
      data: populatedOrder,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { status, orderType } = req.query;

  const filter: any = {};
  if (status) filter.preparationStatus = status;
  if (orderType) filter.orderType = orderType;

  try {
    if (user.role === UserRole.Patient) {
      filter.patientId = user._id;
    } else if (user.role === UserRole.Delivery) {
      filter.deliveryPartnerId = user._id;
    } else if (user.role === UserRole.Doctor || user.role === UserRole.Dietician) {
      // Allow doctors and dieticians to see custom request orders or assigned patients' orders
    }

    const orders = await Order.find(filter)
      .populate('patientId', 'name email phoneNumber')
      .populate('mealItems.mealId')
      .populate('deliveryPartnerId', 'name phoneNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('patientId', 'name email phoneNumber')
      .populate('mealItems.mealId')
      .populate('deliveryPartnerId', 'name phoneNumber');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePrepStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { preparationStatus } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { preparationStatus },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name email')
      .populate('mealItems.mealId')
      .populate('deliveryPartnerId', 'name');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    await AuditLogger.log(req.user!._id.toString(), 'ORDER_PREP_STATUS_UPDATED', { orderId: order._id, preparationStatus }, req.ip);
    broadcastOrderUpdate(order);

    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignDeliveryPartner = async (req: AuthRequest, res: Response): Promise<void> => {
  const { deliveryPartnerId } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryPartnerId, deliveryStatus: 'Assigned' },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name email')
      .populate('mealItems.mealId')
      .populate('deliveryPartnerId', 'name phoneNumber');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    await AuditLogger.log(req.user!._id.toString(), 'DELIVERY_PARTNER_ASSIGNED', { orderId: order._id, deliveryPartnerId }, req.ip);
    broadcastOrderUpdate(order);

    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleCustomFoodRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { dieticianApproval } = req.body; // 'Approved' | 'Rejected'

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { dieticianApproval },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name email')
      .populate('mealItems.mealId');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    await AuditLogger.log(req.user!._id.toString(), 'CUSTOM_FOOD_REQUEST_REVIEWED', { orderId: order._id, dieticianApproval }, req.ip);
    broadcastOrderUpdate(order);

    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
