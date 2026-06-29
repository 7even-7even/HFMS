import express from 'express';
import { getInventory, addInventoryItem, updateInventoryStock, getLowStockAlerts, getPreparationReports } from '../controllers/inventoryController';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { UserRole } from '../models/User';

const router = express.Router();

router.get('/low-stock', authenticate, authorizeRoles(UserRole.Pantry, UserRole.Admin), getLowStockAlerts);
router.get('/reports', authenticate, authorizeRoles(UserRole.Pantry, UserRole.Admin), getPreparationReports);
router.get('/', authenticate, authorizeRoles(UserRole.Pantry, UserRole.Admin), getInventory);
router.post('/', authenticate, authorizeRoles(UserRole.Pantry, UserRole.Admin), addInventoryItem);
router.put('/:id', authenticate, authorizeRoles(UserRole.Pantry, UserRole.Admin), updateInventoryStock);

export default router;
