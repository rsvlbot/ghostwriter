"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
const PostSchema = zod_1.z.object({
    personaId: zod_1.z.string().uuid(),
    accountId: zod_1.z.string().uuid().optional().nullable(),
    content: zod_1.z.string().min(1),
    topic: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.PostStatus).default(client_1.PostStatus.DRAFT),
    scheduledAt: zod_1.z.string().datetime().optional().nullable()
});
// Get all posts with filters
router.get('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { status, personaId, limit = '50', offset = '0' } = req.query;
    const where = {};
    if (status)
        where.status = status;
    if (personaId)
        where.personaId = personaId;
    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
            include: {
                persona: {
                    select: { id: true, name: true, handle: true, avatarUrl: true }
                },
                account: {
                    select: { id: true, name: true }
                }
            }
        }),
        prisma.post.count({ where })
    ]);
    res.json({ posts, total });
});
// Get single post
router.get('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const post = await prisma.post.findUnique({
        where: { id: req.params.id },
        include: {
            persona: true,
            account: true
        }
    });
    if (!post) {
        throw new errorHandler_1.AppError('Post not found', 404);
    }
    res.json(post);
});
// Create post
router.post('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const data = PostSchema.parse(req.body);
    const post = await prisma.post.create({
        data: {
            ...data,
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null
        },
        include: {
            persona: true
        }
    });
    res.status(201).json(post);
});
// Update post
router.put('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const data = PostSchema.partial().parse(req.body);
    const post = await prisma.post.update({
        where: { id: req.params.id },
        data: {
            ...data,
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined
        },
        include: {
            persona: true
        }
    });
    res.json(post);
});
// Delete post
router.delete('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    await prisma.post.delete({
        where: { id: req.params.id }
    });
    res.status(204).send();
});
// Bulk update status
router.post('/bulk-status', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { ids, status } = zod_1.z.object({
        ids: zod_1.z.array(zod_1.z.string().uuid()),
        status: zod_1.z.nativeEnum(client_1.PostStatus)
    }).parse(req.body);
    const result = await prisma.post.updateMany({
        where: { id: { in: ids } },
        data: { status }
    });
    res.json({ updated: result.count });
});
// Approve post
router.patch('/:id/approve', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const post = await prisma.post.update({
        where: { id: req.params.id },
        data: { status: client_1.PostStatus.APPROVED }
    });
    res.json(post);
});
// Reject post
router.patch('/:id/reject', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const post = await prisma.post.update({
        where: { id: req.params.id },
        data: { status: client_1.PostStatus.REJECTED }
    });
    res.json(post);
});
// Schedule post
router.patch('/:id/schedule', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { scheduledAt, accountId } = zod_1.z.object({
        scheduledAt: zod_1.z.string().datetime(),
        accountId: zod_1.z.string().uuid()
    }).parse(req.body);
    const post = await prisma.post.update({
        where: { id: req.params.id },
        data: {
            status: client_1.PostStatus.SCHEDULED,
            scheduledAt: new Date(scheduledAt),
            accountId
        }
    });
    res.json(post);
});
exports.default = router;
//# sourceMappingURL=posts.js.map