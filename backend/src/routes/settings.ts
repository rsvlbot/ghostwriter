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
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6 (Latest)', provider: 'Anthropic' },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'Anthropic' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Fast)', provider: 'Anthropic' },
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
      configured: !!process.env.ANTHROPIC_API_KEY,
      provider: 'Anthropic Claude'
    }
  });
});

// Test AI connection
router.get('/ai/test', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  if (!process.env.ANTHROPIC_API_KEY) {
    res.json({ 
      connected: false, 
      error: 'ANTHROPIC_API_KEY not configured' 
    });
    return;
  }

  try {
    // Get current model from settings
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' }
    });
    const model = settings?.aiModel || 'claude-sonnet-4-20250514';

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    
    const response = await client.messages.create({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    });

    res.json({ 
      connected: true, 
      model,
      provider: 'Anthropic'
    });
  } catch (error: any) {
    res.json({ 
      connected: false, 
      error: error.message || 'Connection failed'
    });
  }
});

export default router;
