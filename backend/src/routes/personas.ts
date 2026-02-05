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

// Get all personas
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

// Get single persona
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

// Create persona
router.post('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const data = PersonaSchema.parse(req.body);
  
  const persona = await prisma.persona.create({
    data
  });
  
  res.status(201).json(persona);
});

// Update persona
router.put('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const data = PersonaSchema.partial().parse(req.body);
  
  const persona = await prisma.persona.update({
    where: { id: req.params.id },
    data
  });
  
  res.json(persona);
});

// Delete persona
router.delete('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  await prisma.persona.delete({
    where: { id: req.params.id }
  });
  
  res.status(204).send();
});

// Toggle active status
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
