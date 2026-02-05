"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const errorHandler_1 = require("../middleware/errorHandler");
const threads_1 = require("../services/threads");
const router = (0, express_1.Router)();
const PostSchema = zod_1.z.object({
    personaId: zod_1.z.string().uuid(),
    accountId: zod_1.z.string().uuid().optional().nullable(),
    content: zod_1.z.string().min(1),
    topic: zod_1.z.string().optional().nullable(),
    status: zod_1.z.nativeEnum(client_1.PostStatus).default('DRAFT'),
    scheduledAt: zod_1.z.string().datetime().optional().nullable()
});
/**
 * @openapi
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, APPROVED, SCHEDULED, PUBLISHED, REJECTED, FAILED]
 *       - in: query
 *         name: personaId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
router.get('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { status, personaId } = req.query;
    const where = {};
    if (status)
        where.status = status;
    if (personaId)
        where.personaId = personaId;
    const posts = await prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            persona: {
                select: { id: true, name: true, handle: true, avatarUrl: true }
            },
            account: {
                select: { id: true, name: true }
            }
        }
    });
    res.json(posts);
});
/**
 * @openapi
 * /api/posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 */
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
/**
 * @openapi
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [personaId, content]
 *             properties:
 *               personaId:
 *                 type: string
 *                 format: uuid
 *               content:
 *                 type: string
 *               topic:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PENDING, APPROVED, SCHEDULED]
 *     responses:
 *       201:
 *         description: Post created
 */
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
/**
 * @openapi
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post updated
 */
router.put('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const data = PostSchema.partial().parse(req.body);
    const post = await prisma.post.update({
        where: { id: req.params.id },
        data: {
            ...data,
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined
        }
    });
    res.json(post);
});
/**
 * @openapi
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Post deleted
 */
router.delete('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    await prisma.post.delete({
        where: { id: req.params.id }
    });
    res.status(204).send();
});
/**
 * @openapi
 * /api/posts/{id}/approve:
 *   post:
 *     summary: Approve a post for publishing
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post approved
 */
router.post('/:id/approve', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const post = await prisma.post.update({
        where: { id: req.params.id },
        data: { status: 'APPROVED' }
    });
    res.json(post);
});
/**
 * @openapi
 * /api/posts/{id}/reject:
 *   post:
 *     summary: Reject a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post rejected
 */
router.post('/:id/reject', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const post = await prisma.post.update({
        where: { id: req.params.id },
        data: { status: 'REJECTED' }
    });
    res.json(post);
});
/**
 * @openapi
 * /api/posts/{id}/schedule:
 *   post:
 *     summary: Schedule a post for publishing
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scheduledAt]
 *             properties:
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Post scheduled
 */
router.post('/:id/schedule', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { scheduledAt } = req.body;
    if (!scheduledAt) {
        throw new errorHandler_1.AppError('scheduledAt is required', 400);
    }
    const post = await prisma.post.update({
        where: { id: req.params.id },
        data: {
            status: 'SCHEDULED',
            scheduledAt: new Date(scheduledAt)
        }
    });
    res.json(post);
});
/**
 * @openapi
 * /api/posts/{id}/publish:
 *   post:
 *     summary: Publish a post immediately to Threads
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post published
 *       400:
 *         description: No Threads account configured
 */
router.post('/:id/publish', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const post = await prisma.post.findUnique({
        where: { id: req.params.id },
        include: { account: true }
    });
    if (!post) {
        throw new errorHandler_1.AppError('Post not found', 404);
    }
    if (!post.account?.accessToken || !post.account?.threadsUserId) {
        throw new errorHandler_1.AppError('No Threads account configured for this post', 400);
    }
    const result = await (0, threads_1.publishToThreads)({
        accessToken: post.account.accessToken,
        userId: post.account.threadsUserId
    }, post.content);
    if (result.success) {
        const updated = await prisma.post.update({
            where: { id: post.id },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
                threadsId: result.threadsId
            }
        });
        res.json(updated);
    }
    else {
        const updated = await prisma.post.update({
            where: { id: post.id },
            data: {
                status: 'FAILED',
                error: result.error
            }
        });
        throw new errorHandler_1.AppError(result.error || 'Failed to publish', 500);
    }
});
exports.default = router;
//# sourceMappingURL=posts.js.map