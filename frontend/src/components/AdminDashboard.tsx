import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { equipmentApi, loansApi } from '../api'
import type { Equipment, EquipmentStatus, Loan } from '../types'
import { ADMIN_BUSINESS_RULES } from '../constants/businessRules'
import { BusinessRulesPanel } from './BusinessRulesPanel'
import { ConfirmDialog } from './ConfirmDialog'
import { EmptyState } from './dashboard/EmptyState'
import { KpiStrip } from './dashboard/KpiStrip'
import { PageAlerts } from './dashboard/PageAlerts'
import { PageHeader } from './dashboard/PageHeader'
import {
  DataCardFooter,
  DataCardRow,
  ResponsiveDataView,
} from './dashboard/ResponsiveDataView'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from './dashboard/DashboardLayout'
import { SectionCard } from './dashboard/SectionCard'
import { DashboardSkeleton } from './DashboardSkeleton'
import { EditEquipmentDialog } from './EditEquipmentDialog'
import { EquipmentStatusPill } from './StatusPill'
import { equipmentStatusLabel } from '../labels/equipmentStatus'
import { fmtApprovedAt, fmtDateOnly, fmtDateTime } from '../utils/date'
import { fmtBrl, loanDaysOverdue, loanEquipmentBlocked, loanFineAmount, loanIsOverdue } from '../utils/overdue'
import { FINE_PER_DAY_BRL } from '../constants/overdue'

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
  const [notifyBusy, setNotifyBusy] = useState<number | null>(null)
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

  const overdueActive = useMemo(
    () => active.filter((l) => loanIsOverdue(l)),
    [active],
  )

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
      overdueLoans: overdueActive.length,
      historyLoans: finished.length + rejected.length,
    }
  }, [equipment, pendingLoans, active, finished, rejected, overdueActive])

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

  async function notifyOverdue(loanId: number) {
    setNotifyBusy(loanId)
    setMsg(null)
    setErr(null)
    try {
      await loansApi.notifyOverdue(loanId)
      setMsg('Notificação de atraso enviada ao tomador.')
    } catch (er) {
      setErr(er instanceof Error ? er.message : 'Erro ao notificar')
    } finally {
      setNotifyBusy(null)
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

  const headerSubtitle = `${equipment.length} ${equipment.length === 1 ? 'item' : 'itens'} · ${
    pendingLoans.length === 0
      ? 'nenhuma solicitação pendente'
      : pendingLoans.length === 1
        ? '1 solicitação pendente'
        : `${pendingLoans.length} solicitações pendentes`
  } · ${
    active.length === 0
      ? 'nenhum empréstimo ativo'
      : active.length === 1
        ? '1 empréstimo ativo'
        : `${active.length} empréstimos ativos`
  }`

  const kpiItems = useMemo(
    () => [
      { label: 'Itens no acervo', value: adminStats.total, hint: 'Total cadastrado' },
      {
        label: 'Disponíveis',
        value: adminStats.disponivel,
        hint: 'Podem receber pedido',
        variant: 'ok' as const,
      },
      {
        label: 'Pedidos pendentes',
        value: adminStats.pendingLoans,
        hint: 'Aguardam decisão',
        variant: adminStats.pendingLoans ? ('warn' as const) : ('default' as const),
      },
      {
        label: 'Empréstimos ativos',
        value: adminStats.activeLoans,
        hint: 'Em curso com tomador',
      },
      {
        label: 'Em atraso',
        value: adminStats.overdueLoans,
        hint: `Multa R$ ${FINE_PER_DAY_BRL}/dia`,
        variant: adminStats.overdueLoans ? ('danger' as const) : ('default' as const),
      },
    ],
    [adminStats],
  )

  if (loading) {
    return <DashboardSkeleton variant="admin" />
  }

  return (
    <DashboardLayout animateKey={hasLoadedOnce ? 'ready' : 'loading'}>
      <PageHeader
        title="Patrimônio e empréstimos"
        subtitle={headerSubtitle}
        role="admin"
        refreshing={refreshing}
        lastLoadedAt={lastLoadedAt}
        onRefresh={() => void load({ silent: true })}
      />

      <PageAlerts
        msg={msg}
        err={err}
        onDismissMsg={() => setMsg(null)}
        onDismissErr={() => setErr(null)}
        onRetry={() => void load()}
      />

      <KpiStrip items={kpiItems} layout="admin" />

      <div className="dashboard-queue-grid">
        <SectionCard
          id="pending-loans"
          title="Solicitações pendentes"
          badge={pendingLoans.length || undefined}
          badgeVariant={pendingLoans.length ? 'warn' : 'default'}
        >
          <ResponsiveDataView
            caption="Pedidos de empréstimo a aprovar"
            rows={pendingLoans}
            rowKey={(l) => l.id}
            columns={[
              { key: 'eq', header: 'Equipamento', render: (l) => l.equipment?.name ?? '—' },
              {
                key: 'borrower',
                header: 'Tomador',
                render: (l) => l.borrower?.full_name ?? l.borrower?.email ?? '—',
              },
              { key: 'created', header: 'Pedido em', render: (l) => fmtDateTime(l.created_at) },
              { key: 'pickup', header: 'Retirada', priority: 'low', render: (l) => fmtDateOnly(l.pickup_at) },
              { key: 'due', header: 'Devolução', priority: 'low', render: (l) => fmtDateOnly(l.due_at) },
              {
                key: 'actions',
                header: 'Ações',
                render: (l) => {
                  const busy = loanActionBusy === l.id
                  return (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" disabled={busy} onClick={() => void approvePending(l.id)}>
                        {busy ? '…' : 'Aprovar'}
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => void rejectPending(l.id)}>
                        Recusar
                      </Button>
                    </div>
                  )
                },
              },
            ]}
            empty={
              <EmptyState
                subtle
                text="Nenhum pedido aguardando aprovação no momento."
              />
            }
            renderCard={(l) => {
              const busy = loanActionBusy === l.id
              return (
                <>
                  <DataCardRow label="Equipamento">{l.equipment?.name ?? '—'}</DataCardRow>
                  <DataCardRow label="Tomador">
                    {l.borrower?.full_name ?? l.borrower?.email ?? '—'}
                  </DataCardRow>
                  <DataCardRow label="Pedido em">{fmtDateTime(l.created_at)}</DataCardRow>
                  <DataCardRow label="Retirada">{fmtDateOnly(l.pickup_at)}</DataCardRow>
                  <DataCardRow label="Devolução">{fmtDateOnly(l.due_at)}</DataCardRow>
                  <DataCardFooter>
                    <Button size="sm" disabled={busy} onClick={() => void approvePending(l.id)}>
                      {busy ? '…' : 'Aprovar'}
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => void rejectPending(l.id)}>
                      Recusar
                    </Button>
                  </DataCardFooter>
                </>
              )
            }}
          />
        </SectionCard>

        <SectionCard
          id="loans-active"
          title="Empréstimos ativos"
          badge={active.length || undefined}
          badgeVariant={adminStats.overdueLoans ? 'danger' : 'default'}
        >
          <ResponsiveDataView
            caption="Empréstimos em curso"
            rows={active}
            rowKey={(l) => l.id}
            rowClassName={(l) => (loanIsOverdue(l) ? 'row-alert' : undefined)}
            columns={[
              { key: 'eq', header: 'Equipamento', render: (l) => l.equipment?.name ?? '—' },
              {
                key: 'borrower',
                header: 'Tomador',
                render: (l) => l.borrower?.full_name ?? l.borrower?.email ?? '—',
              },
              { key: 'approved', header: 'Retirada efetiva', render: (l) => fmtApprovedAt(l.approved_at) },
              {
                key: 'due',
                header: 'Devolver até',
                render: (l) => {
                  const overdue = loanIsOverdue(l)
                  return (
                    <span className={overdue ? 'text-alert' : undefined}>{fmtDateOnly(l.due_at)}</span>
                  )
                },
              },
              {
                key: 'overdue',
                header: 'Atraso',
                priority: 'low',
                render: (l) => {
                  const overdue = loanIsOverdue(l)
                  const days = loanDaysOverdue(l)
                  return overdue ? `${days} dia${days === 1 ? '' : 's'}` : '—'
                },
              },
              {
                key: 'fine',
                header: 'Multa',
                priority: 'low',
                render: (l) => (loanIsOverdue(l) ? fmtBrl(loanFineAmount(l)) : '—'),
              },
              {
                key: 'block',
                header: 'Bloqueio',
                priority: 'low',
                render: (l) =>
                  loanEquipmentBlocked(l) ? (
                    <span className="pill pill-danger">Bloqueado</span>
                  ) : (
                    <span className="pill pill-ok">Liberado</span>
                  ),
              },
              {
                key: 'action',
                header: 'Ação',
                render: (l) => {
                  const overdue = loanIsOverdue(l)
                  const notifying = notifyBusy === l.id
                  return overdue ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={notifying}
                      onClick={() => void notifyOverdue(l.id)}
                    >
                      {notifying ? '…' : 'Notificar'}
                    </Button>
                  ) : (
                    '—'
                  )
                },
              },
            ]}
            empty={<EmptyState subtle text="Nenhum equipamento emprestado no momento." />}
            renderCard={(l) => {
              const overdue = loanIsOverdue(l)
              const days = loanDaysOverdue(l)
              const fine = loanFineAmount(l)
              const blocked = loanEquipmentBlocked(l)
              const notifying = notifyBusy === l.id
              return (
                <>
                  <DataCardRow label="Equipamento">{l.equipment?.name ?? '—'}</DataCardRow>
                  <DataCardRow label="Tomador">
                    {l.borrower?.full_name ?? l.borrower?.email ?? '—'}
                  </DataCardRow>
                  <DataCardRow label="Devolver até">
                    <span className={overdue ? 'text-alert' : undefined}>{fmtDateOnly(l.due_at)}</span>
                  </DataCardRow>
                  {overdue ? (
                    <>
                      <DataCardRow label="Atraso">{`${days} dia${days === 1 ? '' : 's'}`}</DataCardRow>
                      <DataCardRow label="Multa">{fmtBrl(fine)}</DataCardRow>
                    </>
                  ) : null}
                  <DataCardRow label="Bloqueio">
                    {blocked ? (
                      <span className="pill pill-danger">Bloqueado</span>
                    ) : (
                      <span className="pill pill-ok">Liberado</span>
                    )}
                  </DataCardRow>
                  {overdue ? (
                    <DataCardFooter>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={notifying}
                        onClick={() => void notifyOverdue(l.id)}
                      >
                        {notifying ? '…' : 'Notificar tomador'}
                      </Button>
                    </DataCardFooter>
                  ) : null}
                </>
              )
            }}
          />
        </SectionCard>
      </div>

      {adminStats.total > 0 ? (
        <SectionCard id="admin-dist" title="Distribuição do acervo" className="card--compact">
          <div className="metric-bars-inline">
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
          </div>
        </SectionCard>
      ) : null}

      <SectionCard id="new-eq" title="Incluir item no acervo">
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
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : 'Cadastrar item'}
          </Button>
        </form>
      </SectionCard>

      <SectionCard id="eq-list" title="Itens cadastrados" badge={equipment.length || undefined}>
        <div className="stack equipment-search-block">
          <label htmlFor="eq-search">Buscar no acervo</label>
          <div className="equipment-search-wrap">
            <svg className="equipment-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              id="eq-search"
              type="search"
              autoComplete="off"
              placeholder="Nome, patrimônio ou observação…"
              value={equipmentSearch}
              onChange={(e) => setEquipmentSearch(e.target.value)}
            />
          </div>
        </div>
        {!hasLoadedOnce && err ? (
          <p className="muted section-retry-hint">Lista indisponível até a conexão com a API ser restabelecida.</p>
        ) : hasLoadedOnce && equipment.length === 0 ? (
          <EmptyState
            title="Acervo vazio"
            text="Cadastre o primeiro equipamento usando o formulário acima."
          />
        ) : hasLoadedOnce && filteredEquipment.length === 0 ? (
          <EmptyState subtle text="Nenhum item corresponde à busca. Limpe o filtro ou tente outro termo." />
        ) : (
          <ul className="equipment-acervo-grid">
            {filteredEquipment.map((eq) => (
              <li key={eq.id} className="equipment-acervo-card">
                <div className="equipment-acervo-card-head">
                  <div>
                    <span className="cell-title">{eq.name}</span>
                    {eq.description ? <p className="cell-sub muted tiny">{eq.description}</p> : null}
                  </div>
                  <EquipmentStatusPill status={eq.status} />
                </div>
                <code className="patrimony-code">{eq.inventory_code}</code>
                <div className="equipment-acervo-card-actions">
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
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(eq)}>
                    Editar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        id="history"
        title="Histórico de empréstimos"
        badge={finished.length || undefined}
        defaultCollapsed
      >
        <ResponsiveDataView
          caption="Empréstimos já devolvidos"
          rows={finished}
          rowKey={(l) => l.id}
          columns={[
            { key: 'eq', header: 'Equipamento', render: (l) => l.equipment?.name ?? '—' },
            {
              key: 'borrower',
              header: 'Tomador',
              render: (l) => l.borrower?.full_name ?? l.borrower?.email ?? '—',
            },
            { key: 'approved', header: 'Retirada efetiva', render: (l) => fmtApprovedAt(l.approved_at) },
            { key: 'due', header: 'Devolução prevista', priority: 'low', render: (l) => fmtDateOnly(l.due_at) },
            {
              key: 'returned',
              header: 'Devolvido em',
              render: (l) => (l.returned_at ? fmtDateTime(l.returned_at) : '—'),
            },
          ]}
          empty={<EmptyState subtle text="Ainda não há empréstimos encerrados registrados." />}
          renderCard={(l) => (
            <>
              <DataCardRow label="Equipamento">{l.equipment?.name ?? '—'}</DataCardRow>
              <DataCardRow label="Tomador">
                {l.borrower?.full_name ?? l.borrower?.email ?? '—'}
              </DataCardRow>
              <DataCardRow label="Devolvido em">
                {l.returned_at ? fmtDateTime(l.returned_at) : '—'}
              </DataCardRow>
            </>
          )}
        />
      </SectionCard>

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

      <SectionCard
        id="rejected"
        title="Pedidos recusados"
        badge={rejected.length || undefined}
        defaultCollapsed
      >
        <ResponsiveDataView
          caption="Solicitações recusadas"
          rows={rejected}
          rowKey={(l) => l.id}
          columns={[
            { key: 'eq', header: 'Equipamento', render: (l) => l.equipment?.name ?? '—' },
            {
              key: 'borrower',
              header: 'Tomador',
              render: (l) => l.borrower?.full_name ?? l.borrower?.email ?? '—',
            },
            { key: 'created', header: 'Pedido em', render: (l) => fmtDateTime(l.created_at) },
            { key: 'pickup', header: 'Retirada', priority: 'low', render: (l) => fmtDateOnly(l.pickup_at) },
            { key: 'due', header: 'Devolução', priority: 'low', render: (l) => fmtDateOnly(l.due_at) },
          ]}
          empty={<EmptyState subtle text="Nenhum pedido recusado registrado." />}
          renderCard={(l) => (
            <>
              <DataCardRow label="Equipamento">{l.equipment?.name ?? '—'}</DataCardRow>
              <DataCardRow label="Tomador">
                {l.borrower?.full_name ?? l.borrower?.email ?? '—'}
              </DataCardRow>
              <DataCardRow label="Pedido em">{fmtDateTime(l.created_at)}</DataCardRow>
            </>
          )}
        />
      </SectionCard>

      <div id="admin-rules">
        <BusinessRulesPanel role="admin" sections={ADMIN_BUSINESS_RULES} />
      </div>

      <EditEquipmentDialog
        key={editing ? `eq-${editing.id}` : 'eq-closed'}
        equipment={editing}
        onDismiss={() => {
          if (!editBusy) setEditing(null)
        }}
        onSave={saveEdit}
        busy={editBusy}
      />
    </DashboardLayout>
  )
}
