import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type Props = {
  msg: string | null
  err: string | null
  onDismissMsg: () => void
  onDismissErr: () => void
  onRetry?: () => void
}

export function PageAlerts({ msg, err, onDismissMsg, onDismissErr, onRetry }: Props) {
  if (!msg && !err) return null
  return (
    <div className="page-alerts flex w-full max-w-full flex-col gap-2">
      {msg ? (
        <Alert variant="success" className="flex items-start justify-between gap-2">
          <span className="size-4 shrink-0 text-emerald-400" aria-hidden>
            ✓
          </span>
          <AlertDescription className="col-start-auto flex-1 text-emerald-400">{msg}</AlertDescription>
          <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={onDismissMsg} aria-label="Fechar">
            ×
          </Button>
        </Alert>
      ) : null}
      {err ? (
        <Alert variant="destructive" className="flex flex-wrap items-start justify-between gap-2">
          <span className="size-4 shrink-0 text-destructive" aria-hidden>
            !
          </span>
          <AlertDescription className="col-start-auto min-w-0 flex-1">{err}</AlertDescription>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onDismissErr}>
              Fechar
            </Button>
            {onRetry ? (
              <Button type="button" size="sm" onClick={onRetry}>
                Tentar de novo
              </Button>
            ) : null}
          </div>
        </Alert>
      ) : null}
    </div>
  )
}
