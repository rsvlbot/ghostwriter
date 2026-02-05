import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { generatePost, generateMultiplePosts } from '../services/ai';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const GenerateSchema = z.object({
  personaId: z.string().uuid(),
  topic: z.string().min(1),
  count: z.number().min(1).max(5).default(1),
  saveAsDraft: z.boolean().default(false),
  accountId: z.string().uuid().optional()
});

const TestGenerateSchema = z.object({
  persona: z.object({
    name: z.string(),
    era: z.string().optional(),
    occupation: z.string().optional(),
    style: z.string(),
    sampleQuotes: z.array(z.string()).default([]),
    systemPrompt: z.string()
  }),
  topic: z.string().min(1)
});

// Generate post(s) for a persona
router.post('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { personaId, topic, count, saveAsDraft, accountId } = GenerateSchema.parse(req.body);

  const persona = await prisma.persona.findUnique({
    where: { id: personaId }
  });

  if (!persona) {
    throw new AppError('Persona not found', 404);
  }

  const settings = await prisma.settings.findUnique({
    where: { id: 'default' }
  });

  if (count === 1) {
    const content = await generatePost({
      persona,
      topic,
      model: settings?.aiModel,
      temperature: settings?.aiTemp
    });

    if (saveAsDraft) {
      const post = await prisma.post.create({
        data: {
          personaId,
          accountId,
          content,
          topic,
          status: 'DRAFT'
        }
      });
      res.json({ posts: [{ id: post.id, content }] });
    } else {
      res.json({ posts: [{ content }] });
    }
  } else {
    const contents = await generateMultiplePosts(
      {
        persona,
        topic,
        model: settings?.aiModel,
        temperature: settings?.aiTemp
      },
      count
    );

    if (saveAsDraft) {
      const posts = await Promise.all(
        contents.map(content =>
          prisma.post.create({
            data: {
              personaId,
              accountId,
              content,
              topic,
              status: 'DRAFT'
            }
          })
        )
      );
      res.json({ posts: posts.map((p: { id: string }, i: number) => ({ id: p.id, content: contents[i] })) });
    } else {
      res.json({ posts: contents.map(content => ({ content })) });
    }
  }
});

// Test generation without saving (for persona preview)
router.post('/test', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { persona, topic } = TestGenerateSchema.parse(req.body);

  const settings = await prisma.settings.findUnique({
    where: { id: 'default' }
  });

  const content = await generatePost({
    persona,
    topic,
    model: settings?.aiModel,
    temperature: settings?.aiTemp
  });

  res.json({ content });
});

export default router;
