import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { AppSettings, Vehicle } from '../../shared/types'
import AppLogo from './components/AppLogo'
import AppShell from './components/AppShell'
import BackupReminderBanner from './components/BackupReminderBanner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { getApi, hasApi } from './lib/api'
import { countReminders } from './lib/reminders'
import { applyTheme } from './lib/theme'
import DashboardPage from './pages/DashboardPage'
import EntriesPage from './pages/EntriesPage'
import RemindersPage from './pages/RemindersPage'
import SettingsPage from './pages/SettingsPage'
import SetupPage from './pages/SetupPage'
import OnboardingPage from './pages/OnboardingPage'
import VehiclesPage from './pages/VehiclesPage'
import VehicleDetailPage from './pages/VehicleDetailPage'
import ReportsPage from './pages/ReportsPage'

export default function App() {
  const navigate = useNavigate()
  const [bootstrapping, setBootstrapping] = useState(true)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [reminderCounts, setReminderCounts] = useState({ overdue: 0, due: 0 })
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    const api = getApi()
    const init = await api.initIfConfigured()
    setSettings(init.settings)
    applyTheme(init.settings.theme)

    if (init.ready) {
      const [list, reminders] = await Promise.all([
        api.listVehicles(false),
        api.listReminders()
      ])
      setVehicles(list)
      const counts = countReminders(reminders)
      setReminderCounts({ overdue: counts.overdue, due: counts.due })
    } else {
      setVehicles([])
      setReminderCounts({ overdue: 0, due: 0 })
    }
  }

  useEffect(() => {
    if (!hasApi()) {
      setError('ServiceKeep must run inside the Electron desktop app.')
      setBootstrapping(false)
      return
    }

    refresh()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to start app.')
      })
      .finally(() => setBootstrapping(false))
  }, [])

  useEffect(() => {
    if (!hasApi()) return
    return getApi().onNavigate((path) => navigate(path))
  }, [navigate])

  async function handleThemeToggle() {
    if (!settings) return
    const next = settings.theme === 'dark' ? 'light' : 'dark'
    const updated = await getApi().setTheme(next)
    setSettings(updated)
    applyTheme(updated.theme)
  }

  async function handleSelectVehicle(id: number | null) {
    const updated = await getApi().setActiveVehicle(id)
    setSettings(updated)
  }

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <AppLogo className="mb-2" />
            <CardTitle>ServiceKeep</CardTitle>
            <CardDescription>Loading your garage…</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Starting app
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not start ServiceKeep</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!settings?.dataPath) {
    return (
      <>
        <SetupPage
          onConfigured={async () => {
            await refresh()
          }}
        />
        <Toaster theme={settings?.theme ?? 'dark'} />
      </>
    )
  }

  if (vehicles.length === 0 && !settings.onboardingComplete) {
    return (
      <>
        <OnboardingPage
          onComplete={async () => {
            await refresh()
          }}
        />
        <Toaster theme={settings.theme} />
      </>
    )
  }

  return (
    <>
      <AppShell
        theme={settings.theme}
        onToggleTheme={handleThemeToggle}
        overdueCount={reminderCounts.overdue}
        dueCount={reminderCounts.due}
      >
        <BackupReminderBanner settings={settings} onSettingsChange={setSettings} />
        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                vehicles={vehicles}
                activeVehicleId={settings.activeVehicleId}
                onSelectVehicle={handleSelectVehicle}
                onRefresh={refresh}
                overdueCount={reminderCounts.overdue}
                dueCount={reminderCounts.due}
              />
            }
          />
          <Route
            path="/vehicles/:id"
            element={
              <VehicleDetailPage
                vehicles={vehicles}
                onSelectVehicle={handleSelectVehicle}
                onChange={refresh}
              />
            }
          />
          <Route
            path="/vehicles"
            element={
              <VehiclesPage
                vehicles={vehicles}
                activeVehicleId={settings.activeVehicleId}
                onSelectVehicle={handleSelectVehicle}
                onChange={refresh}
              />
            }
          />
          <Route
            path="/entries"
            element={
              <EntriesPage
                vehicles={vehicles}
                activeVehicleId={settings.activeVehicleId}
                onSelectVehicle={handleSelectVehicle}
                onChange={refresh}
              />
            }
          />
          <Route
            path="/reports"
            element={
              <ReportsPage
                vehicles={vehicles}
                activeVehicleId={settings.activeVehicleId}
                onSelectVehicle={handleSelectVehicle}
              />
            }
          />
          <Route path="/reminders" element={<RemindersPage vehicles={vehicles} onChange={refresh} />} />
          <Route
            path="/settings"
            element={
              <SettingsPage
                settings={settings}
                onChange={refresh}
                onSettingsChange={setSettings}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
      <Toaster theme={settings.theme} />
    </>
  )
}
