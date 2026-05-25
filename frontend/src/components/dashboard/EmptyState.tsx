import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Props = {
  title?: string
  text: string
  action?: ReactNode
  subtle?: boolean
}

export function EmptyState({ title, text, action, subtle }: Props) {
  return (
    <Card className={cn('border-dashed bg-muted/30 py-6 shadow-none', subtle && 'bg-transparent')}>
      <CardContent className="flex flex-col items-center text-center">
        <svg className="text-muted-foreground mb-3 size-10 opacity-50" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 6h16M4 12h10M4 18h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {title ? <p className="font-semibold text-foreground">{title}</p> : null}
        <p className="text-muted-foreground mt-1 max-w-md text-sm">{text}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </CardContent>
    </Card>
  )
}
