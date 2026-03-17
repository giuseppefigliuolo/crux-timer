import confetti from 'canvas-confetti'

function prefersReducedMotion(): boolean {
  return !!(
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Multi-burst confetti explosion from a normalized origin point.
 * origin.x and origin.y are 0–1 ratios of viewport width/height.
 */
export function fireConfetti(origin: { x: number; y: number } = { x: 0.5, y: 0.5 }) {
  if (prefersReducedMotion()) return

  const base = {
    origin,
    ticks: 260,
    gravity: 1.15,
    scalar: 1,
    drift: 0,
  }

  confetti({ ...base, particleCount: 120, spread: 70, startVelocity: 50, decay: 0.9 })
  confetti({ ...base, particleCount: 55, spread: 110, startVelocity: 40, decay: 0.92, scalar: 0.9 })
  confetti({ ...base, particleCount: 35, spread: 140, startVelocity: 32, decay: 0.94, scalar: 0.8 })
}

/**
 * Fire confetti from the position of a mouse/pointer event.
 */
export function fireConfettiFromEvent(e: React.MouseEvent | MouseEvent) {
  const vw = Math.max(1, window.innerWidth)
  const vh = Math.max(1, window.innerHeight)

  fireConfetti({
    x: Math.min(vw, Math.max(0, e.clientX)) / vw,
    y: Math.min(vh, Math.max(0, e.clientY)) / vh,
  })
}
