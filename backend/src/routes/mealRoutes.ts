import express from 'express';
import { getMeals, addMeal, updateMeal, getRecommendations, validateMealSelection } from '../controllers/mealController';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { UserRole } from '../models/User';

const router = express.Router();

router.get('/', authenticate, getMeals);
router.post('/', authenticate, authorizeRoles(UserRole.Admin, UserRole.Pantry), addMeal);
router.put('/:id', authenticate, authorizeRoles(UserRole.Admin, UserRole.Pantry), updateMeal);
router.get('/recommendations/:patientId', authenticate, getRecommendations);
router.post('/validate-allergy', authenticate, validateMealSelection);

export default router;
