import { useCallback, useMemo, useRef, useState, type FormEvent } from 'react'
import { authApi } from '../api'
import {
  BORROWER_DEMO_PASSWORD,
  DEMO_ACCOUNTS,
  type DemoAccount,
} from '../constants/demoAccounts'
import { ThemeToggle } from './ThemeToggle'
import { LoginProfileIcon } from './LoginProfileIcon'
import { LoginQrPanel } from './LoginQrPanel'

const DEFAULT_ACCOUNT = DEMO_ACCOUNTS.find((a) => a.id === 'prof-rocha')!

function profileRoleLine(account: DemoAccount): string {
  if (account.role === 'admin') return 'Administrador'
  return 'Solicitante'
}

type Props = {
  onLoggedIn: () => void
}

export function LoginForm({ onLoggedIn }: Props) {
  const [selectedId, setSelectedId] = useState(DEFAULT_ACCOUNT.id)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const accounts = DEMO_ACCOUNTS

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedId) ?? accounts[0],
    [accounts, selectedId],
  )

  const selectedIndex = useMemo(
    () => Math.max(0, accounts.findIndex((a) => a.id === selectedId)),
    [accounts, selectedId],
  )

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = carouselRef.current
      if (!el) return
      const card = el.children[index] as HTMLElement | undefined
      card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    },
    [],
  )

  function selectByOffset(delta: number) {
    const next = (selectedIndex + delta + accounts.length) % accounts.length
    const account = accounts[next]
    setSelectedId(account.id)
    scrollToIndex(next)
  }

  async function doLogin(loginEmail: string, loginPassword: string) {
    setError(null)
    setLoading(true)
    try {
      const { access_token } = await authApi.login(loginEmail.trim(), loginPassword)
      localStorage.setItem('equipflow_token', access_token)
      onLoggedIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await doLogin(email, password)
  }

  async function quickLogin(account: DemoAccount) {
    setEmail(account.email)
    setPassword(account.password)
    setError(null)
    await doLogin(account.email, account.password)
  }

  return (
    <div className="login-split" id="login-main">
      <aside className="login-visual" aria-label="EquipFlow">
        <div className="login-visual-mesh" aria-hidden="true" />

        <div className="login-visual-inner">
          <header className="login-visual-brand">
            <img
              src="/brand/logo-com-nome.png"
              alt="EquipFlow"
              className="login-visual-logo"
              width={2816}
              height={1536}
              decoding="async"
            />
            <p className="login-visual-tagline">Colaboração e gestão em movimento</p>
          </header>

          <div className="login-visual-qr-zone">
            <LoginQrPanel variant="hero" />
          </div>

          <p className="login-visual-foot">NRDT · UCDB · DAC 2026</p>
        </div>
      </aside>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel-toolbar">
          <ThemeToggle />
        </div>

        <div className="login-panel-inner">
          <header className="login-panel-head">
            <img
              src="/brand/logo-icone.png"
              alt=""
              className="login-panel-head-icon"
              width={32}
              height={32}
              decoding="async"
              aria-hidden="true"
            />
            <h1 id="login-title">Entrar</h1>
          </header>

          <section className="login-profiles" aria-label="Selecionar perfil de demonstração">
            <div className="login-profiles-carousel-wrap">
              <button
                type="button"
                className="login-profiles-nav"
                onClick={() => selectByOffset(-1)}
                disabled={loading}
                aria-label="Perfil anterior"
              >
                ‹
              </button>

              <div className="login-profiles-carousel" ref={carouselRef} role="listbox">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    role="option"
                    aria-selected={selectedId === account.id}
                    className={`login-profile-card${selectedId === account.id ? ' is-active' : ''}`}
                    onClick={() => {
                      setSelectedId(account.id)
                      scrollToIndex(accounts.findIndex((a) => a.id === account.id))
                    }}
                    disabled={loading}
                  >
                    <span
                      className={`login-profile-avatar login-profile-avatar--${account.role}`}
                      aria-hidden="true"
                    >
                      <LoginProfileIcon role={account.role} className="login-profile-icon" />
                    </span>
                    <span className="login-profile-name">{account.label}</span>
                    <span className="login-profile-role">{profileRoleLine(account)}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="login-profiles-nav"
                onClick={() => selectByOffset(1)}
                disabled={loading}
                aria-label="Próximo perfil"
              >
                ›
              </button>
            </div>

            <button
              type="button"
              className="btn primary login-profile-enter"
              disabled={loading || !selectedAccount}
              onClick={() => selectedAccount && void quickLogin(selectedAccount)}
            >
              {loading ? 'Entrando…' : 'Entrar como Conta Selecionada'}
            </button>
          </section>

          <div className="login-section-divider" aria-hidden="true" />

          <form onSubmit={onSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">E-mail</label>
              <div className="login-input-wrap">
                <span className="login-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e-mail@exemplo.com"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Senha</label>
              <div className="login-input-wrap">
                <span className="login-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M7 11V8a5 5 0 0110 0v3" />
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="login-input-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    {showPassword ? (
                      <>
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42" />
                        <path d="M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7-1.02 2.28-2.78 4.18-5 5.35" />
                        <path d="M6.61 6.61C4.62 7.86 3.29 9.39 2 11c1.73 3.89 6 7 11 7 1.05 0 2.05-.15 3-.42" />
                      </>
                    ) : (
                      <>
                        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {error ? (
              <p className="error login-form-error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn primary login-form-submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="login-quick-label" aria-hidden="true">
            ou acesso rápido
          </p>

          <div className="login-demo-box">
            <span className="login-demo-box-title">Credenciais de Demonstração</span>
            <span className="login-demo-box-sep">·</span>
            <span>
              Senha:{' '}
              <code>
                {selectedAccount.role === 'admin'
                  ? selectedAccount.password
                  : BORROWER_DEMO_PASSWORD}
              </code>
            </span>
          </div>

          <LoginQrPanel variant="compact" />
        </div>
      </section>
    </div>
  )
}
