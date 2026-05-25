import type { ReactNode } from 'react'
import { useDashboardEntrance } from '../../hooks/useDashboardEntrance'

type Props = {
  children: ReactNode
  /** Muda quando o painel termina de carregar (ex.: loading → false) */
  animateKey?: string | number | boolean
}

export function DashboardLayout({ children, animateKey }: Props) {
  const rootRef = useDashboardEntrance([animateKey])

  return (
    <div ref={rootRef} className="dashboard-layout stack gap-lg">
      {children}
    </div>
  )
}
