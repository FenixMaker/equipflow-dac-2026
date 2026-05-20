import { useEffect, useRef } from 'react'
import type { Equipment } from '../types'

type Props = {
  equipment: Equipment | null
  onDismiss: () => void
}

export function EquipmentDetailDialog({ equipment, onDismiss }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    const onCancel = (e: Event) => {
      e.preventDefault()
      onDismiss()
    }
    d.addEventListener('cancel', onCancel)
    return () => d.removeEventListener('cancel', onCancel)
  }, [onDismiss])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (equipment) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [equipment])

  return (
    <dialog
      ref={ref}
      className="equipment-detail-dialog"
      aria-labelledby={equipment ? 'equipment-detail-title' : undefined}
      aria-modal={equipment ? 'true' : undefined}
      aria-hidden={!equipment}
    >
      <div className="confirm-dialog-inner">
        {equipment ? (
          <>
            <p className="equipment-detail-eyebrow muted tiny">Ficha do património</p>
            <h2 id="equipment-detail-title" className="confirm-dialog-title">
              {equipment.name}
            </h2>
            <div className="equipment-detail-dl">
              <div className="equipment-detail-row">
                <span className="equipment-detail-dt">Código de património</span>
                <span className="equipment-detail-dd">
                  <code className="patrimony-code">{equipment.inventory_code}</code>
                </span>
              </div>
              <div className="equipment-detail-row equipment-detail-row--block">
                <span className="equipment-detail-dt">Descrição / observações</span>
                <span className="equipment-detail-dd">
                  {equipment.description?.trim() ? (
                    equipment.description
                  ) : (
                    <span className="muted">Nenhuma descrição detalhada foi registada para este item.</span>
                  )}
                </span>
              </div>
              <div className="equipment-detail-row">
                <span className="equipment-detail-dt">Situação no catálogo</span>
                <span className="equipment-detail-dd">Disponível para novo pedido de empréstimo</span>
              </div>
            </div>
            <p className="equipment-detail-foot muted tiny">
              Em ambiente real, a ficha poderia incluir fotos, localização física, manual PDF e histórico de
              manutenções.
            </p>
            <div className="confirm-dialog-actions">
              <button type="button" className="btn primary" onClick={onDismiss}>
                Fechar
              </button>
            </div>
          </>
        ) : null}
      </div>
    </dialog>
  )
}
