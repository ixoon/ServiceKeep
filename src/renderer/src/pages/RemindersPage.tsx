import { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCircle2, Clock, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { ReminderItem, ReminderStatusFilter, Vehicle } from '../../../shared/types'
import EmptyState from '../components/EmptyState'
import EntryFormSheet from '../components/EntryFormSheet'
import PageHeader from '../components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { getApi } from '@/lib/api'
import { formatCategory, formatDate, formatKm } from '@/lib/format'
import { findEntryTemplate } from '@/lib/entryTemplates'
import { filterReminders, getReminderStatus, sortReminders } from '@/lib/reminderFilters'

interface Props {
  vehicles: Vehicle[]
  onChange: () => Promise<void>
}

export default function RemindersPage({ vehicles, onChange }: Props) {
  const [reminders, setReminders] = useState<ReminderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ReminderStatusFilter>('all')
  const [vehicleFilter, setVehicleFilter] = useState<string>('all')

  const [entryFormOpen, setEntryFormOpen] = useState(false)
  const [completeReminderEntryId, setCompleteReminderEntryId] = useState<number | null>(null)
  const [entryTemplateId, setEntryTemplateId] = useState<string | null>(null)
  const [entryVehicle, setEntryVehicle] = useState<Vehicle | null>(null)

  async function load() {
    setLoading(true)
    try {
      setReminders(await getApi().listReminders())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    let items = filterReminders(reminders, statusFilter)
    if (vehicleFilter !== 'all') {
      items = items.filter((item) => item.vehicleId === Number(vehicleFilter))
    }
    return sortReminders(items)
  }, [reminders, statusFilter, vehicleFilter])

  const counts = useMemo(
    () => ({
      overdue: reminders.filter((item) => getReminderStatus(item) === 'overdue').length,
      due: reminders.filter((item) => getReminderStatus(item) === 'due').length,
      upcoming: reminders.filter((item) => getReminderStatus(item) === 'upcoming').length
    }),
    [reminders]
  )

  function openMarkDone(item: ReminderItem) {
    const vehicle = vehicles.find((v) => v.id === item.vehicleId) ?? null
    setEntryVehicle(vehicle)
    setCompleteReminderEntryId(item.entryId)
    const templateId =
      item.category === 'oil'
        ? 'oil'
        : item.category === 'small_service' || item.category === 'big_service'
          ? item.category
          : item.category === 'parts'
            ? 'parts'
            : null
    setEntryTemplateId(templateId)
    setEntryFormOpen(true)
  }

  async function handleSnooze(entryId: number, options: { days?: number; km?: number }) {
    try {
      await getApi().snoozeReminder(entryId, options)
      toast.success('Reminder snoozed')
      await load()
      await onChange()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not snooze reminder.')
    }
  }

  async function handleDismiss(entryId: number) {
    try {
      await getApi().clearReminder(entryId)
      toast.success('Reminder cleared')
      await load()
      await onChange()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not clear reminder.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Reminders"
        description="Manual next-due date and/or km from your entries. Due when either threshold is reached."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={async () => {
                const path = await getApi().exportRemindersCsv()
                if (path) toast.success('Reminders exported', { description: path })
              }}
            >
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => void load()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['all', `All (${reminders.length})`],
            ['overdue', `Overdue (${counts.overdue})`],
            ['due', `Due (${counts.due})`],
            ['upcoming', `Upcoming (${counts.upcoming})`]
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            variant={statusFilter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Vehicle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All vehicles</SelectItem>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                {vehicle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All reminders</CardTitle>
          <CardDescription>
            {counts.overdue + counts.due > 0
              ? `${counts.overdue + counts.due} item${counts.overdue + counts.due === 1 ? '' : 's'} need attention.`
              : 'Nothing is due right now.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No reminders in this view"
              description="Try another filter or log an entry with a next due date or km."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Due km</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.entryId}>
                    <TableCell>{item.vehicleName}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCategory(item.category)}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(item.nextDueDate)}</TableCell>
                    <TableCell>{formatKm(item.nextDueKm)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.isOverdue
                            ? 'destructive'
                            : item.isDue
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {item.isOverdue ? 'Overdue' : item.isDue ? 'Due' : 'Upcoming'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => openMarkDone(item)}
                        >
                          <CheckCircle2 className="size-3.5" />
                          Mark done
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => void handleSnooze(item.entryId, { days: 30 })}
                        >
                          <Clock className="size-3.5" />
                          +30d
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleSnooze(item.entryId, { km: 1000 })}
                        >
                          +1000 km
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDismiss(item.entryId)}
                        >
                          Clear
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EntryFormSheet
        open={entryFormOpen}
        onOpenChange={(open) => {
          setEntryFormOpen(open)
          if (!open) {
            setCompleteReminderEntryId(null)
            setEntryTemplateId(null)
          }
        }}
        vehicles={vehicles}
        vehicle={entryVehicle}
        initialTemplate={entryTemplateId ? findEntryTemplate(entryTemplateId) ?? null : null}
        completeReminderEntryId={completeReminderEntryId}
        onSaved={() => {
          void load()
        }}
        onChange={async () => {
          await onChange()
          await load()
        }}
      />
    </div>
  )
}
