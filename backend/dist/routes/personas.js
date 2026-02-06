"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const errorHandler_1 = require("../middleware/errorHandler");
const ai_1 = require("../services/ai");
const router = (0, express_1.Router)();
const PersonaSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    handle: zod_1.z.string().min(1),
    era: zod_1.z.string().optional().nullable(),
    occupation: zod_1.z.string().optional().nullable(),
    style: zod_1.z.string().min(1),
    tone: zod_1.z.string().optional().nullable(),
    topics: zod_1.z.array(zod_1.z.string()).default([]),
    sampleQuotes: zod_1.z.array(zod_1.z.string()).default([]),
    systemPrompt: zod_1.z.string().default(''),
    writingPatterns: zod_1.z.string().optional().nullable(),
    vocabulary: zod_1.z.string().optional().nullable(),
    keyThemes: zod_1.z.string().optional().nullable(),
    basedOn: zod_1.z.string().optional().nullable(),
    avatarUrl: zod_1.z.string().url().optional().nullable(),
    accountId: zod_1.z.string().optional().nullable(),
    active: zod_1.z.boolean().default(true)
});
/**
 * @openapi
 * /api/personas:
 *   get:
 *     summary: Get all personas
 *     tags: [Personas]
 *     responses:
 *       200:
 *         description: List of personas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Persona'
 */
router.get('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const personas = await prisma.persona.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { posts: true }
            }
        }
    });
    res.json(personas);
});
/**
 * @openapi
 * /api/personas/{id}:
 *   get:
 *     summary: Get persona by ID
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Persona details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Persona'
 *       404:
 *         description: Persona not found
 */
router.get('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const persona = await prisma.persona.findUnique({
        where: { id: req.params.id },
        include: {
            posts: {
                orderBy: { createdAt: 'desc' },
                take: 10
            },
            schedules: true
        }
    });
    if (!persona) {
        throw new errorHandler_1.AppError('Persona not found', 404);
    }
    res.json(persona);
});
/**
 * @openapi
 * /api/personas:
 *   post:
 *     summary: Create a new persona
 *     tags: [Personas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, handle, style, systemPrompt]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Marcus Aurelius
 *               handle:
 *                 type: string
 *                 example: emperor_marcus
 *               era:
 *                 type: string
 *                 example: 121-180 AD
 *               occupation:
 *                 type: string
 *                 example: Roman Emperor, Stoic Philosopher
 *               style:
 *                 type: string
 *                 example: Contemplative, measured, focused on virtue
 *               sampleQuotes:
 *                 type: array
 *                 items:
 *                   type: string
 *               systemPrompt:
 *                 type: string
 *     responses:
 *       201:
 *         description: Persona created
 */
router.post('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const data = PersonaSchema.parse(req.body);
    const persona = await prisma.persona.create({
        data
    });
    res.status(201).json(persona);
});
/**
 * @openapi
 * /api/personas/{id}:
 *   put:
 *     summary: Update a persona
 *     tags: [Personas]
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
 *             $ref: '#/components/schemas/Persona'
 *     responses:
 *       200:
 *         description: Persona updated
 */
router.put('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const data = PersonaSchema.partial().parse(req.body);
    const persona = await prisma.persona.update({
        where: { id: req.params.id },
        data
    });
    res.json(persona);
});
/**
 * @openapi
 * /api/personas/analyze:
 *   post:
 *     summary: Analyze a famous person and generate persona profile
 *     tags: [Personas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [personName]
 *             properties:
 *               personName:
 *                 type: string
 *                 example: Steve Jobs
 *     responses:
 *       200:
 *         description: Persona analysis result
 */
router.post('/analyze', async (req, res) => {
    const { personName } = req.body;
    if (!personName || typeof personName !== 'string') {
        throw new errorHandler_1.AppError('personName is required', 400);
    }
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new errorHandler_1.AppError('AI not configured. Set ANTHROPIC_API_KEY.', 500);
    }
    const analysis = await (0, ai_1.analyzePersona)(personName);
    res.json(analysis);
});
/**
 * @openapi
 * /api/personas/{id}:
 *   delete:
 *     summary: Delete a persona
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Persona deleted
 */
router.delete('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    await prisma.persona.delete({
        where: { id: req.params.id }
    });
    res.status(204).send();
});
/**
 * @openapi
 * /api/personas/{id}/toggle:
 *   patch:
 *     summary: Toggle persona active status
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Persona status toggled
 */
router.patch('/:id/toggle', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const persona = await prisma.persona.findUnique({
        where: { id: req.params.id }
    });
    if (!persona) {
        throw new errorHandler_1.AppError('Persona not found', 404);
    }
    const updated = await prisma.persona.update({
        where: { id: req.params.id },
        data: { active: !persona.active }
    });
    res.json(updated);
});
exports.default = router;
//# sourceMappingURL=personas.js.map