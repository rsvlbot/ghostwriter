"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
const ScheduleSchema = zod_1.z.object({
    personaId: zod_1.z.string().uuid(),
    accountId: zod_1.z.string().uuid(),
    postsPerDay: zod_1.z.number().int().min(1).max(10).default(3),
    postingTimes: zod_1.z.array(zod_1.z.string().regex(/^\d{2}:\d{2}$/)).default(['09:00', '15:00', '21:00']),
    timezone: zod_1.z.string().default('UTC'),
    autoApprove: zod_1.z.boolean().default(false),
    active: zod_1.z.boolean().default(true)
});
// Get all schedules
router.get('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const schedules = await prisma.schedule.findMany({
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
    res.json(schedules);
});
// Get single schedule
router.get('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const schedule = await prisma.schedule.findUnique({
        where: { id: req.params.id },
        include: {
            persona: true,
            account: true
        }
    });
    if (!schedule) {
        throw new errorHandler_1.AppError('Schedule not found', 404);
    }
    res.json(schedule);
});
// Create schedule
router.post('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const data = ScheduleSchema.parse(req.body);
    // Check if schedule already exists for this persona+account combo
    const existing = await prisma.schedule.findUnique({
        where: {
            personaId_accountId: {
                personaId: data.personaId,
                accountId: data.accountId
            }
        }
    });
    if (existing) {
        throw new errorHandler_1.AppError('Schedule already exists for this persona and account', 400);
    }
    const schedule = await prisma.schedule.create({
        data,
        include: {
            persona: true,
            account: true
        }
    });
    res.status(201).json(schedule);
});
// Update schedule
router.put('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const data = ScheduleSchema.partial().parse(req.body);
    const schedule = await prisma.schedule.update({
        where: { id: req.params.id },
        data,
        include: {
            persona: true,
            account: true
        }
    });
    res.json(schedule);
});
// Delete schedule
router.delete('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    await prisma.schedule.delete({
        where: { id: req.params.id }
    });
    res.status(204).send();
});
// Toggle active status
router.patch('/:id/toggle', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const schedule = await prisma.schedule.findUnique({
        where: { id: req.params.id }
    });
    if (!schedule) {
        throw new errorHandler_1.AppError('Schedule not found', 404);
    }
    const updated = await prisma.schedule.update({
        where: { id: req.params.id },
        data: { active: !schedule.active },
        include: {
            persona: true,
            account: true
        }
    });
    res.json(updated);
});
exports.default = router;
//# sourceMappingURL=schedules.js.map