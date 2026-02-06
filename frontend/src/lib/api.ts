const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://backend-production-e024.up.railway.app')

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Request failed')
  }
  
  return res.json()
}

export const api = {
  // Stats
  getStats: () => request<{
    totalPersonas: number
    totalPosts: number
    pendingPosts: number
    publishedPosts: number
    scheduledPosts: number
    postsThisWeek: number
    recentPosts: any[]
  }>('/api/stats'),

  // Personas
  getPersonas: () => request<any[]>('/api/personas'),
  getPersona: (id: string) => request<any>(`/api/personas/${id}`),
  createPersona: (data: any) => request<any>('/api/personas', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePersona: (id: string, data: any) => request<any>(`/api/personas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deletePersona: (id: string) => request<void>(`/api/personas/${id}`, {
    method: 'DELETE',
  }),

  // Posts
  getPosts: (status?: string) => request<any[]>(`/api/posts${status ? `?status=${status}` : ''}`),
  getPost: (id: string) => request<any>(`/api/posts/${id}`),
  updatePost: (id: string, data: any) => request<any>(`/api/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  approvePost: (id: string) => request<any>(`/api/posts/${id}/approve`, { method: 'POST' }),
  rejectPost: (id: string) => request<any>(`/api/posts/${id}/reject`, { method: 'POST' }),
  publishPost: (id: string) => request<any>(`/api/posts/${id}/publish`, { method: 'POST' }),
  deletePost: (id: string) => request<void>(`/api/posts/${id}`, { method: 'DELETE' }),

  // Generate
  generate: (personaId: string, topic: string, saveAsDraft = true) => 
    request<{ posts: { id?: string; content: string }[] }>('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ personaId, topic, saveAsDraft }),
    }),
  testGenerate: (persona: any, topic: string) =>
    request<{ content: string }>('/api/generate/test', {
      method: 'POST',
      body: JSON.stringify({ persona, topic }),
    }),

  // Settings
  getSettings: () => request<any>('/api/settings'),
  updateSettings: (data: any) => request<any>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getSystemInfo: () => request<any>('/api/settings/system'),

  // Threads
  getThreadsStatus: () => request<{ configured: boolean; appId: string | null }>('/api/threads/status'),
  getAuthUrl: (redirectUri: string) => request<{ url: string }>(`/api/threads/auth/url?redirect_uri=${encodeURIComponent(redirectUri)}`),

  // Accounts
  getAccounts: () => request<any[]>('/api/accounts'),
  disconnectAccount: (id: string) => request<void>(`/api/threads/disconnect/${id}`, { method: 'POST' }),

  // Trends
  getTrends: () => request<{ count: number; trends: any[] }>('/api/trends'),
  getTrendsBySource: (source: 'google' | 'hackernews' | 'reddit') => 
    request<{ source: string; count: number; trends: any[] }>(`/api/trends/${source}`),
  getBestTopic: (personaId: string) => 
    request<{ persona: any; topic: any }>(`/api/trends/best/${personaId}`),
  syncTrends: () => request<{ created: number; skipped: number }>('/api/trends/sync', { method: 'POST' }),

  // Schedules
  getSchedules: () => request<any[]>('/api/schedules'),
  createSchedule: (data: any) => request<any>('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSchedule: (id: string, data: any) => request<any>(`/api/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  toggleSchedule: (id: string) => request<any>(`/api/schedules/${id}/toggle`, { method: 'PATCH' }),
  deleteSchedule: (id: string) => request<void>(`/api/schedules/${id}`, { method: 'DELETE' }),

  // Topics
  getTopics: () => request<any[]>('/api/topics'),
  createTopic: (data: any) => request<any>('/api/topics', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  toggleTopic: (id: string) => request<any>(`/api/topics/${id}/toggle`, { method: 'PATCH' }),
  deleteTopic: (id: string) => request<void>(`/api/topics/${id}`, { method: 'DELETE' }),
}
