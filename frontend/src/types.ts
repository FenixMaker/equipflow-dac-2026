export type Role = 'admin' | 'borrower'

export type EquipmentStatus = 'disponivel' | 'emprestado' | 'manutencao'

export type LoanStatus = 'pendente' | 'ativo' | 'finalizado' | 'recusado'

export interface User {
  id: number
  email: string
  full_name: string
  role: Role
}

export interface Equipment {
  id: number
  name: string
  inventory_code: string
  description: string | null
  status: EquipmentStatus
}

export interface Loan {
  id: number
  equipment_id: number
  borrower_id: number
  created_at: string
  due_at: string
  returned_at: string | null
  status: LoanStatus
  terms_accepted_at: string | null
  terms_version: string | null
  equipment?: Equipment | null
  borrower?: { id: number; email: string; full_name: string } | null
}
