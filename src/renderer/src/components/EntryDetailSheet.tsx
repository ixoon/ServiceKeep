import { useEffect, useState, type FormEvent } from 'react'
import { Archive, Loader2, Pencil, RotateCcw, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  ENTRY_CATEGORIES,
  type EntryCategory,
  type EntryImage,
  type ServiceEntry
} from '../../../shared/types'
import PhotoDocumentation from '@/components/PhotoDocumentation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { getApi } from '@/lib/api'
import { confirmPermanentDelete } from '@/lib/confirmDelete'
import { formatCategory, formatDate, formatEur, formatKm } from '@/lib/format'

interface Props {
  entryId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: () => Promise<void>
  initialEdit?: boolean
}

export default function EntryDetailSheet({
  entryId,
  open,
  onOpenChange,
  onChanged,
  initialEdit = false
}: Props) {
  const [entry, setEntry] = useState<ServiceEntry | null>(null)
  const [images, setImages] = useState<EntryImage[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    category: 'oil' as EntryCategory,
    title: '',
    comment: '',
    costEur: '',
    odometerKm: '',
    performedAt: '',
    nextDueDate: '',
    nextDueKm: ''
  })

  async function loadEntry(id: number) {
    setLoading(true)
    try {
      const api = getApi()
      const [loaded, imageList] = await Promise.all([api.getEntry(id), api.listImages(id)])
      if (!loaded) {
        setEntry(null)
        return
      }
      setEntry(loaded)
      setImages(imageList)
      setForm({
        category: loaded.category,
        title: loaded.title,
        comment: loaded.comment ?? '',
        costEur: loaded.costEur?.toString() ?? '',
        odometerKm: loaded.odometerKm?.toString() ?? '',
        performedAt: loaded.performedAt.slice(0, 10),
        nextDueDate: loaded.nextDueDate?.slice(0, 10) ?? '',
        nextDueKm: loaded.nextDueKm?.toString() ?? ''
      })
      setEditing(initialEdit && loaded.archivedAt == null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && entryId != null) {
      void loadEntry(entryId)
    } else if (!open) {
      setEntry(null)
      setImages([])
      setEditing(false)
    }
  }, [open, entryId, initialEdit])

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!entry) return

    if (!form.title.trim()) {
      toast.error('Title is required.')
      return
    }

    setSaving(true)
    try {
      const updated = await getApi().updateEntry(entry.id, {
        category: form.category,
        title: form.title.trim(),
        comment: form.comment || null,
        costEur: form.costEur ? Number(form.costEur) : null,
        odometerKm: form.odometerKm ? Number(form.odometerKm) : null,
        performedAt: new Date(form.performedAt).toISOString(),
        nextDueDate: form.nextDueDate ? new Date(form.nextDueDate).toISOString() : null,
        nextDueKm: form.nextDueKm ? Number(form.nextDueKm) : null
      })
      setEntry(updated)
      setEditing(false)
      toast.success('Entry updated')
      await onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update entry.')
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive() {
    if (!entry) return
    await getApi().archiveEntry(entry.id)
    toast.success('Entry archived')
    onOpenChange(false)
    await onChanged()
  }

  async function handleRestore() {
    if (!entry) return
    await getApi().restoreEntry(entry.id)
    toast.success('Entry restored')
    onOpenChange(false)
    await onChanged()
  }

  async function handleDeletePermanent() {
    if (!entry) return
    if (!confirmPermanentDelete(`"${entry.title}"`, 'Photos attached to this entry will also be removed.')) {
      return
    }
    await getApi().deleteEntryPermanent(entry.id)
    toast.success('Entry deleted')
    onOpenChange(false)
    await onChanged()
  }

  const isArchived = entry?.archivedAt != null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 border-b px-4 py-4">
          <div className="flex items-start justify-between gap-2 pr-8">
            <div className="min-w-0 space-y-1">
              <SheetTitle className="truncate">{entry?.title ?? 'Entry details'}</SheetTitle>
              <SheetDescription>
                {entry ? formatCategory(entry.category) : 'Loading entry…'}
              </SheetDescription>
            </div>
            {entry && !editing ? (
              <div className="flex shrink-0 gap-1">
                {!isArchived ? (
                  <>
                    <Button variant="outline" size="icon-sm" onClick={() => setEditing(true)} title="Edit">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => void handleArchive()} title="Archive">
                      <Archive className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void handleDeletePermanent()}
                      title="Delete entry"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => void handleRestore()}
                      title="Restore"
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void handleDeletePermanent()}
                      title="Delete permanently"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-6 px-4 py-4 pb-8">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </div>
            ) : !entry ? (
              <p className="text-sm text-muted-foreground">Entry not found.</p>
            ) : editing ? (
              <form className="space-y-4" onSubmit={handleSave}>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, category: value as EntryCategory }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTRY_CATEGORIES.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detail-title">Title</Label>
                  <Input
                    id="detail-title"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="detail-performedAt">Performed on</Label>
                    <Input
                      id="detail-performedAt"
                      type="date"
                      value={form.performedAt}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, performedAt: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail-odometerKm">Odometer (km)</Label>
                    <Input
                      id="detail-odometerKm"
                      type="number"
                      min="0"
                      value={form.odometerKm}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, odometerKm: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail-costEur">Cost (EUR)</Label>
                    <Input
                      id="detail-costEur"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.costEur}
                      onChange={(e) => setForm((prev) => ({ ...prev, costEur: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail-nextDueDate">Next due date</Label>
                    <Input
                      id="detail-nextDueDate"
                      type="date"
                      value={form.nextDueDate}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, nextDueDate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="detail-nextDueKm">Next due km</Label>
                    <Input
                      id="detail-nextDueKm"
                      type="number"
                      min="0"
                      value={form.nextDueKm}
                      onChange={(e) => setForm((prev) => ({ ...prev, nextDueKm: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detail-comment">Comment</Label>
                  <Textarea
                    id="detail-comment"
                    value={form.comment}
                    onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                    <X className="size-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                {isArchived ? (
                  <Badge variant="outline" className="text-muted-foreground">
                    Archived {formatDate(entry.archivedAt)}
                  </Badge>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{formatCategory(entry.category)}</Badge>
                  <Badge variant="outline">{formatEur(entry.costEur)}</Badge>
                </div>

                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Performed</dt>
                    <dd className="font-medium">{formatDate(entry.performedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Odometer</dt>
                    <dd className="font-medium">{formatKm(entry.odometerKm)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Next due date</dt>
                    <dd className="font-medium">{formatDate(entry.nextDueDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Next due km</dt>
                    <dd className="font-medium">{formatKm(entry.nextDueKm)}</dd>
                  </div>
                </dl>

                {entry.comment ? (
                  <div>
                    <p className="mb-1 text-sm text-muted-foreground">Comment</p>
                    <p className="text-sm whitespace-pre-wrap">{entry.comment}</p>
                  </div>
                ) : null}

                {isArchived ? (
                  <div className="flex flex-col gap-2">
                    <Button variant="default" className="w-full gap-2" onClick={() => void handleRestore()}>
                      <RotateCcw className="size-4" />
                      Restore entry
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      onClick={() => void handleDeletePermanent()}
                    >
                      <Trash2 className="size-4" />
                      Delete permanently
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full gap-2" onClick={() => setEditing(true)}>
                      <Pencil className="size-4" />
                      Edit entry
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      onClick={() => void handleDeletePermanent()}
                    >
                      <Trash2 className="size-4" />
                      Delete entry
                    </Button>
                  </div>
                )}
              </>
            )}

            {entry ? (
              <PhotoDocumentation
                entryId={entry.id}
                images={images}
                editable={!isArchived}
                onChanged={() => void loadEntry(entry.id)}
              />
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
