import { useEffect, useState } from 'react'
import { Check, X, Send, Trash2, Clock, AlertCircle } from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

interface Post {
  id: string
  content: string
  topic?: string
  status: string
  scheduledAt?: string
  publishedAt?: string
  persona?: { name: string }
  error?: string
}

const statusTabs = [
  { id: '', label: 'All' },
  { id: 'DRAFT', label: 'Drafts' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'SCHEDULED', label: 'Scheduled' },
  { id: 'PUBLISHED', label: 'Published' },
  { id: 'FAILED', label: 'Failed' },
]

const statusColors: Record<string, string> = {
  DRAFT: 'bg-zinc-600',
  PENDING: 'bg-yellow-600',
  APPROVED: 'bg-blue-600',
  SCHEDULED: 'bg-purple-600',
  PUBLISHED: 'bg-green-600',
  REJECTED: 'bg-red-600',
  FAILED: 'bg-red-600',
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')

  useEffect(() => {
    loadPosts()
  }, [activeTab])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const data = await api.getPosts(activeTab || undefined)
      setPosts(data)
    } catch (error) {
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await api.approvePost(id)
      toast.success('Post approved')
      loadPosts()
    } catch (error) {
      toast.error('Failed to approve')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await api.rejectPost(id)
      toast.success('Post rejected')
      loadPosts()
    } catch (error) {
      toast.error('Failed to reject')
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await api.publishPost(id)
      toast.success('Publishing...')
      loadPosts()
    } catch (error) {
      toast.error('Failed to publish')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    try {
      await api.deletePost(id)
      toast.success('Post deleted')
      loadPosts()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Posts</h1>
        <p className="text-zinc-500">Manage generated posts</p>
      </div>

      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-zinc-500">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No posts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="card">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusColors[post.status] || 'bg-zinc-600'}`}>
                      {post.status}
                    </span>
                    {post.persona && (
                      <span className="text-sm text-zinc-500">{post.persona.name}</span>
                    )}
                    {post.topic && (
                      <span className="text-xs text-zinc-600">• {post.topic}</span>
                    )}
                  </div>
                  
                  <p className="text-zinc-200 whitespace-pre-wrap">{post.content}</p>
                  
                  {post.error && (
                    <p className="text-sm text-red-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {post.error}
                    </p>
                  )}
                  
                  {post.publishedAt && (
                    <p className="text-xs text-zinc-600 mt-2">
                      Published: {new Date(post.publishedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {(post.status === 'DRAFT' || post.status === 'PENDING') && (
                    <>
                      <button
                        onClick={() => handleApprove(post.id)}
                        className="p-2 rounded-lg bg-green-600/20 text-green-500 hover:bg-green-600/30"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(post.id)}
                        className="p-2 rounded-lg bg-red-600/20 text-red-500 hover:bg-red-600/30"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {post.status === 'APPROVED' && (
                    <button
                      onClick={() => handlePublish(post.id)}
                      className="p-2 rounded-lg bg-blue-600/20 text-blue-500 hover:bg-blue-600/30"
                      title="Publish Now"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
