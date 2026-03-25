import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  variant?: 'default' | 'primary' | 'secondary' | 'violet'
}

// Each variant has a warm tinted background that reads clearly on parchment
const variantStyles: Record<string, { bg: string; shadow: string }> = {
  default:   { bg: '#FFF8E8', shadow: '5px 5px 0px #3A1248' },
  primary:   { bg: '#FDEEE4', shadow: '5px 5px 0px #3A1248' },
  secondary: { bg: '#E2F6F6', shadow: '5px 5px 0px #3A1248' },
  violet:    { bg: '#F2EAF8', shadow: '5px 5px 0px #3A1248' },
}

// Each corner has a slightly different radius — organic wavy feel
const CARD_RADIUS = '1.75rem 1.25rem 1.75rem 1.25rem / 1.25rem 1.75rem 1.25rem 1.75rem'

export default function Card({ children, className = '', onClick, variant = 'default' }: CardProps) {
  const Component = onClick ? motion.button : motion.div
  const style = variantStyles[variant] ?? variantStyles.default

  return (
    <Component
      onClick={onClick}
      className={`border-[3px] border-[#3A1248] p-4 text-left w-full
        ${onClick ? 'cursor-pointer' : ''}
        ${className}`}
      style={{
        backgroundColor: style.bg,
        borderRadius: CARD_RADIUS,
        boxShadow: `${style.shadow}, inset 0 2px 0 rgba(255,255,255,0.55)`,
      }}
      whileTap={onClick ? {
        x: 5,
        y: 5,
        boxShadow: `0px 0px 0px #3A1248, inset 0 1px 0 rgba(255,255,255,0.3)`,
      } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {children}
    </Component>
  )
}
