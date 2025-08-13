'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns'
import { fr } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Coffee,
  MapPin,
  AlertCircle,
  Bell,
  Search,
  Star,
  Activity,
  Sun,
  Cloud,
  Zap,
  Bookmark,
  Plus,
  ChevronRight,
} from 'lucide-react'
import { ClientLayout } from '@/components/dashboard/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface BookingData {
  id: string
  space: {
    name: string
    location: string
  }
  date: string
  startTime: string
  endTime: string
  duration: number
  durationType: 'hour' | 'day'
  guests: number
  totalPrice: number
  status:
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'completed'
    | 'payment_pending'
  createdAt: string
}

export default function ClientDashboard() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Fetch user bookings and stats
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return

      try {
        // Fetch bookings and stats in parallel
        const [bookingsResponse, statsResponse] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/bookings/stats'),
        ])

        const bookingsData = await bookingsResponse.json()
        const statsData = await statsResponse.json()

        if (!bookingsResponse.ok) {
          throw new Error(
            bookingsData.error ||
              'Erreur lors de la récupération des réservations'
          )
        }

        if (!statsResponse.ok) {
          console.warn('Erreur récupération stats:', statsData.error)
        } else {
          setStats(statsData)
        }

        setBookings(bookingsData.bookings || [])
      } catch (err) {
        console.error('Erreur récupération données:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
        setStatsLoading(false)
      }
    }

    fetchData()
  }, [session?.user?.id])

  // Get welcome message based on time
  const getWelcomeMessage = () => {
    const hour = currentTime.getHours()
    const firstName = session?.user?.name?.split(' ')[0] || 'Membre'

    if (hour < 12) {
      return `Bon matin, ${firstName} ☀️`
    } else if (hour < 17) {
      return `Bon après-midi, ${firstName} 🌤️`
    } else {
      return `Bonsoir, ${firstName} 🌙`
    }
  }

  // Calculate basic stats from bookings (fallback if API stats fail)
  const basicStats = {
    total: bookings.length,
    active: bookings.filter(
      (b) => b.status === 'confirmed' && !isPast(parseISO(b.date))
    ).length,
    pending: bookings.filter((b) => b.status === 'payment_pending').length,
    thisMonth: bookings.filter((b) => {
      const bookingDate = parseISO(b.date)
      const now = new Date()
      return (
        bookingDate.getMonth() === now.getMonth() &&
        bookingDate.getFullYear() === now.getFullYear()
      )
    }).length,
  }

  // Use API stats if available, otherwise fallback to basic stats
  const displayStats = stats?.overview || basicStats

  // Get upcoming bookings
  const upcomingBookings = bookings
    .filter((b) => b.status === 'confirmed' && !isPast(parseISO(b.date)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const cardHoverVariants = {
    hover: {
      y: -8,
      scale: 1.02,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      transition: { duration: 0.3 },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 mt-[100px] h-[100px] border-b border-orange-200/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg">
                  <Coffee className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-xl font-bold text-transparent">
                    Cow or King
                  </h1>
                  <p className="text-sm text-gray-500">Coworking Dashboard</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative hidden md:flex">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  className="w-64 border-orange-200/50 bg-white/50 pl-9 focus:border-orange-400"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Weather Widget */}
              <div className="hidden items-center space-x-2 rounded-lg bg-gradient-to-r from-blue-100 to-sky-100 px-3 py-2 lg:flex">
                <Sun className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">22°C</span>
              </div>

              {/* Time */}
              <div className="hidden flex-col items-end sm:flex">
                <div className="text-sm font-semibold text-gray-900">
                  {format(currentTime, 'HH:mm')}
                </div>
                <div className="text-xs text-gray-500">
                  {format(currentTime, 'EEE d MMM', { locale: fr })}
                </div>
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500">
                  <span className="text-xs font-bold text-white">2</span>
                </div>
              </Button>

              {/* Avatar */}
              <Avatar className="h-10 w-10 ring-2 ring-orange-200 ring-offset-2">
                <AvatarImage src={session?.user?.image || undefined} />
                <AvatarFallback className="bg-gradient-to-r from-orange-500 to-amber-500 font-semibold text-white">
                  {session?.user?.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('') || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Welcome Section */}
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="mb-2 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-4xl font-bold text-transparent">
              {getWelcomeMessage()}
            </h1>
            <p className="text-lg text-gray-600">
              Prêt pour une journée productive ? Découvrez vos espaces favoris
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 gap-6 lg:grid-cols-4"
          >
            {[
              {
                title: 'Réservations Actives',
                value: displayStats.activeBookings || displayStats.active,
                change: statsLoading
                  ? 'Chargement...'
                  : stats?.thisMonth?.changeFromLastMonth
                    ? `${stats.thisMonth.changeFromLastMonth > 0 ? '+' : ''}${stats.thisMonth.changeFromLastMonth.toFixed(0)}% ce mois`
                    : 'À venir',
                icon: Calendar,
                gradient: 'from-blue-500 to-cyan-500',
                bgGradient: 'from-blue-50 to-cyan-50',
              },
              {
                title: 'En Attente',
                value: displayStats.pendingBookings || displayStats.pending,
                change: 'À confirmer',
                icon: Clock,
                gradient: 'from-amber-500 to-orange-500',
                bgGradient: 'from-amber-50 to-orange-50',
              },
              {
                title: 'Ce Mois-ci',
                value: stats?.thisMonth?.bookings || displayStats.thisMonth,
                change: statsLoading
                  ? 'Chargement...'
                  : stats?.thisMonth?.spent
                    ? `${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.thisMonth.spent)} dépensé`
                    : 'Aucune dépense',
                icon: TrendingUp,
                gradient: 'from-green-500 to-emerald-500',
                bgGradient: 'from-green-50 to-emerald-50',
              },
              {
                title: 'Total Heures',
                value: Math.round(displayStats.totalHoursSpent || 0),
                change: stats?.overview?.averageSessionDuration
                  ? `Moy. ${stats.overview.averageSessionDuration.toFixed(1)}h/session`
                  : 'Temps passé',
                icon: Users,
                gradient: 'from-purple-500 to-pink-500',
                bgGradient: 'from-purple-50 to-pink-50',
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                variants={cardHoverVariants}
                whileHover="hover"
                className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} rounded-2xl border border-white/50 p-6 shadow-lg`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <div className="mb-2 text-3xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <Badge variant="secondary" className="bg-white/50 text-xs">
                      {stat.change}
                    </Badge>
                  </div>
                  <div
                    className={`rounded-xl bg-gradient-to-r p-3 ${stat.gradient} shadow-lg`}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/20 blur-lg" />
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            {[
              {
                title: 'Nouvelle Réservation',
                desc: 'Réserver un espace',
                icon: Plus,
                href: '/reservation',
                gradient: 'from-orange-500 to-red-500',
              },
              {
                title: 'Mes Réservations',
                desc: 'Gérer vos réservations',
                icon: Calendar,
                href: '/dashboard/client/bookings',
                gradient: 'from-blue-500 to-indigo-500',
              },
              {
                title: 'Commande Café',
                desc: 'Menu du jour',
                icon: Coffee,
                href: '/dashboard/client/orders',
                gradient: 'from-amber-500 to-orange-500',
              },
              {
                title: 'Support',
                desc: 'Aide et assistance',
                icon: Activity,
                href: '/support',
                gradient: 'from-purple-500 to-pink-500',
              },
            ].map((action, index) => (
              <Link key={action.title} href={action.href}>
                <motion.div
                  variants={cardHoverVariants}
                  whileHover="hover"
                  className={`relative bg-gradient-to-br p-6 ${action.gradient} group cursor-pointer overflow-hidden rounded-2xl text-white shadow-lg`}
                >
                  <div className="relative z-10">
                    <action.icon className="mb-4 h-8 w-8 transition-transform duration-300 group-hover:scale-110" />
                    <h3 className="mb-1 font-semibold">{action.title}</h3>
                    <p className="text-sm opacity-90">{action.desc}</p>
                  </div>
                  {/* Hover Effect */}
                  <div className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-500 group-hover:translate-y-0" />
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/20 blur-xl" />
                </motion.div>
              </Link>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Upcoming Bookings */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="overflow-hidden rounded-2xl border-orange-200/50 bg-white/70 shadow-xl backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        Prochaines Réservations
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {upcomingBookings.length} réservation
                        {upcomingBookings.length > 1 ? 's' : ''} à venir
                      </CardDescription>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 animate-pulse rounded bg-gray-200" />
                            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : upcomingBookings.length === 0 ? (
                    <div className="py-12 text-center">
                      <Calendar className="mx-auto mb-4 h-16 w-16 text-orange-300" />
                      <h3 className="mb-2 font-semibold text-gray-900">
                        Aucune réservation à venir
                      </h3>
                      <p className="mb-6 text-gray-500">
                        Commencez par réserver votre premier espace !
                      </p>
                      <Link href="/reservation">
                        <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                          Faire une réservation
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {upcomingBookings.map((booking, index) => (
                          <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between rounded-xl border border-orange-200/50 bg-gradient-to-r from-white to-orange-50/50 p-4 transition-all duration-300 hover:shadow-md"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-amber-400">
                                <MapPin className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {booking.space.name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {booking.space.location}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                  {format(
                                    parseISO(booking.date),
                                    'EEEE d MMMM',
                                    { locale: fr }
                                  )}{' '}
                                  • {booking.startTime}-{booking.endTime}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="mb-1 font-semibold text-gray-900">
                                {new Intl.NumberFormat('fr-FR', {
                                  style: 'currency',
                                  currency: 'EUR',
                                }).format(booking.totalPrice)}
                              </div>
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                                Confirmée
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Favorite Spaces */}
              <Card className="rounded-2xl border-orange-200/50 bg-white/70 shadow-xl backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Star className="mr-2 h-5 w-5 text-yellow-500" />
                    Espaces Favoris
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                          <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
                        </div>
                      ))}
                    </div>
                  ) : stats?.favoriteSpaces?.length > 0 ? (
                    stats.favoriteSpaces.map((favorite: any, index: number) => (
                      <div
                        key={favorite.space.id}
                        className="flex items-center justify-between rounded-lg border border-yellow-200/50 bg-gradient-to-r from-yellow-50 to-orange-50 p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <Star className="h-4 w-4 fill-current text-yellow-400" />
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {favorite.space.name}
                            </span>
                            <p className="text-xs text-gray-600">
                              {favorite.bookingCount} réservation
                              {favorite.bookingCount > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-gray-900">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(favorite.totalSpent)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {favorite.totalHours}h
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center">
                      <Star className="mx-auto mb-2 h-8 w-8 text-yellow-300" />
                      <p className="text-sm text-gray-500">
                        Aucun espace favori encore
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Total Spent */}
              <Card className="rounded-2xl border-orange-200/50 bg-white/70 shadow-xl backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                    Dépenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {statsLoading ? (
                    <div className="space-y-3">
                      <div className="h-6 w-full animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                    </div>
                  ) : (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(stats?.overview?.totalSpent || 0)}
                        </div>
                        <p className="text-sm text-gray-600">Total dépensé</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-blue-600">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(
                              stats?.overview?.averageBookingPrice || 0
                            )}
                          </div>
                          <p className="text-xs text-gray-500">Prix moyen</p>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-600">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(stats?.thisMonth?.spent || 0)}
                          </div>
                          <p className="text-xs text-gray-500">Ce mois</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="rounded-2xl border-orange-200/50 bg-white/70 shadow-xl backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Activity className="mr-2 h-5 w-5 text-blue-500" />
                    Activité Récente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start space-x-3">
                          <div className="mt-2 h-2 w-2 animate-pulse rounded-full bg-gray-200" />
                          <div className="flex-1 space-y-1">
                            <div className="h-4 animate-pulse rounded bg-gray-200" />
                            <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : bookings.length > 0 ? (
                    bookings.slice(0, 3).map((booking, index) => {
                      const isRecent =
                        new Date(booking.createdAt).getTime() >
                        Date.now() - 24 * 60 * 60 * 1000 // 24h
                      const statusColor =
                        booking.status === 'confirmed'
                          ? 'green'
                          : booking.status === 'pending'
                            ? 'blue'
                            : booking.status === 'payment_pending'
                              ? 'amber'
                              : 'red'

                      return (
                        <div
                          key={booking.id}
                          className="flex items-start space-x-3"
                        >
                          <div
                            className={`mt-2 h-2 w-2 rounded-full ${
                              statusColor === 'green'
                                ? 'bg-green-500'
                                : statusColor === 'blue'
                                  ? 'bg-blue-500'
                                  : statusColor === 'amber'
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                            }`}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {booking.status === 'confirmed' &&
                                'Réservation confirmée'}
                              {booking.status === 'pending' &&
                                'Réservation en attente'}
                              {booking.status === 'payment_pending' &&
                                'Paiement en attente'}
                              {booking.status === 'cancelled' &&
                                'Réservation annulée'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {booking.space.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(
                                parseISO(booking.createdAt),
                                'd MMM yyyy',
                                { locale: fr }
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-4 text-center">
                      <Activity className="mx-auto mb-2 h-8 w-8 text-blue-300" />
                      <p className="text-sm text-gray-500">
                        Aucune activité récente
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
