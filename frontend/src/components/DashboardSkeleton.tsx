export function DashboardSkeleton() {
  return (
    <div className="stack gap-lg skeleton-root" aria-busy="true" aria-label="Carregando painel">
      <div className="skeleton-block skeleton-title" />
      <div className="skeleton-block skeleton-line wide" />
      <div className="stat-grid" aria-hidden="true">
        <div className="skeleton-block skeleton-stat" />
        <div className="skeleton-block skeleton-stat" />
        <div className="skeleton-block skeleton-stat" />
        <div className="skeleton-block skeleton-stat" />
      </div>
      <div className="card skeleton-card">
        <div className="skeleton-block skeleton-h3" />
        <div className="skeleton-block skeleton-line" />
        <div className="skeleton-block skeleton-line medium" />
      </div>
      <div className="card skeleton-card">
        <div className="skeleton-block skeleton-h3" />
        <div className="skeleton-rows">
          <div className="skeleton-block skeleton-row" />
          <div className="skeleton-block skeleton-row" />
          <div className="skeleton-block skeleton-row" />
        </div>
      </div>
    </div>
  )
}
