import type { EquipmentStatus, LoanStatus } from '../types'
import { EQUIPMENT_STATUS_LABELS } from '../labels/equipmentStatus'

const equipmentClass: Record<EquipmentStatus, string> = {
  disponivel: 'pill pill-ok',
  emprestado: 'pill pill-busy',
  manutencao: 'pill pill-warn',
}

export function EquipmentStatusPill({ status }: { status: EquipmentStatus }) {
  return <span className={equipmentClass[status]}>{EQUIPMENT_STATUS_LABELS[status]}</span>
}

export function LoanSituationPill({
  status,
  overdue,
}: {
  status: LoanStatus
  overdue?: boolean
}) {
  if (status === 'finalizado') {
    return <span className="pill pill-neutral">Encerrado</span>
  }
  if (status === 'recusado') {
    return <span className="pill pill-neutral">Recusado</span>
  }
  if (status === 'pendente') {
    return <span className="pill pill-warn">Aguardando aprovação</span>
  }
  if (overdue) {
    return <span className="pill pill-danger">Em atraso</span>
  }
  return <span className="pill pill-ok">Ativo</span>
}
