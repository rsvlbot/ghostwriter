import { Router, Request, Response } from 'express';
import { PrismaClient, PostStatus } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const PostSchema = z.object({
  personaId: z.string().uuid(),
  accountId: z.string().uuid().optional().nullable(),
  content: z.string().min(1),
  topic: z.string().optional(),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
  scheduledAt: z.string().datetime().optional().nullable()
});

// Get all posts with filters
router.get('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { status, personaId, limit = '50', offset = '0' } = req.query;
  
  const where: any = {};
  if (status) where.status = status as PostStatus;
  if (personaId) where.personaId = personaId as string;
  
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        persona: {
          select: { id: true, name: true, handle: true, avatarUrl: true }
        },
        account: {
          select: { id: true, name: true }
        }
      }
    }),
    prisma.post.count({ where })
  ]);
  
  res.json({ posts, total });
});

// Get single post
router.get('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      persona: true,
      account: true
    }
  });
  
  if (!post) {
    throw new AppError('Post not found', 404);
  }
  
  res.json(post);
});

// Create post
router.post('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const data = PostSchema.parse(req.body);
  
  const post = await prisma.post.create({
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null
    },
    include: {
      persona: true
    }
  });
  
  res.status(201).json(post);
});

// Update post
router.put('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const data = PostSchema.partial().parse(req.body);
  
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined
    },
    include: {
      persona: true
    }
  });
  
  res.json(post);
});

// Delete post
router.delete('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  await prisma.post.delete({
    where: { id: req.params.id }
  });
  
  res.status(204).send();
});

// Bulk update status
router.post('/bulk-status', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { ids, status } = z.object({
    ids: z.array(z.string().uuid()),
    status: z.nativeEnum(PostStatus)
  }).parse(req.body);
  
  const result = await prisma.post.updateMany({
    where: { id: { in: ids } },
    data: { status }
  });
  
  res.json({ updated: result.count });
});

// Approve post
router.patch('/:id/approve', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { status: PostStatus.APPROVED }
  });
  
  res.json(post);
});

// Reject post
router.patch('/:id/reject', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { status: PostStatus.REJECTED }
  });
  
  res.json(post);
});

// Schedule post
router.patch('/:id/schedule', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { scheduledAt, accountId } = z.object({
    scheduledAt: z.string().datetime(),
    accountId: z.string().uuid()
  }).parse(req.body);
  
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: {
      status: PostStatus.SCHEDULED,
      scheduledAt: new Date(scheduledAt),
      accountId
    }
  });
  
  res.json(post);
});

export default router;
