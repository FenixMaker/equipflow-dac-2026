import { useCallback, useEffect, useState } from 'react'
import { authApi } from './api'
import { AdminDashboard } from './components/AdminDashboard'
import { BorrowerDashboard } from './components/BorrowerDashboard'
import { LoginForm } from './components/LoginForm'
import { ThemeToggle } from './components/ThemeToggle'
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
        <div className="auth-page">
          <header className="auth-portal-header">
            <div className="auth-portal-brand">
              <img
                src="/brand/logo-icone.png"
                alt=""
                className="brand-mark brand-mark--header"
                width={36}
                height={36}
                decoding="async"
                aria-hidden="true"
              />
              <div className="auth-portal-brand-text">
                <span className="auth-portal-name">EquipFlow</span>
                <span className="auth-portal-meta muted tiny">NRDT · acesso interno · DAC 2026</span>
              </div>
            </div>
            <ThemeToggle />
          </header>
          <div className="auth-wrap">
            <LoginForm onLoggedIn={() => void refreshUser()} />
          </div>
        </div>
      </>
    )
  }

  const roleLabel = user.role === 'admin' ? 'Administração de acervo' : 'Solicitação de equipamentos'

  return (
    <div className="app-layout">
      <a href="#conteudo-principal" className="skip-link">
        Ir para o conteúdo
      </a>
      <aside className="app-sidebar" aria-label="Aplicação">
        <div className="app-sidebar-brand">
          <img
            src="/brand/logo-icone.png"
            alt=""
            className="brand-mark brand-mark--sidebar"
            width={44}
            height={44}
            decoding="async"
            aria-hidden="true"
          />
          <div>
            <strong className="app-sidebar-title">EquipFlow</strong>
            <p className="muted tiny app-sidebar-sub">NRDT</p>
          </div>
        </div>
        <p className="app-sidebar-role">{roleLabel}</p>
        <div className="app-sidebar-spacer" aria-hidden="true" />
        <div className="app-sidebar-footer">
          <p className="app-sidebar-user">{user.full_name}</p>
          <div className="app-sidebar-actions">
            <ThemeToggle />
            <button type="button" className="btn ghost app-sidebar-logout" onClick={logout}>
              Sair
            </button>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <main id="conteudo-principal" className="app-main-inner" tabIndex={-1}>
          {user.role === 'admin' ? <AdminDashboard /> : <BorrowerDashboard />}
        </main>
        <footer className="footer app-footer">
          <details className="footer-details">
            <summary className="footer-summary muted tiny">
              Demonstração acadêmica · dados fictícios — Sobre o protótipo
            </summary>
            <p className="footer-about-body muted tiny">
              O EquipFlow é uma aplicação web de protótipo (React e API REST) para o fluxo de empréstimo de equipamentos
              didáticos no núcleo NRDT. Não substitui sistemas oficiais da instituição; serve apenas para simulação e
              avaliação do projeto.
            </p>
          </details>
        </footer>
      </div>
    </div>
  )
}
