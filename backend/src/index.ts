import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import personasRouter from './routes/personas';
import postsRouter from './routes/posts';
import accountsRouter from './routes/accounts';
import schedulesRouter from './routes/schedules';
import topicsRouter from './routes/topics';
import generateRouter from './routes/generate';
import threadsRouter from './routes/threads';
import settingsRouter from './routes/settings';
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

// Health check
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

// Dashboard stats endpoint
app.get('/api/stats', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [
    totalPersonas,
    totalPosts,
    pendingApproval,
    publishedPosts,
    scheduledPosts,
    publishedToday,
    recentPosts
  ] = await Promise.all([
    prisma.persona.count({ where: { active: true } }),
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PENDING' } }),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.post.count({ where: { status: 'SCHEDULED' } }),
    prisma.post.count({
      where: {
        status: 'PUBLISHED',
        publishedAt: { gte: today }
      }
    }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      include: { persona: true }
    })
  ]);

  res.json({
    totalPersonas,
    totalPosts,
    pendingApproval,
    publishedPosts,
    scheduledPosts,
    publishedToday,
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
