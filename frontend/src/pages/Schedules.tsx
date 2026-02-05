import { useEffect, useState } from 'react'
import { Calendar, Clock, Plus, Trash2, Power, PowerOff } from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Skeleton, EmptyState, Select } from '../components/ui'
import { cn } from '../lib/utils'

interface Schedule {
  id: string
  personaId: string
  accountId: string
  postsPerDay: number
  postingTimes: string[]
  timezone: string
  autoApprove: boolean
  active: boolean
  persona: { id: string; name: string; handle: string }
  account: { id: string; name: string }
}

export default function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [personas, setPersonas] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    personaId: '',
    accountId: '',
    postsPerDay: 3,
    autoApprove: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [schedulesData, personasData, accountsData] = await Promise.all([
        api.getSchedules(),
        api.getPersonas(),
        api.getAccounts()
      ])
      setSchedules(schedulesData)
      setPersonas(personasData)
      setAccounts(accountsData)
    } catch (error) {
      toast.error('Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await api.toggleSchedule(id)
      await loadData()
      toast.success('Schedule updated')
    } catch (error) {
      toast.error('Failed to toggle schedule')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this schedule?')) return
    try {
      await api.deleteSchedule(id)
      await loadData()
      toast.success('Schedule deleted')
    } catch (error) {
      toast.error('Failed to delete schedule')
    }
  }

  const handleCreate = async () => {
    if (!newSchedule.personaId || !newSchedule.accountId) {
      toast.error('Select persona and account')
      return
    }
    try {
      await api.createSchedule(newSchedule)
      await loadData()
      setShowCreate(false)
      setNewSchedule({ personaId: '', accountId: '', postsPerDay: 3, autoApprove: false })
      toast.success('Schedule created')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create schedule')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
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
            <Calendar className="w-7 h-7 text-[rgb(var(--primary))]" />
            Schedules
          </h1>
          <p className="text-[rgb(var(--muted-foreground))] mt-1 text-sm sm:text-base">
            Automated posting schedules for your personas
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          New Schedule
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="border-[rgb(var(--primary))/0.3] animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">Create Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Persona</label>
                <Select
                  value={newSchedule.personaId}
                  onChange={(e) => setNewSchedule({ ...newSchedule, personaId: e.target.value })}
                >
                  <option value="">Select persona...</option>
                  {personas.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Threads Account</label>
                <Select
                  value={newSchedule.accountId}
                  onChange={(e) => setNewSchedule({ ...newSchedule, accountId: e.target.value })}
                >
                  <option value="">Select account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Posts per day</label>
                <Select
                  value={newSchedule.postsPerDay.toString()}
                  onChange={(e) => setNewSchedule({ ...newSchedule, postsPerDay: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} post{n > 1 ? 's' : ''}/day</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Auto-approve?</label>
                <Select
                  value={newSchedule.autoApprove ? 'yes' : 'no'}
                  onChange={(e) => setNewSchedule({ ...newSchedule, autoApprove: e.target.value === 'yes' })}
                >
                  <option value="no">No - Manual approval</option>
                  <option value="yes">Yes - Auto publish</option>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate}>Create Schedule</Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12" />}
          title="No schedules yet"
          description="Create a schedule to automatically generate and publish posts"
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />
              Create Schedule
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule, index) => (
            <Card 
              key={schedule.id}
              className={cn(
                'animate-fade-in',
                !schedule.active && 'opacity-60'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{schedule.persona.name}</h3>
                      <Badge variant={schedule.active ? 'success' : 'secondary'}>
                        {schedule.active ? 'Active' : 'Paused'}
                      </Badge>
                      {schedule.autoApprove && (
                        <Badge variant="warning">Auto-publish</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[rgb(var(--muted-foreground))] mt-1">
                      @{schedule.persona.handle} → {schedule.account.name}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-[rgb(var(--muted-foreground))]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {schedule.postsPerDay} posts/day
                      </span>
                      <span>
                        at {schedule.postingTimes.join(', ')} UTC
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleToggle(schedule.id)}
                      className={cn(
                        'h-10 w-10',
                        schedule.active ? 'text-emerald-500 hover:text-emerald-400' : 'text-[rgb(var(--muted-foreground))]'
                      )}
                      title={schedule.active ? 'Pause' : 'Activate'}
                    >
                      {schedule.active ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(schedule.id)}
                      className="h-10 w-10 text-[rgb(var(--muted-foreground))] hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
