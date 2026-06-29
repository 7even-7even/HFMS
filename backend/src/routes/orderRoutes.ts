import express from 'express';
import { createOrder, getOrders, getOrderById, updatePrepStatus, assignDeliveryPartner, handleCustomFoodRequest } from '../controllers/orderController';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { UserRole } from '../models/User';

const router = express.Router();

router.post('/', authenticate, authorizeRoles(UserRole.Patient), createOrder);
router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrderById);
router.put('/:id/prep-status', authenticate, authorizeRoles(UserRole.Pantry, UserRole.Admin), updatePrepStatus);
router.put('/:id/assign-delivery', authenticate, authorizeRoles(UserRole.Pantry, UserRole.Admin), assignDeliveryPartner);
router.put('/:id/custom-request', authenticate, authorizeRoles(UserRole.Dietician, UserRole.Doctor, UserRole.Admin), handleCustomFoodRequest);

export default router;
