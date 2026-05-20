import { useState, type FormEvent } from 'react'
import { authApi } from '../api'
import { LoginQrPanel } from './LoginQrPanel'

const DEMO_ADMIN = { email: 'admin@labnrdt.edu.br', password: 'Admin@123' }
const DEMO_USER = { email: 'usuario@labnrdt.edu.br', password: 'Usuario@123' }

type Props = {
  onLoggedIn: () => void
}

export function LoginForm({ onLoggedIn }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function fillDemo(which: 'admin' | 'user') {
    const d = which === 'admin' ? DEMO_ADMIN : DEMO_USER
    setEmail(d.email)
    setPassword(d.password)
    setError(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { access_token } = await authApi.login(email.trim(), password)
      localStorage.setItem('equipflow_token', access_token)
      onLoggedIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page-grid" id="login-main">
      <aside className="login-side-panel" aria-label="Sobre o acesso">
        <img
          src="/brand/logo-com-nome.png"
          alt="EQUIPE FLOW — colaboração em movimento"
          className="login-brand-wordmark"
          width={2816}
          height={1536}
          decoding="async"
        />
        <p className="login-side-context muted tiny">NRDT · EquipFlow · DAC 2026</p>
        <p className="login-side-lede muted">
          Empréstimo de equipamentos didáticos: use o formulário ao lado com uma das contas de demonstração.
        </p>
      </aside>
      <article className="login-card" aria-labelledby="login-title" tabIndex={-1}>
        <div className="login-card-body">
          <p className="login-eyebrow">Autenticação</p>
          <h1 id="login-title">Entrar</h1>
          <p className="login-lede">Use o e-mail e a senha da sua conta de demonstração.</p>
          <form onSubmit={onSubmit} className="stack">
          <div>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password">Senha</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>
          <div className="demo-fill-row">
            <span className="muted tiny demo-fill-label">Demonstração:</span>
            <button type="button" className="btn btn-compact" onClick={() => fillDemo('admin')}>
              Conta administrador
            </button>
            <button type="button" className="btn btn-compact" onClick={() => fillDemo('user')}>
              Conta solicitante
            </button>
          </div>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Aguarde…' : 'Entrar'}
          </button>
        </form>
        <section className="hint" aria-label="Credenciais de demonstração">
          <p>
            Admin: <code>admin@labnrdt.edu.br</code> · <code>Admin@123</code>
          </p>
          <p>
            Solicitante: <code>usuario@labnrdt.edu.br</code> · <code>Usuario@123</code>
          </p>
        </section>
        <LoginQrPanel />
        </div>
      </article>
    </div>
  )
}
