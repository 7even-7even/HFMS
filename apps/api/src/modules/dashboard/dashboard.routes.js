const express = require('express');
const { prisma } = require('../../config/prisma');
const { requireAuth } = require('../../middleware/auth');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ROLES } = require('../../constants');

const router = express.Router();
router.use(requireAuth);

function avg(values) {
  const nums = values.filter((v) => typeof v === 'number');
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

async function unreadCount(user) {
  return prisma.notification.count({ where: { readAt: null, OR: [{ userId: user.id }, { roleTarget: user.role }] } });
}

router.get('/summary', asyncHandler(async (req, res) => {
  const user = req.user;
  const unread = await unreadCount(user);

  if (user.role === ROLES.ADMIN) {
    const [users, patients] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: { role: true }, where: { isActive: true } }),
      prisma.patient.count({ where: { status: 'ADMITTED' } })
    ]);
    const roleCounts = users.reduce((acc, row) => ({ ...acc, [row.role]: row._count.role }), {});
    return res.json({ success: true, data: { role: user.role, profile: user, unreadNotifications: unread, admittedPatients: patients, roleCounts } });
  }

  if (user.role === ROLES.DELIVERY_STAFF) {
    const orders = await prisma.foodOrder.findMany({ where: { OR: [{ deliveredById: user.id }, { status: { in: ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'CANCELLED'] } }] } });
    const delivered = orders.filter((o) => o.status === 'DELIVERED' && o.deliveredById === user.id);
    const cash = delivered.filter((o) => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.totalAmount, 0);
    const online = delivered.filter((o) => o.paymentMethod === 'ONLINE').reduce((sum, o) => sum + o.totalAmount, 0);
    const latestFeedback = delivered.filter((o) => o.feedbackSubmittedAt).sort((a, b) => b.feedbackSubmittedAt - a.feedbackSubmittedAt).slice(0, 5).map((o) => ({ orderNumber: o.orderNumber, rating: o.deliveryRating, message: o.feedbackMessage, staffPolite: o.staffPolite, deliveredSafely: o.deliveredSafely }));
    return res.json({ success: true, data: { role: user.role, profile: user, unreadNotifications: unread, completedOrders: delivered.length, cancelledOrders: orders.filter((o) => o.status === 'CANCELLED').length, avgRating: avg(delivered.map((o) => o.deliveryRating)), cashCollected: cash, onlineCollected: online, latestFeedback } });
  }

  if (user.role === ROLES.KITCHEN_STAFF) {
    const orders = await prisma.foodOrder.findMany();
    const delivered = orders.filter((o) => o.status === 'DELIVERED');
    const latestFeedback = orders.filter((o) => o.feedbackSubmittedAt).sort((a, b) => b.feedbackSubmittedAt - a.feedbackSubmittedAt).slice(0, 5).map((o) => ({ orderNumber: o.orderNumber, rating: o.foodRating, message: o.feedbackMessage, foodWarm: o.foodWarm }));
    return res.json({ success: true, data: { role: user.role, profile: user, unreadNotifications: unread, totalOrders: orders.length, cancelledOrders: orders.filter((o) => o.status === 'CANCELLED').length, avgFoodRating: avg(orders.map((o) => o.foodRating)), revenue: delivered.reduce((sum, o) => sum + o.totalAmount, 0), latestFeedback } });
  }

  if (user.role === ROLES.PATIENT) {
    const patient = await prisma.patient.findUnique({ where: { userId: user.id }, include: { currentDietPlan: true } });
    const [orderCount, pendingBills, prescriptions] = patient ? await Promise.all([
      prisma.foodOrder.count({ where: { patientId: patient.id } }),
      prisma.billingCharge.findMany({ where: { patientId: patient.id, status: { in: ['PENDING', 'POSTED'] } } }),
      prisma.dietPrescription.findMany({ where: { patientId: patient.id }, include: { doctor: { select: { id: true, name: true } }, dietician: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' }, take: 1 })
    ]) : [0, [], []];
    return res.json({ success: true, data: { role: user.role, profile: user, patient, unreadNotifications: unread, orderCount, pendingBillsCount: pendingBills.length, pendingBillsAmount: pendingBills.reduce((sum, b) => sum + b.amount, 0), currentDietPlan: patient?.currentDietPlan, assignedDoctor: prescriptions[0]?.doctor, assignedDietician: prescriptions[0]?.dietician } });
  }

  if (user.role === ROLES.DOCTOR || user.role === ROLES.DIETICIAN) {
    const [admittedPatients, openQueries, patients] = await Promise.all([
      prisma.patient.count({ where: { status: 'ADMITTED' } }),
      prisma.patientQuery.count({ where: { targetRole: user.role, status: 'OPEN' } }),
      prisma.patient.findMany({ where: { status: 'ADMITTED' }, include: { currentDietPlan: true }, orderBy: [{ ward: 'asc' }, { roomNumber: 'asc' }], take: 8 })
    ]);
    return res.json({ success: true, data: { role: user.role, profile: user, unreadNotifications: unread, admittedPatients, openQueries, patients } });
  }

  res.json({ success: true, data: { role: user.role, profile: user, unreadNotifications: unread } });
}));

module.exports = router;
