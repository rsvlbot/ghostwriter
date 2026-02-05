import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const SettingsSchema = z.object({
  aiModel: z.string().optional(),
  aiTemp: z.number().min(0).max(2).optional()
});

// Get settings
router.get('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;

  let settings = await prisma.settings.findUnique({
    where: { id: 'default' }
  });

  // Create default settings if not exists
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        id: 'default',
        aiModel: 'claude-sonnet-4-20250514',
        aiTemp: 0.8
      }
    });
  }

  // Add available models list
  const availableModels = [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'Anthropic' },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'Anthropic' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' }
  ];

  res.json({
    ...settings,
    availableModels
  });
});

// Update settings
router.put('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const data = SettingsSchema.parse(req.body);

  const settings = await prisma.settings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      ...data
    },
    update: data
  });

  res.json(settings);
});

// Get system info
router.get('/system', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;

  const [personaCount, postCount, accountCount] = await Promise.all([
    prisma.persona.count(),
    prisma.post.count(),
    prisma.account.count()
  ]);

  res.json({
    version: '1.0.0',
    nodeVersion: process.version,
    uptime: process.uptime(),
    stats: {
      personas: personaCount,
      posts: postCount,
      accounts: accountCount
    },
    threads: {
      configured: !!(process.env.THREADS_APP_ID && process.env.THREADS_APP_SECRET)
    },
    ai: {
      configured: !!process.env.ANTHROPIC_API_KEY
    }
  });
});

export default router;
