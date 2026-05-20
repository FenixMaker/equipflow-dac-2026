/** Data/hora mínima para `datetime-local` (agora, fuso local). */
export function minDatetimeLocalValue(): string {
  const d = new Date()
  d.setSeconds(0, 0)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

import type { LoanStatus } from '../types'

/** Empréstimo ativo com data prevista já passada. */
export function isLoanOverdue(dueIso: string, status: LoanStatus): boolean {
  if (status !== 'ativo') return false
  try {
    return new Date(dueIso).getTime() < Date.now()
  } catch {
    return false
  }
}
