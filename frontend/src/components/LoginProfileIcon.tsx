import type { DemoRole } from '../constants/demoAccounts'

type Props = {
  role: DemoRole
  className?: string
}

export function LoginProfileIcon({ role, className }: Props) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  if (role === 'admin') {
    return (
      <svg {...common}>
        <circle cx="10" cy="8.5" r="3" />
        <path d="M4.5 19.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
        <path d="M16.25 5.25L19 6.75v3.25c0 1.9-1.35 3.35-2.75 3.85-1.4-.5-2.75-1.95-2.75-3.85V6.75l2.75-1.5z" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19.5c0-3.2 2.9-5.5 6.5-5.5s6.5 2.3 6.5 5.5" />
    </svg>
  )
}
