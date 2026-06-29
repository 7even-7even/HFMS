import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import DietPlan from '../models/DietPlan';
import PatientProfile from '../models/PatientProfile';
import Order from '../models/Order';
import { AuditLogger } from '../services/AuditLogger';

export const createDietPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { patientId, calories, proteinLimit, carbsLimit, fatLimit, sugarLimit, sodiumLimit, allergies, foodRestrictions, mealSchedule } = req.body;

  try {
    // Check if patient exists
    const patientProfile = await PatientProfile.findOne({ userId: patientId });
    if (!patientProfile) {
      res.status(404).json({ success: false, message: 'Patient profile not found' });
      return;
    }

    // Mark any existing active diet plan as Archived
    await DietPlan.updateMany({ patientId, status: 'Active' }, { status: 'Archived' });

    const dietPlan = await DietPlan.create({
      patientId,
      createdBy: req.user!._id,
      calories,
      proteinLimit,
      carbsLimit,
      fatLimit,
      sugarLimit,
      sodiumLimit,
      allergies: allergies || patientProfile.allergies || [],
      foodRestrictions: foodRestrictions || patientProfile.medicalRestrictions || [],
      mealSchedule: mealSchedule || [
        { mealType: 'Breakfast', time: '08:00 AM' },
        { mealType: 'Lunch', time: '01:00 PM' },
        { mealType: 'Dinner', time: '07:00 PM' },
      ],
      status: 'Active',
    });

    await AuditLogger.log(req.user!._id.toString(), 'DIET_PLAN_CREATED', { dietPlanId: dietPlan._id, patientId }, req.ip);

    res.status(201).json({ success: true, data: dietPlan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDietPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let dietPlan = await DietPlan.findById(req.params.id);
    if (!dietPlan) {
      res.status(404).json({ success: false, message: 'Diet plan not found' });
      return;
    }

    dietPlan = await DietPlan.findByIdAndUpdate(
      req.params.id,
      { ...req.body, status: 'Modified' },
      { new: true, runValidators: true }
    );

    await AuditLogger.log(req.user!._id.toString(), 'DIET_PLAN_MODIFIED', { dietPlanId: dietPlan!._id, patientId: dietPlan!.patientId }, req.ip);

    res.status(200).json({ success: true, data: dietPlan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDietPlanByPatientId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dietPlan = await DietPlan.findOne({ patientId: req.params.patientId, status: { $in: ['Active', 'Modified'] } })
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    if (!dietPlan) {
      res.status(404).json({ success: false, message: 'No active diet plan found for this patient' });
      return;
    }

    res.status(200).json({ success: true, data: dietPlan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientCompliance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const dietPlan = await DietPlan.findOne({ patientId, status: { $in: ['Active', 'Modified'] } });

    if (!dietPlan) {
      res.status(404).json({ success: false, message: 'No active diet plan found to track compliance' });
      return;
    }

    // Fetch delivered orders for the patient over the last 24 hours
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      patientId,
      preparationStatus: 'Delivered',
      createdAt: { $gte: startOfDay },
    }).populate('mealItems.mealId');

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalSugar = 0;
    let totalSodium = 0;

    orders.forEach((order) => {
      order.mealItems.forEach((item: any) => {
        if (item.mealId) {
          const qty = item.quantity || 1;
          totalCalories += item.mealId.calories * qty;
          totalProtein += item.mealId.protein * qty;
          totalCarbs += item.mealId.carbs * qty;
          totalFat += item.mealId.fat * qty;
          totalSugar += item.mealId.sugar * qty;
          totalSodium += item.mealId.sodium * qty;
        }
      });
    });

    const complianceSummary = {
      dietPlanLimits: {
        calories: dietPlan.calories,
        protein: dietPlan.proteinLimit,
        carbs: dietPlan.carbsLimit,
        fat: dietPlan.fatLimit,
        sugar: dietPlan.sugarLimit,
        sodium: dietPlan.sodiumLimit,
      },
      actualIntakeToday: {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        sugar: totalSugar,
        sodium: totalSodium,
      },
      isCompliant: totalCalories <= dietPlan.calories && totalSugar <= dietPlan.sugarLimit && totalSodium <= dietPlan.sodiumLimit,
    };

    res.status(200).json({ success: true, data: complianceSummary });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
