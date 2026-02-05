"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const ai_1 = require("../services/ai");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
const GenerateSchema = zod_1.z.object({
    personaId: zod_1.z.string().uuid(),
    topic: zod_1.z.string().min(1),
    count: zod_1.z.number().min(1).max(5).default(1),
    saveAsDraft: zod_1.z.boolean().default(false),
    accountId: zod_1.z.string().uuid().optional()
});
const TestGenerateSchema = zod_1.z.object({
    persona: zod_1.z.object({
        name: zod_1.z.string(),
        era: zod_1.z.string().optional(),
        occupation: zod_1.z.string().optional(),
        style: zod_1.z.string(),
        sampleQuotes: zod_1.z.array(zod_1.z.string()).default([]),
        systemPrompt: zod_1.z.string()
    }),
    topic: zod_1.z.string().min(1)
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
router.post('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { personaId, topic, count, saveAsDraft, accountId } = GenerateSchema.parse(req.body);
    const persona = await prisma.persona.findUnique({
        where: { id: personaId }
    });
    if (!persona) {
        throw new errorHandler_1.AppError('Persona not found', 404);
    }
    const settings = await prisma.settings.findUnique({
        where: { id: 'default' }
    });
    if (count === 1) {
        const content = await (0, ai_1.generatePost)({
            persona,
            topic,
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
        }
        else {
            res.json({ posts: [{ content }] });
        }
    }
    else {
        const contents = await (0, ai_1.generateMultiplePosts)({
            persona,
            topic,
            model: settings?.aiModel,
            temperature: settings?.aiTemp
        }, count);
        if (saveAsDraft) {
            const posts = await Promise.all(contents.map(content => prisma.post.create({
                data: {
                    personaId,
                    accountId,
                    content,
                    topic,
                    status: 'DRAFT'
                }
            })));
            res.json({ posts: posts.map((p, i) => ({ id: p.id, content: contents[i] })) });
        }
        else {
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
router.post('/test', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { persona, topic } = TestGenerateSchema.parse(req.body);
    const settings = await prisma.settings.findUnique({
        where: { id: 'default' }
    });
    const content = await (0, ai_1.generatePost)({
        persona,
        topic,
        model: settings?.aiModel,
        temperature: settings?.aiTemp
    });
    res.json({ content });
});
exports.default = router;
//# sourceMappingURL=generate.js.map