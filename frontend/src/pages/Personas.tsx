import { useEffect, useState } from 'react'
import { Sparkles, Wand2, Search } from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Skeleton, EmptyState, Badge } from '../components/ui'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { GhostwriterIcon } from '../components/ui/logo'
import { cn } from '../lib/utils'

interface Persona {
  id: string
  name: string
  handle: string
  era?: string
  occupation?: string
  style: string
  active: boolean
}

export default function Personas() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [testTopic, setTestTopic] = useState('')
  const [testResult, setTestResult] = useState('')
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadPersonas()
  }, [])

  const loadPersonas = async () => {
    try {
      const data = await api.getPersonas()
      setPersonas(data)
    } catch (error) {
      toast.error('Failed to load personas')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (persona: Persona) => {
    if (!testTopic.trim()) {
      toast.error('Enter a topic first')
      return
    }
    
    setGenerating(true)
    setSelectedPersona(persona)
    setTestResult('')
    
    try {
      const result = await api.generate(persona.id, testTopic, true)
      setTestResult(result.posts[0]?.content || 'No content generated')
      toast.success('Post generated and saved as draft!')
    } catch (error) {
      toast.error('Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Personas</h1>
          <p className="text-[rgb(var(--muted-foreground))] mt-1 text-sm sm:text-base">
            Historical figures that post on your behalf
          </p>
        </div>
        <Badge variant="info" className="px-3 py-1 self-start sm:self-auto">
          {personas.length} active
        </Badge>
      </div>

      {/* Quick Generate */}
      <Card className="border-[rgb(var(--primary))/0.3]">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-[rgb(var(--primary))]" />
            Quick Generate
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-foreground))]" />
            <Input
              placeholder="Enter a topic..."
              className="pl-10 h-11 sm:h-10"
              value={testTopic}
              onChange={(e) => setTestTopic(e.target.value)}
            />
          </div>
          
          {testResult && (
            <div className="p-3 sm:p-4 rounded-lg bg-[rgb(var(--muted))] border border-[rgb(var(--border))] animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarFallback className="text-xs sm:text-sm">
                    {selectedPersona?.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{selectedPersona?.name}</span>
                <Badge variant="success" className="ml-auto text-xs">Generated</Badge>
              </div>
              <p className="text-[rgb(var(--foreground))] leading-relaxed text-sm sm:text-base">{testResult}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personas Grid */}
      {personas.length === 0 ? (
        <EmptyState
          icon={<GhostwriterIcon size={48} className="text-[rgb(var(--muted-foreground))]" />}
          title="No personas yet"
          description="Run the seed script to add some historical figures!"
          action={
            <code className="text-xs bg-[rgb(var(--muted))] px-3 py-2 rounded-lg">
              npm run db:seed
            </code>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map((persona, index) => (
            <Card 
              key={persona.id} 
              className="group hover:border-[rgb(var(--primary))/0.5] transition-all duration-300 hover:shadow-lg hover:shadow-[rgb(var(--primary))/0.1] animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Avatar className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-[rgb(var(--border))] group-hover:ring-[rgb(var(--primary))/0.5] transition-all flex-shrink-0">
                    <AvatarFallback className="text-base sm:text-lg font-bold bg-neutral-800">
                      <GhostwriterIcon size={24} className="text-[rgb(var(--primary))]" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg truncate">{persona.name}</h3>
                    <p className="text-sm text-[rgb(var(--primary))]">@{persona.handle}</p>
                    {persona.era && (
                      <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">{persona.era}</p>
                    )}
                    {persona.occupation && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {persona.occupation}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-[rgb(var(--muted-foreground))] mt-4 line-clamp-2 leading-relaxed">
                  {persona.style}
                </p>
                
                <Button
                  onClick={() => handleGenerate(persona)}
                  disabled={generating || !testTopic.trim()}
                  className={cn(
                    'w-full mt-4 h-11 sm:h-10 touch-manipulation',
                    generating && selectedPersona?.id === persona.id && 'animate-pulse-soft'
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  {generating && selectedPersona?.id === persona.id ? 'Generating...' : 'Generate Post'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
