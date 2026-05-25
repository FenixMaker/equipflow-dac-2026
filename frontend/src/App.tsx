import { useCallback, useEffect, useState } from 'react'
import { authApi } from './api'
import { AdminDashboard } from './components/AdminDashboard'
import { BorrowerDashboard } from './components/BorrowerDashboard'
import { LoginForm } from './components/LoginForm'
import { AppSidebarNav } from './components/AppSidebarNav'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './components/ThemeToggle'
import { ADMIN_SIDEBAR_NAV, BORROWER_SIDEBAR_NAV } from './constants/sidebarNav'
import type { User } from './types'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(!!localStorage.getItem('equipflow_token'))

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('equipflow_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await authApi.me()
      setUser(me)
    } catch {
      setUser(null)
      localStorage.removeItem('equipflow_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  useEffect(() => {
    if (loading) {
      document.title = 'EquipFlow · Carregando'
      return
    }
    if (!user) {
      document.title = 'EquipFlow · Entrar'
      return
    }
    document.title =
      user.role === 'admin' ? 'EquipFlow · Administração' : 'EquipFlow · Meus empréstimos'
  }, [loading, user])

  function logout() {
    localStorage.removeItem('equipflow_token')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="loading-screen" role="status" aria-live="polite">
        <img
          src="/brand/logo-icone.png"
          alt=""
          className="brand-mark brand-mark--loading"
          width={48}
          height={48}
          decoding="async"
          aria-hidden="true"
        />
        <div className="loading-bar" aria-hidden="true" />
        <p className="loading-text">EquipFlow</p>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <a href="#login-main" className="skip-link">
          Ir para o conteúdo
        </a>
        <div className="auth-page auth-page--split">
          <LoginForm onLoggedIn={() => void refreshUser()} />
        </div>
      </>
    )
  }

  const roleLabel = user.role === 'admin' ? 'Administração de acervo' : 'Solicitação de equipamentos'

  const initials = user.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'

  return (
    <div className="app-layout">
      <a href="#conteudo-principal" className="skip-link">
        Ir para o conteúdo
      </a>
      <aside
        className="app-sidebar bg-sidebar text-sidebar-foreground border-sidebar-border flex w-60 shrink-0 flex-col border-r"
        aria-label="Aplicação"
      >
        <div className="app-sidebar-brand">
          <img
            src="/brand/logo-icone.png"
            alt=""
            className="brand-mark brand-mark--sidebar"
            width={36}
            height={36}
            decoding="async"
            aria-hidden="true"
          />
          <div className="app-sidebar-brand-text">
            <strong className="app-sidebar-title">EquipFlow</strong>
            <span className="app-sidebar-role">{roleLabel}</span>
          </div>
        </div>
        <div className="app-sidebar-user-row">
          <span className="app-sidebar-avatar" aria-hidden="true">
            {initials}
          </span>
          <p className="app-sidebar-user" title={user.email}>
            {user.full_name}
          </p>
        </div>
        <AppSidebarNav items={user.role === 'admin' ? ADMIN_SIDEBAR_NAV : BORROWER_SIDEBAR_NAV} />
        <div className="app-sidebar-footer">
          <div className="app-sidebar-actions">
            <ThemeToggle />
            <Button type="button" variant="ghost" className="app-sidebar-logout w-full" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <main id="conteudo-principal" className="app-main-inner" tabIndex={-1}>
          {user.role === 'admin' ? <AdminDashboard /> : <BorrowerDashboard />}
        </main>
        <footer className="footer app-footer">
          <details className="footer-details">
            <summary className="footer-summary muted tiny">Sobre o EquipFlow</summary>
            <p className="footer-about-body muted tiny">
              Aplicação web (React e API REST) para empréstimo de equipamentos do NRDT — trabalho da
              DAC 2026, com dados fictícios. Não substitui sistemas oficiais da UCDB.
            </p>
          </details>
        </footer>
      </div>
    </div>
  )
}
