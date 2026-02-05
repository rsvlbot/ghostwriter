"use strict";
/**
 * Threads API Service
 *
 * Official Meta Threads API integration
 * Docs: https://developers.facebook.com/docs/threads/
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishToThreads = publishToThreads;
exports.getThreadsProfile = getThreadsProfile;
exports.exchangeCodeForToken = exchangeCodeForToken;
exports.refreshAccessToken = refreshAccessToken;
exports.getAuthorizationUrl = getAuthorizationUrl;
const THREADS_API_URL = 'https://graph.threads.net/v1.0';
/**
 * Create a media container for a text post
 */
async function createMediaContainer(config, text) {
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
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create media container');
    }
    const data = await response.json();
    return data.id;
}
/**
 * Publish a media container
 */
async function publishContainer(config, containerId) {
    const url = `${THREADS_API_URL}/${config.userId}/threads_publish`;
    const params = new URLSearchParams({
        creation_id: containerId,
        access_token: config.accessToken
    });
    const response = await fetch(`${url}?${params}`, {
        method: 'POST'
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to publish post');
    }
    const data = await response.json();
    return data.id;
}
/**
 * Publish a text post to Threads
 */
async function publishToThreads(config, text) {
    try {
        // Step 1: Create media container
        const containerId = await createMediaContainer(config, text);
        // Step 2: Publish the container
        const threadsId = await publishContainer(config, containerId);
        return {
            success: true,
            threadsId
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Get user profile from Threads
 */
async function getThreadsProfile(accessToken) {
    const url = `${THREADS_API_URL}/me`;
    const params = new URLSearchParams({
        fields: 'id,username,name,threads_profile_picture_url',
        access_token: accessToken
    });
    const response = await fetch(`${url}?${params}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get profile');
    }
    return response.json();
}
/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code, redirectUri) {
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
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to exchange code');
    }
    const data = await response.json();
    return {
        accessToken: data.access_token,
        userId: data.user_id
    };
}
/**
 * Refresh a long-lived access token
 */
async function refreshAccessToken(accessToken) {
    const url = `${THREADS_API_URL}/refresh_access_token`;
    const params = new URLSearchParams({
        grant_type: 'th_refresh_token',
        access_token: accessToken
    });
    const response = await fetch(`${url}?${params}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to refresh token');
    }
    const data = await response.json();
    return {
        accessToken: data.access_token,
        expiresIn: data.expires_in
    };
}
/**
 * Get OAuth authorization URL
 */
function getAuthorizationUrl(redirectUri, state) {
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
//# sourceMappingURL=threads.js.map