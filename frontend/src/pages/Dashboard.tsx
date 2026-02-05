import { useEffect, useState } from 'react'
import { Users, FileText, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { api } from '../lib/api'

interface Stats {
  totalPersonas: number
  totalPosts: number
  pendingPosts: number
  publishedPosts: number
  scheduledPosts: number
  postsThisWeek: number
  recentPosts: any[]
}

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
    return <div className="text-zinc-500">Loading...</div>
  }

  if (!stats) {
    return <div className="text-red-500">Failed to load stats. Is the backend running?</div>
  }

  const statCards = [
    { label: 'Active Personas', value: stats.totalPersonas, icon: Users, color: 'text-blue-500' },
    { label: 'Total Posts', value: stats.totalPosts, icon: FileText, color: 'text-green-500' },
    { label: 'Pending Approval', value: stats.pendingPosts, icon: Clock, color: 'text-yellow-500' },
    { label: 'Published', value: stats.publishedPosts, icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'This Week', value: stats.postsThisWeek, icon: TrendingUp, color: 'text-purple-500' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-500">Overview of your Ghostwriter activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-zinc-500 text-sm">{stat.label}</span>
              </div>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          )
        })}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Posts</h2>
        {stats.recentPosts.length === 0 ? (
          <p className="text-zinc-500">No posts yet. Generate some!</p>
        ) : (
          <div className="space-y-3">
            {stats.recentPosts.map((post) => (
              <div key={post.id} className="flex items-start gap-4 p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-zinc-300 line-clamp-2">{post.content}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {post.persona?.name} • {new Date(post.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
