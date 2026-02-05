"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initScheduler = initScheduler;
exports.generatePostNow = generatePostNow;
const node_cron_1 = __importDefault(require("node-cron"));
const ai_1 = require("./ai");
const threads_1 = require("./threads");
const trends_1 = require("./trends");
let prisma;
/**
 * Initialize the scheduler
 */
function initScheduler(prismaClient) {
    prisma = prismaClient;
    // Run every minute to check for scheduled posts
    node_cron_1.default.schedule('* * * * *', async () => {
        await processScheduledPosts();
    });
    // Run every hour to generate new posts based on schedules
    node_cron_1.default.schedule('0 * * * *', async () => {
        await generateScheduledPosts();
    });
    // Sync trending topics every 2 hours
    node_cron_1.default.schedule('0 */2 * * *', async () => {
        await syncTrendingTopics();
    });
    // Refresh Threads tokens daily at 3 AM
    node_cron_1.default.schedule('0 3 * * *', async () => {
        await refreshAllTokens();
    });
    // Cleanup old trending topics weekly on Sunday
    node_cron_1.default.schedule('0 4 * * 0', async () => {
        await cleanupOldTopics();
    });
    console.log('📅 Scheduler started with:');
    console.log('   - Post publishing check: every minute');
    console.log('   - Post generation: every hour');
    console.log('   - Trending sync: every 2 hours');
    console.log('   - Token refresh: daily at 3 AM');
    console.log('   - Topic cleanup: weekly on Sunday');
}
/**
 * Process posts that are scheduled to be published now
 */
async function processScheduledPosts() {
    const now = new Date();
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
            const result = await (0, threads_1.publishToThreads)({
                accessToken: post.account.accessToken,
                userId: post.account.threadsUserId
            }, post.content);
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
            }
            else {
                await prisma.post.update({
                    where: { id: post.id },
                    data: {
                        status: 'FAILED',
                        error: result.error
                    }
                });
                console.error(`❌ Failed to publish post ${post.id}: ${result.error}`);
            }
        }
        catch (error) {
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
 * Now uses smart topic selection instead of random
 */
async function generateScheduledPosts() {
    const now = new Date();
    const currentHour = now.getUTCHours().toString().padStart(2, '0') + ':00';
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
    console.log(`🕐 Checking schedules for ${currentHour} UTC - found ${schedules.length}`);
    for (const schedule of schedules) {
        try {
            // Get recent topics used by this persona
            const recentPosts = await prisma.post.findMany({
                where: {
                    personaId: schedule.personaId,
                    topic: { not: null }
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: { topic: true }
            });
            const excludeTitles = recentPosts
                .map(p => p.topic)
                .filter((t) => t !== null);
            // Get best trending topic for this persona
            const bestTopic = await (0, trends_1.getBestTopicForPersona)(schedule.persona, excludeTitles);
            if (!bestTopic) {
                // Fallback to manual topics from database
                const manualTopics = await prisma.topic.findMany({
                    where: { active: true, type: 'MANUAL' }
                });
                if (manualTopics.length === 0) {
                    console.log(`⚠️ No topics available for ${schedule.persona.name}`);
                    continue;
                }
                const randomTopic = manualTopics[Math.floor(Math.random() * manualTopics.length)];
                await generateAndSavePost(schedule, randomTopic.source, randomTopic.title);
            }
            else {
                await generateAndSavePost(schedule, bestTopic.title, bestTopic.title);
            }
        }
        catch (error) {
            console.error(`❌ Error generating post for schedule ${schedule.id}:`, error);
        }
    }
}
/**
 * Helper to generate and save a post
 */
async function generateAndSavePost(schedule, topicSource, topicTitle) {
    const settings = await prisma.settings.findUnique({
        where: { id: 'default' }
    });
    const content = await (0, ai_1.generatePost)({
        persona: schedule.persona,
        topic: topicSource,
        model: settings?.aiModel,
        temperature: settings?.aiTemp
    });
    // Calculate scheduled time (now + small random delay to seem more human)
    const delay = Math.floor(Math.random() * 10) * 60 * 1000; // 0-10 min random delay
    const scheduledAt = new Date(Date.now() + delay);
    const post = await prisma.post.create({
        data: {
            personaId: schedule.personaId,
            accountId: schedule.accountId,
            content,
            topic: topicTitle || topicSource,
            status: schedule.autoApprove ? 'SCHEDULED' : 'PENDING',
            scheduledAt: schedule.autoApprove ? scheduledAt : null
        }
    });
    console.log(`📝 Generated post ${post.id} for ${schedule.persona.name}`);
    console.log(`   Topic: "${topicTitle || topicSource}"`);
    console.log(`   Status: ${schedule.autoApprove ? 'auto-scheduled' : 'pending approval'}`);
}
/**
 * Sync trending topics from all sources
 */
async function syncTrendingTopics() {
    console.log('🔄 Syncing trending topics...');
    try {
        const trends = await (0, trends_1.fetchAllTrends)();
        let created = 0;
        for (const trend of trends) {
            const existing = await prisma.topic.findFirst({
                where: {
                    source: trend.title,
                    type: 'TRENDING'
                }
            });
            if (!existing) {
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
        }
        console.log(`✅ Trending sync complete: ${created} new topics from ${trends.length} total`);
    }
    catch (error) {
        console.error('❌ Error syncing trends:', error);
    }
}
/**
 * Refresh all Threads access tokens that are expiring soon
 */
async function refreshAllTokens() {
    console.log('🔑 Checking Threads tokens...');
    const accounts = await prisma.account.findMany({
        where: {
            active: true,
            accessToken: { not: null },
            tokenExpiresAt: { not: null }
        }
    });
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    for (const account of accounts) {
        if (!account.tokenExpiresAt || !account.accessToken)
            continue;
        // Refresh if expiring in less than 7 days
        if (account.tokenExpiresAt < sevenDaysFromNow) {
            try {
                const result = await (0, threads_1.refreshAccessToken)(account.accessToken);
                const newExpiry = new Date(Date.now() + result.expiresIn * 1000);
                await prisma.account.update({
                    where: { id: account.id },
                    data: {
                        accessToken: result.accessToken,
                        tokenExpiresAt: newExpiry
                    }
                });
                console.log(`✅ Refreshed token for account ${account.name}`);
            }
            catch (error) {
                console.error(`❌ Failed to refresh token for ${account.name}:`, error);
            }
        }
    }
    console.log('🔑 Token check complete');
}
/**
 * Cleanup old trending topics
 */
async function cleanupOldTopics() {
    console.log('🧹 Cleaning up old trending topics...');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const result = await prisma.topic.deleteMany({
        where: {
            type: 'TRENDING',
            createdAt: { lt: weekAgo }
        }
    });
    console.log(`🧹 Deleted ${result.count} old trending topics`);
}
/**
 * Manually trigger post generation for a persona
 */
async function generatePostNow(personaId, topic, accountId) {
    const persona = await prisma.persona.findUnique({
        where: { id: personaId }
    });
    if (!persona) {
        throw new Error('Persona not found');
    }
    const settings = await prisma.settings.findUnique({
        where: { id: 'default' }
    });
    const content = await (0, ai_1.generatePost)({
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
//# sourceMappingURL=scheduler.js.map