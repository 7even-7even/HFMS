const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { prisma } = require('../../config/prisma');
const { env } = require('../../config/env');
const { validate } = require('../../middleware/validate');
const { requireAuth, signAccessToken, signRefreshToken, hashToken } = require('../../middleware/auth');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiError } = require('../../utils/apiError');
const { ROLES } = require('../../constants');
const { hydratePatient } = require('../../utils/json');
const { sendVerificationEmail, hasEmailConfig } = require('../../services/email.service');

const router = express.Router();

function sanitizeUser(user) {
  if (!user) return user;
  const {
    passwordHash,
    refreshTokenHash,
    emailVerificationTokenHash,
    emailVerificationExpiresAt,
    patientProfile,
    ...safe
  } = user;
  return { ...safe, patientProfile: hydratePatient(patientProfile) };
}

function createRawVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

function verificationUrl(token) {
  const baseUrl = env.APP_URL.replace(/\/$/, '');
  return `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
}

function assertEmailDeliveryAvailable() {
  if (env.NODE_ENV === 'production' && !hasEmailConfig()) {
    throw new ApiError(503, 'Email verification service is not configured. Please contact the administrator.');
  }
}

function emailDeliveryError(error) {
  console.error('Verification email delivery failed:', error);
  return new ApiError(503, 'Email verification is required, but the verification email could not be sent right now. Please try again in a few minutes or contact support.', {
    code: 'EMAIL_SEND_FAILED'
  });
}

async function issueVerificationEmail(user) {
  assertEmailDeliveryAvailable();
  const rawToken = createRawVerificationToken();
  const expiresAt = new Date(Date.now() + env.EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationTokenHash: hashToken(rawToken),
      emailVerificationExpiresAt: expiresAt,
      isActive: false
    }
  });

  const link = verificationUrl(rawToken);
  const mail = await sendVerificationEmail({
    user,
    verificationLink: link,
    expiresMinutes: env.EMAIL_VERIFICATION_TTL_MINUTES
  });

  return { link, mail };
}

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().transform((v) => v.toLowerCase()),
    phone: z.string().optional(),
    password: z.string().min(8).max(128),
    role: z.literal(ROLES.PATIENT).optional().default(ROLES.PATIENT)
  })
});

router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  assertEmailDeliveryAvailable();
  const { name, email, phone, password } = req.validated.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.emailVerifiedAt) {
    throw new ApiError(409, 'An account with this email already exists. Please login instead.');
  }

  if (existing && !existing.emailVerifiedAt) {
    let verification;
    try {
      verification = await issueVerificationEmail(existing);
    } catch (error) {
      throw emailDeliveryError(error);
    }
    return res.json({
      success: true,
      message: 'An unverified account already exists for this email. A fresh verification email has been sent.',
      data: {
        user: sanitizeUser(existing),
        ...(env.NODE_ENV !== 'production' && verification.mail.preview ? { devVerificationLink: verification.link } : {})
      }
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: ROLES.PATIENT,
      isActive: false,
      emailVerifiedAt: null
    }
  });

  let verification;
  try {
    verification = await issueVerificationEmail(user);
  } catch (error) {
    throw emailDeliveryError(error);
  }

  res.status(201).json({
    success: true,
    message: 'Registration submitted. Please verify your email address to activate your Cure Cafe account.',
    data: {
      user: sanitizeUser(user),
      ...(env.NODE_ENV !== 'production' && verification.mail.preview ? { devVerificationLink: verification.link } : {})
    }
  });
}));

const verifyEmailSchema = z.object({
  body: z.object({ token: z.string().min(32) })
});

router.post('/verify-email', validate(verifyEmailSchema), asyncHandler(async (req, res) => {
  const tokenHash = hashToken(req.validated.body.token);
  const user = await prisma.user.findFirst({
    where: { emailVerificationTokenHash: tokenHash },
    include: { patientProfile: { include: { currentDietPlan: true } } }
  });

  if (!user) throw new ApiError(400, 'Invalid or already used verification token');
  if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    throw new ApiError(400, 'Verification token has expired. Please request a new verification email.');
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
      isActive: true
    },
    include: { patientProfile: { include: { currentDietPlan: true } } }
  });

  res.json({ success: true, message: 'Email verified successfully. You can now login.', data: { user: sanitizeUser(verifiedUser) } });
}));

const resendVerificationSchema = z.object({
  body: z.object({ email: z.string().email().transform((v) => v.toLowerCase()) })
});

router.post('/resend-verification', validate(resendVerificationSchema), asyncHandler(async (req, res) => {
  const { email } = req.validated.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.json({ success: true, message: 'If an unverified account exists for this email, a verification email has been sent.' });
  }

  if (user.emailVerifiedAt) {
    return res.json({ success: true, message: 'This email is already verified. Please login.' });
  }

  let verification;
  try {
    verification = await issueVerificationEmail(user);
  } catch (error) {
    throw emailDeliveryError(error);
  }
  res.json({
    success: true,
    message: 'Verification email sent. Please check your inbox.',
    data: {
      ...(env.NODE_ENV !== 'production' && verification.mail.preview ? { devVerificationLink: verification.link } : {})
    }
  });
}));

const loginSchema = z.object({
  body: z.object({
    email: z.string().email().transform((v) => v.toLowerCase()),
    password: z.string().min(1)
  })
});

router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { patientProfile: { include: { currentDietPlan: true } } }
  });

  if (!user) throw new ApiError(401, 'Invalid email or password');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ApiError(401, 'Invalid email or password');

  if (!user.emailVerifiedAt) {
    let verification;
    try {
      verification = await issueVerificationEmail(user);
    } catch (error) {
      throw emailDeliveryError(error);
    }
    throw new ApiError(403, 'Email verification required. A fresh verification email has been sent to your registered email address.', {
      code: 'EMAIL_VERIFICATION_REQUIRED',
      ...(env.NODE_ENV !== 'production' && verification.mail.preview ? { devVerificationLink: verification.link } : {})
    });
  }

  if (!user.isActive) throw new ApiError(403, 'User account is inactive. Please contact the administrator.');

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: hashToken(refreshToken) } });

  res.json({ success: true, data: { accessToken, refreshToken, user: sanitizeUser(user) } });
}));

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(20)
  })
});

router.post('/refresh', validate(refreshSchema), asyncHandler(async (req, res) => {
  const { refreshToken } = req.validated.body;
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  if (payload.tokenType !== 'refresh') throw new ApiError(401, 'Invalid refresh token');

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { patientProfile: { include: { currentDietPlan: true } } }
  });
  if (!user || !user.isActive || !user.emailVerifiedAt || user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new ApiError(401, 'Refresh token revoked');
  }

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: hashToken(newRefreshToken) } });

  res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken, user: sanitizeUser(user) } });
}));

router.post('/logout', requireAuth, asyncHandler(async (req, res) => {
  await prisma.user.update({ where: { id: req.user.id }, data: { refreshTokenHash: null } });
  res.json({ success: true, message: 'Logged out successfully' });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { patientProfile: { include: { currentDietPlan: true } } }
  });
  res.json({ success: true, data: { user: sanitizeUser(user) } });
}));

module.exports = router;
