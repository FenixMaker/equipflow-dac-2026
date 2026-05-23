import { useCallback, useEffect, useMemo, useState } from 'react'
import { equipmentApi, loansApi } from '../api'
import { LOAN_TERMS_VERSION } from '../constants/terms'
import { EQUIPMENT_STATUS_LABELS } from '../labels/equipmentStatus'
import type { Equipment, Loan } from '../types'
import { CatalogEquipmentRow } from './CatalogEquipmentRow'
import { ConfirmDialog } from './ConfirmDialog'
import { DashboardSkeleton } from './DashboardSkeleton'
import { EquipmentDetailDialog } from './EquipmentDetailDialog'
import { LoanRequestDialog } from './LoanRequestDialog'
import { LoanSituationPill } from './StatusPill'
import { dateInputToUtcIso, fmtApprovedAt, fmtDateOnly, fmtDateTime, isLoanOverdue } from '../utils/date'

const POLL_MS = 12_000

export function BorrowerDashboard() {
  const [available, setAvailable] = useState<Equipment[]>([])
  const [mine, setMine] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null)

  const [returnConfirm, setReturnConfirm] = useState<Loan | null>(null)
  const [returnBusy, setReturnBusy] = useState(false)
  const [detailEquipment, setDetailEquipment] = useState<Equipment | null>(null)
  const [requestEquipment, setRequestEquipment] = useState<Equipment | null>(null)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false
    if (!silent) setErr(null)
    if (silent) setRefreshing(true)
    try {
      const [a, m] = await Promise.all([equipmentApi.list('disponivel'), loansApi.mine()])
      setAvailable(a)
      setMine(m)
      setHasLoadedOnce(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLastLoadedAt(new Date())
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') void load({ silent: true })
    }
    const id = window.setInterval(tick, POLL_MS)
    const onVis = () => {
      if (document.visibilityState === 'visible') void load({ silent: true })
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [load])

  const pendingLoans = useMemo(() => mine.filter((l) => l.status === 'pendente'), [mine])
  const activeLoans = useMemo(() => mine.filter((l) => l.status === 'ativo'), [mine])
  const historyLoans = useMemo(
    () => mine.filter((l) => l.status === 'finalizado' || l.status === 'recusado'),
    [mine],
  )

  const overdueCount = useMemo(
    () => activeLoans.filter((l) => isLoanOverdue(l.due_at, l.status)).length,
    [activeLoans],
  )

  async function confirmReturn() {
    if (!returnConfirm) return
    setReturnBusy(true)
    setErr(null)
    try {
      await loansApi.returnLoan(returnConfirm.id)
      setMsg('Devolução registrada.')
      setReturnConfirm(null)
      await load({ silent: true })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao devolver')
      setReturnConfirm(null)
    } finally {
      setReturnBusy(false)
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="stack gap-lg">
      <header className="page-intro page-intro-row">
        <div>
          <h2>Empréstimos e devoluções</h2>
          <p className="muted">
            {available.length === 0
              ? 'Nenhum equipamento disponível para novo pedido'
              : available.length === 1
                ? '1 equipamento disponível para novo pedido'
                : `${available.length} equipamentos disponíveis para novo pedido`}
            {' · '}
            {(() => {
              const p = pendingLoans.length
              if (p === 0) return 'nenhuma solicitação aguardando aprovação'
              if (p === 1) return '1 solicitação aguardando aprovação'
              return `${p} solicitações aguardando aprovação`
            })()}
            {' · '}
            {(() => {
              const n = activeLoans.length
              if (n === 0) return 'nenhum empréstimo ativo'
              if (n === 1) return '1 empréstimo ativo'
              return `${n} empréstimos ativos`
            })()}
          </p>
        </div>
        <div className="page-intro-actions">
          <button
            type="button"
            className="btn"
            onClick={() => void load({ silent: true })}
            disabled={refreshing}
            aria-busy={refreshing}
          >
            {refreshing ? 'Atualizando…' : 'Atualizar'}
          </button>
          {lastLoadedAt ? (
            <p className="sync-hint muted tiny" aria-live="polite">
              Atualizado às{' '}
              {lastLoadedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          ) : null}
        </div>
      </header>

      {msg ? (
        <div className="flash-row" role="status">
          <p className="success flash-msg">{msg}</p>
          <button type="button" className="btn ghost btn-dismiss" onClick={() => setMsg(null)}>
            Fechar
          </button>
        </div>
      ) : null}
      {err ? (
        <div className="error-banner" role="alert">
          <p className="error error-flat">{err}</p>
          <div className="flash-actions-inline">
            <button type="button" className="btn ghost btn-dismiss" onClick={() => setErr(null)}>
              Fechar
            </button>
            <button type="button" className="btn primary btn-compact" onClick={() => void load()}>
              Tentar de novo
            </button>
          </div>
        </div>
      ) : null}

      <div className="stat-grid" aria-label="Resumo do painel">
        <div className="stat-tile stat-tile--ok">
          <p className="stat-tile-value">{available.length}</p>
          <span className="stat-tile-label">Disponíveis agora</span>
          <p className="stat-tile-hint">Itens que aceitam novo pedido</p>
        </div>
        <div className={`stat-tile${pendingLoans.length ? ' stat-tile--warn' : ''}`}>
          <p className="stat-tile-value">{pendingLoans.length}</p>
          <span className="stat-tile-label">Aguardando aprovação</span>
          <p className="stat-tile-hint">Pedidos enviados ao administrador</p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile-value">{activeLoans.length}</p>
          <span className="stat-tile-label">Empréstimos ativos</span>
          <p className="stat-tile-hint">Em uso após aprovação</p>
        </div>
        <div className={`stat-tile${overdueCount ? ' stat-tile--danger' : ''}`}>
          <p className="stat-tile-value">{overdueCount}</p>
          <span className="stat-tile-label">Em atraso</span>
          <p className="stat-tile-hint">Prazo de devolução ultrapassado</p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile-value">{historyLoans.length}</p>
          <span className="stat-tile-label">Histórico</span>
          <p className="stat-tile-hint">Encerrados ou recusados</p>
        </div>
      </div>

      <section className="card" aria-labelledby="borrow-panel-guide-title">
        <h3 id="borrow-panel-guide-title">Como ler este painel</h3>
        <div className="guide-columns">
          <div>
            <h4 className="guide-col-heading">Pedidos e empréstimos</h4>
            <ul className="guide-list">
              <li>
                <strong>Pendente:</strong> aguarda decisão do administrador do NRDT.
              </li>
              <li>
                <strong>Ativo:</strong> em uso; registre a devolução até a data combinada.
              </li>
              <li>
                <strong>Encerrado:</strong> devolução registrada no sistema.
              </li>
              <li>
                <strong>Recusado:</strong> o pedido não foi aceito (motivo não é obrigatório neste protótipo).
              </li>
            </ul>
          </div>
          <div>
            <h4 className="guide-col-heading">Catálogo e pedido</h4>
            <ul className="guide-list">
              <li>
                <strong>Ver ficha:</strong> descrição completa e código de patrimônio antes de solicitar.
              </li>
              <li>
                <strong>Solicitar empréstimo:</strong> define retirada e devolução (mín. 3 dias); o termo aparece no passo 2.
              </li>
              <li>
                A lista <strong>atualiza sozinha</strong> a cada ~12&nbsp;s com o separador visível; use <strong>Atualizar</strong> para
                forçar.
              </li>
            </ul>
          </div>
          <div>
            <h4 className="guide-col-heading">Situações no acervo</h4>
            <ul className="guide-list">
              <li>
                <strong>{EQUIPMENT_STATUS_LABELS.disponivel}:</strong> pode receber novo pedido.
              </li>
              <li>
                <strong>{EQUIPMENT_STATUS_LABELS.emprestado}:</strong> vinculado a um empréstimo ativo ou fluxo em curso.
              </li>
              <li>
                <strong>{EQUIPMENT_STATUS_LABELS.manutencao}:</strong> indisponível para empréstimo até nova liberação.
              </li>
            </ul>
            <p className="guide-list-p guide-list-p-follow">Linhas em destaque indicam <strong>atraso</strong> face ao prazo de devolução.</p>
          </div>
        </div>
      </section>

      <div className="dashboard-panels">
        <section className="card" aria-labelledby="borrow-guide-title">
          <h3 id="borrow-guide-title">Fluxo na sua conta</h3>
          <ol className="info-checklist">
            <li>
              Consulte a <strong>ficha completa</strong> do equipamento antes de pedir; o assistente de empréstimo
              abre em dois passos: primeiro as <strong>datas previstas</strong>, depois o <strong>termo</strong> só ao finalizar.
            </li>
            <li>
              Após enviar o pedido, acompanhe a secção <strong>Aguardando aprovação</strong> até o administrador decidir.
            </li>
            <li>
              Com o empréstimo <strong>ativo</strong>, utilize o equipamento e registe a devolução a tempo; linhas em
              vermelho indicam atraso.
            </li>
          </ol>
          <p className="info-callout">
            Esta página atualiza automaticamente a cada ~12 s quando o separador está visível. Use <strong>Atualizar</strong>{' '}
            para forçar uma nova leitura.
          </p>
        </section>
        <section className="card" aria-labelledby="borrow-tips-title">
          <h3 id="borrow-tips-title">Boas práticas (demonstração)</h3>
          <ul className="info-checklist">
            <li>Prefira horários de devolução realistas no campus (ex.: fim de aula).</li>
            <li>Em dúvida sobre o equipamento, abra <strong>Ver ficha</strong> — o resumo na lista é apenas orientativo.</li>
            <li>O termo registado inclui versão — o administrador pode consultar o aceite no pedido.</li>
            <li>Em produção real, haveria notificações por e-mail; aqui o acompanhamento é só neste painel.</li>
          </ul>
        </section>
      </div>

      <section className="card" aria-labelledby="avail-title">
        <h3 id="avail-title">Equipamentos disponíveis para empréstimo</h3>
        <p id="catalog-hint" className="field-hint">
          Cada linha mostra um <strong>resumo</strong> do item. Use <strong>Ver ficha</strong> para descrição completa e
          dados de património. Use <strong>Solicitar empréstimo</strong> para abrir o assistente: no passo 1 escolhe a
          <strong>data de retirada</strong> e a <strong>data de devolução</strong> (intervalo mínimo de 3 dias); o{' '}
          <strong>termo de responsabilidade</strong> só aparece no passo 2. Após enviar, o estado fica{' '}
          <strong>pendente</strong> até o NRDT aprovar; a retirada efetiva só é registrada na aprovação.
        </p>
        {!hasLoadedOnce && err ? (
          <p className="muted section-retry-hint">Não foi possível carregar o acervo.</p>
        ) : hasLoadedOnce && available.length === 0 ? (
          <div className="empty-state empty-state-subtle">
            <p className="empty-state-title">Nada disponível para novo pedido</p>
            <p className="empty-state-text">
              Os itens podem estar em manutenção, com pedido pendente ou emprestados. Atualize em instantes.
            </p>
          </div>
        ) : (
          <ul className="list">
            {available.map((eq) => (
              <li key={eq.id}>
                <CatalogEquipmentRow
                  equipment={eq}
                  onShowDetail={() => setDetailEquipment(eq)}
                  onStartRequest={() => setRequestEquipment(eq)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="pending-title">
        <h3 id="pending-title">Aguardando aprovação</h3>
        {!hasLoadedOnce && err ? (
          <p className="muted section-retry-hint">Lista indisponível no momento.</p>
        ) : pendingLoans.length === 0 ? (
          <div className="empty-state empty-state-subtle">
            <p className="empty-state-text">Quando enviar um pedido, ele aparecerá aqui até o administrador decidir.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Solicitações pendentes</caption>
              <thead>
                <tr>
                  <th scope="col">Equipamento</th>
                  <th scope="col">Patrimônio</th>
                  <th scope="col">Pedido em</th>
                  <th scope="col">Retirada prevista</th>
                  <th scope="col">Devolução prevista</th>
                  <th scope="col">Situação</th>
                </tr>
              </thead>
              <tbody>
                {pendingLoans.map((l) => (
                  <tr key={l.id}>
                    <td>{l.equipment?.name ?? '—'}</td>
                    <td>
                      {l.equipment?.inventory_code ? (
                        <code className="patrimony-code">{l.equipment.inventory_code}</code>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{fmtDateTime(l.created_at)}</td>
                    <td>{fmtDateOnly(l.pickup_at)}</td>
                    <td>{fmtDateOnly(l.due_at)}</td>
                    <td>
                      <LoanSituationPill status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="active-title">
        <h3 id="active-title">Meus empréstimos ativos</h3>
        {!hasLoadedOnce && err ? (
          <p className="muted section-retry-hint">Lista indisponível no momento.</p>
        ) : hasLoadedOnce && activeLoans.length === 0 ? (
          <div className="empty-state empty-state-subtle">
            <p className="empty-state-text">
              Após a aprovação do administrador, o empréstimo ativo aparecerá aqui com prazo e opção de devolução.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Empréstimos em curso</caption>
              <thead>
                <tr>
                  <th scope="col">Equipamento</th>
                  <th scope="col">Patrimônio</th>
                  <th scope="col">Retirada efetiva</th>
                  <th scope="col">Devolver até</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Ação</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.map((l) => {
                  const overdue = isLoanOverdue(l.due_at, l.status)
                  return (
                    <tr key={l.id} className={overdue ? 'row-alert' : undefined}>
                      <td>{l.equipment?.name ?? '—'}</td>
                      <td>
                        {l.equipment?.inventory_code ? (
                          <code className="patrimony-code">{l.equipment.inventory_code}</code>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{fmtApprovedAt(l.approved_at)}</td>
                      <td>
                        <span className={overdue ? 'text-alert' : undefined}>{fmtDateOnly(l.due_at)}</span>
                      </td>
                      <td>
                        <LoanSituationPill status={l.status} overdue={overdue} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn primary btn-table"
                          onClick={() => setReturnConfirm(l)}
                        >
                          Devolver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="history-title">
        <h3 id="history-title">Histórico de empréstimos</h3>
        {!hasLoadedOnce && err ? (
          <p className="muted section-retry-hint">Histórico indisponível no momento.</p>
        ) : historyLoans.length === 0 ? (
          <div className="empty-state empty-state-subtle">
            <p className="empty-state-text">Empréstimos encerrados ou recusados aparecerão aqui.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Histórico</caption>
              <thead>
                <tr>
                  <th scope="col">Equipamento</th>
                  <th scope="col">Patrimônio</th>
                  <th scope="col">Pedido em</th>
                  <th scope="col">Retirada prevista</th>
                  <th scope="col">Devolução prevista</th>
                  <th scope="col">Retirada efetiva</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Devolvido em</th>
                </tr>
              </thead>
              <tbody>
                {historyLoans.map((l) => (
                  <tr key={l.id}>
                    <td>{l.equipment?.name ?? '—'}</td>
                    <td>
                      {l.equipment?.inventory_code ? (
                        <code className="patrimony-code">{l.equipment.inventory_code}</code>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{fmtDateTime(l.created_at)}</td>
                    <td>{fmtDateOnly(l.pickup_at)}</td>
                    <td>{fmtDateOnly(l.due_at)}</td>
                    <td>{fmtApprovedAt(l.approved_at)}</td>
                    <td>
                      <LoanSituationPill status={l.status} />
                    </td>
                    <td>{l.returned_at ? fmtDateTime(l.returned_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="dashboard-panels">
        <section className="card" aria-labelledby="borrow-session-title">
          <h3 id="borrow-session-title">Sessão e privacidade (demonstração)</h3>
          <p className="info-panel">
            O token de acesso fica guardado neste navegador apenas para a simulação. Num computador compartilhado, use{' '}
            <strong>Sair</strong> no fim. Os dados do laboratório residem na base SQLite da API nesta máquina.
          </p>
          <p className="info-callout">
            Não utilize dados pessoais reais: o cenário NRDT / EquipFlow é académico e fictício.
          </p>
        </section>
        <section className="card" aria-labelledby="borrow-api-title">
          <h3 id="borrow-api-title">Suporte técnico e documentação</h3>
          <p className="info-panel">
            Se o pedido falhar com erro de rede ou 401, confirme que a API está no ar e que a sessão não expirou (faça
            login de novo). Com o backend local, pode consultar rotas e exemplos em{' '}
            <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">
              127.0.0.1:8000/docs
            </a>
            .
          </p>
          <p className="info-panel">
            Para testar no celular na mesma rede Wi-Fi, o servidor de desenvolvimento do Vite e o FastAPI precisam de
            estar acessíveis pelo endereço IP deste PC (não só <code className="patrimony-code">localhost</code>).
          </p>
        </section>
      </div>

      <EquipmentDetailDialog equipment={detailEquipment} onDismiss={() => setDetailEquipment(null)} />

      <LoanRequestDialog
        equipment={requestEquipment}
        onDismiss={() => setRequestEquipment(null)}
        onSubmitLoan={async (pickupLocal, dueLocal) => {
          const eq = requestEquipment
          if (!eq) return
          setMsg(null)
          setErr(null)
          const pickup_at = dateInputToUtcIso(pickupLocal)
          const due_at = dateInputToUtcIso(dueLocal)
          try {
            await loansApi.create(eq.id, pickup_at, due_at, {
              terms_accepted: true,
              terms_version: LOAN_TERMS_VERSION,
            })
          } catch (err) {
            setErr(err instanceof Error ? err.message : 'Erro ao registrar solicitação')
            throw err
          }
          setMsg(`Solicitação enviada: ${eq.name}. Aguarde a aprovação do administrador.`)
          await load({ silent: true })
        }}
      />

      <ConfirmDialog
        open={!!returnConfirm}
        title="Registrar devolução"
        confirmLabel="Confirmar devolução"
        onDismiss={() => {
          if (!returnBusy) setReturnConfirm(null)
        }}
        onConfirm={() => void confirmReturn()}
        busy={returnBusy}
      >
        {returnConfirm ? (
          <p>
            Confirma a devolução de <strong>{returnConfirm.equipment?.name ?? 'equipamento'}</strong> (patrimônio{' '}
            <strong>{returnConfirm.equipment?.inventory_code ?? '—'}</strong>)?
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}
