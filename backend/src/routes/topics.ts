import { Router, Request, Response } from 'express';
import { PrismaClient, TopicType } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const TopicSchema = z.object({
  type: z.nativeEnum(TopicType),
  source: z.string().min(1),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  active: z.boolean().default(true)
});

// Get all topics
router.get('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { type } = req.query;
  
  const where: any = {};
  if (type) where.type = type as TopicType;
  
  const topics = await prisma.topic.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
  res.json(topics);
});

// Get single topic
router.get('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const topic = await prisma.topic.findUnique({
    where: { id: req.params.id }
  });
  
  if (!topic) {
    throw new AppError('Topic not found', 404);
  }
  
  res.json(topic);
});

// Create topic
router.post('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const data = TopicSchema.parse(req.body);
  
  const topic = await prisma.topic.create({
    data
  });
  
  res.status(201).json(topic);
});

// Update topic
router.put('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const data = TopicSchema.partial().parse(req.body);
  
  const topic = await prisma.topic.update({
    where: { id: req.params.id },
    data
  });
  
  res.json(topic);
});

// Delete topic
router.delete('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  await prisma.topic.delete({
    where: { id: req.params.id }
  });
  
  res.status(204).send();
});

// Toggle active status
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  const topic = await prisma.topic.findUnique({
    where: { id: req.params.id }
  });
  
  if (!topic) {
    throw new AppError('Topic not found', 404);
  }
  
  const updated = await prisma.topic.update({
    where: { id: req.params.id },
    data: { active: !topic.active }
  });
  
  res.json(updated);
});

// Get random active topic
router.get('/random/one', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  const topics = await prisma.topic.findMany({
    where: { active: true }
  });
  
  if (topics.length === 0) {
    throw new AppError('No active topics found', 404);
  }
  
  const random = topics[Math.floor(Math.random() * topics.length)];
  res.json(random);
});

export default router;
