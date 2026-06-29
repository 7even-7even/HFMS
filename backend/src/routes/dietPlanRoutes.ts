import express from 'express';
import { createDietPlan, updateDietPlan, getDietPlanByPatientId, getPatientCompliance } from '../controllers/dietPlanController';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { UserRole } from '../models/User';

const router = express.Router();

router.post('/', authenticate, authorizeRoles(UserRole.Doctor, UserRole.Dietician), createDietPlan);
router.put('/:id', authenticate, authorizeRoles(UserRole.Doctor, UserRole.Dietician), updateDietPlan);
router.get('/patient/:patientId', authenticate, getDietPlanByPatientId);
router.get('/patient/:patientId/compliance', authenticate, getPatientCompliance);

export default router;
