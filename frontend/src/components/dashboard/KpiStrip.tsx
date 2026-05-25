import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type KpiItem = {
  label: string
  value: number | string
  hint?: string
  variant?: 'default' | 'ok' | 'warn' | 'danger'
}

type Props = {
  items: KpiItem[]
  layout?: 'admin' | 'borrower'
}

const variantStyles: Record<
  NonNullable<KpiItem['variant']>,
  { border: string; glow: string; icon: ReactNode }
> = {
  default: {
    border: 'border-l-primary',
    glow: 'from-primary/10',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
        <path d="M4 8h16v10H4V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  ok: {
    border: 'border-l-emerald-500',
    glow: 'from-emerald-500/12',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  warn: {
    border: 'border-l-amber-400',
    glow: 'from-amber-400/12',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  danger: {
    border: 'border-l-destructive',
    glow: 'from-destructive/12',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
        <path
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
}

export function KpiStrip({ items, layout }: Props) {
  const layoutClass = layout === 'admin' ? 'kpi-strip--admin' : layout === 'borrower' ? 'kpi-strip--borrower' : ''
  return (
    <div className={cn('kpi-strip dash-enter grid w-full max-w-full min-w-0 gap-3', layoutClass)} aria-label="Resumo">
      {items.map((item) => {
        const variant = item.variant ?? 'default'
        const style = variantStyles[variant]
        return (
          <Card
            key={item.label}
            className={cn(
              'group relative min-w-0 overflow-hidden border-l-4 py-0 shadow-sm transition-shadow duration-200 hover:shadow-md',
              style.border,
            )}
          >
            <div
              className={cn(
                'pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-80',
                style.glow,
              )}
              aria-hidden
            />
            <CardContent className="relative flex gap-3 px-3.5 py-3.5">
              <div className="bg-background/70 text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80 shadow-sm">
                {style.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">{item.value}</p>
                <p className="mt-0.5 truncate text-[0.68rem] font-bold uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                {item.hint ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground/90">{item.hint}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
