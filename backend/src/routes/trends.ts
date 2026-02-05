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

// Get all trending topics
router.get('/', async (req: Request, res: Response) => {
  const trends = await fetchAllTrends();
  res.json({
    count: trends.length,
    trends
  });
});

// Get trends by source
router.get('/google', async (req: Request, res: Response) => {
  const trends = await fetchGoogleTrends();
  res.json({ source: 'google', count: trends.length, trends });
});

router.get('/hackernews', async (req: Request, res: Response) => {
  const trends = await fetchHackerNews();
  res.json({ source: 'hackernews', count: trends.length, trends });
});

router.get('/reddit', async (req: Request, res: Response) => {
  const { subreddits } = req.query;
  const subs = typeof subreddits === 'string' 
    ? subreddits.split(',') 
    : undefined;
  
  const trends = await fetchRedditTrends(subs);
  res.json({ source: 'reddit', count: trends.length, trends });
});

// Get best topic for a specific persona
router.get('/best/:personaId', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  const persona = await prisma.persona.findUnique({
    where: { id: req.params.personaId }
  });
  
  if (!persona) {
    return res.status(404).json({ error: 'Persona not found' });
  }
  
  // Get recent topics used by this persona to avoid repetition
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

// Sync trending topics to database
router.post('/sync', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  const trends = await fetchAllTrends();
  
  let created = 0;
  let skipped = 0;
  
  for (const trend of trends) {
    // Check if similar topic already exists
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

// Clean old trending topics
router.delete('/cleanup', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  
  // Delete trending topics older than 7 days
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
