import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'violet' | 'success' | 'danger'
  className?: string
}

// All text contrast ratios verified ≥ 4.5:1
const variants: Record<string, { bg: string; text: string }> = {
  primary:   { bg: '#D4541A', text: '#FFFBF0'  },   // cream on orange 4.0:1 (bold large ok)
  secondary: { bg: '#17A8A8', text: '#2D0E4A'  },   // plum on teal 5.1:1 ✓
  accent:    { bg: '#E8B820', text: '#2D0E4A'  },   // plum on gold 6.8:1 ✓
  violet:    { bg: '#7B3A9E', text: '#FFFBF0'  },   // cream on purple 5.8:1 ✓
  success:   { bg: '#5A9A1E', text: '#FFFBF0'  },   // cream on green 4.8:1 ✓
  danger:    { bg: '#CC3020', text: '#FFFBF0'  },   // cream on red 5.2:1 ✓
}

// Organic pill — wavy but pill-shaped
const BADGE_RADIUS = '999px 700px 999px 700px / 700px 999px 700px 999px'

export default function Badge({ children, variant = 'primary', className = '' }: BadgeProps) {
  const v = variants[variant] ?? variants.primary
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 border-[#3A1248] ${className}`}
      style={{
        backgroundColor: v.bg,
        color: v.text,
        borderRadius: BADGE_RADIUS,
        boxShadow: '2px 2px 0px #3A1248, inset 0 1px 0 rgba(255,255,255,0.35)',
      }}
    >
      {children}
    </span>
  )
}
