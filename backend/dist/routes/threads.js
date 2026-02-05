"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const threads_1 = require("../services/threads");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// Get OAuth URL for connecting Threads account
router.get('/auth/url', (req, res) => {
    const redirectUri = req.query.redirect_uri || process.env.THREADS_REDIRECT_URI || '';
    const state = req.query.state;
    if (!process.env.THREADS_APP_ID) {
        throw new errorHandler_1.AppError('Threads App ID not configured', 500);
    }
    const url = (0, threads_1.getAuthorizationUrl)(redirectUri, state);
    res.json({ url });
});
// Handle OAuth callback
router.post('/auth/callback', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { code, redirect_uri } = req.body;
    if (!code) {
        throw new errorHandler_1.AppError('Authorization code is required', 400);
    }
    // Exchange code for token
    const { accessToken, userId } = await (0, threads_1.exchangeCodeForToken)(code, redirect_uri || process.env.THREADS_REDIRECT_URI || '');
    // Get user profile
    const profile = await (0, threads_1.getThreadsProfile)(accessToken);
    // Calculate token expiration (60 days for long-lived token)
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 60);
    // Create or update account
    const account = await prisma.account.upsert({
        where: { threadsUserId: userId },
        create: {
            name: profile.username || profile.name || `Threads User ${userId}`,
            threadsUserId: userId,
            accessToken,
            tokenExpiresAt,
            active: true
        },
        update: {
            name: profile.username || profile.name || `Threads User ${userId}`,
            accessToken,
            tokenExpiresAt,
            active: true
        }
    });
    res.json({
        success: true,
        account: {
            id: account.id,
            name: account.name,
            threadsUserId: account.threadsUserId
        }
    });
});
// Refresh token for an account
router.post('/auth/refresh/:accountId', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { accountId } = req.params;
    const account = await prisma.account.findUnique({
        where: { id: accountId }
    });
    if (!account) {
        throw new errorHandler_1.AppError('Account not found', 404);
    }
    if (!account.accessToken) {
        throw new errorHandler_1.AppError('Account has no access token', 400);
    }
    const { accessToken, expiresIn } = await (0, threads_1.refreshAccessToken)(account.accessToken);
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expiresIn);
    await prisma.account.update({
        where: { id: accountId },
        data: {
            accessToken,
            tokenExpiresAt
        }
    });
    res.json({
        success: true,
        expiresAt: tokenExpiresAt
    });
});
// Check Threads connection status
router.get('/status', async (req, res) => {
    const configured = !!(process.env.THREADS_APP_ID && process.env.THREADS_APP_SECRET);
    res.json({
        configured,
        appId: process.env.THREADS_APP_ID ? '***configured***' : null
    });
});
// Disconnect account from Threads
router.post('/disconnect/:accountId', async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { accountId } = req.params;
    await prisma.account.update({
        where: { id: accountId },
        data: {
            accessToken: null,
            refreshToken: null,
            tokenExpiresAt: null,
            threadsUserId: null
        }
    });
    res.json({ success: true });
});
exports.default = router;
//# sourceMappingURL=threads.js.map