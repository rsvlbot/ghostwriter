"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
const PersonaSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    handle: zod_1.z.string().min(1),
    era: zod_1.z.string().optional(),
    occupation: zod_1.z.string().optional(),
    style: zod_1.z.string().min(1),
    sampleQuotes: zod_1.z.array(zod_1.z.string()).default([]),
    systemPrompt: zod_1.z.string().min(1),
    avatarUrl: zod_1.z.string().url().optional().nullable(),
    active: zod_1.z.boolean().default(true)
});
// Get all personas
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
// Get single persona
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
// Create persona
router.post('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const data = PersonaSchema.parse(req.body);
    const persona = await prisma.persona.create({
        data
    });
    res.status(201).json(persona);
});
// Update persona
router.put('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const data = PersonaSchema.partial().parse(req.body);
    const persona = await prisma.persona.update({
        where: { id: req.params.id },
        data
    });
    res.json(persona);
});
// Delete persona
router.delete('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    await prisma.persona.delete({
        where: { id: req.params.id }
    });
    res.status(204).send();
});
// Toggle active status
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