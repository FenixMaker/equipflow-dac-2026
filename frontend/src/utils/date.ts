import type { LoanStatus } from '../types'

export const MIN_LOAN_DAYS = 3

/** Data mínima para `input[type=date]` (hoje, fuso local). */
export function minDateValue(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Soma dias a um valor `YYYY-MM-DD` (calendário local). */
export function addDaysToDateInput(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/** Converte `YYYY-MM-DD` (dia local) para ISO UTC (meio-dia UTC). */
export function dateInputToUtcIso(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString()
}

function dateInputStamp(dateStr: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  const stamp = Date.UTC(y, m - 1, d, 12, 0, 0, 0)
  const check = new Date(stamp)
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== m - 1 ||
    check.getUTCDate() !== d
  ) {
    return null
  }
  return stamp
}

/** Valida retirada/devolução no formulário; retorna mensagem ou null. */
export function validateLoanDateInputs(pickup: string, due: string): string | null {
  const pickupNorm = pickup.trim()
  const dueNorm = due.trim()
  if (!pickupNorm || !dueNorm) {
    return 'Indique a data de retirada e a data de devolução.'
  }
  const pickupStamp = dateInputStamp(pickupNorm)
  const dueStamp = dateInputStamp(dueNorm)
  if (pickupStamp === null || dueStamp === null) return 'Datas inválidas.'

  const today = minDateValue()
  if (pickupNorm < today) {
    return 'A data de retirada não pode ser anterior a hoje.'
  }

  if (dueStamp <= pickupStamp) {
    return 'A data de devolução deve ser posterior à data de retirada (não pode ser no mesmo dia).'
  }
  const gap = Math.round((dueStamp - pickupStamp) / 86400000)
  if (gap < MIN_LOAN_DAYS) {
    return `O empréstimo deve ter no mínimo ${MIN_LOAN_DAYS} dias entre retirada e devolução.`
  }
  return null
}

export function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export function fmtDateOnly(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { dateStyle: 'short' })
  } catch {
    return iso
  }
}

/** Retirada efetiva (após aprovação) ou traço. */
export function fmtApprovedAt(iso: string | null | undefined): string {
  if (!iso) return '—'
  return fmtDateTime(iso)
}

/** Empréstimo ativo com data prevista de devolução já passada (fim do dia UTC da due_at). */
export function isLoanOverdue(dueIso: string, status: LoanStatus): boolean {
  if (status !== 'ativo') return false
  try {
    const due = new Date(dueIso)
    const dueEnd = new Date(due)
    dueEnd.setUTCHours(23, 59, 59, 999)
    return Date.now() > dueEnd.getTime()
  } catch {
    return false
  }
}

export function dateSummaryFromInput(dateStr: string): string {
  const stamp = dateInputStamp(dateStr)
  if (stamp === null) return dateStr || '—'
  const d = new Date(stamp)
  return d.toLocaleDateString('pt-BR', { dateStyle: 'short' })
}
