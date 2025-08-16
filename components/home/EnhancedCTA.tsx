'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Clock, Star, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface EnhancedCTAProps {
  variant?: 'primary' | 'secondary' | 'urgent' | 'social-proof'
  size?: 'sm' | 'md' | 'lg'
}

export function EnhancedCTA({
  variant = 'primary',
  size = 'md',
}: EnhancedCTAProps) {
  const [recentBookings, setRecentBookings] = useState(12)
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 30 })

  useEffect(() => {
    // Simulation d'activité en temps réel
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setRecentBookings((prev) => prev + 1)
      }
    }, 10000)

    // Décompte pour offre limitée
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59 }
        }
        return prev
      })
    }, 60000)

    return () => {
      clearInterval(interval)
      clearInterval(timer)
    }
  }, [])

  if (variant === 'primary') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="space-y-6 text-center"
      >
        <div>
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            Prêt à rejoindre notre{' '}
            <span className="from-coffee-accent to-coffee-primary bg-gradient-to-r bg-clip-text text-transparent">
              communauté ?
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Réservez votre place dès maintenant et découvrez l'espace de
            coworking qui va transformer votre productivité.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/reservation">
            <motion.button
              className="from-coffee-primary to-coffee-accent flex min-w-[250px] items-center gap-3 rounded-full bg-gradient-to-r px-8 py-4 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:shadow-2xl"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="h-6 w-6" />
              Réserver maintenant
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </Link>

          <motion.button
            className="border-coffee-primary text-coffee-primary hover:bg-coffee-primary flex min-w-[200px] items-center gap-3 rounded-full border-2 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Clock className="h-5 w-5" />
            Visite virtuelle
          </motion.button>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span>{recentBookings} réservations aujourd'hui</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>23 personnes présentes</span>
          </div>
        </div>
      </motion.div>
    )
  }

  if (variant === 'secondary') {
    return (
      <motion.div whileHover={{ scale: 1.02 }} className="inline-block">
        <Link href="/reservation">
          <button className="text-coffee-accent border-coffee-primary hover:bg-coffee-accent flex items-center gap-2 rounded-full border-2 bg-white px-6 py-3 font-semibold transition-all duration-300 hover:text-white">
            Découvrir nos espaces
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </motion.div>
    )
  }

  if (variant === 'urgent') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white shadow-xl"
      >
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
            OFFRE LIMITÉE
          </div>

          <h3 className="text-2xl font-bold">
            -20% sur votre première semaine
          </h3>

          <p className="text-orange-100">
            Plus que {timeLeft.hours}h {timeLeft.minutes}min pour profiter de
            cette offre exceptionnelle !
          </p>

          <Link href="/reservation">
            <motion.button
              className="w-full rounded-full bg-white px-6 py-3 font-bold text-orange-600 transition-colors duration-200 hover:bg-orange-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              J'en profite maintenant !
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  if (variant === 'social-proof') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-green-200 bg-green-50 p-6"
      >
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="h-5 w-5 fill-yellow-400 text-yellow-400"
              />
            ))}
          </div>

          <p className="text-gray-700">
            "Rejoignez <strong>150+ professionnels</strong> qui ont fait
            confiance à Cow or King Café"
          </p>

          <Link href="/reservation">
            <motion.button
              className="mx-auto flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-green-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Rejoindre la communauté
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  return null
}
