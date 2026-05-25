import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start',
  {
    variants: {
      variant: {
        default: 'bg-card text-foreground',
        destructive:
          'text-destructive bg-destructive/10 border-destructive/30 [&>svg]:text-destructive',
        success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('col-start-2 font-medium tracking-tight', className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('col-start-2 text-sm text-muted-foreground [&_p]:leading-relaxed', className)} {...props} />
  )
}

export { Alert, AlertTitle, AlertDescription }
