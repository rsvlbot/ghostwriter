import { useEffect, useState } from 'react'
import { ExternalLink, CheckCircle, XCircle, Zap, Users, Trash2, Brain, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Skeleton, Badge } from '../components/ui'
import { cn } from '../lib/utils'

export default function Settings() {
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [threadsStatus, setThreadsStatus] = useState<any>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [aiStatus, setAiStatus] = useState<{ connected: boolean; model?: string; error?: string } | null>(null)
  const [testingAI, setTestingAI] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [systemData, threadsData, accountsData] = await Promise.all([
        api.getSystemInfo(),
        api.getThreadsStatus(),
        api.getAccounts(),
      ])
      setSystemInfo(systemData)
      setThreadsStatus(threadsData)
      setAccounts(accountsData)
    } catch (error) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async (accountId: string, accountName: string) => {
    if (!confirm(`Disconnect ${accountName}?`)) return
    try {
      await api.disconnectAccount(accountId)
      toast.success('Account disconnected')
      loadData()
    } catch (error) {
      toast.error('Failed to disconnect')
    }
  }

  const handleTestAI = async () => {
    setTestingAI(true)
    try {
      const result = await api.testAI()
      setAiStatus(result)
      if (result.connected) {
        toast.success('AI connected!')
      } else {
        toast.error(result.error || 'AI not connected')
      }
    } catch (error) {
      setAiStatus({ connected: false, error: 'Test failed' })
      toast.error('Failed to test AI')
    } finally {
      setTestingAI(false)
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
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-1 text-sm sm:text-base">
          Configure your Ghostwriter instance
        </p>
      </div>

      {/* AI Connection Status */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className={cn(
                "p-2 sm:p-2.5 rounded-lg sm:rounded-xl shadow-lg",
                systemInfo?.ai?.configured 
                  ? "bg-gradient-to-br from-emerald-500 to-teal-500" 
                  : "bg-neutral-800 border border-neutral-700"
              )}>
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Claude AI</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Anthropic API connection</CardDescription>
              </div>
            </div>
            {systemInfo?.ai?.configured ? (
              <Badge variant="success" className="flex items-center gap-1 self-start sm:self-auto">
                <CheckCircle className="w-3.5 h-3.5" />
                Key Added
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1 self-start sm:self-auto">
                <XCircle className="w-3.5 h-3.5" />
                Not Configured
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2 sm:pt-0 space-y-4">
          {!systemInfo?.ai?.configured ? (
            <div className="p-3 sm:p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-400">
                Set <code className="px-1 py-0.5 rounded bg-[rgb(var(--muted))] text-xs">ANTHROPIC_API_KEY</code> in your environment to enable AI features.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {aiStatus && (
                <div className={cn(
                  "p-3 rounded-lg border",
                  aiStatus.connected 
                    ? "bg-emerald-500/10 border-emerald-500/20" 
                    : "bg-red-500/10 border-red-500/20"
                )}>
                  {aiStatus.connected ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Connected to {aiStatus.model}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">{aiStatus.error}</span>
                    </div>
                  )}
                </div>
              )}
              <Button
                variant="secondary"
                onClick={handleTestAI}
                disabled={testingAI}
                className="w-full sm:w-auto h-11 sm:h-10"
              >
                {testingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Threads Accounts */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Threads Accounts</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
                </CardDescription>
              </div>
            </div>
            {threadsStatus?.configured ? (
              <Badge variant="success" className="flex items-center gap-1 self-start sm:self-auto">
                <CheckCircle className="w-3.5 h-3.5" />
                API Ready
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1 self-start sm:self-auto">
                <XCircle className="w-3.5 h-3.5" />
                Not Configured
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2 sm:pt-0 space-y-4">
          {!threadsStatus?.configured && (
            <div className="p-3 sm:p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-400">
                Set <code className="px-1 py-0.5 rounded bg-[rgb(var(--muted))] text-xs">THREADS_APP_ID</code> and{' '}
                <code className="px-1 py-0.5 rounded bg-[rgb(var(--muted))] text-xs">THREADS_APP_SECRET</code> in your environment.
              </p>
            </div>
          )}

          {/* Connected accounts list */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--muted))/0.5] border border-[rgb(var(--border))]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                      {account.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">@{account.name}</p>
                      <p className="text-xs text-[rgb(var(--muted-foreground))]">
                        {account.threadsUserId ? `ID: ${account.threadsUserId}` : 'Not linked'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.threadsUserId ? (
                      <Badge variant="success" className="text-xs hidden sm:flex">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Disconnected
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(account.id, account.name)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add account button */}
          <div className="pt-2 border-t border-[rgb(var(--border))]">
            <Button
              variant="secondary"
              onClick={handleConnectThreads}
              disabled={!threadsStatus?.configured}
              className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation"
            >
              <ExternalLink className="w-4 h-4" />
              {accounts.length === 0 ? 'Connect Threads Account' : 'Add Another Account'}
            </Button>
            <p className="text-xs text-[rgb(var(--muted-foreground))] mt-2">
              💡 To add a different account, log out of Threads first or use incognito mode
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-neutral-800 border border-neutral-700">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[rgb(var(--primary))]" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">System Info</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Runtime and statistics</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2 sm:pt-0">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              { label: 'Version', value: systemInfo?.version || '-' },
              { label: 'Node', value: systemInfo?.nodeVersion || '-' },
              { label: 'Personas', value: systemInfo?.stats?.personas || 0 },
              { label: 'Total Posts', value: systemInfo?.stats?.posts || 0 },
              { 
                label: 'AI', 
                value: systemInfo?.ai?.configured ? '✅ Yes' : '❌ No',
                highlight: systemInfo?.ai?.configured
              },
              { 
                label: 'Uptime', 
                value: systemInfo?.uptime ? `${Math.floor(systemInfo.uptime / 60)}m` : '-' 
              },
            ].map((item) => (
              <div 
                key={item.label} 
                className={cn(
                  'p-2.5 sm:p-3 rounded-lg bg-[rgb(var(--muted))/0.5]',
                  item.highlight && 'bg-emerald-500/10 border border-emerald-500/20'
                )}
              >
                <span className="text-[10px] sm:text-xs text-[rgb(var(--muted-foreground))] uppercase tracking-wider">
                  {item.label}
                </span>
                <p className="font-medium mt-0.5 text-sm sm:text-base">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
