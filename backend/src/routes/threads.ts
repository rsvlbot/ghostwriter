import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  getAuthorizationUrl,
  exchangeCodeForToken,
  getThreadsProfile,
  refreshAccessToken
} from '../services/threads';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Get OAuth URL for connecting Threads account
router.get('/auth/url', (req: Request, res: Response) => {
  const redirectUri = req.query.redirect_uri as string || process.env.THREADS_REDIRECT_URI || '';
  const state = req.query.state as string;

  if (!process.env.THREADS_APP_ID) {
    throw new AppError('Threads App ID not configured', 500);
  }

  const url = getAuthorizationUrl(redirectUri, state);
  res.json({ url });
});

// Handle OAuth callback
router.post('/auth/callback', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { code, redirect_uri } = req.body;

  if (!code) {
    throw new AppError('Authorization code is required', 400);
  }

  // Exchange code for token
  const { accessToken, userId } = await exchangeCodeForToken(
    code,
    redirect_uri || process.env.THREADS_REDIRECT_URI || ''
  );

  // Get user profile
  const profile = await getThreadsProfile(accessToken);

  // Calculate token expiration (60 days for long-lived token)
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 60);

  // Convert userId to string (API returns number, DB expects string)
  const userIdStr = String(userId);

  // Create or update account
  const account = await prisma.account.upsert({
    where: { threadsUserId: userIdStr },
    create: {
      name: profile.username || profile.name || `Threads User ${userIdStr}`,
      threadsUserId: userIdStr,
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
router.post('/auth/refresh/:accountId', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { accountId } = req.params;

  const account = await prisma.account.findUnique({
    where: { id: accountId }
  });

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  if (!account.accessToken) {
    throw new AppError('Account has no access token', 400);
  }

  const { accessToken, expiresIn } = await refreshAccessToken(account.accessToken);

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
router.get('/status', async (req: Request, res: Response) => {
  const configured = !!(process.env.THREADS_APP_ID && process.env.THREADS_APP_SECRET);

  res.json({
    configured,
    appId: process.env.THREADS_APP_ID ? '***configured***' : null
  });
});

// Disconnect account from Threads
router.post('/disconnect/:accountId', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
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

export default router;
