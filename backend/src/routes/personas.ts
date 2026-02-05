import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const PersonaSchema = z.object({
  name: z.string().min(1),
  handle: z.string().min(1),
  era: z.string().optional(),
  occupation: z.string().optional(),
  style: z.string().min(1),
  sampleQuotes: z.array(z.string()).default([]),
  systemPrompt: z.string().min(1),
  avatarUrl: z.string().url().optional().nullable(),
  active: z.boolean().default(true)
});

/**
 * @openapi
 * /api/personas:
 *   get:
 *     summary: Get all personas
 *     tags: [Personas]
 *     responses:
 *       200:
 *         description: List of personas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Persona'
 */
router.get('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const personas = await prisma.persona.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { posts: true }
      }
    }
  });
  res.json(personas);
});

/**
 * @openapi
 * /api/personas/{id}:
 *   get:
 *     summary: Get persona by ID
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Persona details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Persona'
 *       404:
 *         description: Persona not found
 */
router.get('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const persona = await prisma.persona.findUnique({
    where: { id: req.params.id },
    include: {
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      schedules: true
    }
  });
  
  if (!persona) {
    throw new AppError('Persona not found', 404);
  }
  
  res.json(persona);
});

/**
 * @openapi
 * /api/personas:
 *   post:
 *     summary: Create a new persona
 *     tags: [Personas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, handle, style, systemPrompt]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Marcus Aurelius
 *               handle:
 *                 type: string
 *                 example: emperor_marcus
 *               era:
 *                 type: string
 *                 example: 121-180 AD
 *               occupation:
 *                 type: string
 *                 example: Roman Emperor, Stoic Philosopher
 *               style:
 *                 type: string
 *                 example: Contemplative, measured, focused on virtue
 *               sampleQuotes:
 *                 type: array
 *                 items:
 *                   type: string
 *               systemPrompt:
 *                 type: string
 *     responses:
 *       201:
 *         description: Persona created
 */
router.post('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const data = PersonaSchema.parse(req.body);
  
  const persona = await prisma.persona.create({
    data
  });
  
  res.status(201).json(persona);
});

/**
 * @openapi
 * /api/personas/{id}:
 *   put:
 *     summary: Update a persona
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Persona'
 *     responses:
 *       200:
 *         description: Persona updated
 */
router.put('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const data = PersonaSchema.partial().parse(req.body);
  
  const persona = await prisma.persona.update({
    where: { id: req.params.id },
    data
  });
  
  res.json(persona);
});

/**
 * @openapi
 * /api/personas/{id}:
 *   delete:
 *     summary: Delete a persona
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Persona deleted
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  await prisma.persona.delete({
    where: { id: req.params.id }
  });
  
  res.status(204).send();
});

/**
 * @openapi
 * /api/personas/{id}/toggle:
 *   patch:
 *     summary: Toggle persona active status
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Persona status toggled
 */
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  const persona = await prisma.persona.findUnique({
    where: { id: req.params.id }
  });
  
  if (!persona) {
    throw new AppError('Persona not found', 404);
  }
  
  const updated = await prisma.persona.update({
    where: { id: req.params.id },
    data: { active: !persona.active }
  });
  
  res.json(updated);
});

export default router;
