'use client'

import AuthButtons from '@/components/auth/auth-buttons'
import ClientOnly from '@/components/ClientOnly'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'

import { motion, useScroll, useTransform } from 'framer-motion'
import { Coffee, MapPin, Star, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  useEffect(() => {
    let animationFrameId: number
    
    const updateMousePosition = (e: MouseEvent) => {
      // Throttle avec requestAnimationFrame pour éviter trop de re-renders
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      
      animationFrameId = requestAnimationFrame(() => {
        setMousePosition({ x: e.clientX, y: e.clientY })
      })
    }
    
    window.addEventListener('mousemove', updateMousePosition)
    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        damping: 20,
        stiffness: 100,
      },
    },
  }

  return (
    <main className="from-coffee-secondary to-coffee-muted relative min-h-screen overflow-hidden bg-linear-to-br via-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="bg-coffee-primary/10 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 0.01,
            y: mousePosition.y * 0.01,
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="bg-coffee-accent/10 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * -0.01,
            y: mousePosition.y * -0.01,
            scale: [1.1, 1, 1.1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center px-4">
        <motion.div
          className="z-10 mx-auto max-w-6xl text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="mb-8 flex flex-col items-center"
          >
            <div className="mb-4">
              <ClientOnly>
                <Logo
                  size="xl"
                  showText={false}
                  animated={true}
                  variant="auto"
                />
              </ClientOnly>
            </div>
            <span className="bg-coffee-primary/10 text-coffee-accent inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
              ☕ Coworking à Strasbourg
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="from-coffee-accent via-coffee-primary to-coffee-accent mb-6 bg-linear-to-r bg-clip-text text-5xl leading-tight font-bold text-transparent md:text-7xl"
          >
            Cow or King
            <br />
            <span className="from-coffee-accent via-coffee-primary to-coffee-accent relative bg-linear-to-r bg-clip-text pb-4 text-5xl leading-tight font-bold text-transparent md:text-7xl">
              Café
              <motion.div
                className="from-coffee-primary to-coffee-accent absolute right-0 -bottom-2 left-0 h-1 bg-linear-to-r"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
              />
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-16 mb-8 max-w-3xl text-xl leading-relaxed text-gray-700 md:text-2xl"
          >
            Votre espace de coworking au cœur de Strasbourg. Travaillez dans
            notre café avec place, salle verrière et étage disponibles à la
            réservation.
          </motion.p>

          <motion.div variants={itemVariants}>
            <AuthButtons variant="homepage" size="lg" />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mx-auto grid max-w-2xl grid-cols-2 gap-8 md:grid-cols-4"
          >
            {[
              { icon: Coffee, label: '3 espaces', value: 'disponibles' },
              { icon: Users, label: '50+', value: 'membres' },
              { icon: MapPin, label: 'Strasbourg', value: 'centre-ville' },
              { icon: Star, label: '4.8/5', value: 'satisfaction' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <stat.icon className="text-coffee-primary mx-auto mb-2 h-8 w-8" />
                <div className="text-coffee-accent text-2xl font-bold">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-600">{stat.value}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </main>
  )
}
