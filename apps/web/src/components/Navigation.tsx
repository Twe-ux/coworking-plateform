'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, Menu, User, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import ClientOnly from './ClientOnly'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  // TODO: Replace with real authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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
    { name: 'Contact', href: '#contact' },
    { name: 'À propos', href: '#apropos' },
    ...(isLoggedIn ? [{ name: 'Dashboard', href: '/dashboard' }] : []),
  ]

  return (
    <motion.nav
      id="navigation"
      role="navigation"
      aria-label="Navigation principale"
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 shadow-lg backdrop-blur-md' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-screen-xl px-4">
        <div className="flex h-24 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="focus:outline-none focus:ring-0 focus:ring-offset-0"
          >
            <ClientOnly>
              <Logo size="xl" animated={true} variant="auto" showText={false} />
            </ClientOnly>
          </Link>

          {/* Desktop Navigation */}
          <div className="flex w-full justify-between">
            <div className="ml-16 hidden items-center gap-8 md:flex">
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
                      {item.name}
                    </motion.span>
                  </Link>
                )
              )}
            </div>
            <div>
              <ClientOnly>
                <ThemeToggle />
              </ClientOnly>
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <motion.button
                    className="from-coffee-primary to-coffee-accent rounded-full bg-gradient-to-r px-6 py-2 font-semibold text-white transition-all duration-300 hover:shadow-lg"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LayoutDashboard className="mr-2 inline h-4 w-4" />
                    Dashboard
                  </motion.button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <motion.button
                    className="from-coffee-primary to-coffee-accent rounded-full bg-gradient-to-r px-6 py-2 font-semibold text-white transition-all duration-300 hover:shadow-lg"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <User className="mr-2 inline h-4 w-4" />
                    Connexion
                  </motion.button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="text-coffee-accent focus:ring-coffee-primary rounded-md p-2 focus:outline-none focus:ring-2 md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            className="absolute left-0 right-0 top-full bg-white/95 shadow-lg backdrop-blur-md md:hidden"
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
                      {item.name}
                    </motion.span>
                  </Link>
                )
              )}
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <motion.button
                    className="from-coffee-primary to-coffee-accent w-full rounded-xl bg-gradient-to-r px-6 py-3 font-semibold text-white"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard className="mr-2 inline h-4 w-4" />
                    Dashboard
                  </motion.button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <motion.button
                    className="from-coffee-primary to-coffee-accent w-full rounded-xl bg-gradient-to-r px-6 py-3 font-semibold text-white"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="mr-2 inline h-4 w-4" />
                    Connexion
                  </motion.button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
