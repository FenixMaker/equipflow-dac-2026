import { useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Props = {
  id: string
  title: string
  titleId?: string
  badge?: number | string
  badgeVariant?: 'default' | 'warn' | 'danger'
  description?: string
  descriptionClassName?: string
  defaultCollapsed?: boolean
  children: ReactNode
  className?: string
  priority?: boolean
}

export function SectionCard({
  id,
  title,
  titleId,
  badge,
  badgeVariant = 'default',
  description,
  descriptionClassName,
  defaultCollapsed = false,
  children,
  className = '',
  priority = false,
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const headingId = titleId ?? `${id}-title`

  const badgeMap = {
    default: 'secondary' as const,
    warn: 'warning' as const,
    danger: 'destructive' as const,
  }

  return (
    <Card
      id={id}
      className={cn(
        'section-card scroll-mt-5 gap-0 overflow-hidden border py-0 shadow-sm transition-shadow duration-200 hover:shadow-md',
        priority ? 'border-primary/30 ring-1 ring-primary/10' : 'border-border/80',
        className,
      )}
      aria-labelledby={headingId}
    >
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              'size-2 shrink-0 rounded-full',
              priority ? 'bg-primary shadow-[0_0_8px] shadow-primary/50' : 'bg-muted-foreground/40',
            )}
            aria-hidden
          />
          <CardTitle
            id={headingId}
            className="text-xs font-bold uppercase tracking-[0.08em] text-foreground"
          >
            {title}
          </CardTitle>
          {badge !== undefined && badge !== 0 && badge !== '' ? (
            <Badge variant={badgeMap[badgeVariant]}>{badge}</Badge>
          ) : null}
        </div>
        {defaultCollapsed ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-8"
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? 'Expandir' : 'Recolher'}
          </Button>
        ) : null}
      </CardHeader>
      {description && !collapsed ? (
        <CardDescription className={cn('px-4 pb-0 text-sm', descriptionClassName)}>{description}</CardDescription>
      ) : null}
      {!collapsed ? <CardContent className="section-card-body px-4 py-4">{children}</CardContent> : null}
    </Card>
  )
}
