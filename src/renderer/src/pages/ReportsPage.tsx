import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Car, Download, FileText, Receipt, Tags } from 'lucide-react'
import { toast } from 'sonner'
import type {
  SpendByCategoryRow,
  SpendByMonthRow,
  SpendByVehicleRow,
  Vehicle
} from '../../../shared/types'
import PageHeader from '../components/PageHeader'
import SpendBarChart from '../components/SpendBarChart'
import StatCard from '../components/StatCard'
import VehicleSwitcher from '../components/VehicleSwitcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatCategory, formatEur, formatMonthYear, MONTH_NAMES } from '@/lib/format'
import { ENTRY_CATEGORIES } from '../../../shared/types'

interface Props {
  vehicles: Vehicle[]
  activeVehicleId: number | null
  onSelectVehicle: (id: number | null) => void
}

export default function ReportsPage({ vehicles, activeVehicleId, onSelectVehicle }: Props) {
  const currentYear = new Date().getFullYear()
  const [years, setYears] = useState<number[]>([currentYear])
  const [year, setYear] = useState(currentYear)
  const [totalSpend, setTotalSpend] = useState(0)
  const [byVehicle, setByVehicle] = useState<SpendByVehicleRow[]>([])
  const [byCategory, setByCategory] = useState<SpendByCategoryRow[]>([])
  const [byMonth, setByMonth] = useState<SpendByMonthRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const availableYears = await getApi().getAvailableYears()
      setYears(availableYears)
      if (!availableYears.includes(year)) {
        setYear(availableYears[0] ?? currentYear)
      }
    })()
  }, [])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const api = getApi()
        const vehicleFilter = activeVehicleId
        const [total, vehicleRows, categoryRows, monthRows] = await Promise.all([
          api.getTotalSpend(year, vehicleFilter),
          activeVehicleId == null ? api.getSpendByVehicle(year) : Promise.resolve([]),
          api.getSpendByCategory(year, vehicleFilter),
          api.getSpendByMonth(year, vehicleFilter)
        ])
        setTotalSpend(total)
        setByVehicle(vehicleRows)
        setByCategory(categoryRows)
        setByMonth(monthRows)
      } finally {
        setLoading(false)
      }
    })()
  }, [year, activeVehicleId])

  const categoryLabels = useMemo(() => {
    const map = new Map(ENTRY_CATEGORIES.map((item) => [item.id, item.label]))
    return (category: string) => map.get(category as SpendByCategoryRow['category']) ?? formatCategory(category)
  }, [])

  const monthsWithSpend = byMonth.filter((row) => row.totalEur > 0)

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Simple spend summaries by vehicle, category, and month."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={async () => {
                const path = await getApi().exportEntriesCsv(activeVehicleId)
                if (path) toast.success('Entries exported', { description: path })
              }}
            >
              <Download className="size-4" />
              Export CSV
            </Button>
            {activeVehicleId != null ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  const path = await getApi().exportVehiclePdf(activeVehicleId, year)
                  if (path) toast.success('PDF exported', { description: path })
                }}
              >
                <FileText className="size-4" />
                Vehicle PDF
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((item) => (
              <SelectItem key={item} value={String(item)}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <VehicleSwitcher
        vehicles={vehicles}
        activeVehicleId={activeVehicleId}
        onSelect={onSelectVehicle}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={`Total spend (${year})`} value={formatEur(totalSpend)} icon={Receipt} />
        <StatCard
          label="Categories with spend"
          value={byCategory.length}
          icon={Tags}
        />
        <StatCard
          label="Months with spend"
          value={monthsWithSpend.length}
          icon={BarChart3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {activeVehicleId == null ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="size-4" />
                By vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : byVehicle.length === 0 ? (
                <p className="text-sm text-muted-foreground">No spend recorded for {year}.</p>
              ) : (
                <div className="space-y-6">
                  <SpendBarChart
                    layout="horizontal"
                    items={byVehicle.map((row) => ({
                      key: String(row.vehicleId),
                      label: row.vehicleName,
                      value: row.totalEur
                    }))}
                    emptyLabel={`No spend recorded for ${year}.`}
                  />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byVehicle.map((row) => (
                        <TableRow key={row.vehicleId}>
                          <TableCell className="font-medium">{row.vehicleName}</TableCell>
                          <TableCell className="text-right">{formatEur(row.totalEur)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card className={activeVehicleId == null ? undefined : 'lg:col-span-2'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tags className="size-4" />
              By category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No spend recorded for {year}.</p>
            ) : (
              <div className="space-y-6">
                <SpendBarChart
                  layout="horizontal"
                  items={byCategory.map((row) => ({
                    key: row.category,
                    label: categoryLabels(row.category),
                    value: row.totalEur
                  }))}
                  emptyLabel={`No spend recorded for ${year}.`}
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Entries</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byCategory.map((row) => (
                      <TableRow key={row.category}>
                        <TableCell className="font-medium">{categoryLabels(row.category)}</TableCell>
                        <TableCell className="text-right">{row.entryCount}</TableCell>
                        <TableCell className="text-right">{formatEur(row.totalEur)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4" />
              Spend by month ({year})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : monthsWithSpend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No spend recorded for {year}.</p>
            ) : (
              <>
                <SpendBarChart
                  items={byMonth.map((row) => ({
                    key: String(row.month),
                    label: MONTH_NAMES[row.month - 1] ?? String(row.month),
                    value: row.totalEur
                  }))}
                  emptyLabel={`No spend recorded for ${year}.`}
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthsWithSpend.map((row) => (
                      <TableRow key={row.month}>
                        <TableCell>{formatMonthYear(row.year, row.month)}</TableCell>
                        <TableCell className="text-right">{formatEur(row.totalEur)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
