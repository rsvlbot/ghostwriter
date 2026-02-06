import { useEffect, useState } from 'react'
import { Sparkles, Wand2, Search, Ghost, Plus, X, Edit2, Trash2, Brain, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Skeleton, EmptyState, Badge, Select } from '../components/ui'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { cn } from '../lib/utils'

interface Persona {
  id: string
  name: string
  handle: string
  era?: string
  occupation?: string
  style: string
  topics?: string[]
  tone?: string
  accountId?: string
  active: boolean
}

interface Account {
  id: string
  name: string
  threadsUserId: string
}

const emptyForm = {
  name: '',
  handle: '',
  occupation: '',
  style: '',
  topics: '',
  tone: '',
  accountId: '',
  basedOn: '',
  systemPrompt: '',
  sampleQuotes: '',
  writingPatterns: '',
  vocabulary: '',
  keyThemes: '',
}

export default function Personas() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [testTopic, setTestTopic] = useState('')
  const [testResult, setTestResult] = useState('')
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [personasData, accountsData] = await Promise.all([
        api.getPersonas(),
        api.getAccounts(),
      ])
      setPersonas(personasData)
      setAccounts(accountsData.filter((a: Account) => a.threadsUserId))
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.style.trim()) {
      toast.error('Name and style are required')
      return
    }
    setSaving(true)
    try {
      const data = {
        name: form.name,
        handle: form.handle || form.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        occupation: form.occupation || null,
        style: form.style,
        topics: form.topics ? form.topics.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        tone: form.tone || null,
        accountId: form.accountId || null,
        basedOn: form.basedOn || null,
        systemPrompt: form.systemPrompt || '',
        sampleQuotes: form.sampleQuotes ? form.sampleQuotes.split('\n').filter(Boolean) : [],
        writingPatterns: form.writingPatterns || null,
        vocabulary: form.vocabulary || null,
        keyThemes: form.keyThemes || null,
      }
      
      if (editingId) {
        await api.updatePersona(editingId, data)
        toast.success('Persona updated')
      } else {
        await api.createPersona(data)
        toast.success('Persona created')
      }
      
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      loadData()
    } catch (error) {
      toast.error('Failed to save persona')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (persona: any) => {
    setForm({
      name: persona.name,
      handle: persona.handle,
      occupation: persona.occupation || '',
      style: persona.style,
      topics: persona.topics?.join(', ') || '',
      tone: persona.tone || '',
      accountId: persona.accountId || '',
      basedOn: persona.basedOn || '',
      systemPrompt: persona.systemPrompt || '',
      sampleQuotes: persona.sampleQuotes?.join('\n') || '',
      writingPatterns: persona.writingPatterns || '',
      vocabulary: persona.vocabulary || '',
      keyThemes: persona.keyThemes || '',
    })
    setEditingId(persona.id)
    setShowForm(true)
  }

  const handleDelete = async (persona: Persona) => {
    if (!confirm(`Delete "${persona.name}"?`)) return
    try {
      await api.deletePersona(persona.id)
      toast.success('Persona deleted')
      loadData()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const openCreateForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  const handleAnalyze = async () => {
    if (!form.basedOn.trim()) {
      toast.error('Enter a famous person name first')
      return
    }
    setAnalyzing(true)
    try {
      const analysis = await api.analyzePersona(form.basedOn.trim())
      setForm({
        ...form,
        name: analysis.name,
        handle: analysis.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        occupation: analysis.occupation,
        style: analysis.style,
        tone: analysis.tone,
        topics: analysis.topics.join(', '),
        sampleQuotes: analysis.sampleQuotes.join('\n'),
        systemPrompt: analysis.systemPrompt,
        writingPatterns: analysis.writingPatterns,
        vocabulary: analysis.vocabulary,
        keyThemes: analysis.keyThemes,
      })
      toast.success(`Analyzed ${analysis.name}!`)
    } catch (error) {
      toast.error('Analysis failed. Check if AI is configured.')
    } finally {
      setAnalyzing(false)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Personas</h1>
          <p className="text-[rgb(var(--muted-foreground))] mt-1 text-sm sm:text-base">
            AI profiles that generate content in unique styles
          </p>
        </div>
        <Button onClick={openCreateForm} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Create Persona
        </Button>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <CardHeader className="p-4 sm:p-6 pb-2 flex flex-row items-center justify-between">
              <CardTitle>{editingId ? 'Edit Persona' : 'Create Persona'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
              {/* AI Analysis Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <span className="font-medium">AI-Powered Analysis</span>
                </div>
                <p className="text-sm text-[rgb(var(--muted-foreground))] mb-3">
                  Enter a famous person's name and let AI analyze their writing style, quotes, and create a detailed persona profile.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Steve Jobs, Einstein, Hemingway..."
                    value={form.basedOn}
                    onChange={(e) => setForm({ ...form, basedOn: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzing || !form.basedOn.trim()}
                    className="min-w-[120px]"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[rgb(var(--border))]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[rgb(var(--card))] px-2 text-[rgb(var(--muted-foreground))]">
                    or fill manually
                  </span>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    placeholder="Marcus Aurelius"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Handle</label>
                  <Input
                    placeholder="marcus_aurelius"
                    value={form.handle}
                    onChange={(e) => setForm({ ...form, handle: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Occupation / Role</label>
                <Input
                  placeholder="Roman Emperor, Stoic Philosopher..."
                  value={form.occupation}
                  onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Writing Style *</label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 rounded-lg bg-[rgb(var(--muted))] border border-[rgb(var(--border))] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                  placeholder="Contemplative and reflective, uses metaphors from nature, focuses on virtue and self-improvement..."
                  value={form.style}
                  onChange={(e) => setForm({ ...form, style: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Topics</label>
                  <Input
                    placeholder="philosophy, leadership, ethics"
                    value={form.topics}
                    onChange={(e) => setForm({ ...form, topics: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tone</label>
                  <Select
                    value={form.tone}
                    onChange={(e) => setForm({ ...form, tone: e.target.value })}
                  >
                    <option value="">Select tone...</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="humorous">Humorous</option>
                    <option value="sarcastic">Sarcastic</option>
                    <option value="inspirational">Inspirational</option>
                    <option value="controversial">Controversial</option>
                  </Select>
                </div>
              </div>

              {/* Sample Quotes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sample Quotes</label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 rounded-lg bg-[rgb(var(--muted))] border border-[rgb(var(--border))] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                  placeholder="One quote per line. These help AI capture the voice..."
                  value={form.sampleQuotes}
                  onChange={(e) => setForm({ ...form, sampleQuotes: e.target.value })}
                />
              </div>

              {/* System Prompt - Collapsible */}
              {form.systemPrompt && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">AI System Prompt</label>
                  <textarea
                    className="w-full min-h-[120px] px-3 py-2 rounded-lg bg-[rgb(var(--muted))] border border-[rgb(var(--border))] text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                    value={form.systemPrompt}
                    onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                  />
                  <p className="text-xs text-[rgb(var(--muted-foreground))]">
                    This prompt guides the AI to write like this person. Auto-generated by analysis.
                  </p>
                </div>
              )}
              
              {accounts.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Threads Account</label>
                  <Select
                    value={form.accountId}
                    onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                  >
                    <option value="">Select account...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>@{acc.name}</option>
                    ))}
                  </Select>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || !form.name || !form.style} className="flex-1">
                  {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
          icon={<Ghost className="w-12 h-12" />}
          title="No personas yet"
          description="Create your first persona to start generating content"
          action={
            <Button onClick={openCreateForm}>
              <Plus className="w-4 h-4" />
              Create Persona
            </Button>
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
                      <Ghost className="w-6 h-6 text-[rgb(var(--primary))]" />
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
                
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => handleGenerate(persona)}
                    disabled={generating || !testTopic.trim()}
                    className={cn(
                      'flex-1 h-10 touch-manipulation',
                      generating && selectedPersona?.id === persona.id && 'animate-pulse-soft'
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                    {generating && selectedPersona?.id === persona.id ? 'Generating...' : 'Generate'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(persona)}
                    className="h-10 w-10 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(persona)}
                    className="h-10 w-10 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
