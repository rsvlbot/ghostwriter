import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  fetchAllTrends, 
  fetchGoogleTrends, 
  fetchHackerNews, 
  fetchRedditTrends,
  getBestTopicForPersona 
} from '../services/trends';

const router = Router();

/**
 * @openapi
 * /api/trends:
 *   get:
 *     summary: Get all trending topics from all sources
 *     description: Fetches viral topics from Google Trends, HackerNews, and Reddit
 *     tags: [Trends]
 *     responses:
 *       200:
 *         description: List of trending topics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 trends:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrendingTopic'
 */
router.get('/', async (req: Request, res: Response) => {
  const trends = await fetchAllTrends();
  res.json({
    count: trends.length,
    trends
  });
});

/**
 * @openapi
 * /api/trends/google:
 *   get:
 *     summary: Get Google Trends
 *     description: Fetches current trending searches from Google Trends US
 *     tags: [Trends]
 *     responses:
 *       200:
 *         description: Google trending topics
 */
router.get('/google', async (req: Request, res: Response) => {
  const trends = await fetchGoogleTrends();
  res.json({ source: 'google', count: trends.length, trends });
});

/**
 * @openapi
 * /api/trends/hackernews:
 *   get:
 *     summary: Get HackerNews top stories
 *     description: Fetches top 15 stories from HackerNews
 *     tags: [Trends]
 *     responses:
 *       200:
 *         description: HackerNews top stories
 */
router.get('/hackernews', async (req: Request, res: Response) => {
  const trends = await fetchHackerNews();
  res.json({ source: 'hackernews', count: trends.length, trends });
});

/**
 * @openapi
 * /api/trends/reddit:
 *   get:
 *     summary: Get Reddit hot posts
 *     description: Fetches hot posts from specified subreddits
 *     tags: [Trends]
 *     parameters:
 *       - in: query
 *         name: subreddits
 *         schema:
 *           type: string
 *         description: Comma-separated list of subreddits
 *         example: technology,worldnews,science
 *     responses:
 *       200:
 *         description: Reddit hot posts
 */
router.get('/reddit', async (req: Request, res: Response) => {
  const { subreddits } = req.query;
  const subs = typeof subreddits === 'string' 
    ? subreddits.split(',') 
    : undefined;
  
  const trends = await fetchRedditTrends(subs);
  res.json({ source: 'reddit', count: trends.length, trends });
});

/**
 * @openapi
 * /api/trends/best/{personaId}:
 *   get:
 *     summary: Get best trending topic for a persona
 *     description: Returns the most relevant trending topic for a specific persona based on their occupation and style
 *     tags: [Trends]
 *     parameters:
 *       - in: path
 *         name: personaId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Best matching topic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 persona:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 topic:
 *                   $ref: '#/components/schemas/TrendingTopic'
 *       404:
 *         description: Persona not found
 */
router.get('/best/:personaId', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  const persona = await prisma.persona.findUnique({
    where: { id: req.params.personaId }
  });
  
  if (!persona) {
    return res.status(404).json({ error: 'Persona not found' });
  }
  
  const recentPosts = await prisma.post.findMany({
    where: { 
      personaId: persona.id,
      topic: { not: null }
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { topic: true }
  });
  
  const excludeTitles = recentPosts
    .map(p => p.topic)
    .filter((t): t is string => t !== null);
  
  const bestTopic = await getBestTopicForPersona(persona, excludeTitles);
  
  if (!bestTopic) {
    return res.status(404).json({ error: 'No trending topics found' });
  }
  
  res.json({
    persona: { id: persona.id, name: persona.name },
    topic: bestTopic
  });
});

/**
 * @openapi
 * /api/trends/sync:
 *   post:
 *     summary: Sync trending topics to database
 *     description: Fetches all trends and saves new ones to the database as TRENDING type topics
 *     tags: [Trends]
 *     responses:
 *       200:
 *         description: Sync complete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 created:
 *                   type: integer
 *                 skipped:
 *                   type: integer
 *                 total:
 *                   type: integer
 */
router.post('/sync', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  const trends = await fetchAllTrends();
  
  let created = 0;
  let skipped = 0;
  
  for (const trend of trends) {
    const existing = await prisma.topic.findFirst({
      where: {
        OR: [
          { source: trend.title },
          { title: trend.title }
        ]
      }
    });
    
    if (existing) {
      skipped++;
      continue;
    }
    
    await prisma.topic.create({
      data: {
        type: 'TRENDING',
        source: trend.title,
        title: trend.title,
        description: trend.description,
        active: true,
        lastFetched: new Date()
      }
    });
    created++;
  }
  
  res.json({
    message: 'Sync complete',
    created,
    skipped,
    total: trends.length
  });
});

/**
 * @openapi
 * /api/trends/cleanup:
 *   delete:
 *     summary: Clean up old trending topics
 *     description: Deletes trending topics older than 7 days
 *     tags: [Trends]
 *     responses:
 *       200:
 *         description: Cleanup complete
 */
router.delete('/cleanup', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const result = await prisma.topic.deleteMany({
    where: {
      type: 'TRENDING',
      createdAt: { lt: weekAgo }
    }
  });
  
  res.json({
    message: 'Cleanup complete',
    deleted: result.count
  });
});

export default router;
