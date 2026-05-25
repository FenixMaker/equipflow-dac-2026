import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import type { Equipment } from '../../types'

const EXCERPT_LEN = 140

type Props = {
  equipment: Equipment
  onShowDetail: () => void
  onStartRequest: () => void
  requestDisabled?: boolean
  requestDisabledTitle?: string
}

export function EquipmentCatalogCard({
  equipment,
  onShowDetail,
  onStartRequest,
  requestDisabled,
  requestDisabledTitle,
}: Props) {
  const raw = equipment.description?.trim() ?? ''
  const excerpt =
    raw.length === 0
      ? 'Sem observações cadastradas — abra a ficha para mais detalhes.'
      : raw.length > EXCERPT_LEN
        ? `${raw.slice(0, EXCERPT_LEN - 1)}…`
        : raw

  return (
    <Card
      className={
        requestDisabled
          ? 'opacity-75'
          : 'transition-shadow duration-200 hover:border-primary/25 hover:shadow-md'
      }
    >
      <CardContent className="flex flex-col gap-2 pt-4">
        <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md border border-primary/20">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 8h16v10H4V8zm2-4h12v2H6V4z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h4 className="font-semibold leading-snug">{equipment.name}</h4>
        <p className="text-muted-foreground text-xs">
          Patrimônio{' '}
          <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">{equipment.inventory_code}</code>
        </p>
        <p className="text-muted-foreground line-clamp-3 flex-1 text-sm">{excerpt}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t border-border pt-3">
        <Button type="button" variant="outline" size="sm" onClick={onShowDetail}>
          Ver ficha
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onStartRequest}
          disabled={requestDisabled}
          title={requestDisabled ? requestDisabledTitle : undefined}
        >
          Solicitar empréstimo
        </Button>
      </CardFooter>
    </Card>
  )
}
