import { useEffect, useState } from 'react'
import type { SidebarNavIcon, SidebarNavItem } from '../constants/sidebarNav'
import { cn } from '@/lib/utils'

type Props = {
  items: SidebarNavItem[]
}

function NavIcon({ icon }: { icon: SidebarNavIcon }) {
  const common = { className: 'size-4 shrink-0 opacity-80', viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const }
  switch (icon) {
    case 'pending':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'active':
      return (
        <svg {...common}>
          <path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'rules':
      return (
        <svg {...common}>
          <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )
    case 'add':
      return (
        <svg {...common}>
          <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'catalog':
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h10M4 18h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'history':
      return (
        <svg {...common}>
          <path d="M4 8h16v12H4V8zm2-4h12v2H6V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )
    case 'rejected':
      return (
        <svg {...common}>
          <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'notifications':
      return (
        <svg {...common}>
          <path d="M12 4a4 4 0 014 4v3l2 3H6l2-3V8a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M4 8h16v10H4V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )
  }
}

function sectionIdFromHref(href: string): string {
  return href.startsWith('#') ? href.slice(1) : href
}

export function AppSidebarNav({ items }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const ids = items.map((item) => sectionIdFromHref(item.href))
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length > 0 && visible[0].target.id) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-18% 0px -58% 0px', threshold: [0, 0.12, 0.35] },
    )

    for (const el of elements) observer.observe(el)
    return () => observer.disconnect()
  }, [items])

  return (
    <nav className="app-sidebar-nav flex flex-1 flex-col gap-1 px-1 py-2" aria-label="Atalhos do painel">
      <p className="text-muted-foreground px-2 pb-1 text-[0.62rem] font-bold uppercase tracking-[0.12em]">
        Ir para
      </p>
      <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
        {items.map((item) => {
          const id = sectionIdFromHref(item.href)
          const isActive = activeId === id
          return (
            <li key={item.href}>
              <a
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )}
                aria-current={isActive ? 'location' : undefined}
              >
                <NavIcon icon={item.icon} />
                <span className="truncate">{item.label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
