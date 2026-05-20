import type { EquipmentStatus } from '../types'

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  disponivel: 'Disponível',
  emprestado: 'Emprestado',
  manutencao: 'Manutenção',
}

export function equipmentStatusLabel(status: EquipmentStatus): string {
  return EQUIPMENT_STATUS_LABELS[status]
}
