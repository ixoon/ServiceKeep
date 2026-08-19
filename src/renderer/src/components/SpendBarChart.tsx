import { formatEur } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface SpendBarItem {
  key: string
  label: string
  value: number
}

interface Props {
  items: SpendBarItem[]
  emptyLabel?: string
  layout?: 'vertical' | 'horizontal'
}

export default function SpendBarChart({
  items,
  emptyLabel = 'No spend recorded.',
  layout = 'vertical'
}: Props) {
  const max = Math.max(0, ...items.map((item) => item.value))

  if (items.length === 0 || max <= 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  if (layout === 'horizontal') {
    return (
      <div className="space-y-3">
        {items.map((item) => {
          const width = Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)
          return (
            <div key={item.key} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{item.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatEur(item.value)}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${width}%` }}
                  title={`${item.label}: ${formatEur(item.value)}`}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex h-52 items-end gap-1.5 sm:gap-2">
      {items.map((item) => {
        const height = Math.max((item.value / max) * 100, item.value > 0 ? 3 : 0)
        return (
          <div key={item.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span
              className={cn(
                'text-[10px] tabular-nums text-muted-foreground',
                item.value <= 0 && 'invisible'
              )}
            >
              {formatEur(item.value)}
            </span>
            <div className="flex h-36 w-full items-end justify-center">
              <div
                className={cn(
                  'w-full max-w-8 rounded-t-sm bg-primary/85',
                  item.value <= 0 && 'bg-muted'
                )}
                style={{ height: item.value > 0 ? `${height}%` : '2px' }}
                title={`${item.label}: ${formatEur(item.value)}`}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}
