import express from 'express';
import { getUsers, getUserById, updateUser, getAssignedPatients } from '../controllers/userController';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { UserRole } from '../models/User';

const router = express.Router();

router.get('/assigned-patients', authenticate, authorizeRoles(UserRole.Doctor, UserRole.Dietician), getAssignedPatients);
router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, authorizeRoles(UserRole.Admin), updateUser);

export default router;
