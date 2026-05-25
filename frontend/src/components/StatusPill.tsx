import { Badge } from '@/components/ui/badge'
import type { EquipmentStatus, LoanStatus } from '../types'
import { EQUIPMENT_STATUS_LABELS } from '../labels/equipmentStatus'

const equipmentVariant: Record<EquipmentStatus, 'default' | 'secondary' | 'warning'> = {
  disponivel: 'default',
  emprestado: 'secondary',
  manutencao: 'warning',
}

export function EquipmentStatusPill({ status }: { status: EquipmentStatus }) {
  return (
    <Badge variant={equipmentVariant[status]} className="font-semibold uppercase tracking-wide">
      {EQUIPMENT_STATUS_LABELS[status]}
    </Badge>
  )
}

export function LoanSituationPill({
  status,
  overdue,
}: {
  status: LoanStatus
  overdue?: boolean
}) {
  if (status === 'finalizado') {
    return <Badge variant="secondary">Encerrado</Badge>
  }
  if (status === 'recusado') {
    return <Badge variant="outline">Recusado</Badge>
  }
  if (status === 'pendente') {
    return <Badge variant="warning">Aguardando aprovação</Badge>
  }
  if (overdue) {
    return <Badge variant="destructive">Em atraso</Badge>
  }
  return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 border">Ativo</Badge>
}
