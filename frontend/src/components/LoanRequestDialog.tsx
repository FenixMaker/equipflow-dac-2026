import { useCallback, useEffect, useRef, useState } from 'react'
import { LOAN_TERMS_PARAGRAPHS, LOAN_TERMS_VERSION } from '../constants/terms'
import type { Equipment } from '../types'
import { minDatetimeLocalValue } from '../utils/date'

type Props = {
  equipment: Equipment | null
  onDismiss: () => void
  /** Chamado após validação (inclui termo no passo 2). O pai trata da API e erros globais. */
  onSubmitLoan: (dueLocal: string) => Promise<void>
}

export function LoanRequestDialog({ equipment, onDismiss, onSubmitLoan }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [due, setDue] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const minDue = minDatetimeLocalValue()

  const reset = useCallback(() => {
    setStep(1)
    setDue('')
    setTermsAccepted(false)
    setErr(null)
    setBusy(false)
  }, [])

  useEffect(() => {
    if (equipment) reset()
  }, [equipment, reset])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    const onCancel = (e: Event) => {
      e.preventDefault()
      if (!busy) onDismiss()
    }
    d.addEventListener('cancel', onCancel)
    return () => d.removeEventListener('cancel', onCancel)
  }, [busy, onDismiss])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (equipment) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [equipment])

  function goStep2() {
    setErr(null)
    if (!due.trim()) {
      setErr('Indique data e hora previstas para devolução.')
      return
    }
    setStep(2)
  }

  async function sendLoan() {
    setErr(null)
    if (!termsAccepted) {
      setErr('É necessário ler e aceitar o termo de responsabilidade para enviar o pedido.')
      return
    }
    setBusy(true)
    try {
      await onSubmitLoan(due)
      onDismiss()
    } finally {
      setBusy(false)
    }
  }

  function dueSummary(): string {
    if (!due.trim()) return '—'
    const d = new Date(due)
    if (Number.isNaN(d.getTime())) return due
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  }

  const termsBodyId = 'loan-request-terms-body'

  return (
    <dialog
      ref={ref}
      className="loan-request-dialog"
      aria-labelledby={equipment ? 'loan-request-title' : undefined}
      aria-modal={equipment ? 'true' : undefined}
      aria-hidden={!equipment}
    >
      <div className="loan-request-inner">
        {equipment ? (
          <>
            <div className="loan-request-steps" aria-label="Etapas do pedido">
              <span className={`loan-step ${step === 1 ? 'loan-step--active' : 'loan-step--done'}`}>1 · Prazo</span>
              <span className="loan-step-sep" aria-hidden="true">
                →
              </span>
              <span className={`loan-step ${step === 2 ? 'loan-step--active' : ''}`}>2 · Termo e envio</span>
            </div>

            <h2 id="loan-request-title" className="confirm-dialog-title">
              Solicitar empréstimo
            </h2>
            <p className="loan-request-sub muted">
              <strong className="loan-request-strong">{equipment.name}</strong>{' '}
              <code className="patrimony-code patrimony-inline">{equipment.inventory_code}</code>
            </p>

            {step === 1 ? (
              <div className="loan-request-section stack">
                <p className="info-panel-title">Prazo de devolução previsto</p>
                <p className="muted tiny loan-request-hint">
                  O horário segue o fuso do seu navegador. O pedido ficará pendente até o administrador do NRDT
                  aprovar.
                </p>
                <div className="field-datetime">
                  <label htmlFor="loan-request-due">Devolver até</label>
                  <input
                    id="loan-request-due"
                    type="datetime-local"
                    min={minDue}
                    value={due}
                    onChange={(e) => {
                      setDue(e.target.value)
                      setErr(null)
                    }}
                  />
                </div>
                {err ? (
                  <p className="error" role="alert">
                    {err}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="loan-request-section stack">
                <div className="loan-request-summary">
                  <p className="info-panel-title">Resumo</p>
                  <p className="loan-request-summary-line">
                    Equipamento: <strong>{equipment.name}</strong>
                  </p>
                  <p className="loan-request-summary-line">
                    Devolução prevista: <strong>{dueSummary()}</strong>
                  </p>
                </div>
                <div className="loan-request-terms-block">
                  <p className="terms-step-title">Termo de responsabilidade — leia antes de aceitar</p>
                  <div className="terms-scroll-wrap">
                    <div className="terms-body" id={termsBodyId}>
                      {LOAN_TERMS_PARAGRAPHS.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                      <p className="muted tiny">Versão do termo: {LOAN_TERMS_VERSION}</p>
                    </div>
                  </div>
                  <label className="terms-check-label" htmlFor="loan-request-terms-check">
                    <input
                      id="loan-request-terms-check"
                      type="checkbox"
                      checked={termsAccepted}
                      aria-describedby={termsBodyId}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked)
                        setErr(null)
                      }}
                    />{' '}
                    Li e aceito o termo acima para concluir o pedido de <strong>{equipment.name}</strong>.
                  </label>
                </div>
                {err ? (
                  <p className="error" role="alert">
                    {err}
                  </p>
                ) : null}
              </div>
            )}

            <div className="loan-request-actions">
              {step === 2 ? (
                <button type="button" className="btn" onClick={() => setStep(1)} disabled={busy}>
                  Voltar
                </button>
              ) : (
                <button type="button" className="btn" onClick={onDismiss} disabled={busy}>
                  Cancelar
                </button>
              )}
              {step === 1 ? (
                <button type="button" className="btn primary" onClick={goStep2}>
                  Continuar para o termo
                </button>
              ) : (
                <button
                  type="button"
                  className="btn primary"
                  disabled={busy}
                  aria-busy={busy}
                  onClick={() => void sendLoan()}
                >
                  {busy ? 'Enviando…' : 'Enviar pedido'}
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>
    </dialog>
  )
}
