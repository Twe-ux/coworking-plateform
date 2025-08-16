'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Clock, Users, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import ClientOnly from '@/components/ClientOnly'
import Logo from '@/components/Logo'
import { useMemberStats } from '@/hooks/useMemberStats'
import { useTodayStats } from '@/hooks/useTodayStats'

export function EnhancedHero() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isOpen, setIsOpen] = useState(false)
  const { stats: memberStats, loading: memberStatsLoading } = useMemberStats()
  const { stats: todayStats, loading: todayStatsLoading } = useTodayStats()

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      const hour = now.getHours()
      setIsOpen(hour >= 8 && hour < 20) // Ouvert de 8h à 20h
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 100,
      },
    },
  }

  return (
    <section className="relative flex min-h-screen items-center justify-center px-2 sm:px-4">
      <motion.div
        className="z-10 mx-auto max-w-6xl text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Status indicator */}
        <motion.div
          variants={itemVariants}
          className="mb-6 flex justify-center"
        >
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
            isOpen 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            {isOpen ? 'Ouvert maintenant' : 'Fermé'} • {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </motion.div>

        {/* Logo centré sur mobile uniquement */}
        <motion.div
          variants={itemVariants}
          className="mb-6 flex flex-col items-center justify-center md:hidden"
        >
          <div className="mt-4">
            <ClientOnly>
              <Logo
                size="xl"
                showText={false}
                animated={true}
                variant="auto"
              />
            </ClientOnly>
          </div>
        </motion.div>

        {/* Titre principal amélioré */}
        <motion.h1
          variants={itemVariants}
          className="from-coffee-accent via-coffee-primary to-coffee-accent mb-4 bg-gradient-to-r bg-clip-text text-4xl leading-tight font-bold text-transparent sm:mb-6 sm:text-5xl md:text-7xl"
        >
          Cow or King
          <br />
          <span className="from-coffee-accent via-coffee-primary to-coffee-accent relative bg-gradient-to-r bg-clip-text pb-3 text-4xl leading-tight font-bold text-transparent sm:pb-4 sm:text-5xl md:text-7xl">
            Café
            <motion.div
              className="from-coffee-primary to-coffee-accent absolute right-0 -bottom-2 left-0 h-1 bg-gradient-to-r"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            />
          </span>
        </motion.h1>

        {/* Proposition de valeur renforcée */}
        <motion.div
          variants={itemVariants}
          className="mx-auto mt-8 mb-6 max-w-4xl px-2 sm:mt-16 sm:mb-8"
        >
          <p className="text-lg leading-relaxed text-gray-700 sm:text-xl md:text-2xl mb-4">
            Votre espace de coworking au cœur de Strasbourg
          </p>
          <p className="text-base text-gray-600 sm:text-lg max-w-2xl mx-auto">
            Travaillez dans notre café avec place, salle verrière et étage disponibles. 
            Rejoignez une communauté de <span className="font-semibold text-coffee-primary">
              {memberStatsLoading ? '150+' : memberStats?.displayText || '150+'} entrepreneurs
            </span> passionnés.
          </p>
        </motion.div>

        {/* Indicateurs sociaux */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-6 mb-8 text-sm text-gray-600"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-coffee-accent" />
            <span>
              <strong>
                {todayStatsLoading ? '23' : todayStats?.peopleWorkingToday || '23'}
              </strong> personnes travaillent ici aujourd'hui
            </span>
            {!todayStatsLoading && todayStats && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-green-500 rounded-full"
                />
                Live
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-coffee-accent" />
            <span>Strasbourg Centre</span>
          </div>
        </motion.div>

        {/* CTAs améliorés */}
        <motion.div
          variants={itemVariants}
          className="mb-8 flex flex-col items-center justify-center gap-4 px-4 sm:mb-12 sm:flex-row"
        >
          <Link href="/reservation">
            <motion.button
              className="from-coffee-primary to-coffee-accent group flex min-h-[56px] w-full max-w-xs items-center justify-center gap-2 rounded-full bg-gradient-to-r px-8 py-4 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 sm:w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isOpen ? 'Réserver maintenant' : 'Réserver pour demain'}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </Link>

          <motion.button
            className="flex min-h-[56px] w-full max-w-xs items-center justify-center gap-2 rounded-full border-2 border-coffee-primary bg-white px-8 py-4 text-base font-semibold text-coffee-primary transition-all duration-300 hover:bg-coffee-primary hover:text-white sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Clock className="h-5 w-5" />
            Voir les horaires
          </motion.button>
        </motion.div>

        {/* Urgence et places limitées */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800"
        >
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          {isOpen ? '7 places disponibles aujourd\'hui' : 'Réservez dès maintenant pour demain'}
        </motion.div>
      </motion.div>
    </section>
  )
}