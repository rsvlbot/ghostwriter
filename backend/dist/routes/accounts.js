"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
const AccountSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    threadsUserId: zod_1.z.string().optional().nullable(),
    accessToken: zod_1.z.string().optional().nullable(),
    refreshToken: zod_1.z.string().optional().nullable(),
    tokenExpiresAt: zod_1.z.string().datetime().optional().nullable(),
    active: zod_1.z.boolean().default(true)
});
// Get all accounts
router.get('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const accounts = await prisma.account.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            threadsUserId: true,
            active: true,
            tokenExpiresAt: true,
            createdAt: true,
            _count: {
                select: { posts: true, schedules: true }
            }
        }
    });
    res.json(accounts);
});
// Get single account
router.get('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const account = await prisma.account.findUnique({
        where: { id: req.params.id },
        select: {
            id: true,
            name: true,
            threadsUserId: true,
            active: true,
            tokenExpiresAt: true,
            createdAt: true,
            schedules: {
                include: { persona: true }
            }
        }
    });
    if (!account) {
        throw new errorHandler_1.AppError('Account not found', 404);
    }
    res.json(account);
});
// Create account (for manual creation before OAuth)
router.post('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const data = AccountSchema.parse(req.body);
    const account = await prisma.account.create({
        data: {
            ...data,
            tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : null
        }
    });
    res.status(201).json(account);
});
// Update account
router.put('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const data = AccountSchema.partial().parse(req.body);
    const account = await prisma.account.update({
        where: { id: req.params.id },
        data: {
            ...data,
            tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : undefined
        }
    });
    res.json(account);
});
// Delete account
router.delete('/:id', async (req, res) => {
    const prisma = req.app.locals.prisma;
    await prisma.account.delete({
        where: { id: req.params.id }
    });
    res.status(204).send();
});
// Toggle active status
router.patch('/:id/toggle', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const account = await prisma.account.findUnique({
        where: { id: req.params.id }
    });
    if (!account) {
        throw new errorHandler_1.AppError('Account not found', 404);
    }
    const updated = await prisma.account.update({
        where: { id: req.params.id },
        data: { active: !account.active }
    });
    res.json(updated);
});
exports.default = router;
//# sourceMappingURL=accounts.js.map