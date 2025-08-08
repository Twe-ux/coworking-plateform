'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/hooks/use-auth'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  LayoutDashboard,
  Loader2,
  LogOut,
  User,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface AuthButtonsProps {
  variant?: 'homepage' | 'navigation'
  size?: 'sm' | 'md' | 'lg'
  onMobileMenuClose?: () => void
}

export function AuthButtonsSkeleton({
  variant = 'homepage',
  size = 'md',
}: Omit<AuthButtonsProps, 'onMobileMenuClose'>) {
  const buttonHeight =
    size === 'sm'
      ? 'h-8'
      : size === 'md'
        ? 'h-10'
        : variant === 'homepage'
          ? 'h-12 sm:h-14'
          : 'h-10'
  const buttonWidth =
    variant === 'homepage' ? 'w-32 sm:w-40' : size === 'sm' ? 'w-24' : 'w-32'

  return (
    <div
      className={
        variant === 'homepage'
          ? 'mx-auto mb-8 flex max-w-sm flex-col items-center justify-center gap-3 sm:mb-12 sm:max-w-none sm:flex-row sm:gap-4'
          : 'flex items-center gap-2 sm:gap-4'
      }
      role="status"
      aria-label="Chargement des boutons d'authentification"
    >
      <Skeleton className={`${buttonHeight} ${buttonWidth} rounded-full`} />
      <Skeleton className={`${buttonHeight} ${buttonWidth} rounded-full`} />
      <span className="sr-only">Chargement des options de connexion...</span>
    </div>
  )
}

export default function AuthButtons({
  variant = 'homepage',
  size = 'md',
  onMobileMenuClose,
}: AuthButtonsProps) {
  const { isAuthenticated, isLoading, redirectToDashboard } = useAuth()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()
  
  // Version simplifiée pour éviter les problèmes
  const [showSkeleton, setShowSkeleton] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      toast({
        variant: 'info',
        title: 'Déconnexion en cours...',
        description: 'Nous vous déconnectons de votre session.',
        duration: 2000,
      })

      await signOut({
        callbackUrl: '/',
        redirect: true,
      })
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)

      toast({
        variant: 'destructive',
        title: 'Erreur de déconnexion',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        duration: 4000,
      })
    }
    onMobileMenuClose?.()
  }

  const handleDashboardClick = () => {
    redirectToDashboard()
    onMobileMenuClose?.()
  }

  // Générer l'URL de login avec le callbackUrl pour préserver la page actuelle
  const loginUrl = `/login${pathname !== '/' ? `?callbackUrl=${encodeURIComponent(pathname)}` : ''}`

  // Transition simple lors des changements d'état
  useEffect(() => {
    if (!isLoading) {
      // Très brève transition pour éviter le flash
      const timer = setTimeout(() => {
        setShowSkeleton(false)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isLoading])


  // Show skeleton only during initial loading
  if (isLoading) {
    return <AuthButtonsSkeleton variant={variant} size={size} />
  }

  // Responsive styling variants
  const buttonClasses = {
    primary:
      variant === 'homepage'
        ? 'from-coffee-primary to-coffee-accent group flex min-h-[48px] sm:min-h-[56px] items-center gap-2 rounded-full bg-linear-to-r px-6 sm:px-8 py-3 sm:py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl text-sm sm:text-base'
        : size === 'sm'
          ? 'from-coffee-primary to-coffee-accent rounded-full bg-linear-to-r px-4 py-1.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg'
          : 'from-coffee-primary to-coffee-accent rounded-full bg-linear-to-r px-6 py-2 font-semibold text-white transition-all duration-300 hover:shadow-lg',
    secondary:
      variant === 'homepage'
        ? 'border-coffee-accent text-coffee-accent hover:bg-coffee-accent rounded-full border-2 px-6 sm:px-8 py-3 sm:py-4 font-semibold transition-all duration-300 hover:text-white text-sm sm:text-base'
        : size === 'sm'
          ? 'border-coffee-accent text-coffee-accent hover:bg-coffee-accent rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-all duration-300 hover:text-white'
          : 'border-coffee-accent text-coffee-accent hover:bg-coffee-accent rounded-full border-2 px-6 py-2 font-semibold transition-all duration-300 hover:text-white',
  }

  const iconSize =
    variant === 'homepage'
      ? 'h-4 w-4 sm:h-5 sm:w-5'
      : size === 'sm'
        ? 'h-3 w-3'
        : 'h-4 w-4'

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={
          variant === 'homepage'
            ? 'mx-auto mb-8 flex max-w-sm flex-col items-center justify-center gap-3 sm:mb-12 sm:max-w-none sm:flex-row sm:gap-4'
            : 'flex items-center gap-2 sm:gap-4'
        }
      >
        {isAuthenticated ? (
          // Authenticated user buttons
          <>
            <motion.button
              onClick={handleDashboardClick}
              className={`flex items-center gap-2 ${buttonClasses.primary}`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoggingOut}
              aria-label="Accéder au tableau de bord personnel"
              aria-describedby="dashboard-button-description"
            >
              <LayoutDashboard className={iconSize} aria-hidden="true" />
              <span>Dashboard</span>
              {variant === 'homepage' && (
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5"
                  aria-hidden="true"
                />
              )}
            </motion.button>

            <motion.button
              onClick={handleLogout}
              className={`flex items-center gap-2 ${buttonClasses.secondary}`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoggingOut}
              aria-label={
                isLoggingOut
                  ? 'Déconnexion en cours, veuillez patientr'
                  : 'Se déconnecter de votre session'
              }
              aria-describedby="logout-button-description"
            >
              {isLoggingOut ? (
                <>
                  <Loader2
                    className={`${iconSize} animate-spin`}
                    aria-hidden="true"
                  />
                  <span className="sr-only">Déconnexion en cours...</span>
                </>
              ) : (
                <LogOut className={iconSize} aria-hidden="true" />
              )}
              <span>Déconnexion</span>
            </motion.button>
          </>
        ) : (
          // Non-authenticated user buttons
          <>
            <Link href={loginUrl} onClick={onMobileMenuClose}>
              <motion.button
                className={`flex items-center gap-2 ${buttonClasses.primary}`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Se connecter à votre compte"
                aria-describedby="login-button-description"
              >
                <User className={iconSize} aria-hidden="true" />
                <span>Connexion</span>

                {variant === 'homepage' && (
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5"
                    aria-hidden="true"
                  />
                )}
              </motion.button>
            </Link>

            {/* <Link href="/reservation" onClick={onMobileMenuClose}>
              <motion.button
                className={buttonClasses.secondary}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Découvrir et réserver nos espaces de coworking"
                aria-describedby="explore-button-description"
              >
                <span>Explorer les espaces</span>
              </motion.button>
            </Link> */}
          </>
        )}
      </motion.div>

      {/* Screen reader descriptions */}
      <div className="sr-only">
        <div id="dashboard-button-description">
          Accédez à votre tableau de bord personnel pour gérer vos réservations
          et votre profil
        </div>
        <div id="logout-button-description">
          Se déconnecter de votre session et revenir à la page d&apos;accueil
        </div>
        <div id="login-button-description">
          Se connecter à votre compte pour accéder à vos réservations et profil
        </div>
        <div id="explore-button-description">
          Découvrir nos trois espaces de coworking disponibles à la réservation
        </div>
      </div>
    </AnimatePresence>
  )
}
