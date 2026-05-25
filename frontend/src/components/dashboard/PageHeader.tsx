import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  subtitle: string
  role?: 'admin' | 'borrower'
  refreshing?: boolean
  lastLoadedAt?: Date | null
  onRefresh: () => void
  actions?: ReactNode
}

export function PageHeader({
  title,
  subtitle,
  role,
  refreshing,
  lastLoadedAt,
  onRefresh,
  actions,
}: Props) {
  return (
    <header className="dash-enter dashboard-hero relative w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card/60 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-5 sm:py-5">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {role ? (
              <Badge variant="secondary" className="text-[0.65rem] uppercase tracking-wider">
                {role === 'admin' ? 'Administração' : 'Solicitante'}
              </Badge>
            ) : null}
            {lastLoadedAt ? (
              <span className="text-muted-foreground text-xs tabular-nums" aria-live="polite">
                Sync{' '}
                {lastLoadedAt.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            ) : null}
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem]">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        </div>
        <div className={cn('flex shrink-0 flex-col items-stretch gap-2 sm:items-end')}>
          {actions}
          <Button
            type="button"
            variant="outline"
            className="bg-background/80 shadow-sm"
            onClick={onRefresh}
            disabled={refreshing}
            aria-busy={refreshing}
          >
            {refreshing ? 'Atualizando…' : 'Atualizar dados'}
          </Button>
        </div>
      </div>
    </header>
  )
}
