import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Equipment } from '../types'

type Props = {
  equipment: Equipment | null
  onDismiss: () => void
  onSave: (body: { name: string; inventory_code: string; description: string | null }) => Promise<void>
  busy: boolean
}

export function EditEquipmentDialog({ equipment, onDismiss, onSave, busy }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState(() => equipment?.name ?? '')
  const [code, setCode] = useState(() => equipment?.inventory_code ?? '')
  const [desc, setDesc] = useState(() => equipment?.description ?? '')

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
    const open = !!equipment
    if (open) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [equipment])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!equipment || busy) return
    const description = desc.trim() || null
    await onSave({
      name: name.trim(),
      inventory_code: code.trim(),
      description,
    })
  }

  return (
    <dialog
      ref={ref}
      className="confirm-dialog edit-equipment-dialog"
      aria-labelledby="edit-eq-title"
      aria-modal="true"
    >
      <form className="confirm-dialog-inner" onSubmit={(ev) => void submit(ev)}>
        <h2 id="edit-eq-title" className="confirm-dialog-title">
          Editar equipamento
        </h2>
        <div className="confirm-dialog-body stack">
          <div>
            <label htmlFor="edit-eq-name">Nome</label>
            <input
              id="edit-eq-name"
              required
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </div>
          <div>
            <label htmlFor="edit-eq-code">Código de patrimônio</label>
            <input
              id="edit-eq-code"
              required
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={busy}
            />
          </div>
          <div>
            <label htmlFor="edit-eq-desc">Observações</label>
            <textarea
              id="edit-eq-desc"
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>
        <div className="confirm-dialog-actions">
          <button type="button" className="btn" onClick={onDismiss} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="btn primary" disabled={busy} aria-busy={busy}>
            {busy ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
