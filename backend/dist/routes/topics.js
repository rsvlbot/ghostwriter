"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
const TopicSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(client_1.TopicType),
    source: zod_1.z.string().min(1),
    title: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().optional().nullable(),
    active: zod_1.z.boolean().default(true)
});
// Get all topics
router.get('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { type } = req.query;
    const where = {};
    if (type)
        where.type = type;
    const topics = await prisma.topic.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });
    res.json(topics);
});
// Get single topic
router.get('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const topic = await prisma.topic.findUnique({
        where: { id: req.params.id }
    });
    if (!topic) {
        throw new errorHandler_1.AppError('Topic not found', 404);
    }
    res.json(topic);
});
// Create topic
router.post('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const data = TopicSchema.parse(req.body);
    const topic = await prisma.topic.create({
        data
    });
    res.status(201).json(topic);
});
// Update topic
router.put('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const data = TopicSchema.partial().parse(req.body);
    const topic = await prisma.topic.update({
        where: { id: req.params.id },
        data
    });
    res.json(topic);
});
// Delete topic
router.delete('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    await prisma.topic.delete({
        where: { id: req.params.id }
    });
    res.status(204).send();
});
// Toggle active status
router.patch('/:id/toggle', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const topic = await prisma.topic.findUnique({
        where: { id: req.params.id }
    });
    if (!topic) {
        throw new errorHandler_1.AppError('Topic not found', 404);
    }
    const updated = await prisma.topic.update({
        where: { id: req.params.id },
        data: { active: !topic.active }
    });
    res.json(updated);
});
// Get random active topic
router.get('/random/one', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const topics = await prisma.topic.findMany({
        where: { active: true }
    });
    if (topics.length === 0) {
        throw new errorHandler_1.AppError('No active topics found', 404);
    }
    const random = topics[Math.floor(Math.random() * topics.length)];
    res.json(random);
});
exports.default = router;
//# sourceMappingURL=topics.js.map