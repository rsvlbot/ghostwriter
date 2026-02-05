import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './swagger';
import personasRouter from './routes/personas';
import postsRouter from './routes/posts';
import accountsRouter from './routes/accounts';
import schedulesRouter from './routes/schedules';
import topicsRouter from './routes/topics';
import generateRouter from './routes/generate';
import threadsRouter from './routes/threads';
import settingsRouter from './routes/settings';
import trendsRouter from './routes/trends';
import { initScheduler } from './services/scheduler';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Make prisma available to routes
app.locals.prisma = prisma;

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Ghostwriter API Docs',
}));

// Swagger JSON
app.get('/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/personas', personasRouter);
app.use('/api/posts', postsRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/generate', generateRouter);
app.use('/api/threads', threadsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/trends', trendsRouter);

/**
 * @openapi
 * /api/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stats'
 */
app.get('/api/stats', async (req, res) => {
  const [
    totalPersonas,
    totalPosts,
    pendingPosts,
    publishedPosts,
    scheduledPosts,
    recentPosts
  ] = await Promise.all([
    prisma.persona.count({ where: { active: true } }),
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PENDING' } }),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.post.count({ where: { status: 'SCHEDULED' } }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      include: { persona: true }
    })
  ]);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const postsThisWeek = await prisma.post.count({
    where: {
      status: 'PUBLISHED',
      publishedAt: { gte: weekAgo }
    }
  });

  res.json({
    totalPersonas,
    totalPosts,
    pendingPosts,
    publishedPosts,
    scheduledPosts,
    postsThisWeek,
    recentPosts
  });
});

// Error handler
app.use(errorHandler);

// Start server
async function main() {
  await prisma.$connect();
  console.log('✅ Database connected');

  // Initialize scheduler
  initScheduler(prisma);
  console.log('✅ Scheduler initialized');

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
