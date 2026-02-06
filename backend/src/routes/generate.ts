import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { generatePost, generateMultiplePosts } from '../services/ai';
import { fetchArticleContent } from '../services/content';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const GenerateSchema = z.object({
  personaId: z.string().uuid(),
  topic: z.string().min(1),
  topicUrl: z.string().url().optional(),
  topicDescription: z.string().optional(),
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

/**
 * @openapi
 * /api/generate:
 *   post:
 *     summary: Generate post(s) for a persona
 *     description: Uses AI to generate social media content in the style of the specified persona
 *     tags: [Generate]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [personaId, topic]
 *             properties:
 *               personaId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the persona to generate as
 *               topic:
 *                 type: string
 *                 description: Topic to generate content about
 *                 example: The ethics of artificial intelligence
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 default: 1
 *                 description: Number of posts to generate
 *               saveAsDraft:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to save generated posts as drafts
 *               accountId:
 *                 type: string
 *                 format: uuid
 *                 description: Threads account to associate with the post
 *     responses:
 *       200:
 *         description: Generated posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       content:
 *                         type: string
 *       404:
 *         description: Persona not found
 */
router.post('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { personaId, topic, topicUrl, topicDescription, count, saveAsDraft, accountId } = GenerateSchema.parse(req.body);

  const persona = await prisma.persona.findUnique({
    where: { id: personaId }
  });

  if (!persona) {
    throw new AppError('Persona not found', 404);
  }

  const settings = await prisma.settings.findUnique({
    where: { id: 'default' }
  });

  // Fetch article content if URL provided
  let topicContext = topicDescription || '';
  if (topicUrl) {
    try {
      const articleContent = await fetchArticleContent(topicUrl);
      if (articleContent) {
        topicContext = articleContent;
      }
    } catch (error) {
      console.error('Failed to fetch article content:', error);
    }
  }

  if (count === 1) {
    const content = await generatePost({
      persona,
      topic,
      topicContext,
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
        topicContext,
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

/**
 * @openapi
 * /api/generate/test:
 *   post:
 *     summary: Test generation without saving
 *     description: Generate a test post for persona preview without saving to database
 *     tags: [Generate]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [persona, topic]
 *             properties:
 *               persona:
 *                 type: object
 *                 required: [name, style, systemPrompt]
 *                 properties:
 *                   name:
 *                     type: string
 *                   era:
 *                     type: string
 *                   occupation:
 *                     type: string
 *                   style:
 *                     type: string
 *                   sampleQuotes:
 *                     type: array
 *                     items:
 *                       type: string
 *                   systemPrompt:
 *                     type: string
 *               topic:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated test content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: string
 */
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
