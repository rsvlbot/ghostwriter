import { useEffect, useState } from 'react'
import { Sparkles, Ghost } from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

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
    return <div className="text-zinc-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Personas</h1>
          <p className="text-zinc-500">Historical figures that post on your behalf</p>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold mb-3">Quick Generate</h3>
        <input
          type="text"
          placeholder="Enter a topic (e.g., 'AI replacing jobs')"
          className="input w-full"
          value={testTopic}
          onChange={(e) => setTestTopic(e.target.value)}
        />
        {testResult && (
          <div className="mt-4 p-4 bg-zinc-800 rounded-lg">
            <p className="text-sm font-medium text-zinc-400 mb-2">
              {selectedPersona?.name} says:
            </p>
            <p className="text-zinc-200">{testResult}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((persona) => (
          <div key={persona.id} className="card hover:border-zinc-700 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Ghost className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{persona.name}</h3>
                <p className="text-sm text-zinc-500">@{persona.handle}</p>
                {persona.era && (
                  <p className="text-xs text-zinc-600 mt-1">{persona.era}</p>
                )}
                {persona.occupation && (
                  <p className="text-xs text-zinc-600">{persona.occupation}</p>
                )}
              </div>
            </div>
            
            <p className="text-sm text-zinc-400 mt-4 line-clamp-2">{persona.style}</p>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleGenerate(persona)}
                disabled={generating || !testTopic.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {generating && selectedPersona?.id === persona.id ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {personas.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Ghost className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No personas yet. Run the seed script to add some!</p>
          <code className="text-xs bg-zinc-800 px-2 py-1 rounded mt-2 inline-block">
            npm run db:seed
          </code>
        </div>
      )}
    </div>
  )
}
