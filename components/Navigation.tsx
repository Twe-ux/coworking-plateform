'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { useNotifications } from '@/hooks/use-notifications'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import ClientOnly from './ClientOnly'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import AuthButtons from './auth/auth-buttons'
import { Badge } from './ui/badge'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { isAuthenticated } = useAuth()
  const { notificationCounts } = useNotifications()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { name: 'Espaces', href: '#espaces' },
    { name: 'Tarifs', href: '#tarifs' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '#contact' },
    { name: 'À propos', href: '#apropos' },
    { name: 'tchat', href: '/messaging', hasNotification: true },
    ...(isAuthenticated
      ? [{ name: 'Messenger App', href: '/messaging', hasNotification: true }]
      : []),
  ]

  // Helper component for messaging links with notification badge
  const MessagingLinkWithBadge = ({
    children,
    className,
  }: {
    children: React.ReactNode
    className?: string
  }) => (
    <div className="relative inline-flex items-center">
      {children}
      {isAuthenticated && notificationCounts.totalUnread > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 flex h-5 w-5 animate-pulse items-center justify-center bg-red-500 p-0 text-xs text-white"
        >
          {notificationCounts.totalUnread > 99
            ? '99+'
            : notificationCounts.totalUnread}
        </Badge>
      )}
    </div>
  )

  return (
    <motion.nav
      id="navigation"
      role="navigation"
      aria-label="Navigation principale"
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 shadow-lg backdrop-blur-md' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-(--breakpoint-xl) px-4 py-2">
        <div className="flex h-24 items-center justify-between">
          {/* Mobile Menu Button - Left side on mobile */}
          <button
            className="text-coffee-accent focus:ring-coffee-accent rounded-md p-2 focus:ring-2 focus:outline-none md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo - Hidden on mobile, visible on desktop */}
          <Link
            href="/"
            className="hidden focus:ring-0 focus:ring-offset-0 focus:outline-none md:block"
          >
            <ClientOnly>
              <Logo size="xl" animated={true} variant="auto" showText={false} />
            </ClientOnly>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden w-full justify-between md:flex">
            <div className="ml-16 flex items-center gap-8">
              {navItems.map((item, index) =>
                item.href.startsWith('#') ? (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    className="text-coffee-accent hover:text-coffee-primary font-medium transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    {item.name}
                  </motion.a>
                ) : (
                  <Link key={item.name} href={item.href}>
                    <motion.span
                      className="text-coffee-accent hover:text-coffee-primary cursor-pointer font-medium transition-colors duration-200"
                      whileHover={{ scale: 1.05 }}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      {item.hasNotification ? (
                        <MessagingLinkWithBadge>
                          {item.name}
                        </MessagingLinkWithBadge>
                      ) : (
                        item.name
                      )}
                    </motion.span>
                  </Link>
                )
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* <ClientOnly>
                <ThemeToggle />
              </ClientOnly> */}
              <AuthButtons variant="navigation" size="sm" />
            </div>
          </div>

          {/* Mobile Auth Buttons - Right side on mobile */}
          <div className="flex items-center md:hidden">
            <AuthButtons variant="navigation" size="sm" />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            className="absolute top-full right-0 left-0 bg-white/95 shadow-lg backdrop-blur-md md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            role="menu"
            aria-label="Menu mobile"
          >
            <div className="space-y-4 px-4 py-6">
              {navItems.map((item, index) =>
                item.href.startsWith('#') ? (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    className="text-coffee-accent hover:text-coffee-primary block py-2 font-medium transition-colors duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </motion.a>
                ) : (
                  <Link key={item.name} href={item.href}>
                    <motion.span
                      className="text-coffee-accent hover:text-coffee-primary block cursor-pointer py-2 font-medium transition-colors duration-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.hasNotification ? (
                        <MessagingLinkWithBadge>
                          {item.name}
                        </MessagingLinkWithBadge>
                      ) : (
                        item.name
                      )}
                    </motion.span>
                  </Link>
                )
              )}
              <motion.div
                className="border-t border-gray-200 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <AuthButtons
                  variant="homepage"
                  size="md"
                  onMobileMenuClose={() => setIsOpen(false)}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
