import { Router, Request, Response } from 'express';
import { PrismaClient, PostStatus } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { publishToThreads } from '../services/threads';

const router = Router();

const PostSchema = z.object({
  personaId: z.string().uuid(),
  accountId: z.string().uuid().optional().nullable(),
  content: z.string().min(1),
  topic: z.string().optional().nullable(),
  status: z.nativeEnum(PostStatus).default('DRAFT'),
  scheduledAt: z.string().datetime().optional().nullable()
});

/**
 * @openapi
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, APPROVED, SCHEDULED, PUBLISHED, REJECTED, FAILED]
 *       - in: query
 *         name: personaId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
router.get('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { status, personaId } = req.query;
  
  const where: any = {};
  if (status) where.status = status as PostStatus;
  if (personaId) where.personaId = personaId as string;
  
  const posts = await prisma.post.findMany({
    where,
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
  res.json(posts);
});

/**
 * @openapi
 * /api/posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 */
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

/**
 * @openapi
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [personaId, content]
 *             properties:
 *               personaId:
 *                 type: string
 *                 format: uuid
 *               content:
 *                 type: string
 *               topic:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PENDING, APPROVED, SCHEDULED]
 *     responses:
 *       201:
 *         description: Post created
 */
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

/**
 * @openapi
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post updated
 */
router.put('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const data = PostSchema.partial().parse(req.body);
  
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined
    }
  });
  
  res.json(post);
});

/**
 * @openapi
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Post deleted
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  await prisma.post.delete({
    where: { id: req.params.id }
  });
  
  res.status(204).send();
});

/**
 * @openapi
 * /api/posts/{id}/approve:
 *   post:
 *     summary: Approve a post for publishing
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post approved
 */
router.post('/:id/approve', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { status: 'APPROVED' }
  });
  
  res.json(post);
});

/**
 * @openapi
 * /api/posts/{id}/reject:
 *   post:
 *     summary: Reject a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post rejected
 */
router.post('/:id/reject', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { status: 'REJECTED' }
  });
  
  res.json(post);
});

/**
 * @openapi
 * /api/posts/{id}/schedule:
 *   post:
 *     summary: Schedule a post for publishing
 *     tags: [Posts]
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
 *             type: object
 *             required: [scheduledAt]
 *             properties:
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Post scheduled
 */
router.post('/:id/schedule', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { scheduledAt } = req.body;
  
  if (!scheduledAt) {
    throw new AppError('scheduledAt is required', 400);
  }
  
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: {
      status: 'SCHEDULED',
      scheduledAt: new Date(scheduledAt)
    }
  });
  
  res.json(post);
});

/**
 * @openapi
 * /api/posts/{id}/publish:
 *   post:
 *     summary: Publish a post immediately to Threads
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post published
 *       400:
 *         description: No Threads account configured
 */
router.post('/:id/publish', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { account: true }
  });
  
  if (!post) {
    throw new AppError('Post not found', 404);
  }
  
  if (!post.account?.accessToken || !post.account?.threadsUserId) {
    throw new AppError('No Threads account configured for this post', 400);
  }
  
  const result = await publishToThreads(
    {
      accessToken: post.account.accessToken,
      userId: post.account.threadsUserId
    },
    post.content
  );
  
  if (result.success) {
    const updated = await prisma.post.update({
      where: { id: post.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        threadsId: result.threadsId
      }
    });
    res.json(updated);
  } else {
    const updated = await prisma.post.update({
      where: { id: post.id },
      data: {
        status: 'FAILED',
        error: result.error
      }
    });
    throw new AppError(result.error || 'Failed to publish', 500);
  }
});

export default router;
