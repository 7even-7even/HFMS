import express from 'express';
import { getDashboardMetrics, getAuditLogs } from '../controllers/analyticsController';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { UserRole } from '../models/User';

const router = express.Router();

router.get('/dashboard', authenticate, authorizeRoles(UserRole.Admin), getDashboardMetrics);
router.get('/audit-logs', authenticate, authorizeRoles(UserRole.Admin), getAuditLogs);

export default router;
