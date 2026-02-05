import { useEffect, useState } from 'react'
import { TrendingUp, RefreshCw, Zap, Globe, MessageSquare, Newspaper, Sparkles } from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { Card, CardContent, Button, Badge, Skeleton, EmptyState, Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui'
import { cn } from '../lib/utils'

interface Trend {
  title: string
  source: 'google' | 'hackernews' | 'reddit'
  url?: string
  score?: number
  description?: string
}

const sourceConfig = {
  google: { icon: Globe, label: 'Google Trends', color: 'text-blue-400' },
  hackernews: { icon: Newspaper, label: 'Hacker News', color: 'text-orange-400' },
  reddit: { icon: MessageSquare, label: 'Reddit', color: 'text-red-400' },
}

export default function Trends() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [activeSource, setActiveSource] = useState<string>('all')
  const [personas, setPersonas] = useState<any[]>([])
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [trendsData, personasData] = await Promise.all([
        api.getTrends(),
        api.getPersonas()
      ])
      setTrends(trendsData.trends)
      setPersonas(personasData)
    } catch (error) {
      toast.error('Failed to load trends')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await api.syncTrends()
      toast.success(`Synced: ${result.created} new trends`)
      await loadData()
    } catch (error) {
      toast.error('Failed to sync trends')
    } finally {
      setSyncing(false)
    }
  }

  const handleGenerateFromTrend = async (trend: Trend, personaId: string) => {
    setGeneratingFor(`${trend.title}-${personaId}`)
    try {
      await api.generate(personaId, trend.title, true)
      toast.success('Post generated and saved as draft!')
    } catch (error) {
      toast.error('Failed to generate post')
    } finally {
      setGeneratingFor(null)
    }
  }

  const filteredTrends = activeSource === 'all' 
    ? trends 
    : trends.filter(t => t.source === activeSource)

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-[rgb(var(--primary))]" />
            Trending Topics
          </h1>
          <p className="text-[rgb(var(--muted-foreground))] mt-1 text-sm sm:text-base">
            Real-time viral topics from Google, HN & Reddit
          </p>
        </div>
        <Button 
          onClick={handleSync} 
          disabled={syncing}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
          {syncing ? 'Syncing...' : 'Refresh Trends'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['google', 'hackernews', 'reddit'] as const).map(source => {
          const config = sourceConfig[source]
          const count = trends.filter(t => t.source === source).length
          const Icon = config.icon
          
          return (
            <Card key={source} className="cursor-pointer hover:border-[rgb(var(--primary))/0.3]" onClick={() => setActiveSource(source)}>
              <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                <Icon className={cn('w-5 h-5', config.color)} />
                <div>
                  <p className="text-lg sm:text-xl font-bold">{count}</p>
                  <p className="text-xs text-[rgb(var(--muted-foreground))] hidden sm:block">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" value={activeSource} onValueChange={setActiveSource}>
        <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scrollbar-hide">
          <TabsList>
            <TabsTrigger value="all">All ({trends.length})</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="hackernews">HN</TabsTrigger>
            <TabsTrigger value="reddit">Reddit</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeSource}>
          {filteredTrends.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="w-12 h-12" />}
              title="No trends yet"
              description="Click 'Refresh Trends' to fetch latest viral topics"
              action={
                <Button onClick={handleSync} disabled={syncing}>
                  <RefreshCw className="w-4 h-4" />
                  Fetch Trends
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredTrends.map((trend, index) => {
                const config = sourceConfig[trend.source]
                const Icon = config.icon
                
                return (
                  <Card 
                    key={`${trend.title}-${index}`}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn('p-2 rounded-lg bg-neutral-800', config.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm sm:text-base line-clamp-2">{trend.title}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {config.label}
                            </Badge>
                            {trend.score && (
                              <span className="text-xs text-[rgb(var(--muted-foreground))]">
                                {trend.score.toLocaleString()} {trend.source === 'hackernews' ? 'points' : 'upvotes'}
                              </span>
                            )}
                            {trend.description && !trend.score && (
                              <span className="text-xs text-[rgb(var(--muted-foreground))]">
                                {trend.description}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Quick generate dropdown */}
                        <div className="relative group">
                          <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                            <Zap className="w-4 h-4" />
                          </Button>
                          <div className="absolute right-0 top-full mt-1 w-48 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <div className="p-2 text-xs text-[rgb(var(--muted-foreground))] border-b border-[rgb(var(--border))]">
                              Generate post as:
                            </div>
                            {personas.slice(0, 5).map(persona => (
                              <button
                                key={persona.id}
                                onClick={() => handleGenerateFromTrend(trend, persona.id)}
                                disabled={generatingFor === `${trend.title}-${persona.id}`}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-[rgb(var(--muted))] flex items-center gap-2 disabled:opacity-50"
                              >
                                {generatingFor === `${trend.title}-${persona.id}` ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3 text-[rgb(var(--primary))]" />
                                )}
                                {persona.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
