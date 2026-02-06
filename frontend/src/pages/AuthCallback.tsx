import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const error = params.get('error')
      const errorDescription = params.get('error_description')

      if (error) {
        setStatus('error')
        setMessage(errorDescription || error)
        return
      }

      if (!code) {
        setStatus('error')
        setMessage('No authorization code received')
        return
      }

      try {
        const redirectUri = `${window.location.origin}/auth/callback`
        
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://backend-production-e024.up.railway.app')}/api/threads/auth/callback`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirect_uri: redirectUri })
          }
        )

        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage(`Connected as ${data.account.name}!`)
          
          // Redirect to settings after 2 seconds
          setTimeout(() => {
            window.location.href = '/'
          }, 2000)
        } else {
          setStatus('error')
          setMessage(data.message || 'Failed to connect account')
        }
      } catch (err) {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Connection failed')
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center p-4">
      <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto text-[rgb(var(--primary))] animate-spin" />
            <h1 className="text-xl font-semibold mt-4">Connecting to Threads...</h1>
            <p className="text-[rgb(var(--muted-foreground))] mt-2">Please wait</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-500" />
            <h1 className="text-xl font-semibold mt-4">Connected!</h1>
            <p className="text-[rgb(var(--muted-foreground))] mt-2">{message}</p>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mt-4">Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-red-500" />
            <h1 className="text-xl font-semibold mt-4">Connection Failed</h1>
            <p className="text-[rgb(var(--muted-foreground))] mt-2">{message}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-6 px-4 py-2 bg-[rgb(var(--primary))] text-white rounded-lg hover:opacity-90"
            >
              Back to App
            </button>
          </>
        )}
      </div>
    </div>
  )
}
