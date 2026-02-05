import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { generatePost } from './ai';
import { publishToThreads } from './threads';

let prisma: PrismaClient;

/**
 * Initialize the scheduler
 */
export function initScheduler(prismaClient: PrismaClient) {
  prisma = prismaClient;

  // Run every minute to check for scheduled posts
  cron.schedule('* * * * *', async () => {
    await processScheduledPosts();
  });

  // Run every hour to generate new posts based on schedules
  cron.schedule('0 * * * *', async () => {
    await generateScheduledPosts();
  });

  console.log('📅 Scheduler started');
}

/**
 * Process posts that are scheduled to be published now
 */
async function processScheduledPosts() {
  const now = new Date();

  // Find posts that should be published
  const posts = await prisma.post.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: {
        lte: now
      }
    },
    include: {
      persona: true,
      account: true
    }
  });

  for (const post of posts) {
    if (!post.account?.accessToken || !post.account?.threadsUserId) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'FAILED',
          error: 'No valid Threads account configured'
        }
      });
      continue;
    }

    try {
      const result = await publishToThreads(
        {
          accessToken: post.account.accessToken,
          userId: post.account.threadsUserId
        },
        post.content
      );

      if (result.success) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
            threadsId: result.threadsId
          }
        });
        console.log(`✅ Published post ${post.id} for ${post.persona.name}`);
      } else {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'FAILED',
            error: result.error
          }
        });
        console.error(`❌ Failed to publish post ${post.id}: ${result.error}`);
      }
    } catch (error) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      console.error(`❌ Error publishing post ${post.id}:`, error);
    }
  }
}

/**
 * Generate new posts based on active schedules
 */
async function generateScheduledPosts() {
  const now = new Date();
  const currentHour = now.getUTCHours().toString().padStart(2, '0') + ':00';

  // Find active schedules that should post at this hour
  const schedules = await prisma.schedule.findMany({
    where: {
      active: true,
      postingTimes: {
        has: currentHour
      }
    },
    include: {
      persona: true,
      account: true
    }
  });

  for (const schedule of schedules) {
    try {
      // Get a random topic
      const topics = await prisma.topic.findMany({
        where: { active: true }
      });

      if (topics.length === 0) {
        console.log(`⚠️ No active topics for schedule ${schedule.id}`);
        continue;
      }

      const randomTopic = topics[Math.floor(Math.random() * topics.length)];

      // Get AI settings
      const settings = await prisma.settings.findUnique({
        where: { id: 'default' }
      });

      // Generate post
      const content = await generatePost({
        persona: schedule.persona,
        topic: randomTopic.source,
        model: settings?.aiModel,
        temperature: settings?.aiTemp
      });

      // Create post
      const post = await prisma.post.create({
        data: {
          personaId: schedule.personaId,
          accountId: schedule.accountId,
          content,
          topic: randomTopic.title || randomTopic.source,
          status: schedule.autoApprove ? 'SCHEDULED' : 'PENDING',
          scheduledAt: schedule.autoApprove ? new Date() : null
        }
      });

      console.log(`📝 Generated post ${post.id} for ${schedule.persona.name} (${schedule.autoApprove ? 'auto-scheduled' : 'pending approval'})`);
    } catch (error) {
      console.error(`❌ Error generating post for schedule ${schedule.id}:`, error);
    }
  }
}

/**
 * Manually trigger post generation for a persona
 */
export async function generatePostNow(
  personaId: string,
  topic: string,
  accountId?: string
): Promise<string> {
  const persona = await prisma.persona.findUnique({
    where: { id: personaId }
  });

  if (!persona) {
    throw new Error('Persona not found');
  }

  const settings = await prisma.settings.findUnique({
    where: { id: 'default' }
  });

  const content = await generatePost({
    persona,
    topic,
    model: settings?.aiModel,
    temperature: settings?.aiTemp
  });

  const post = await prisma.post.create({
    data: {
      personaId,
      accountId,
      content,
      topic,
      status: 'DRAFT'
    }
  });

  return post.id;
}
