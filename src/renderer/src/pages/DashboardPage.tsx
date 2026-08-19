import { useEffect, useMemo, useState } from 'react'
import { Bell, Car, RefreshCw, Receipt, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReminderItem, ServiceEntry, Vehicle } from '../../../shared/types'
import EmptyState from '../components/EmptyState'
import EntryDetailSheet from '../components/EntryDetailSheet'
import EntryFormSheet from '../components/EntryFormSheet'
import OverdueBanner from '../components/OverdueBanner'
import PageHeader from '../components/PageHeader'
import QuickAddBar from '../components/QuickAddBar'
import QuickKmBar from '../components/QuickKmBar'
import StatCard from '../components/StatCard'
import VehicleSwitcher from '../components/VehicleSwitcher'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { getApi } from '@/lib/api'
import { formatCategory, formatDate, formatEur, formatKm } from '@/lib/format'
import type { EntryTemplate } from '@/lib/entryTemplates'
import { findEntryTemplate } from '@/lib/entryTemplates'

interface Props {
  vehicles: Vehicle[]
  activeVehicleId: number | null
  onSelectVehicle: (id: number | null) => void
  onRefresh: () => Promise<void>
  overdueCount: number
  dueCount: number
}

export default function DashboardPage({
  vehicles,
  activeVehicleId,
  onSelectVehicle,
  onRefresh,
  overdueCount,
  dueCount
}: Props) {
  const [entries, setEntries] = useState<ServiceEntry[]>([])
  const [reminders, setReminders] = useState<ReminderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [detailEntryId, setDetailEntryId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [entryFormOpen, setEntryFormOpen] = useState(false)
  const [entryTemplateId, setEntryTemplateId] = useState<string | null>(null)

  const activeVehicle = vehicles.find((vehicle) => vehicle.id === activeVehicleId) ?? null

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const api = getApi()
        const [entryList, reminderList] = await Promise.all([
          api.listEntries(activeVehicleId ?? undefined),
          api.listReminders()
        ])
        setEntries(entryList)
        setReminders(
          activeVehicleId == null
            ? reminderList
            : reminderList.filter((item) => item.vehicleId === activeVehicleId)
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [activeVehicleId, vehicles])

  const totalSpend = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.costEur ?? 0), 0),
    [entries]
  )

  const dueItems = reminders.filter((item) => item.isDue)

  function openEntryDetail(entryId: number) {
    setDetailEntryId(entryId)
    setDetailOpen(true)
  }

  function openQuickAdd(template?: EntryTemplate) {
    if (!activeVehicle) return
    setEntryTemplateId(template?.id ?? null)
    setEntryFormOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your vehicles, recent work, and due reminders."
        actions={
          <Button variant="outline" size="sm" className="gap-2" onClick={() => void onRefresh()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />

      <OverdueBanner overdueCount={overdueCount} dueCount={dueCount} />

      <VehicleSwitcher
        vehicles={vehicles}
        activeVehicleId={activeVehicleId}
        onSelect={onSelectVehicle}
      />

      <QuickKmBar vehicle={activeVehicle} onUpdated={onRefresh} />

      <QuickAddBar
        vehicle={activeVehicle}
        onSelectTemplate={(template) => openQuickAdd(template)}
        onOther={() => openQuickAdd()}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active vehicles" value={vehicles.length} icon={Car} />
        <StatCard label="Logged spend" value={formatEur(totalSpend)} icon={Receipt} />
        <StatCard label="Due reminders" value={dueItems.length} icon={Bell} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent entries</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : entries.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="No entries yet"
                description="Use quick add above or open Entries to log your first service."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.slice(0, 6).map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer"
                      onClick={() => openEntryDetail(entry.id)}
                    >
                      <TableCell className="whitespace-nowrap">{formatDate(entry.performedAt)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{entry.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCategory(entry.category)} · {formatKm(entry.odometerKm)}
                        </div>
                      </TableCell>
                      <TableCell>{formatEur(entry.costEur)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Needs attention</CardTitle>
            {dueItems.length > 0 ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/reminders">View all</Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : dueItems.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="All clear"
                description="No reminders are due right now. Set next due date or km on an entry."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueItems.slice(0, 6).map((item) => (
                    <TableRow
                      key={item.entryId}
                      className="cursor-pointer"
                      onClick={() => openEntryDetail(item.entryId)}
                    >
                      <TableCell>
                        <Link
                          to={`/vehicles/${item.vehicleId}`}
                          className="hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {item.vehicleName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(item.nextDueDate)} · {formatKm(item.nextDueKm)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isOverdue ? 'destructive' : 'secondary'}>
                          {item.isOverdue ? 'Overdue' : 'Due'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <EntryFormSheet
        open={entryFormOpen}
        onOpenChange={setEntryFormOpen}
        vehicles={vehicles}
        vehicle={activeVehicle}
        initialTemplate={entryTemplateId ? findEntryTemplate(entryTemplateId) ?? null : null}
        onSaved={(entryId) => {
          openEntryDetail(entryId)
          void onRefresh()
        }}
        onChange={onRefresh}
      />

      <EntryDetailSheet
        entryId={detailEntryId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onChanged={onRefresh}
      />
    </div>
  )
}
