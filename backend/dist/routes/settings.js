"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const SettingsSchema = zod_1.z.object({
    aiModel: zod_1.z.string().optional(),
    aiTemp: zod_1.z.number().min(0).max(2).optional()
});
// Get settings
router.get('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    let settings = await prisma.settings.findUnique({
        where: { id: 'default' }
    });
    // Create default settings if not exists
    if (!settings) {
        settings = await prisma.settings.create({
            data: {
                id: 'default',
                aiModel: 'claude-sonnet-4-20250514',
                aiTemp: 0.8
            }
        });
    }
    // Add available models list
    const availableModels = [
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'Anthropic' },
        { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'Anthropic' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' }
    ];
    res.json({
        ...settings,
        availableModels
    });
});
// Update settings
router.put('/', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const data = SettingsSchema.parse(req.body);
    const settings = await prisma.settings.upsert({
        where: { id: 'default' },
        create: {
            id: 'default',
            ...data
        },
        update: data
    });
    res.json(settings);
});
// Get system info
router.get('/system', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const [personaCount, postCount, accountCount] = await Promise.all([
        prisma.persona.count(),
        prisma.post.count(),
        prisma.account.count()
    ]);
    res.json({
        version: '1.0.0',
        nodeVersion: process.version,
        uptime: process.uptime(),
        stats: {
            personas: personaCount,
            posts: postCount,
            accounts: accountCount
        },
        threads: {
            configured: !!(process.env.THREADS_APP_ID && process.env.THREADS_APP_SECRET)
        },
        ai: {
            configured: !!process.env.ANTHROPIC_API_KEY,
            provider: 'Anthropic Claude'
        }
    });
});
// Test AI connection
router.get('/ai/test', async (req, res) => {
    if (!process.env.ANTHROPIC_API_KEY) {
        res.json({
            connected: false,
            error: 'ANTHROPIC_API_KEY not configured'
        });
        return;
    }
    try {
        const Anthropic = (await Promise.resolve().then(() => __importStar(require('@anthropic-ai/sdk')))).default;
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }]
        });
        res.json({
            connected: true,
            model: 'claude-sonnet-4-20250514',
            provider: 'Anthropic'
        });
    }
    catch (error) {
        res.json({
            connected: false,
            error: error.message || 'Connection failed'
        });
    }
});
exports.default = router;
//# sourceMappingURL=settings.js.map