import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const ScheduleSchema = z.object({
  personaId: z.string().uuid(),
  accountId: z.string().uuid(),
  postsPerDay: z.number().int().min(1).max(10).default(3),
  postingTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).default(['09:00', '15:00', '21:00']),
  timezone: z.string().default('UTC'),
  autoApprove: z.boolean().default(false),
  active: z.boolean().default(true)
});

/**
 * @openapi
 * /api/schedules:
 *   get:
 *     summary: Get all schedules
 *     tags: [Schedules]
 *     responses:
 *       200:
 *         description: List of schedules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 */
router.get('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const schedules = await prisma.schedule.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      persona: {
        select: { id: true, name: true, handle: true, avatarUrl: true }
      },
      account: {
        select: { id: true, name: true }
      }
    }
  });
  res.json(schedules);
});

/**
 * @openapi
 * /api/schedules/{id}:
 *   get:
 *     summary: Get schedule by ID
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Schedule details
 *       404:
 *         description: Schedule not found
 */
router.get('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const schedule = await prisma.schedule.findUnique({
    where: { id: req.params.id },
    include: {
      persona: true,
      account: true
    }
  });
  
  if (!schedule) {
    throw new AppError('Schedule not found', 404);
  }
  
  res.json(schedule);
});

/**
 * @openapi
 * /api/schedules:
 *   post:
 *     summary: Create a new schedule
 *     description: Creates an automated posting schedule for a persona
 *     tags: [Schedules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [personaId, accountId]
 *             properties:
 *               personaId:
 *                 type: string
 *                 format: uuid
 *               accountId:
 *                 type: string
 *                 format: uuid
 *               postsPerDay:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 3
 *               postingTimes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: '^\d{2}:\d{2}$'
 *                 default: ['09:00', '15:00', '21:00']
 *               timezone:
 *                 type: string
 *                 default: UTC
 *               autoApprove:
 *                 type: boolean
 *                 default: false
 *                 description: If true, posts are automatically scheduled for publishing
 *     responses:
 *       201:
 *         description: Schedule created
 *       400:
 *         description: Schedule already exists for this persona+account
 */
router.post('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const data = ScheduleSchema.parse(req.body);
  
  const existing = await prisma.schedule.findUnique({
    where: {
      personaId_accountId: {
        personaId: data.personaId,
        accountId: data.accountId
      }
    }
  });
  
  if (existing) {
    throw new AppError('Schedule already exists for this persona and account', 400);
  }
  
  const schedule = await prisma.schedule.create({
    data,
    include: {
      persona: true,
      account: true
    }
  });
  
  res.status(201).json(schedule);
});

/**
 * @openapi
 * /api/schedules/{id}:
 *   put:
 *     summary: Update a schedule
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Schedule updated
 */
router.put('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const data = ScheduleSchema.partial().parse(req.body);
  
  const schedule = await prisma.schedule.update({
    where: { id: req.params.id },
    data,
    include: {
      persona: true,
      account: true
    }
  });
  
  res.json(schedule);
});

/**
 * @openapi
 * /api/schedules/{id}:
 *   delete:
 *     summary: Delete a schedule
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Schedule deleted
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  await prisma.schedule.delete({
    where: { id: req.params.id }
  });
  
  res.status(204).send();
});

/**
 * @openapi
 * /api/schedules/{id}/toggle:
 *   patch:
 *     summary: Toggle schedule active status
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Schedule status toggled
 */
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  const schedule = await prisma.schedule.findUnique({
    where: { id: req.params.id }
  });
  
  if (!schedule) {
    throw new AppError('Schedule not found', 404);
  }
  
  const updated = await prisma.schedule.update({
    where: { id: req.params.id },
    data: { active: !schedule.active },
    include: {
      persona: true,
      account: true
    }
  });
  
  res.json(updated);
});

export default router;
