import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import MealItem from '../models/MealItem';
import PatientProfile from '../models/PatientProfile';
import DietPlan from '../models/DietPlan';
import { RecommendationEngine } from '../services/RecommendationEngine';
import { AllergyDetector } from '../services/AllergyDetector';
import { AuditLogger } from '../services/AuditLogger';

export const getMeals = async (req: AuthRequest, res: Response): Promise<void> => {
  const { category, available } = req.query;

  const filter: any = {};
  if (category) filter.category = category;
  if (available !== undefined) filter.available = available === 'true';

  try {
    const meals = await MealItem.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, count: meals.length, data: meals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addMeal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meal = await MealItem.create(req.body);
    await AuditLogger.log(req.user!._id.toString(), 'MEAL_ADDED_TO_CATALOG', { mealId: meal._id, name: meal.name }, req.ip);
    res.status(201).json({ success: true, data: meal });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMeal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meal = await MealItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!meal) {
      res.status(404).json({ success: false, message: 'Meal item not found' });
      return;
    }
    await AuditLogger.log(req.user!._id.toString(), 'MEAL_CATALOG_UPDATED', { mealId: meal._id }, req.ip);
    res.status(200).json({ success: true, data: meal });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const profile = await PatientProfile.findOne({ userId: patientId });
    if (!profile) {
      res.status(404).json({ success: false, message: 'Patient profile not found' });
      return;
    }

    const dietPlan = await DietPlan.findOne({ patientId, status: { $in: ['Active', 'Modified'] } });
    const recommendations = await RecommendationEngine.getRecommendations(profile, dietPlan);

    res.status(200).json({ success: true, data: recommendations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const validateMealSelection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, mealId, customNotes } = req.body;

    const meal = await MealItem.findById(mealId);
    if (!meal) {
      res.status(404).json({ success: false, message: 'Meal not found' });
      return;
    }

    const profile = await PatientProfile.findOne({ userId: patientId });
    const dietPlan = await DietPlan.findOne({ patientId, status: { $in: ['Active', 'Modified'] } });

    const validationResult = AllergyDetector.validateMealForPatient(meal, profile, dietPlan, customNotes);

    res.status(200).json({ success: true, data: validationResult });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
