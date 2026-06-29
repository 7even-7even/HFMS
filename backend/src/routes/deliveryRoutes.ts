import express from 'express';
import { getAssignedDeliveries, acceptDelivery, verifyDelivery, reportFailedDelivery } from '../controllers/deliveryController';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { UserRole } from '../models/User';

const router = express.Router();

router.get('/assigned', authenticate, authorizeRoles(UserRole.Delivery), getAssignedDeliveries);
router.put('/:id/accept', authenticate, authorizeRoles(UserRole.Delivery), acceptDelivery);
router.post('/:id/verify', authenticate, authorizeRoles(UserRole.Delivery), verifyDelivery);
router.post('/:id/fail', authenticate, authorizeRoles(UserRole.Delivery), reportFailedDelivery);

export default router;
