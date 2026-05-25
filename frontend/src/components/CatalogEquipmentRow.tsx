import type { Equipment } from '../types'

const EXCERPT_LEN = 140

type Props = {
  equipment: Equipment
  onShowDetail: () => void
  onStartRequest: () => void
  requestDisabled?: boolean
  requestDisabledTitle?: string
}

export function CatalogEquipmentRow({
  equipment,
  onShowDetail,
  onStartRequest,
  requestDisabled,
  requestDisabledTitle,
}: Props) {
  const raw = equipment.description?.trim() ?? ''
  const excerpt =
    raw.length === 0
      ? 'Sem observações cadastradas — abra a ficha para pedir detalhes ao NRDT.'
      : raw.length > EXCERPT_LEN
        ? `${raw.slice(0, EXCERPT_LEN - 1)}…`
        : raw

  return (
    <article className="catalog-row">
      <div className="catalog-row-main">
        <h4 className="catalog-row-title">{equipment.name}</h4>
        <p className="catalog-row-meta muted tiny">
          Patrimônio <code className="patrimony-code patrimony-inline">{equipment.inventory_code}</code>
        </p>
        <p className="catalog-row-excerpt muted">{excerpt}</p>
      </div>
      <div className="catalog-row-actions">
        <button type="button" className="btn btn-compact" onClick={onShowDetail}>
          Ver ficha
        </button>
        <button
          type="button"
          className="btn primary btn-compact"
          onClick={onStartRequest}
          disabled={requestDisabled}
          title={requestDisabled ? requestDisabledTitle : undefined}
        >
          Solicitar empréstimo
        </button>
      </div>
    </article>
  )
}
