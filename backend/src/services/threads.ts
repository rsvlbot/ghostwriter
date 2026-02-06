/**
 * Threads API Service
 * 
 * Official Meta Threads API integration
 * Docs: https://developers.facebook.com/docs/threads/
 */

const THREADS_API_URL = 'https://graph.threads.net/v1.0';

interface ThreadsConfig {
  accessToken: string;
  userId: string;
}

interface PublishResult {
  success: boolean;
  threadsId?: string;
  error?: string;
}

/**
 * Create a media container for a text post
 */
async function createMediaContainer(
  config: ThreadsConfig,
  text: string
): Promise<string> {
  const url = `${THREADS_API_URL}/${config.userId}/threads`;
  
  const params = new URLSearchParams({
    media_type: 'TEXT',
    text: text,
    access_token: config.accessToken
  });

  const response = await fetch(`${url}?${params}`, {
    method: 'POST'
  });

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(error.error?.message || 'Failed to create media container');
  }

  const data = await response.json() as { id: string };
  return data.id;
}

/**
 * Publish a media container
 */
async function publishContainer(
  config: ThreadsConfig,
  containerId: string
): Promise<string> {
  const url = `${THREADS_API_URL}/${config.userId}/threads_publish`;
  
  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: config.accessToken
  });

  const response = await fetch(`${url}?${params}`, {
    method: 'POST'
  });

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(error.error?.message || 'Failed to publish post');
  }

  const data = await response.json() as { id: string };
  return data.id;
}

/**
 * Publish a text post to Threads
 */
export async function publishToThreads(
  config: ThreadsConfig,
  text: string
): Promise<PublishResult> {
  try {
    // Step 1: Create media container
    const containerId = await createMediaContainer(config, text);
    
    // Step 2: Publish the container
    const threadsId = await publishContainer(config, containerId);

    return {
      success: true,
      threadsId
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get user profile from Threads
 */
export async function getThreadsProfile(accessToken: string): Promise<{
  id: string;
  username: string;
  name?: string;
  threadsProfilePictureUrl?: string;
}> {
  const url = `${THREADS_API_URL}/me`;
  
  const params = new URLSearchParams({
    fields: 'id,username,name,threads_profile_picture_url',
    access_token: accessToken
  });

  const response = await fetch(`${url}?${params}`);

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(error.error?.message || 'Failed to get profile');
  }

  return response.json() as Promise<{
    id: string;
    username: string;
    name?: string;
    threadsProfilePictureUrl?: string;
  }>;
}

/**
 * Exchange authorization code for short-lived access token
 */
async function exchangeCodeForShortLivedToken(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  userId: string;
}> {
  const url = `${THREADS_API_URL}/oauth/access_token`;
  
  const params = new URLSearchParams({
    client_id: process.env.THREADS_APP_ID || '',
    client_secret: process.env.THREADS_APP_SECRET || '',
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code
  });

  const response = await fetch(url, {
    method: 'POST',
    body: params
  });

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(error.error?.message || 'Failed to exchange code');
  }

  const data = await response.json() as { access_token: string; user_id: string };
  return {
    accessToken: data.access_token,
    userId: data.user_id
  };
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 */
async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const url = `${THREADS_API_URL}/access_token`;
  
  const params = new URLSearchParams({
    grant_type: 'th_exchange_token',
    client_secret: process.env.THREADS_APP_SECRET || '',
    access_token: shortLivedToken
  });

  const response = await fetch(`${url}?${params}`);

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(error.error?.message || 'Failed to exchange for long-lived token');
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in
  };
}

/**
 * Exchange authorization code for a long-lived access token
 * Step 1: code → short-lived token
 * Step 2: short-lived → long-lived token (60 days)
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  userId: string;
  expiresIn: number;
}> {
  // Step 1: Get short-lived token
  const { accessToken: shortToken, userId } = await exchangeCodeForShortLivedToken(code, redirectUri);
  
  // Step 2: Exchange for long-lived token
  const { accessToken, expiresIn } = await exchangeForLongLivedToken(shortToken);
  
  return {
    accessToken,
    userId,
    expiresIn
  };
}

/**
 * Refresh a long-lived access token
 */
export async function refreshAccessToken(
  accessToken: string
): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const url = `${THREADS_API_URL}/refresh_access_token`;
  
  const params = new URLSearchParams({
    grant_type: 'th_refresh_token',
    access_token: accessToken
  });

  const response = await fetch(`${url}?${params}`);

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(error.error?.message || 'Failed to refresh token');
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in
  };
}

/**
 * Get OAuth authorization URL
 */
export function getAuthorizationUrl(redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.THREADS_APP_ID || '',
    redirect_uri: redirectUri,
    scope: 'threads_basic,threads_content_publish',
    response_type: 'code'
  });

  if (state) {
    params.set('state', state);
  }

  return `https://threads.net/oauth/authorize?${params}`;
}
