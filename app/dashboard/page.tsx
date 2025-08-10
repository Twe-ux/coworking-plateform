'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  Bell,
  Bookmark,
  Calendar,
  ChevronRight,
  Clock,
  Coffee,
  CreditCard,
  Heart,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Star,
  Sun,
  User,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { memo, useEffect, useState } from 'react'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.6,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

const floatingVariants = {
  animate: {
    y: [-2, 2, -2],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// Modern Header Component
const ModernHeader = memo(() => {
  const [time, setTime] = useState(new Date())
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Bonjour')
    else if (hour < 18) setGreeting('Bel après-midi')
    else setGreeting('Bonsoir')
    return () => clearInterval(timer)
  }, [])

  return (
    <motion.div
      variants={itemVariants}
      className="relative overflow-hidden rounded-3xl border border-orange-100/50 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6 backdrop-blur-sm md:p-8"
    >
      {/* Floating background elements */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute top-4 right-16 h-20 w-20 rounded-full bg-gradient-to-br from-orange-200/30 to-amber-200/30 blur-xl"
      />
      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '1s' }}
        className="absolute bottom-4 left-16 h-16 w-16 rounded-full bg-gradient-to-br from-yellow-200/30 to-orange-200/30 blur-xl"
      />

      <div className="relative z-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Avatar className="h-16 w-16 ring-4 ring-orange-200/50 ring-offset-2">
                <AvatarImage src="/api/placeholder/64/64" />
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-lg font-semibold text-white">
                  JD
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl"
              >
                {greeting}, John!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="font-medium text-orange-700/70"
              >
                Prêt pour une journée productive au Cow or King?
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-1 font-mono text-sm text-orange-600/60"
              >
                {time.toLocaleTimeString('fr-FR')} •{' '}
                {time.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </motion.p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="relative hidden md:block"
            >
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-orange-400" />
              <Input
                placeholder="Rechercher..."
                className="w-64 border-orange-200/50 bg-white/80 pl-9 backdrop-blur-sm focus:border-orange-300 focus:ring-orange-200"
              />
            </motion.div>

            {/* Weather */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="hidden items-center gap-2 rounded-xl border border-orange-200/30 bg-white/60 px-3 py-2 backdrop-blur-sm lg:flex"
            >
              <Sun className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-orange-700">22°C</span>
            </motion.div>

            {/* Notifications */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative rounded-xl border border-orange-200/30 bg-white/60 p-3 backdrop-blur-sm transition-all duration-200 hover:bg-white/80"
            >
              <Bell className="h-5 w-5 text-orange-600" />
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white"
              />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

ModernHeader.displayName = 'ModernHeader'

// Animated Stat Card
const AnimatedStatCard = memo(
  ({
    icon: Icon,
    label,
    value,
    change,
    changeType,
    gradient,
    delay = 0,
  }: {
    icon: any
    label: string
    value: string
    change: string
    changeType: 'positive' | 'negative' | 'neutral'
    gradient: string
    delay?: number
  }) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay }}
        whileHover={{
          scale: 1.02,
          y: -2,
          transition: { duration: 0.2 },
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          'relative cursor-pointer overflow-hidden rounded-2xl border border-white/20 p-6 backdrop-blur-sm',
          gradient
        )}
      >
        {/* Floating background circle */}
        <motion.div
          animate={{
            scale: isHovered ? 1.1 : 1,
            opacity: isHovered ? 0.8 : 0.6,
          }}
          transition={{ duration: 0.3 }}
          className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10 blur-lg"
        />

        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <motion.div
              animate={{ rotate: isHovered ? 5 : 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl bg-white/20 p-3 backdrop-blur-sm"
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
            <Badge
              variant="secondary"
              className={cn(
                'text-xs font-medium',
                changeType === 'positive'
                  ? 'bg-green-100 text-green-700'
                  : changeType === 'negative'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
              )}
            >
              {change}
            </Badge>
          </div>
          <div className="space-y-1">
            <motion.p
              animate={{
                scale: isHovered ? 1.05 : 1,
              }}
              className="text-2xl font-bold text-white"
            >
              {value}
            </motion.p>
            <p className="text-sm font-medium text-white/80">{label}</p>
          </div>
        </div>

        {/* Shine effect */}
        <motion.div
          animate={{
            x: isHovered ? '100%' : '-100%',
            opacity: isHovered ? [0, 1, 0] : 0,
          }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
      </motion.div>
    )
  }
)

AnimatedStatCard.displayName = 'AnimatedStatCard'

// Quick Action Button Component
const QuickActionButton = memo(
  ({
    icon: Icon,
    label,
    description,
    href,
    gradient,
    delay = 0,
    onClick,
  }: {
    icon: any
    label: string
    description: string
    href?: string
    gradient: string
    delay?: number
    onClick?: () => void
  }) => {
    const [isHovered, setIsHovered] = useState(false)

    const content = (
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay }}
        whileHover={{
          scale: 1.02,
          y: -4,
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          'relative cursor-pointer overflow-hidden rounded-2xl border border-white/20 p-6 backdrop-blur-sm',
          gradient
        )}
        onClick={onClick}
      >
        {/* Animated background */}
        <motion.div
          animate={{
            scale: isHovered ? 1.2 : 1,
            opacity: isHovered ? 0.3 : 0.1,
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-full bg-white/10 blur-2xl"
        />

        <div className="relative z-10 space-y-4 text-center">
          <motion.div
            animate={{
              rotateY: isHovered ? 180 : 0,
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{ duration: 0.4 }}
            className="inline-flex rounded-2xl bg-white/20 p-4 backdrop-blur-sm"
          >
            <Icon className="h-8 w-8 text-white" />
          </motion.div>

          <div className="space-y-2">
            <motion.h3
              animate={{
                scale: isHovered ? 1.05 : 1,
              }}
              className="text-lg font-bold text-white"
            >
              {label}
            </motion.h3>
            <p className="text-sm text-white/80">{description}</p>
          </div>

          <motion.div
            animate={{ x: isHovered ? 4 : 0 }}
            className="flex items-center justify-center gap-2 text-sm font-medium text-white/90"
          >
            <span>Accéder</span>
            <ArrowRight className="h-4 w-4" />
          </motion.div>
        </div>
      </motion.div>
    )

    return href ? <Link href={href}>{content}</Link> : content
  }
)

QuickActionButton.displayName = 'QuickActionButton'

// Modern Booking Card Component
const BookingCard = memo(
  ({
    title,
    time,
    date,
    status,
    space,
    delay = 0,
  }: {
    title: string
    time: string
    date: string
    status: 'confirmed' | 'pending' | 'cancelled'
    space: string
    delay?: number
  }) => {
    return (
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay }}
        whileHover={{
          scale: 1.02,
          transition: { duration: 0.2 },
        }}
        className="relative overflow-hidden rounded-xl border border-orange-200/50 bg-white/60 p-4 backdrop-blur-sm transition-all duration-200 hover:bg-white/80"
      >
        <div className="mb-3 flex items-center justify-between">
          <Badge
            variant="secondary"
            className={cn(
              'text-xs font-medium',
              status === 'confirmed'
                ? 'bg-green-100 text-green-700'
                : status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            )}
          >
            {status === 'confirmed'
              ? 'Confirmé'
              : status === 'pending'
                ? 'En attente'
                : 'Annulé'}
          </Badge>
          <span className="font-mono text-xs text-orange-600/60">{time}</span>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-orange-900">{title}</h4>
          <div className="flex items-center gap-2 text-sm text-orange-700/70">
            <MapPin className="h-3 w-3" />
            <span>{space}</span>
            <span className="text-orange-600/50">•</span>
            <span>{date}</span>
          </div>
        </div>

        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-orange-400 to-amber-400"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ delay: delay + 0.3, duration: 0.6 }}
        />
      </motion.div>
    )
  }
)

BookingCard.displayName = 'BookingCard'

export default function DashboardPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen space-y-8 bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/50 pb-8"
    >
      {/* Modern Header */}
      <ModernHeader />

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        <AnimatedStatCard
          icon={Calendar}
          label="Réservations actives"
          value="3"
          change="+2 ce mois"
          changeType="positive"
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0.1}
        />
        <AnimatedStatCard
          icon={Clock}
          label="Heures réservées"
          value="24h"
          change="+15% vs mois dernier"
          changeType="positive"
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
          delay={0.2}
        />
        <AnimatedStatCard
          icon={Star}
          label="Points fidélité"
          value="150"
          change="+25 points"
          changeType="positive"
          gradient="bg-gradient-to-br from-yellow-500 to-orange-500"
          delay={0.3}
        />
        <AnimatedStatCard
          icon={CreditCard}
          label="Économisé"
          value="245€"
          change="vs bureaux privés"
          changeType="positive"
          gradient="bg-gradient-to-br from-purple-500 to-pink-600"
          delay={0.4}
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-2xl font-bold text-transparent">
            Actions rapides
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm font-medium text-orange-600 transition-colors hover:text-orange-700"
          >
            Voir tout
          </motion.button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <QuickActionButton
            icon={Plus}
            label="Nouvelle réservation"
            description="Réserver un espace maintenant"
            href="/reservation"
            gradient="bg-gradient-to-br from-orange-500 to-red-500"
            delay={0.1}
          />
          <QuickActionButton
            icon={Calendar}
            label="Mes réservations"
            description="Gérer vos réservations"
            href="/reservations"
            gradient="bg-gradient-to-br from-blue-500 to-indigo-500"
            delay={0.2}
          />
          <QuickActionButton
            icon={User}
            label="Mon profil"
            description="Paramètres et préférences"
            href="/profile"
            gradient="bg-gradient-to-br from-green-500 to-teal-500"
            delay={0.3}
          />
          <QuickActionButton
            icon={MessageSquare}
            label="Support"
            description="Besoin d'aide? Contactez-nous"
            href="/support"
            gradient="bg-gradient-to-br from-purple-500 to-violet-500"
            delay={0.4}
          />
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Mes prochaines réservations */}
        <motion.div variants={itemVariants} className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-orange-900">
              Mes prochaines réservations
            </h2>
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-700"
            >
              3 à venir
            </Badge>
          </div>

          <div className="space-y-3">
            <BookingCard
              title="Réunion équipe produit"
              time="14:00 - 16:00"
              date="Aujourd'hui"
              status="confirmed"
              space="Salle Verrière"
              delay={0.1}
            />
            <BookingCard
              title="Session focus"
              time="09:00 - 12:00"
              date="Demain"
              status="confirmed"
              space="Espace Quiet"
              delay={0.2}
            />
            <BookingCard
              title="Workshop créatif"
              time="15:30 - 18:00"
              date="Vendredi 10 Jan"
              status="pending"
              space="Salle Innovation"
              delay={0.3}
            />
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer rounded-xl border border-orange-200/50 bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-4 transition-all duration-200 hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-amber-500/20"
          >
            <div className="flex items-center justify-center gap-2 font-medium text-orange-600">
              <Plus className="h-4 w-4" />
              <span>Ajouter une nouvelle réservation</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Sidebar */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Espaces favoris */}
          <Card className="border-orange-200/50 bg-white/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg text-orange-900">
                  <Heart className="h-5 w-5 text-red-500" />
                  Mes favoris
                </CardTitle>
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  3
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-orange-200/30 bg-gradient-to-r from-orange-50 to-amber-50 p-3"
              >
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-orange-900">
                    Salle Verrière
                  </p>
                  <p className="text-xs text-orange-700/70">
                    Lumière naturelle
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                  <span className="text-xs text-orange-700">4.9</span>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-orange-200/30 bg-gradient-to-r from-orange-50 to-amber-50 p-3"
              >
                <div className="rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 p-2">
                  <Coffee className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-orange-900">
                    Café Corner
                  </p>
                  <p className="text-xs text-orange-700/70">
                    Ambiance détendue
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                  <span className="text-xs text-orange-700">4.8</span>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-orange-200/30 bg-gradient-to-r from-orange-50 to-amber-50 p-3"
              >
                <div className="rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 p-2">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-orange-900">
                    Espace Collaboratif
                  </p>
                  <p className="text-xs text-orange-700/70">
                    Idéal pour les équipes
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                  <span className="text-xs text-orange-700">4.7</span>
                </div>
              </motion.div>
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card className="border-orange-200/50 bg-white/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-orange-900">
                <Activity className="h-5 w-5 text-orange-600" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-orange-50/50"
              >
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-orange-900">
                    Réservation confirmée
                  </p>
                  <p className="mt-1 text-xs text-orange-700/70">
                    Salle Verrière • Aujourd&apos;hui 14h
                  </p>
                  <p className="mt-1 text-xs text-orange-600/50">
                    Il y a 2 heures
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-orange-50/50"
              >
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-orange-900">
                    Paiement effectué
                  </p>
                  <p className="mt-1 text-xs text-orange-700/70">
                    Forfait mensuel • 89€
                  </p>
                  <p className="mt-1 text-xs text-orange-600/50">
                    Il y a 1 jour
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-orange-50/50"
              >
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-orange-900">
                    Check-in effectué
                  </p>
                  <p className="mt-1 text-xs text-orange-700/70">
                    Café Corner • Session productive
                  </p>
                  <p className="mt-1 text-xs text-orange-600/50">
                    Il y a 2 jours
                  </p>
                </div>
              </motion.div>
            </CardContent>
          </Card>

          {/* Raccourcis */}
          <Card className="border-orange-200/50 bg-white/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-orange-900">
                <Bookmark className="h-5 w-5 text-orange-600" />
                Raccourcis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="group flex w-full items-center justify-between rounded-lg p-3 text-left transition-all duration-200 hover:bg-orange-50/50"
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    Paramètres
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-orange-600/50 transition-colors group-hover:text-orange-600" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="group flex w-full items-center justify-between rounded-lg p-3 text-left transition-all duration-200 hover:bg-orange-50/50"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    Facturation
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-orange-600/50 transition-colors group-hover:text-orange-600" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="group flex w-full items-center justify-between rounded-lg p-3 text-left transition-all duration-200 hover:bg-orange-50/50"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    Support
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-orange-600/50 transition-colors group-hover:text-orange-600" />
              </motion.button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
