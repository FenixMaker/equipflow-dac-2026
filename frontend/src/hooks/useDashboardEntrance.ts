import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const SELECTOR = '.dash-enter, .stat-tile, .section-card.card, .page-header'

export function useDashboardEntrance(deps: unknown[] = []) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const targets = root.querySelectorAll<HTMLElement>(SELECTOR)
    if (!targets.length) return

    if (reduced) {
      gsap.set(targets, { opacity: 1, y: 0 })
      return
    }

    gsap.set(targets, { opacity: 0, y: 10 })
    const tween = gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration: 0.42,
      stagger: 0.04,
      ease: 'power2.out',
      clearProps: 'transform',
    })

    return () => {
      tween.kill()
    }
  }, deps)

  return rootRef
}
