import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Loader2, Search, Wrench } from 'lucide-react'
import type { SearchHit } from '../../../shared/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getApi } from '@/lib/api'
import { formatCategory, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GlobalSearchDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setHits([])
      setActiveIndex(0)
      return
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return

    const trimmed = query.trim()
    if (trimmed.length < 1) {
      setHits([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const results = await getApi().searchGarage(trimmed)
          if (!cancelled) {
            setHits(results)
            setActiveIndex(0)
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }, 180)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, open])

  const vehicles = useMemo(() => hits.filter((hit) => hit.type === 'vehicle'), [hits])
  const entries = useMemo(() => hits.filter((hit) => hit.type === 'entry'), [hits])
  const flat = useMemo(() => [...vehicles, ...entries], [vehicles, entries])

  function selectHit(hit: SearchHit) {
    onOpenChange(false)
    if (hit.type === 'vehicle') {
      navigate(`/vehicles/${hit.vehicleId}`)
      return
    }
    navigate(`/vehicles/${hit.vehicleId}?entry=${hit.id}`)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (flat.length === 0 ? 0 : (prev + 1) % flat.length))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => (flat.length === 0 ? 0 : (prev - 1 + flat.length) % flat.length))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const hit = flat[activeIndex]
      if (hit) selectHit(hit)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton={false}>
        <DialogTitle className="sr-only">Search garage</DialogTitle>
        <DialogDescription className="sr-only">
          Search entries by title, comment, or part number, and vehicles by VIN or plate.
        </DialogDescription>

        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search titles, comments, part numbers, VIN…"
            className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          {loading ? <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" /> : null}
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim().length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Try “oil filter”, a part number, or a license plate.
            </p>
          ) : flat.length === 0 && !loading ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">No matches.</p>
          ) : (
            <div className="space-y-3">
              {vehicles.length > 0 ? (
                <section>
                  <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Vehicles
                  </p>
                  {vehicles.map((hit) => {
                    const index = flat.indexOf(hit)
                    return (
                      <SearchRow
                        key={`vehicle-${hit.id}`}
                        icon={Car}
                        title={hit.title}
                        subtitle={hit.snippet}
                        active={index === activeIndex}
                        onClick={() => selectHit(hit)}
                      />
                    )
                  })}
                </section>
              ) : null}

              {entries.length > 0 ? (
                <section>
                  <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Entries
                  </p>
                  {entries.map((hit) => {
                    const index = flat.indexOf(hit)
                    return (
                      <SearchRow
                        key={`entry-${hit.id}`}
                        icon={Wrench}
                        title={hit.title}
                        subtitle={[
                          hit.vehicleName,
                          hit.category ? formatCategory(hit.category) : null,
                          formatDate(hit.performedAt)
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                        snippet={hit.snippet}
                        active={index === activeIndex}
                        onClick={() => selectHit(hit)}
                      />
                    )
                  })}
                </section>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SearchRow({
  icon: Icon,
  title,
  subtitle,
  snippet,
  active,
  onClick
}: {
  icon: typeof Car
  title: string
  subtitle?: string | null
  snippet?: string | null
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left',
        active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/60'
      )}
      onClick={onClick}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{title}</span>
        {subtitle ? (
          <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
        {snippet ? (
          <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">{snippet}</span>
        ) : null}
      </span>
    </button>
  )
}
