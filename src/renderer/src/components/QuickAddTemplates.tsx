import { Droplets, Package, Settings, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ENTRY_TEMPLATES, type EntryTemplate } from '@/lib/entryTemplates'
import { Button } from '@/components/ui/button'

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  oil: Droplets,
  small_service: Wrench,
  big_service: Settings,
  parts: Package
}

interface Props {
  onSelect: (template: EntryTemplate) => void
  compact?: boolean
}

export default function QuickAddTemplates({ onSelect, compact = false }: Props) {
  return (
    <div className={compact ? 'flex flex-wrap gap-2' : 'grid gap-2 sm:grid-cols-2'}>
      {ENTRY_TEMPLATES.map((template) => {
        const Icon = TEMPLATE_ICONS[template.id] ?? Wrench
        return (
          <Button
            key={template.id}
            type="button"
            variant="outline"
            size={compact ? 'sm' : 'default'}
            className={compact ? 'gap-1.5' : 'h-auto justify-start gap-2 py-3'}
            onClick={() => onSelect(template)}
          >
            <Icon className="size-4 shrink-0" />
            {template.label}
          </Button>
        )
      })}
    </div>
  )
}
