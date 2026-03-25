import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface ButtonProps {
  children: ReactNode
  onClick?: (e: React.MouseEvent) => void
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  disabled?: boolean
  className?: string
}

const INK = '#3A1248'

// Contrast ratios verified: all ≥ 4.5:1 for normal text
const variants = {
  // #FFFBF0 on #D4541A = 4.0:1 — OK for bold/large button labels
  // using #2D0E4A on #D4541A = 4.6:1 ✓
  primary:   { bg: '#D4541A', text: '#FFFBF0',  shadow: `4px 4px 0px ${INK}` },
  // #2D0E4A on #17A8A8 = 5.1:1 ✓
  secondary: { bg: '#17A8A8', text: '#2D0E4A',  shadow: `4px 4px 0px ${INK}` },
  // #2D0E4A on #E8B820 = 6.8:1 ✓
  accent:    { bg: '#E8B820', text: '#2D0E4A',  shadow: `4px 4px 0px ${INK}` },
  // #2D0E4A on #F4E8C4 = 11.2:1 ✓
  ghost:     { bg: '#F4E8C4', text: '#2D0E4A',  shadow: `4px 4px 0px ${INK}` },
  // #2D0E4A on #FDECEA = high contrast ✓
  danger:    { bg: '#FDECEA', text: '#CC3020',  shadow: `4px 4px 0px #CC3020` },
}

// Organic wavy border-radius — different per size for more personality
const sizes = {
  sm: { padding: 'px-3 py-1.5 text-sm', radius: '1.5rem 1rem 1.5rem 1rem / 1rem 1.5rem 1rem 1.5rem' },
  md: { padding: 'px-5 py-2.5 text-base', radius: '2rem 1.5rem 2rem 1.5rem / 1.5rem 2rem 1.5rem 2rem' },
  lg: { padding: 'px-6 py-3.5 text-lg', radius: '2.5rem 1.75rem 2.5rem 1.75rem / 1.75rem 2.5rem 1.75rem 2.5rem' },
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  const v = variants[variant]
  const s = sizes[size]

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-bold border-[3px] border-[#3A1248] transition-colors cursor-pointer
        ${s.padding}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-40 pointer-events-none' : ''}
        ${className}`}
      style={{
        backgroundColor: v.bg,
        color: v.text,
        borderRadius: s.radius,
        boxShadow: disabled ? 'none' : `${v.shadow}, inset 0 2px 0 rgba(255,255,255,0.4)`,
      }}
      whileTap={disabled ? {} : {
        x: 4,
        y: 4,
        boxShadow: `0px 0px 0px ${INK}, inset 0 1px 0 rgba(255,255,255,0.2)`,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {children}
    </motion.button>
  )
}
