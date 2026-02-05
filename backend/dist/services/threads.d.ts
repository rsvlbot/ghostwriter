/**
 * Threads API Service
 *
 * Official Meta Threads API integration
 * Docs: https://developers.facebook.com/docs/threads/
 */
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
 * Publish a text post to Threads
 */
export declare function publishToThreads(config: ThreadsConfig, text: string): Promise<PublishResult>;
/**
 * Get user profile from Threads
 */
export declare function getThreadsProfile(accessToken: string): Promise<{
    id: string;
    username: string;
    name?: string;
    threadsProfilePictureUrl?: string;
}>;
/**
 * Exchange authorization code for access token
 */
export declare function exchangeCodeForToken(code: string, redirectUri: string): Promise<{
    accessToken: string;
    userId: string;
}>;
/**
 * Refresh a long-lived access token
 */
export declare function refreshAccessToken(accessToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
}>;
/**
 * Get OAuth authorization URL
 */
export declare function getAuthorizationUrl(redirectUri: string, state?: string): string;
export {};
//# sourceMappingURL=threads.d.ts.map