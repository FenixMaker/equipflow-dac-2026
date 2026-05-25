import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type DataColumn<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  priority?: 'high' | 'low'
}

type Props<T> = {
  columns: DataColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  caption: string
  renderCard: (row: T) => ReactNode
  empty?: ReactNode
  rowClassName?: (row: T) => string | undefined
}

export function ResponsiveDataView<T>({
  columns,
  rows,
  rowKey,
  caption,
  renderCard,
  empty,
  rowClassName,
}: Props<T>) {
  if (rows.length === 0) {
    return empty ?? null
  }

  return (
    <>
      <div className="responsive-data-table hidden md:block">
        <Table>
          <caption className="sr-only">{caption}</caption>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={col.priority === 'low' ? 'hidden lg:table-cell' : undefined}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={rowKey(row)} className={rowClassName?.(row)}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={col.priority === 'low' ? 'hidden lg:table-cell' : undefined}
                  >
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="responsive-data-cards flex flex-col gap-3 md:hidden" aria-label={caption}>
        {rows.map((row) => {
          const extra = rowClassName?.(row)
          return (
            <Card
              key={rowKey(row)}
              className={cn('py-0', extra === 'row-alert' && 'border-destructive/40 bg-destructive/5')}
            >
              <CardContent className="py-3">{renderCard(row)}</CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}

export function DataCardRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-right text-foreground">{children}</span>
    </div>
  )
}

export function DataCardFooter({ children }: { children: ReactNode }) {
  return <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">{children}</div>
}
