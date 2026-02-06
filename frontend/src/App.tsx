import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Personas from './pages/Personas'
import Posts from './pages/Posts'
import Trends from './pages/Trends'
import Schedules from './pages/Schedules'
import Settings from './pages/Settings'
import AuthCallback from './pages/AuthCallback'

type Page = 'dashboard' | 'personas' | 'posts' | 'trends' | 'schedules' | 'settings'

// Simple router check
const isAuthCallback = window.location.pathname === '/auth/callback'

function MainApp() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'personas':
        return <Personas />
      case 'posts':
        return <Posts />
      case 'trends':
        return <Trends />
      case 'schedules':
        return <Schedules />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex min-h-screen bg-[rgb(var(--background))]">
      <Toaster 
        position="top-center"
        containerClassName="!top-16 md:!top-4"
        toastOptions={{
          style: {
            background: 'rgb(var(--card))',
            color: 'rgb(var(--foreground))',
            border: '1px solid rgb(var(--border))',
            borderRadius: '0.75rem',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
          },
        }}
      />
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      
      {/* Main content with mobile header offset */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

function App() {
  if (isAuthCallback) {
    return <AuthCallback />
  }
  return <MainApp />
}

export default App
