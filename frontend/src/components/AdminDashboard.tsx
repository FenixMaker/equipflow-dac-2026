import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { equipmentApi, loansApi } from '../api'
import type { Equipment, EquipmentStatus, Loan } from '../types'
import { ConfirmDialog } from './ConfirmDialog'
import { DashboardSkeleton } from './DashboardSkeleton'
import { EditEquipmentDialog } from './EditEquipmentDialog'
import { EquipmentStatusPill } from './StatusPill'
import { equipmentStatusLabel } from '../labels/equipmentStatus'
import { fmtDateTime } from '../utils/date'

const POLL_MS = 12_000

export function AdminDashboard() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [pendingLoans, setPendingLoans] = useState<Loan[]>([])
  const [active, setActive] = useState<Loan[]>([])
  const [finished, setFinished] = useState<Loan[]>([])
  const [rejected, setRejected] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [equipmentSearch, setEquipmentSearch] = useState('')

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [desc, setDesc] = useState('')

  const [pendingStatus, setPendingStatus] = useState<{
    id: number
    name: string
    from: EquipmentStatus
    to: EquipmentStatus
  } | null>(null)
  const [statusBusy, setStatusBusy] = useState(false)

  const [editing, setEditing] = useState<Equipment | null>(null)
  const [editBusy, setEditBusy] = useState(false)
  const [loanActionBusy, setLoanActionBusy] = useState<number | null>(null)
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false
    if (!silent) setErr(null)
    if (silent) setRefreshing(true)
    try {
      const [eq, pend, loans, hist, rej] = await Promise.all([
        equipmentApi.list(),
        loansApi.pendingAdmin(),
        loansApi.activeAdmin(),
        loansApi.finishedAdmin(),
        loansApi.rejectedAdmin(),
      ])
      setEquipment(eq)
      setPendingLoans(pend)
      setActive(loans)
      setFinished(hist)
      setRejected(rej)
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

  const filteredEquipment = useMemo(() => {
    const q = equipmentSearch.trim().toLowerCase()
    if (!q) return equipment
    return equipment.filter((eq) => {
      const hay = `${eq.name} ${eq.inventory_code} ${eq.description ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [equipment, equipmentSearch])

  const adminStats = useMemo(() => {
    const disponivel = equipment.filter((e) => e.status === 'disponivel').length
    const emprestado = equipment.filter((e) => e.status === 'emprestado').length
    const manutencao = equipment.filter((e) => e.status === 'manutencao').length
    return {
      total: equipment.length,
      disponivel,
      emprestado,
      manutencao,
      pendingLoans: pendingLoans.length,
      activeLoans: active.length,
      historyLoans: finished.length + rejected.length,
    }
  }, [equipment, pendingLoans, active, finished, rejected])

  const distribPct = useMemo(() => {
    const t = adminStats.total
    if (!t) return { disponivel: 0, emprestado: 0, manutencao: 0 }
    return {
      disponivel: Math.round((adminStats.disponivel / t) * 100),
      emprestado: Math.round((adminStats.emprestado / t) * 100),
      manutencao: Math.round((adminStats.manutencao / t) * 100),
    }
  }, [adminStats])

  async function addEquipment(e: FormEvent) {
    e.preventDefault()
    setMsg(null)
    setErr(null)
    setSaving(true)
    try {
      await equipmentApi.create({
        name: name.trim(),
        inventory_code: code.trim(),
        description: desc.trim() || null,
        status: 'disponivel',
      })
      setName('')
      setCode('')
      setDesc('')
      setMsg('Item incluído no acervo.')
      await load({ silent: true })
    } catch (er) {
      setErr(er instanceof Error ? er.message : 'Erro ao cadastrar')
    } finally {
      setSaving(false)
    }
  }

  async function applyStatusChange() {
    if (!pendingStatus) return
    setStatusBusy(true)
    setMsg(null)
    setErr(null)
    try {
      await equipmentApi.patch(pendingStatus.id, { status: pendingStatus.to })
      setMsg('Situação atualizada.')
      setPendingStatus(null)
      await load({ silent: true })
    } catch (er) {
      setErr(er instanceof Error ? er.message : 'Erro ao atualizar')
      setPendingStatus(null)
    } finally {
      setStatusBusy(false)
    }
  }

  function onStatusSelectChange(eq: Equipment, newStatus: EquipmentStatus) {
    if (newStatus === eq.status) return
    setPendingStatus({ id: eq.id, name: eq.name, from: eq.status, to: newStatus })
  }

  async function saveEdit(body: { name: string; inventory_code: string; description: string | null }) {
    if (!editing) return
    setEditBusy(true)
    setMsg(null)
    setErr(null)
    try {
      await equipmentApi.patch(editing.id, body)
      setMsg('Dados do equipamento atualizados.')
      setEditing(null)
      await load({ silent: true })
    } catch (er) {
      setErr(er instanceof Error ? er.message : 'Erro ao salvar')
    } finally {
      setEditBusy(false)
    }
  }

  async function approvePending(loanId: number) {
    setLoanActionBusy(loanId)
    setMsg(null)
    setErr(null)
    try {
      await loansApi.approve(loanId)
      setMsg('Empréstimo aprovado.')
      await load({ silent: true })
    } catch (er) {
      setErr(er instanceof Error ? er.message : 'Erro ao aprovar')
    } finally {
      setLoanActionBusy(null)
    }
  }

  async function rejectPending(loanId: number) {
    setLoanActionBusy(loanId)
    setMsg(null)
    setErr(null)
    try {
      await loansApi.reject(loanId)
      setMsg('Solicitação recusada.')
      await load({ silent: true })
    } catch (er) {
      setErr(er instanceof Error ? er.message : 'Erro ao recusar')
    } finally {
      setLoanActionBusy(null)
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="stack gap-lg">
      <header className="page-intro page-intro-row">
        <div>
          <h2>Patrimônio e empréstimos</h2>
          <p className="muted">
            {equipment.length} {equipment.length === 1 ? 'item' : 'itens'} ·{' '}
            {pendingLoans.length === 0
              ? 'nenhuma solicitação pendente'
              : pendingLoans.length === 1
                ? '1 solicitação pendente'
                : `${pendingLoans.length} solicitações pendentes`}
            {' · '}
            {active.length === 0
              ? 'nenhum empréstimo ativo'
              : active.length === 1
                ? '1 empréstimo ativo'
                : `${active.length} empréstimos ativos`}
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
            {refreshing ? 'Atualizando…' : 'Atualizar dados'}
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

      <div className="stat-grid" aria-label="Resumo do acervo e empréstimos">
        <div className="stat-tile">
          <p className="stat-tile-value">{adminStats.total}</p>
          <span className="stat-tile-label">Itens no acervo</span>
          <p className="stat-tile-hint">Total cadastrado</p>
        </div>
        <div className="stat-tile stat-tile--ok">
          <p className="stat-tile-value">{adminStats.disponivel}</p>
          <span className="stat-tile-label">Disponíveis</span>
          <p className="stat-tile-hint">Podem receber pedido</p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile-value">{adminStats.emprestado}</p>
          <span className="stat-tile-label">Emprestados</span>
          <p className="stat-tile-hint">Situação do património</p>
        </div>
        <div className="stat-tile stat-tile--warn">
          <p className="stat-tile-value">{adminStats.manutencao}</p>
          <span className="stat-tile-label">Manutenção</span>
          <p className="stat-tile-hint">Indisponíveis para pedido</p>
        </div>
        <div className={`stat-tile${adminStats.pendingLoans ? ' stat-tile--warn' : ''}`}>
          <p className="stat-tile-value">{adminStats.pendingLoans}</p>
          <span className="stat-tile-label">Pedidos pendentes</span>
          <p className="stat-tile-hint">Aguardam aprovação ou recusa</p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile-value">{adminStats.activeLoans}</p>
          <span className="stat-tile-label">Empréstimos ativos</span>
          <p className="stat-tile-hint">Em curso com tomador</p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile-value">{adminStats.historyLoans}</p>
          <span className="stat-tile-label">Registos encerrados</span>
          <p className="stat-tile-hint">Finalizados + recusados</p>
        </div>
      </div>

      <div className="dashboard-panels">
        <section className="card" aria-labelledby="admin-dist-title">
          <h3 id="admin-dist-title">Distribuição do acervo</h3>
          {adminStats.total === 0 ? (
            <p className="muted">Cadastre itens para visualizar percentagens em relação ao total.</p>
          ) : (
            <>
              <p className="muted tiny admin-dist-lede">
                Relativo a <strong>{adminStats.total}</strong> {adminStats.total === 1 ? 'item' : 'itens'} no acervo.
              </p>
              <div className="metric-bar-row">
                <div className="metric-bar-label">
                  <span>Disponíveis</span>
                  <span>{distribPct.disponivel}%</span>
                </div>
                <div className="metric-bar-track">
                  <div
                    className="metric-bar-fill metric-bar-fill--ok"
                    style={{ width: `${distribPct.disponivel}%` }}
                  />
                </div>
              </div>
              <div className="metric-bar-row">
                <div className="metric-bar-label">
                  <span>Emprestados</span>
                  <span>{distribPct.emprestado}%</span>
                </div>
                <div className="metric-bar-track">
                  <div
                    className="metric-bar-fill metric-bar-fill--busy"
                    style={{ width: `${distribPct.emprestado}%` }}
                  />
                </div>
              </div>
              <div className="metric-bar-row">
                <div className="metric-bar-label">
                  <span>Manutenção</span>
                  <span>{distribPct.manutencao}%</span>
                </div>
                <div className="metric-bar-track">
                  <div
                    className="metric-bar-fill metric-bar-fill--warn"
                    style={{ width: `${distribPct.manutencao}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </section>
        <section className="card" aria-labelledby="admin-decision-title">
          <h3 id="admin-decision-title">Decisão e rastreabilidade</h3>
          <p className="info-panel">
            Cada pedido pendente mostra o tomador, datas e o <strong>aceite do termo</strong> com carimbo de tempo e
            versão — útil para auditoria mínima neste protótipo.
          </p>
          <p className="info-panel">
            Ao <strong>aprovar</strong>, confirme que o equipamento está fisicamente disponível; ao <strong>recusar</strong>, o
            item permanece disponível para outros pedidos (salvo outra situação no acervo).
          </p>
          <p className="info-callout">
            Alterações manuais de situação (disponível / emprestado / manutenção) pedem confirmação para evitar erros de
            operação.
          </p>
        </section>
      </div>

      <div className="dashboard-panels">
        <section className="card" aria-labelledby="admin-pipeline-title">
          <h3 id="admin-pipeline-title">Pipeline de decisão</h3>
          <p className="info-panel">
            Cada pedido percorre: <strong>solicitação</strong> (com termo) → <strong>aprovação ou recusa</strong> pelo
            administrador → <strong>uso</strong> pelo solicitante → <strong>devolução</strong> registada. A situação do
            equipamento no acervo (disponível / emprestado / manutenção) deve refletir a realidade do laboratório.
          </p>
          <p className="info-callout">
            Priorize a fila <strong>Solicitações pendentes</strong> antes de alterar património à mão, para não
            conflituar com pedidos em análise.
          </p>
        </section>
        <section className="card" aria-labelledby="admin-checklist-title">
          <h3 id="admin-checklist-title">Checklist do operador</h3>
          <ul className="info-checklist">
            <li>Rever pedidos pendentes e validar datas de devolução pedidas.</li>
            <li>Confirmar aceite do termo e versão antes de aprovar.</li>
            <li>Após aprovação, conferir se a situação do equipamento ficou coerente (emprestado).</li>
            <li>Registar manutenções no acervo para bloquear novos pedidos ao item.</li>
            <li>Usar a busca no acervo quando o NRDT tiver muitos patrimónios.</li>
          </ul>
        </section>
      </div>

      <section className="card" aria-labelledby="new-eq-title">
        <h3 id="new-eq-title">Incluir item no acervo</h3>
        <form onSubmit={addEquipment} className="stack">
          <div className="grid-2">
            <div>
              <label htmlFor="eq-name">Nome do equipamento</label>
              <input
                id="eq-name"
                required
                autoComplete="off"
                placeholder="Ex.: Projetor portátil"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="eq-code">Código de patrimônio</label>
              <input
                id="eq-code"
                required
                autoComplete="off"
                placeholder="Ex.: PAT-LAB-030"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="eq-desc">Observações (opcional)</label>
            <textarea
              id="eq-desc"
              rows={2}
              placeholder="Acessórios, localização, restrições de uso…"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Salvando…' : 'Cadastrar item'}
          </button>
        </form>
      </section>

      <section className="card" aria-labelledby="eq-list-title">
        <h3 id="eq-list-title">Itens cadastrados</h3>
        <div className="stack equipment-search-block">
          <label htmlFor="eq-search">Buscar no acervo</label>
          <input
            id="eq-search"
            type="search"
            autoComplete="off"
            placeholder="Nome, patrimônio ou observação…"
            value={equipmentSearch}
            onChange={(e) => setEquipmentSearch(e.target.value)}
          />
        </div>
        {!hasLoadedOnce && err ? (
          <p className="muted section-retry-hint">Lista indisponível até a conexão com a API ser restabelecida.</p>
        ) : hasLoadedOnce && equipment.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">Acervo vazio</p>
            <p className="empty-state-text">Cadastre o primeiro equipamento usando o formulário acima.</p>
          </div>
        ) : hasLoadedOnce && filteredEquipment.length === 0 ? (
          <div className="empty-state empty-state-subtle">
            <p className="empty-state-text">Nenhum item corresponde à busca. Limpe o filtro ou tente outro termo.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Lista de equipamentos cadastrados</caption>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Patrimônio</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Alterar situação</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((eq) => (
                  <tr key={eq.id}>
                    <td>
                      <span className="cell-title">{eq.name}</span>
                      {eq.description ? <span className="cell-sub muted">{eq.description}</span> : null}
                    </td>
                    <td>
                      <code className="patrimony-code">{eq.inventory_code}</code>
                    </td>
                    <td>
                      <EquipmentStatusPill status={eq.status} />
                    </td>
                    <td>
                      <label htmlFor={`st-${eq.id}`} className="sr-only">
                        Alterar situação de {eq.name}
                      </label>
                      <select
                        id={`st-${eq.id}`}
                        className="select-inline"
                        value={pendingStatus?.id === eq.id ? pendingStatus.to : eq.status}
                        onChange={(e) => void onStatusSelectChange(eq, e.target.value as EquipmentStatus)}
                      >
                        <option value="disponivel">Disponível</option>
                        <option value="emprestado">Emprestado</option>
                        <option value="manutencao">Manutenção</option>
                      </select>
                    </td>
                    <td>
                      <button type="button" className="btn btn-table" onClick={() => setEditing(eq)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="pending-loans-title">
        <h3 id="pending-loans-title">Solicitações pendentes</h3>
        {pendingLoans.length === 0 ? (
          <div className="empty-state empty-state-subtle">
            <p className="empty-state-text">Nenhum pedido aguardando aprovação no momento.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Pedidos de empréstimo a aprovar</caption>
              <thead>
                <tr>
                  <th scope="col">Equipamento</th>
                  <th scope="col">Tomador</th>
                  <th scope="col">Pedido em</th>
                  <th scope="col">Devolver até</th>
                  <th scope="col">Aceite do termo</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pendingLoans.map((l) => {
                  const busy = loanActionBusy === l.id
                  return (
                    <tr key={l.id}>
                      <td>{l.equipment?.name ?? '—'}</td>
                      <td>{l.borrower?.full_name ?? l.borrower?.email ?? '—'}</td>
                      <td>{fmtDateTime(l.created_at)}</td>
                      <td>{fmtDateTime(l.due_at)}</td>
                      <td>
                        {l.terms_accepted_at ? (
                          <span className="cell-sub">
                            {fmtDateTime(l.terms_accepted_at)}
                            {l.terms_version ? (
                              <>
                                {' '}
                                · versão <code className="patrimony-code">{l.terms_version}</code>
                              </>
                            ) : null}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div className="flash-actions-inline">
                          <button
                            type="button"
                            className="btn primary btn-table"
                            disabled={busy}
                            onClick={() => void approvePending(l.id)}
                          >
                            {busy ? '…' : 'Aprovar'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-table"
                            disabled={busy}
                            onClick={() => void rejectPending(l.id)}
                          >
                            Recusar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="loans-title">
        <h3 id="loans-title">Empréstimos ativos</h3>
        {active.length === 0 ? (
          <div className="empty-state empty-state-subtle">
            <p className="empty-state-text">Nenhum equipamento emprestado no momento.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Empréstimos em curso</caption>
              <thead>
                <tr>
                  <th scope="col">Equipamento</th>
                  <th scope="col">Tomador</th>
                  <th scope="col">Retirada</th>
                  <th scope="col">Devolver até</th>
                </tr>
              </thead>
              <tbody>
                {active.map((l) => {
                  const overdue = new Date(l.due_at).getTime() < Date.now()
                  return (
                    <tr key={l.id} className={overdue ? 'row-alert' : undefined}>
                      <td>{l.equipment?.name ?? '—'}</td>
                      <td>{l.borrower?.full_name ?? l.borrower?.email ?? '—'}</td>
                      <td>{fmtDateTime(l.created_at)}</td>
                      <td>
                        <span className={overdue ? 'text-alert' : undefined}>{fmtDateTime(l.due_at)}</span>
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
        {finished.length === 0 ? (
          <div className="empty-state empty-state-subtle">
            <p className="empty-state-text">Ainda não há empréstimos encerrados registrados.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Empréstimos já devolvidos</caption>
              <thead>
                <tr>
                  <th scope="col">Equipamento</th>
                  <th scope="col">Tomador</th>
                  <th scope="col">Retirada</th>
                  <th scope="col">Prazo previsto</th>
                  <th scope="col">Devolvido em</th>
                </tr>
              </thead>
              <tbody>
                {finished.map((l) => (
                  <tr key={l.id}>
                    <td>{l.equipment?.name ?? '—'}</td>
                    <td>{l.borrower?.full_name ?? l.borrower?.email ?? '—'}</td>
                    <td>{fmtDateTime(l.created_at)}</td>
                    <td>{fmtDateTime(l.due_at)}</td>
                    <td>{l.returned_at ? fmtDateTime(l.returned_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="admin-api-title">
        <h3 id="admin-api-title">Referência da API e relatório</h3>
        <p className="info-panel">
          Com o backend em execução neste computador, pode consultar rotas e esquemas em{' '}
          <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">
            http://127.0.0.1:8000/docs
          </a>{' '}
          (Swagger). Útil para alinhar o protótipo com o texto do relatório DAC ou para demonstrar integração na banca.
        </p>
        <p className="info-panel">
          Os dados exibidos nas tabelas podem ser correlacionados com as respostas JSON dos endpoints de equipamentos e
          empréstimos; não há exportação CSV nesta versão — use capturas de tela ou a documentação OpenAPI como anexo.
        </p>
      </section>

      <section className="card" aria-labelledby="admin-ops-title">
        <h3 id="admin-ops-title">Operação diária sugerida</h3>
        <ol className="info-checklist">
          <li>Abrir <strong>Solicitações pendentes</strong> e decidir a fila antes de alterar património manualmente.</li>
          <li>Rever <strong>Empréstimos ativos</strong> com prazo a expirar e avisar o tomador se necessário (fora do âmbito do sistema).</li>
          <li>Após manutenção real, voltar o item a <strong>Disponível</strong> para liberar novos pedidos.</li>
          <li>Consultar <strong>Pedidos recusados</strong> se houver dúvidas sobre pedidos duplicados ou datas inviáveis.</li>
        </ol>
      </section>

      <ConfirmDialog
        open={!!pendingStatus}
        title="Confirmar alteração de situação"
        confirmLabel="Confirmar"
        onDismiss={() => {
          if (!statusBusy) setPendingStatus(null)
        }}
        onConfirm={() => void applyStatusChange()}
        busy={statusBusy}
      >
        {pendingStatus ? (
          <p>
            Alterar <strong>{pendingStatus.name}</strong> de{' '}
            <strong>{equipmentStatusLabel(pendingStatus.from)}</strong> para{' '}
            <strong>{equipmentStatusLabel(pendingStatus.to)}</strong>?
          </p>
        ) : null}
      </ConfirmDialog>

      <section className="card" aria-labelledby="rejected-title">
        <h3 id="rejected-title">Pedidos recusados</h3>
        {rejected.length === 0 ? (
          <div className="empty-state empty-state-subtle">
            <p className="empty-state-text">Nenhum pedido recusado registrado.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Solicitações recusadas</caption>
              <thead>
                <tr>
                  <th scope="col">Equipamento</th>
                  <th scope="col">Tomador</th>
                  <th scope="col">Pedido em</th>
                  <th scope="col">Aceite do termo</th>
                </tr>
              </thead>
              <tbody>
                {rejected.map((l) => (
                  <tr key={l.id}>
                    <td>{l.equipment?.name ?? '—'}</td>
                    <td>{l.borrower?.full_name ?? l.borrower?.email ?? '—'}</td>
                    <td>{fmtDateTime(l.created_at)}</td>
                    <td>
                      {l.terms_accepted_at ? (
                        <span className="cell-sub">
                          {fmtDateTime(l.terms_accepted_at)}
                          {l.terms_version ? (
                            <>
                              {' '}
                              · <code className="patrimony-code">{l.terms_version}</code>
                            </>
                          ) : null}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <EditEquipmentDialog
        key={editing ? `eq-${editing.id}` : 'eq-closed'}
        equipment={editing}
        onDismiss={() => {
          if (!editBusy) setEditing(null)
        }}
        onSave={saveEdit}
        busy={editBusy}
      />
    </div>
  )
}
