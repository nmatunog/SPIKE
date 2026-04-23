import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authRequired, requireRoles, signToken } from './auth.js';
import { segmentFromHours } from './segment.js';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required.');
}

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT || 4000);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const setupSecretConfigured = () =>
  Boolean(process.env.SETUP_SECRET && String(process.env.SETUP_SECRET).length > 0);

app.get('/api/auth/setup', async (_req, res) => {
  const userCount = await prisma.user.count();
  return res.json({
    needsBootstrap: userCount === 0,
    secretRequired: setupSecretConfigured(),
  });
});

const bootstrapSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  setupSecret: z.string().optional(),
});

app.post('/api/auth/setup', async (req, res) => {
  const parsed = bootstrapSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }

  if (setupSecretConfigured()) {
    if (parsed.data.setupSecret !== process.env.SETUP_SECRET) {
      return res.status(403).json({ message: 'Invalid setup secret.' });
    }
  }

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return res.status(403).json({
      message:
        'Initial setup is already complete. Sign in, or ask an administrator to create your account.',
    });
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email already exists.' });

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'ADMIN',
    },
    include: { internProgress: true },
  });

  const token = signToken(created);
  return res.status(201).json({
    token,
    user: {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      internProgress: created.internProgress,
    },
  });
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['INTERN', 'FACULTY', 'MENTOR', 'ADMIN']),
  university: z.string().optional(),
  squad: z.string().optional(),
});

app.post('/api/auth/register', authRequired, requireRoles('ADMIN'), async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }

  const { name, email, password, role, university, squad } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email already exists.' });

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      internProgress:
        role === 'INTERN'
          ? {
              create: { university, squad, segment: 1, hours: 0, licensed: false },
            }
          : undefined,
    },
    include: { internProgress: true },
  });

  return res.status(201).json({
    id: created.id,
    name: created.name,
    email: created.email,
    role: created.role,
    internProgress: created.internProgress,
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { internProgress: true },
  });
  if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

  const token = signToken(user);
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      internProgress: user.internProgress,
    },
  });
});

app.get('/api/auth/me', authRequired, async (req, res) => {
  const userId = Number(req.auth.sub);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { internProgress: true },
  });
  if (!user) return res.status(404).json({ message: 'User not found.' });

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    internProgress: user.internProgress,
  });
});

function mapInternRow(u) {
  const p = u.internProgress;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    segment: p?.segment ?? 1,
    hours: p?.hours ?? 0,
    licensed: p?.licensed ?? false,
    squad: p?.squad ?? null,
    university: p?.university ?? null,
  };
}

app.get('/api/interns', authRequired, requireRoles('FACULTY', 'MENTOR', 'ADMIN'), async (_req, res) => {
  const interns = await prisma.user.findMany({
    where: { role: 'INTERN' },
    include: { internProgress: true },
    orderBy: { id: 'asc' },
  });
  return res.json(interns.map(mapInternRow));
});

const internUpdateSchema = z
  .object({
    segment: z.number().int().min(1).max(3).optional(),
    hours: z.number().int().min(0).max(600).optional(),
    hoursAdd: z.number().int().min(1).max(100).optional(),
    licensed: z.boolean().optional(),
    squad: z.string().nullable().optional(),
    university: z.string().nullable().optional(),
  })
  .refine((d) => !(d.hours != null && d.hoursAdd != null), {
    message: 'Use either hours or hoursAdd, not both.',
  });

app.patch(
  '/api/interns/:id/progress',
  authRequired,
  requireRoles('FACULTY', 'MENTOR', 'ADMIN'),
  async (req, res) => {
    const internId = Number.parseInt(req.params.id, 10);
    const parsed = internUpdateSchema.safeParse(req.body);
    if (!Number.isInteger(internId) || !parsed.success) {
      return res.status(400).json({ message: parsed.error.flatten?.() ?? 'Invalid payload.' });
    }

    const intern = await prisma.user.findFirst({
      where: { id: internId, role: 'INTERN' },
      include: { internProgress: true },
    });
    if (!intern || !intern.internProgress) {
      return res.status(404).json({ message: 'Intern not found.' });
    }

    const cur = intern.internProgress;
    let nextHours = cur.hours;
    let nextSegment = cur.segment;

    if (parsed.data.hoursAdd != null) {
      nextHours = Math.min(cur.hours + parsed.data.hoursAdd, 600);
      nextSegment = segmentFromHours(nextHours);
    } else if (parsed.data.hours != null) {
      nextHours = parsed.data.hours;
      nextSegment = parsed.data.segment ?? segmentFromHours(nextHours);
    } else if (parsed.data.segment != null) {
      nextSegment = parsed.data.segment;
    }

    const updated = await prisma.internProgress.update({
      where: { userId: intern.id },
      data: {
        hours: nextHours,
        segment: nextSegment,
        ...(parsed.data.licensed !== undefined ? { licensed: parsed.data.licensed } : {}),
        ...(parsed.data.squad !== undefined ? { squad: parsed.data.squad } : {}),
        ...(parsed.data.university !== undefined ? { university: parsed.data.university } : {}),
      },
    });
    return res.json(updated);
  },
);

const createTractionSchema = z.object({
  task: z.string().min(1),
  hours: z.number().int().min(1).max(24),
});

app.post('/api/traction-logs', authRequired, requireRoles('INTERN'), async (req, res) => {
  const parsed = createTractionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }

  const userId = Number(req.auth.sub);
  const log = await prisma.tractionLog.create({
    data: {
      userId,
      task: parsed.data.task,
      hours: parsed.data.hours,
      status: 'PENDING',
    },
  });
  return res.status(201).json(log);
});

app.get('/api/traction-logs/my', authRequired, requireRoles('INTERN'), async (req, res) => {
  const userId = Number(req.auth.sub);
  const logs = await prisma.tractionLog.findMany({
    where: { userId },
    orderBy: { id: 'desc' },
    take: 50,
  });
  return res.json(logs);
});

app.get('/api/traction-logs/pending', authRequired, requireRoles('FACULTY', 'MENTOR', 'ADMIN'), async (_req, res) => {
  const logs = await prisma.tractionLog.findMany({
    where: { status: 'PENDING' },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { id: 'asc' },
  });
  return res.json(logs);
});

const reviewTractionSchema = z.object({
  action: z.enum(['approve', 'reject']),
});

app.patch(
  '/api/traction-logs/:id',
  authRequired,
  requireRoles('FACULTY', 'MENTOR', 'ADMIN'),
  async (req, res) => {
    const logId = Number.parseInt(req.params.id, 10);
    const parsed = reviewTractionSchema.safeParse(req.body);
    if (!Number.isInteger(logId) || !parsed.success) {
      return res.status(400).json({ message: 'Invalid payload.' });
    }

    const log = await prisma.tractionLog.findUnique({
      where: { id: logId },
      include: { user: { include: { internProgress: true } } },
    });
    if (!log || log.status !== 'PENDING') {
      return res.status(404).json({ message: 'Pending log not found.' });
    }

    if (parsed.data.action === 'reject') {
      const updated = await prisma.tractionLog.update({
        where: { id: logId },
        data: { status: 'REJECTED' },
      });
      return res.json(updated);
    }

    const intern = log.user;
    if (!intern.internProgress) {
      return res.status(400).json({ message: 'Intern has no progress record.' });
    }

    const nextHours = Math.min(intern.internProgress.hours + log.hours, 600);
    const nextSegment = segmentFromHours(nextHours);

    await prisma.$transaction([
      prisma.internProgress.update({
        where: { userId: intern.id },
        data: { hours: nextHours, segment: nextSegment },
      }),
      prisma.tractionLog.update({
        where: { id: logId },
        data: { status: 'APPROVED' },
      }),
    ]);

    return res.json({ ok: true, hoursAdded: log.hours, newTotalHours: nextHours, segment: nextSegment });
  },
);

const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => {
  console.log(`SPIKE API listening on http://${host}:${port}`);
});
