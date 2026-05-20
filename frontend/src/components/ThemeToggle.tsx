import { useCallback, useEffect, useState } from 'react'
import { applyTheme, readStoredTheme, type ThemeMode } from '../themeStorage'

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = readStoredTheme()
    if (stored) return stored
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <button
      type="button"
      className="btn theme-toggle"
      onClick={toggle}
      aria-pressed={theme === 'light'}
      title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
    </button>
  )
}
