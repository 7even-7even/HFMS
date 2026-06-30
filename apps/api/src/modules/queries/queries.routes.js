const express = require('express');
const { z } = require('zod');
const { prisma } = require('../../config/prisma');
const { requireAuth, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiError } = require('../../utils/apiError');
const { ROLES, QUERY_STATUSES } = require('../../constants');
const { notifyRole, notifyUser } = require('../../services/notification.service');

const router = express.Router();
router.use(requireAuth);

function includeQuery() {
  return { patient: { include: { user: { select: { id: true, name: true, email: true } }, currentDietPlan: true } } };
}

async function getOwnPatient(req) {
  const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
  if (!patient) throw new ApiError(400, 'Patient profile is required to create a query');
  return patient;
}

const listSchema = z.object({
  query: z.object({
    status: z.enum(QUERY_STATUSES).optional(),
    targetRole: z.enum([ROLES.DOCTOR, ROLES.DIETICIAN]).optional(),
    patientId: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50)
  })
});

router.get('/', validate(listSchema), asyncHandler(async (req, res) => {
  const { status, targetRole, patientId, page, limit } = req.validated.query;
  let where = { ...(status ? { status } : {}), ...(targetRole ? { targetRole } : {}), ...(patientId ? { patientId } : {}) };

  if (req.user.role === ROLES.PATIENT) {
    const patient = await getOwnPatient(req);
    where = { ...where, patientId: patient.id };
  } else if (req.user.role === ROLES.DOCTOR || req.user.role === ROLES.DIETICIAN) {
    where = { ...where, targetRole: req.user.role };
  } else if (req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Forbidden');
  }

  const [items, total] = await Promise.all([
    prisma.patientQuery.findMany({ where, include: includeQuery(), orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.patientQuery.count({ where })
  ]);
  res.json({ success: true, data: { items, total, page, limit } });
}));

const createSchema = z.object({
  body: z.object({
    targetRole: z.enum([ROLES.DOCTOR, ROLES.DIETICIAN]),
    subject: z.string().min(3).max(160),
    message: z.string().min(5).max(2000)
  })
});

router.post('/', authorize(ROLES.PATIENT), validate(createSchema), asyncHandler(async (req, res) => {
  const patient = await getOwnPatient(req);
  const query = await prisma.patientQuery.create({
    data: { patientId: patient.id, targetRole: req.validated.body.targetRole, subject: req.validated.body.subject, message: req.validated.body.message },
    include: includeQuery()
  });
  await notifyRole(req.validated.body.targetRole, {
    title: 'New patient query',
    message: `${patient.name} asked: ${query.subject}`,
    type: 'GENERAL',
    metadata: { queryId: query.id, patientId: patient.id }
  });
  res.status(201).json({ success: true, data: { query } });
}));

const answerSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ response: z.string().min(2).max(3000), status: z.enum(['ANSWERED', 'CLOSED']).default('ANSWERED') })
});

router.patch('/:id/answer', authorize(ROLES.ADMIN, ROLES.DOCTOR, ROLES.DIETICIAN), validate(answerSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.patientQuery.findUnique({ where: { id: req.validated.params.id }, include: includeQuery() });
  if (!existing) throw new ApiError(404, 'Query not found');
  if (req.user.role !== ROLES.ADMIN && existing.targetRole !== req.user.role) throw new ApiError(403, 'This query is not assigned to your role');

  const query = await prisma.patientQuery.update({
    where: { id: existing.id },
    data: { response: req.validated.body.response, status: req.validated.body.status, answeredById: req.user.id, answeredAt: new Date() },
    include: includeQuery()
  });

  if (existing.patient?.userId) {
    await notifyUser(existing.patient.userId, {
      title: 'Your query has been answered',
      message: `${req.user.name} answered your query: ${existing.subject}`,
      type: 'GENERAL',
      metadata: { queryId: query.id }
    });
  }

  res.json({ success: true, data: { query } });
}));

module.exports = router;
