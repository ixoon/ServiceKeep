import { ChevronRight } from 'lucide-react'
import type { ServiceEntry } from '../../../shared/types'
import { Badge } from '@/components/ui/badge'
import { formatCategory, formatDate, formatEur, formatKm } from '@/lib/format'

interface Props {
  entries: ServiceEntry[]
  onSelect: (entryId: number) => void
  limit?: number
}

export default function EntryTimeline({ entries, onSelect, limit }: Props) {
  const items = limit != null ? entries.slice(0, limit) : entries

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No service history yet. Log your first entry to start the timeline.
      </p>
    )
  }

  return (
    <div className="relative space-y-0">
      {items.map((entry, index) => (
        <button
          key={entry.id}
          type="button"
          className="group relative flex w-full gap-4 pb-6 text-left last:pb-0"
          onClick={() => onSelect(entry.id)}
        >
          {index < items.length - 1 ? (
            <span
              aria-hidden
              className="absolute top-3 left-[7px] h-[calc(100%-0.5rem)] w-px bg-border"
            />
          ) : null}

          <span className="relative z-10 mt-1.5 size-3.5 shrink-0 rounded-full border-2 border-primary bg-background group-hover:bg-primary/20" />

          <div className="min-w-0 flex-1 rounded-lg border p-3 transition-colors group-hover:bg-muted/40">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{entry.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(entry.performedAt)} · {formatKm(entry.odometerKm)}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">
                {formatCategory(entry.category)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {formatEur(entry.costEur)}
              </Badge>
            </div>

            {entry.comment ? (
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{entry.comment}</p>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  )
}
