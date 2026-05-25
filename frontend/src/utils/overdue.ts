import type { Loan } from '../types'
import { FINE_PER_DAY_BRL } from '../constants/overdue'
import { isLoanOverdue } from './date'

export { FINE_PER_DAY_BRL }

export function fmtBrl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function loanIsOverdue(loan: Loan): boolean {
  return (loan.days_overdue ?? 0) > 0 || isLoanOverdue(loan.due_at, loan.status)
}

export function loanDaysOverdue(loan: Loan): number {
  const days = loan.days_overdue ?? 0
  if (days > 0) return days
  if (!isLoanOverdue(loan.due_at, loan.status)) return 0
  return 1
}

export function loanFineAmount(loan: Loan): number {
  const fine = loan.fine_amount ?? 0
  if (fine > 0) return fine
  return loanDaysOverdue(loan) * FINE_PER_DAY_BRL
}

export function loanEquipmentBlocked(loan: Loan): boolean {
  return loan.equipment_blocked || loanIsOverdue(loan)
}

export function totalOverdueFine(loans: Loan[]): number {
  return loans.filter((l) => l.status === 'ativo' && loanIsOverdue(l)).reduce((s, l) => s + loanFineAmount(l), 0)
}
