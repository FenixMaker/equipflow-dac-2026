import { useEffect, useRef } from 'react'

type Props = {
  open: boolean
  title: string
  children?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  onDismiss: () => void
  busy?: boolean
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onDismiss,
  busy = false,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    const onCancel = (e: Event) => {
      e.preventDefault()
      if (!busy) onDismiss()
    }
    d.addEventListener('cancel', onCancel)
    return () => d.removeEventListener('cancel', onCancel)
  }, [busy, onDismiss])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [open])

  return (
    <dialog ref={ref} className="confirm-dialog" aria-labelledby="confirm-dialog-title" aria-modal="true">
      <div className="confirm-dialog-inner">
        <h2 id="confirm-dialog-title" className="confirm-dialog-title">
          {title}
        </h2>
        {children ? <div className="confirm-dialog-body">{children}</div> : null}
        <div className="confirm-dialog-actions">
          <button type="button" className="btn" onClick={onDismiss} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            aria-busy={busy}
            onClick={() => void onConfirm()}
          >
            {busy ? 'Aguarde…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
