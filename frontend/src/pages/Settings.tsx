import { useEffect, useState } from 'react'
import { Save, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function Settings() {
  const [settings, setSettings] = useState<any>(null)
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [threadsStatus, setThreadsStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [settingsData, systemData, threadsData] = await Promise.all([
        api.getSettings(),
        api.getSystemInfo(),
        api.getThreadsStatus(),
      ])
      setSettings(settingsData)
      setSystemInfo(systemData)
      setThreadsStatus(threadsData)
    } catch (error) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateSettings({
        aiModel: settings.aiModel,
        aiTemp: settings.aiTemp,
      })
      toast.success('Settings saved')
    } catch (error) {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleConnectThreads = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/callback`
      const { url } = await api.getAuthUrl(redirectUri)
      window.open(url, '_blank')
    } catch (error) {
      toast.error('Failed to get auth URL. Check Threads credentials.')
    }
  }

  if (loading) {
    return <div className="text-zinc-500">Loading...</div>
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-zinc-500">Configure your Ghostwriter instance</p>
      </div>

      {/* AI Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">AI Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Model</label>
            <select
              className="input w-full"
              value={settings?.aiModel || ''}
              onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
            >
              {settings?.availableModels?.map((model: any) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Temperature: {settings?.aiTemp?.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={settings?.aiTemp || 0.8}
              onChange={(e) => setSettings({ ...settings, aiTemp: parseFloat(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-zinc-600 mt-1">
              Lower = more focused, Higher = more creative
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Threads Connection */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Threads Connection</h2>
        
        <div className="flex items-center gap-3 mb-4">
          {threadsStatus?.configured ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-500">API Configured</span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-500">Not Configured</span>
            </>
          )}
        </div>

        {!threadsStatus?.configured && (
          <p className="text-sm text-zinc-500 mb-4">
            Set THREADS_APP_ID and THREADS_APP_SECRET in your environment variables.
          </p>
        )}

        <button
          onClick={handleConnectThreads}
          disabled={!threadsStatus?.configured}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          <ExternalLink className="w-4 h-4" />
          Connect Threads Account
        </button>
      </div>

      {/* System Info */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">System Info</h2>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-zinc-500">Version</span>
            <p>{systemInfo?.version || '-'}</p>
          </div>
          <div>
            <span className="text-zinc-500">Node</span>
            <p>{systemInfo?.nodeVersion || '-'}</p>
          </div>
          <div>
            <span className="text-zinc-500">Personas</span>
            <p>{systemInfo?.stats?.personas || 0}</p>
          </div>
          <div>
            <span className="text-zinc-500">Total Posts</span>
            <p>{systemInfo?.stats?.posts || 0}</p>
          </div>
          <div>
            <span className="text-zinc-500">AI Configured</span>
            <p>{systemInfo?.ai?.configured ? '✅ Yes' : '❌ No'}</p>
          </div>
          <div>
            <span className="text-zinc-500">Uptime</span>
            <p>{systemInfo?.uptime ? `${Math.floor(systemInfo.uptime / 60)} min` : '-'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
