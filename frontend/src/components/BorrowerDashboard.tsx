import { useCallback, useEffect, useMemo, useState } from 'react'
import { equipmentApi, loansApi, notificationsApi } from '../api'
import type { LoanNotification } from '../types'
import { BORROWER_BUSINESS_RULES } from '../constants/businessRules'
import { LOAN_TERMS_VERSION } from '../constants/terms'
import type { Equipment, Loan } from '../types'
import { BusinessRulesPanel } from './BusinessRulesPanel'
import { ConfirmDialog } from './ConfirmDialog'
import { EmptyState } from './dashboard/EmptyState'
import { EquipmentCatalogCard } from './dashboard/EquipmentCatalogCard'
import { KpiStrip } from './dashboard/KpiStrip'
import { PageAlerts } from './dashboard/PageAlerts'
import { PageHeader } from './dashboard/PageHeader'
import {
  DataCardFooter,
  DataCardRow,
  ResponsiveDataView,
} from './dashboard/ResponsiveDataView'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from './dashboard/DashboardLayout'
import { SectionCard } from './dashboard/SectionCard'
import { DashboardSkeleton } from './DashboardSkeleton'
import { EquipmentDetailDialog } from './EquipmentDetailDialog'
import { LoanRequestDialog } from './LoanRequestDialog'
import { LoanSituationPill } from './StatusPill'
import { FINE_PER_DAY_BRL } from '../constants/overdue'
import { dateInputToUtcIso, fmtDateOnly, fmtDateTime } from '../utils/date'
import { fmtBrl, loanEquipmentBlocked, loanFineAmount, loanIsOverdue, totalOverdueFine } from '../utils/overdue'

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
  const [notifications, setNotifications] = useState<LoanNotification[]>([])

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false
    if (!silent) setErr(null)
    if (silent) setRefreshing(true)
    try {
      const [a, m, notes] = await Promise.all([
        equipmentApi.list('disponivel'),
        loansApi.mine(),
        notificationsApi.mine(),
      ])
      setAvailable(a)
      setMine(m)
      setNotifications(notes)
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
    () => activeLoans.filter((l) => loanIsOverdue(l)).length,
    [activeLoans],
  )

  const borrowerBlocked = useMemo(
    () => mine.some((l) => l.borrower_blocked) || overdueCount > 0,
    [mine, overdueCount],
  )

  const totalFine = useMemo(() => totalOverdueFine(activeLoans), [activeLoans])

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read_at),
    [notifications],
  )

  async function markNotificationRead(id: number) {
    try {
      await notificationsApi.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      )
    } catch {
      /* silencioso — lista atualiza no próximo poll */
    }
  }

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

  const headerSubtitle = `${
    available.length === 0
      ? 'Nenhum equipamento disponível para novo pedido'
      : available.length === 1
        ? '1 equipamento disponível para novo pedido'
        : `${available.length} equipamentos disponíveis para novo pedido`
  } · ${
    pendingLoans.length === 0
      ? 'nenhuma solicitação aguardando aprovação'
      : pendingLoans.length === 1
        ? '1 solicitação aguardando aprovação'
        : `${pendingLoans.length} solicitações aguardando aprovação`
  } · ${
    activeLoans.length === 0
      ? 'nenhum empréstimo ativo'
      : activeLoans.length === 1
        ? '1 empréstimo ativo'
        : `${activeLoans.length} empréstimos ativos`
  }`

  const kpiItems = useMemo(
    () => [
      {
        label: 'Disponíveis agora',
        value: available.length,
        hint: 'Itens que aceitam novo pedido',
        variant: 'ok' as const,
      },
      {
        label: 'Aguardando aprovação',
        value: pendingLoans.length,
        hint: 'Pedidos enviados ao administrador',
        variant: pendingLoans.length ? ('warn' as const) : ('default' as const),
      },
      {
        label: 'Empréstimos ativos',
        value: activeLoans.length,
        hint: 'Em uso após aprovação',
      },
      {
        label: 'Em atraso',
        value: overdueCount,
        hint: overdueCount > 0 ? `Multa ${fmtBrl(totalFine)} · bloqueio ativo` : 'Prazo ultrapassado',
        variant: overdueCount ? ('danger' as const) : ('default' as const),
      },
    ],
    [available.length, pendingLoans.length, activeLoans.length, overdueCount, totalFine],
  )

  if (loading) {
    return <DashboardSkeleton variant="borrower" />
  }

  return (
    <DashboardLayout animateKey={hasLoadedOnce ? 'ready' : 'loading'}>
      <PageHeader
        title="Meus empréstimos"
        subtitle={headerSubtitle}
        role="borrower"
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

      {borrowerBlocked ? (
        <Alert variant="destructive" className="dash-enter flex gap-3 border-destructive/40 shadow-sm">
          <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <div className="min-w-0 space-y-1">
            <AlertTitle>Conta com empréstimo em atraso</AlertTitle>
            <AlertDescription className="text-destructive/90">
              {overdueCount > 0 ? (
                <>
                  {overdueCount === 1 ? 'Há 1 empréstimo' : `Há ${overdueCount} empréstimos`} com prazo vencido.
                  Multa acumulada: <strong>{fmtBrl(totalFine)}</strong> ({fmtBrl(FINE_PER_DAY_BRL)} por dia).
                  O(s) equipamento(s) está(ão) <strong>bloqueado(s)</strong> e novos pedidos ficam suspensos até a
                  devolução.
                </>
              ) : (
                <>Novos pedidos suspensos por pendência de regularização.</>
              )}
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      {unreadNotifications.length > 0 ? (
        <SectionCard
          id="notifications"
          title="Notificações do NRDT"
          badge={unreadNotifications.length}
          badgeVariant="danger"
          className="notification-panel"
        >
          <ul className="notification-list">
            {unreadNotifications.map((n) => (
              <li key={n.id} className="notification-item notification-item--unread">
                <p className="notification-message">{n.message}</p>
                <p className="notification-meta muted tiny">
                  {fmtDateTime(n.created_at)}
                  {n.equipment_blocked ? ' · Equipamento bloqueado' : ''}
                  {n.fine_amount > 0 ? ` · Multa ${fmtBrl(n.fine_amount)}` : ''}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => void markNotificationRead(n.id)}>
                  Marcar como lida
                </Button>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      {notifications.filter((n) => n.read_at).length > 0 && unreadNotifications.length === 0 ? (
        <p className="muted tiny notification-read-hint">
          Notificações anteriores já foram lidas. Em caso de novo atraso, a coordenação pode enviar outro alerta.
        </p>
      ) : null}

      <KpiStrip items={kpiItems} layout="borrower" />

      <SectionCard
        id="avail-catalog"
        title="Equipamentos disponíveis"
        badge={available.length || undefined}
        description={
          borrowerBlocked
            ? 'Pedidos suspensos: regularize o empréstimo em atraso antes de solicitar outro item.'
            : 'Ver ficha para detalhes · Solicitar empréstimo abre o assistente em 2 passos (datas e termo).'
        }
        descriptionClassName={
          borrowerBlocked ? 'section-card-desc text-alert' : 'section-card-desc'
        }
      >
        {!hasLoadedOnce && err ? (
          <p className="muted section-retry-hint">Não foi possível carregar o acervo.</p>
        ) : hasLoadedOnce && available.length === 0 ? (
          <EmptyState
            title="Nada disponível para novo pedido"
            subtle
            text="Os itens podem estar em manutenção, com pedido pendente ou emprestados. Atualize em instantes."
          />
        ) : (
          <ul className="equipment-catalog-grid">
            {available.map((eq) => (
              <li key={eq.id}>
                <EquipmentCatalogCard
                  equipment={eq}
                  onShowDetail={() => setDetailEquipment(eq)}
                  onStartRequest={() => setRequestEquipment(eq)}
                  requestDisabled={borrowerBlocked}
                  requestDisabledTitle="Há empréstimo em atraso. Registre a devolução antes de um novo pedido."
                />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        id="pending"
        title="Aguardando aprovação"
        badge={pendingLoans.length || undefined}
        badgeVariant={pendingLoans.length ? 'warn' : 'default'}
      >
        {!hasLoadedOnce && err ? (
          <p className="muted section-retry-hint">Lista indisponível no momento.</p>
        ) : (
          <ResponsiveDataView
            caption="Solicitações pendentes"
            rows={pendingLoans}
            rowKey={(l) => l.id}
            columns={[
              { key: 'eq', header: 'Equipamento', render: (l) => l.equipment?.name ?? '—' },
              {
                key: 'pat',
                header: 'Patrimônio',
                render: (l) =>
                  l.equipment?.inventory_code ? (
                    <code className="patrimony-code">{l.equipment.inventory_code}</code>
                  ) : (
                    '—'
                  ),
              },
              { key: 'created', header: 'Pedido em', render: (l) => fmtDateTime(l.created_at) },
              { key: 'pickup', header: 'Retirada', priority: 'low', render: (l) => fmtDateOnly(l.pickup_at) },
              { key: 'due', header: 'Devolução', priority: 'low', render: (l) => fmtDateOnly(l.due_at) },
              {
                key: 'status',
                header: 'Situação',
                render: (l) => <LoanSituationPill status={l.status} />,
              },
            ]}
            empty={
              <EmptyState
                subtle
                text="Quando enviar um pedido, ele aparecerá aqui até o administrador decidir."
              />
            }
            renderCard={(l) => (
              <>
                <DataCardRow label="Equipamento">{l.equipment?.name ?? '—'}</DataCardRow>
                <DataCardRow label="Patrimônio">
                  {l.equipment?.inventory_code ? (
                    <code className="patrimony-code">{l.equipment.inventory_code}</code>
                  ) : (
                    '—'
                  )}
                </DataCardRow>
                <DataCardRow label="Pedido em">{fmtDateTime(l.created_at)}</DataCardRow>
                <DataCardRow label="Situação">
                  <LoanSituationPill status={l.status} />
                </DataCardRow>
              </>
            )}
          />
        )}
      </SectionCard>

      <SectionCard
        id="active"
        title="Meus empréstimos ativos"
        badge={activeLoans.length || undefined}
        badgeVariant={overdueCount ? 'danger' : 'default'}
      >
        {!hasLoadedOnce && err ? (
          <p className="muted section-retry-hint">Lista indisponível no momento.</p>
        ) : (
          <ResponsiveDataView
            caption="Empréstimos em curso"
            rows={activeLoans}
            rowKey={(l) => l.id}
            rowClassName={(l) => (loanIsOverdue(l) ? 'row-alert' : undefined)}
            columns={[
              { key: 'eq', header: 'Equipamento', render: (l) => l.equipment?.name ?? '—' },
              {
                key: 'pat',
                header: 'Patrimônio',
                priority: 'low',
                render: (l) =>
                  l.equipment?.inventory_code ? (
                    <code className="patrimony-code">{l.equipment.inventory_code}</code>
                  ) : (
                    '—'
                  ),
              },
              { key: 'due', header: 'Devolver até', render: (l) => {
                const overdue = loanIsOverdue(l)
                return (
                  <span className={overdue ? 'text-alert' : undefined}>{fmtDateOnly(l.due_at)}</span>
                )
              }},
              {
                key: 'fine',
                header: 'Multa',
                priority: 'low',
                render: (l) => (loanIsOverdue(l) ? fmtBrl(loanFineAmount(l)) : '—'),
              },
              {
                key: 'status',
                header: 'Situação',
                render: (l) => <LoanSituationPill status={l.status} overdue={loanIsOverdue(l)} />,
              },
              {
                key: 'action',
                header: 'Ação',
                render: (l) => (
                  <Button type="button" size="sm" onClick={() => setReturnConfirm(l)}>
                    Devolver
                  </Button>
                ),
              },
            ]}
            empty={
              <EmptyState
                subtle
                text="Após a aprovação do administrador, o empréstimo ativo aparecerá aqui com prazo e opção de devolução."
              />
            }
            renderCard={(l) => {
              const overdue = loanIsOverdue(l)
              const fine = loanFineAmount(l)
              const blocked = loanEquipmentBlocked(l)
              return (
                <>
                  <DataCardRow label="Equipamento">{l.equipment?.name ?? '—'}</DataCardRow>
                  <DataCardRow label="Devolver até">
                    <span className={overdue ? 'text-alert' : undefined}>{fmtDateOnly(l.due_at)}</span>
                  </DataCardRow>
                  {overdue ? <DataCardRow label="Multa">{fmtBrl(fine)}</DataCardRow> : null}
                  <DataCardRow label="Bloqueio">
                    {blocked ? (
                      <span className="pill pill-danger">Bloqueado</span>
                    ) : (
                      <span className="pill pill-ok">—</span>
                    )}
                  </DataCardRow>
                  <DataCardFooter>
                    <Button type="button" size="sm" onClick={() => setReturnConfirm(l)}>
                      Devolver
                    </Button>
                  </DataCardFooter>
                </>
              )
            }}
          />
        )}
      </SectionCard>

      <SectionCard
        id="history"
        title="Histórico de empréstimos"
        badge={historyLoans.length || undefined}
        defaultCollapsed
      >
        {!hasLoadedOnce && err ? (
          <p className="muted section-retry-hint">Histórico indisponível no momento.</p>
        ) : (
          <ResponsiveDataView
            caption="Histórico"
            rows={historyLoans}
            rowKey={(l) => l.id}
            columns={[
              { key: 'eq', header: 'Equipamento', render: (l) => l.equipment?.name ?? '—' },
              {
                key: 'pat',
                header: 'Patrimônio',
                priority: 'low',
                render: (l) =>
                  l.equipment?.inventory_code ? (
                    <code className="patrimony-code">{l.equipment.inventory_code}</code>
                  ) : (
                    '—'
                  ),
              },
              { key: 'created', header: 'Pedido em', priority: 'low', render: (l) => fmtDateTime(l.created_at) },
              {
                key: 'status',
                header: 'Situação',
                render: (l) => <LoanSituationPill status={l.status} />,
              },
              {
                key: 'returned',
                header: 'Devolvido em',
                render: (l) => (l.returned_at ? fmtDateTime(l.returned_at) : '—'),
              },
            ]}
            empty={
              <EmptyState subtle text="Empréstimos encerrados ou recusados aparecerão aqui." />
            }
            renderCard={(l) => (
              <>
                <DataCardRow label="Equipamento">{l.equipment?.name ?? '—'}</DataCardRow>
                <DataCardRow label="Situação">
                  <LoanSituationPill status={l.status} />
                </DataCardRow>
                <DataCardRow label="Devolvido em">
                  {l.returned_at ? fmtDateTime(l.returned_at) : '—'}
                </DataCardRow>
              </>
            )}
          />
        )}
      </SectionCard>

      <div id="borrow-rules">
        <BusinessRulesPanel role="borrower" sections={BORROWER_BUSINESS_RULES} />
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
    </DashboardLayout>
  )
}
