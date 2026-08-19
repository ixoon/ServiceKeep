import { Plus } from 'lucide-react'
import type { Vehicle } from '../../../shared/types'
import QuickAddTemplates from '@/components/QuickAddTemplates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { EntryTemplate } from '@/lib/entryTemplates'

interface Props {
  vehicle: Vehicle | null
  onSelectTemplate: (template: EntryTemplate) => void
  onOther: () => void
}

export default function QuickAddBar({ vehicle, onSelectTemplate, onOther }: Props) {
  if (!vehicle) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick add</CardTitle>
          <CardDescription>Select a vehicle above to log maintenance quickly.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick add — {vehicle.name}</CardTitle>
        <CardDescription>Log oil, service, or parts without opening the full entries page.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <QuickAddTemplates compact onSelect={onSelectTemplate} />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onOther}>
          <Plus className="size-4" />
          Other
        </Button>
      </CardContent>
    </Card>
  )
}
