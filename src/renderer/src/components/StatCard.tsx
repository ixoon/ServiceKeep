import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  label: string
  value: string | number
  icon?: LucideIcon
}

export default function StatCard({ label, value, icon: Icon }: Props) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between pt-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        {Icon ? (
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Icon className="size-4" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
