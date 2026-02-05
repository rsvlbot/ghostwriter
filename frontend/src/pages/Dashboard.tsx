import { useEffect, useState } from 'react'
import { Users, FileText, Clock, CheckCircle, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'
import { api } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge, Button, EmptyState } from '../components/ui'
import { cn } from '../lib/utils'

interface Stats {
  totalPersonas: number
  totalPosts: number
  pendingPosts: number
  publishedPosts: number
  scheduledPosts: number
  postsThisWeek: number
  recentPosts: any[]
}

const statConfigs = [
  { key: 'totalPersonas', label: 'Personas', icon: Users, accent: true },
  { key: 'totalPosts', label: 'Total Posts', icon: FileText, accent: false },
  { key: 'pendingPosts', label: 'Pending', icon: Clock, accent: false },
  { key: 'publishedPosts', label: 'Published', icon: CheckCircle, accent: false },
  { key: 'postsThisWeek', label: 'This Week', icon: TrendingUp, accent: true },
]

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 sm:h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!stats) {
    return (
      <EmptyState
        icon={<Sparkles className="w-12 h-12" />}
        title="Connection Error"
        description="Failed to load stats. Is the backend running?"
        action={
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-1 text-sm sm:text-base">
          Overview of your Ghostwriter activity
        </p>
      </div>

      {/* Stats Grid - 2 cols mobile, 5 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {statConfigs.map((config) => {
          const Icon = config.icon
          const value = stats[config.key as keyof Stats] as number
          
          return (
            <Card 
              key={config.key} 
              className={cn(
                'group relative overflow-hidden hover:scale-[1.02] transition-all duration-300',
                config.accent && 'border-[rgb(var(--primary))/0.3] shadow-lg shadow-[rgb(var(--primary))/0.1]'
              )}
            >
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    'p-2 sm:p-2.5 rounded-lg sm:rounded-xl shadow-lg',
                    config.accent 
                      ? 'bg-[rgb(var(--primary))] shadow-[rgb(var(--primary))/0.3]' 
                      : 'bg-neutral-800'
                  )}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <span className={cn(
                    'text-2xl sm:text-3xl font-bold tabular-nums',
                    config.accent && 'text-[rgb(var(--primary))]'
                  )}>{value}</span>
                </div>
                <p className="text-xs sm:text-sm text-[rgb(var(--muted-foreground))] mt-2 sm:mt-3 font-medium truncate">
                  {config.label}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[rgb(var(--primary))]" />
            <span>Recent Posts</span>
          </CardTitle>
          {stats.recentPosts.length > 0 && (
            <Button variant="ghost" size="sm" className="text-[rgb(var(--muted-foreground))] hidden sm:flex">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {stats.recentPosts.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-10 h-10" />}
              title="No posts yet"
              description="Generate your first post from the Personas page!"
              className="py-8"
            />
          ) : (
            <div className="space-y-3">
              {stats.recentPosts.map((post, index) => (
                <div 
                  key={post.id} 
                  className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-[rgb(var(--muted))/0.5] hover:bg-[rgb(var(--muted))] transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-[rgb(var(--primary))] text-xs sm:text-sm font-medium">
                      {post.persona?.name?.[0] || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[rgb(var(--foreground))] line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {post.persona?.name || 'Unknown'}
                      </Badge>
                      <span className="text-xs text-[rgb(var(--muted-foreground))]">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
