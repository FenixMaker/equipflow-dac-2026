export type SidebarNavIcon =
  | 'pending'
  | 'active'
  | 'rules'
  | 'add'
  | 'inventory'
  | 'history'
  | 'rejected'
  | 'catalog'
  | 'notifications'

export type SidebarNavItem = {
  label: string
  href: string
  icon: SidebarNavIcon
}

export const ADMIN_SIDEBAR_NAV: SidebarNavItem[] = [
  { label: 'Pendentes', href: '#pending-loans', icon: 'pending' },
  { label: 'Empréstimos ativos', href: '#loans-active', icon: 'active' },
  { label: 'Distribuição', href: '#admin-dist', icon: 'inventory' },
  { label: 'Novo item', href: '#new-eq', icon: 'add' },
  { label: 'Acervo', href: '#eq-list', icon: 'inventory' },
  { label: 'Regras NRDT', href: '#admin-rules', icon: 'rules' },
  { label: 'Histórico', href: '#history', icon: 'history' },
  { label: 'Recusados', href: '#rejected', icon: 'rejected' },
]

export const BORROWER_SIDEBAR_NAV: SidebarNavItem[] = [
  { label: 'Catálogo', href: '#avail-catalog', icon: 'catalog' },
  { label: 'Aguardando', href: '#pending', icon: 'pending' },
  { label: 'Ativos', href: '#active', icon: 'active' },
  { label: 'Regras NRDT', href: '#borrow-rules', icon: 'rules' },
  { label: 'Histórico', href: '#history', icon: 'history' },
]
