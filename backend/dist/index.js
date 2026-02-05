"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const errorHandler_1 = require("./middleware/errorHandler");
const personas_1 = __importDefault(require("./routes/personas"));
const posts_1 = __importDefault(require("./routes/posts"));
const accounts_1 = __importDefault(require("./routes/accounts"));
const schedules_1 = __importDefault(require("./routes/schedules"));
const topics_1 = __importDefault(require("./routes/topics"));
const generate_1 = __importDefault(require("./routes/generate"));
const threads_1 = __importDefault(require("./routes/threads"));
const settings_1 = __importDefault(require("./routes/settings"));
const scheduler_1 = require("./services/scheduler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express_1.default.json());
// Make prisma available to routes
app.locals.prisma = prisma;
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/personas', personas_1.default);
app.use('/api/posts', posts_1.default);
app.use('/api/accounts', accounts_1.default);
app.use('/api/schedules', schedules_1.default);
app.use('/api/topics', topics_1.default);
app.use('/api/generate', generate_1.default);
app.use('/api/threads', threads_1.default);
app.use('/api/settings', settings_1.default);
// Dashboard stats endpoint
app.get('/api/stats', async (req, res) => {
    const [totalPersonas, totalPosts, pendingPosts, publishedPosts, scheduledPosts, recentPosts] = await Promise.all([
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
app.use(errorHandler_1.errorHandler);
// Start server
async function main() {
    await prisma.$connect();
    console.log('✅ Database connected');
    // Initialize scheduler
    (0, scheduler_1.initScheduler)(prisma);
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
//# sourceMappingURL=index.js.map