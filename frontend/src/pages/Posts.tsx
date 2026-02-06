import { useEffect, useState } from 'react'
import { Check, X, Send, Trash2, Clock, AlertCircle } from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { Card, CardContent, Button, Badge, Skeleton, EmptyState, Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui'
import { Avatar, AvatarFallback } from '../components/ui/avatar'

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
  { id: 'PUBLISHED', label: 'Published' },
  { id: 'FAILED', label: 'Failed' },
]

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple'> = {
  DRAFT: 'secondary',
  PENDING: 'warning',
  APPROVED: 'info',
  SCHEDULED: 'purple',
  PUBLISHED: 'success',
  REJECTED: 'destructive',
  FAILED: 'destructive',
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deletePost(deleteTarget.id)
      toast.success('Post deleted')
      setDeleteTarget(null)
      loadPosts()
    } catch (error) {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Posts</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-1 text-sm sm:text-base">
          Manage and approve generated posts
        </p>
      </div>

      {/* Tabs - horizontal scroll on mobile */}
      <Tabs defaultValue="" value={activeTab} onValueChange={setActiveTab}>
        <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scrollbar-hide">
          <TabsList className="w-max sm:w-auto">
            {statusTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="px-3 sm:px-4">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 sm:h-40 rounded-xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-12 h-12" />}
              title="No posts found"
              description={activeTab ? `No ${activeTab.toLowerCase()} posts` : 'Generate some posts from the Personas page!'}
            />
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => (
                <Card 
                  key={post.id} 
                  className="group hover:border-[rgb(var(--primary))/0.3] transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <CardContent className="p-4 sm:p-5">
                    {/* Mobile: Stack layout */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      {/* Avatar - hidden on small mobile */}
                      <Avatar className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarFallback>
                          {post.persona?.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Meta row */}
                        <div className="flex items-center gap-2 flex-wrap mb-2 sm:mb-3">
                          {/* Mobile avatar inline */}
                          <Avatar className="sm:hidden h-6 w-6 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {post.persona?.name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <Badge variant={statusVariants[post.status] || 'secondary'}>
                            {post.status}
                          </Badge>
                          {post.persona && (
                            <span className="text-sm font-medium text-[rgb(var(--foreground))]">
                              {post.persona.name}
                            </span>
                          )}
                          {post.topic && (
                            <span className="text-xs text-[rgb(var(--muted-foreground))] hidden sm:inline">
                              • {post.topic}
                            </span>
                          )}
                        </div>
                        
                        {/* Post content */}
                        <p className="text-[rgb(var(--foreground))] whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                          {post.content}
                        </p>
                        
                        {/* Error */}
                        {post.error && (
                          <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <p className="text-sm text-red-400">{post.error}</p>
                          </div>
                        )}
                        
                        {/* Published date */}
                        {post.publishedAt && (
                          <p className="text-xs text-[rgb(var(--muted-foreground))] mt-3">
                            Published: {new Date(post.publishedAt).toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Actions - bottom on mobile, right side on desktop */}
                      <div className="flex gap-2 sm:flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[rgb(var(--border))] mt-2 sm:mt-0">
                        {(post.status === 'DRAFT' || post.status === 'PENDING') && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleApprove(post.id)}
                              className="h-10 w-10 sm:h-9 sm:w-9 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 touch-manipulation"
                              title="Approve"
                            >
                              <Check className="w-5 h-5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleReject(post.id)}
                              className="h-10 w-10 sm:h-9 sm:w-9 text-red-500 hover:text-red-400 hover:bg-red-500/10 touch-manipulation"
                              title="Reject"
                            >
                              <X className="w-5 h-5 sm:w-4 sm:h-4" />
                            </Button>
                          </>
                        )}
                        {post.status === 'APPROVED' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handlePublish(post.id)}
                            className="h-10 w-10 sm:h-9 sm:w-9 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 touch-manipulation"
                            title="Publish Now"
                          >
                            <Send className="w-5 h-5 sm:w-4 sm:h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteTarget(post)}
                          className="h-10 w-10 sm:h-9 sm:w-9 text-[rgb(var(--muted-foreground))] hover:text-red-400 hover:bg-red-500/10 touch-manipulation ml-auto sm:ml-0"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !deleting && setDeleteTarget(null)}>
          <Card className="w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">
                Delete Post?
              </h3>
              <p className="text-sm text-[rgb(var(--muted-foreground))] mb-1">
                This action cannot be undone.
              </p>
              <p className="text-xs text-[rgb(var(--muted-foreground))] mb-6 line-clamp-2 italic">
                "{deleteTarget.content.slice(0, 100)}{deleteTarget.content.length > 100 ? '...' : ''}"
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
