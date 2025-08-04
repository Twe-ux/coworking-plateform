'use client'

import { motion } from 'framer-motion'
import { useThemeSafe } from './ThemeProvider'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
  animated?: boolean
  variant?: 'default' | 'white' | 'dark' | 'auto'
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-20 h-20',
}

const logoVariants = {
  default: '',
  white: 'brightness-0 invert', // Rend le logo blanc
  dark: 'brightness-0', // Rend le logo noir
}

export default function Logo({
  size = 'md',
  showText = true,
  className = '',
  animated = true,
  variant = 'default',
}: LogoProps) {
  const { theme } = useThemeSafe()

  const LogoWrapper = animated ? motion.div : 'div'
  const logoProps = animated
    ? {
        whileHover: { scale: 1.05 },
        transition: { type: 'spring', stiffness: 300 },
      }
    : {}

  // Déterminer le variant à utiliser
  const effectiveVariant =
    variant === 'auto'
      ? 'dark' // Always use dark (black) variant by default
      : variant

  // Classes de texte selon le variant
  const textColorClass =
    effectiveVariant === 'white' ? 'text-white' : 'text-coffee-accent'

  return (
    <LogoWrapper
      className={`flex items-center gap-3 ${className}`}
      {...logoProps}
    >
      <img
        src="/logo-circle.webp"
        alt="Cow or King Café"
        className={`${sizeClasses[size]} object-contain ${logoVariants[effectiveVariant]}`}
        loading="eager"
      />
      {showText && (
        <span
          className={`font-bold ${textColorClass} ${
            size === 'xl'
              ? 'text-3xl'
              : size === 'lg'
                ? 'text-2xl'
                : size === 'md'
                  ? 'text-xl'
                  : 'text-lg'
          }`}
        >
          Cow or King Café
        </span>
      )}
    </LogoWrapper>
  )
}
