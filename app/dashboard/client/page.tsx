'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns'
import { fr } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Coffee, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  ShoppingBag,
  BarChart3,
  Star,
  Wifi,
  Thermometer
} from 'lucide-react'
import Link from 'next/link'
import { ClientLayout } from '@/components/dashboard/client/client-layout'
import { ClientCard, StatsCard, QuickActionCard } from '@/components/dashboard/client/client-cards'
import { containerVariants, headerVariants, listItemVariants, coffeeStreamVariants, loadingVariants } from '@/lib/animations'

interface BookingData {
  id: string
  space: {
    name: string
    location: string
    image?: string
  }
  date: string
  startTime: string
  endTime: string
  duration: number
  durationType: 'hour' | 'day'
  guests: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'payment_pending'
  paymentStatus: string
  paymentMethod: 'onsite' | 'stripe_card' | 'stripe_paypal'
  createdAt: string
}

export default function ClientDashboard() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Mettre à jour l'heure toutes les minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Récupérer les réservations utilisateur
  useEffect(() => {
    const fetchBookings = async () => {
      if (!session?.user?.id) return

      try {
        const response = await fetch('/api/bookings')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la récupération des réservations')
        }

        setBookings(data.bookings || [])
      } catch (err) {
        console.error('Erreur récupération réservations:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [session?.user?.id])

  // Fonction pour obtenir le statut visuel d'une réservation
  const getBookingStatusInfo = (booking: BookingData) => {
    const bookingDate = parseISO(booking.date)
    
    if (booking.status === 'cancelled') {
      return { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: AlertCircle }
    }
    
    if (booking.status === 'payment_pending') {
      return { label: 'Paiement en attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    }
    
    if (isPast(bookingDate) && booking.status === 'confirmed') {
      return { label: 'Terminée', color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
    }
    
    if (isToday(bookingDate)) {
      return { label: 'Aujourd&apos;hui', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
    
    if (isTomorrow(bookingDate)) {
      return { label: 'Demain', color: 'bg-blue-100 text-blue-800', icon: Calendar }
    }
    
    return { label: 'À venir', color: 'bg-blue-100 text-blue-800', icon: Calendar }
  }

  // Calculer les statistiques
  const stats = {
    total: bookings.length,
    active: bookings.filter(b => b.status === 'confirmed' && !isPast(parseISO(b.date))).length,
    pending: bookings.filter(b => b.status === 'payment_pending').length,
    thisMonth: bookings.filter(b => {
      const bookingDate = parseISO(b.date)
      const now = new Date()
      return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear()
    }).length
  }

  // Obtenir un message de bienvenue basé sur l'heure
  const getWelcomeMessage = () => {
    const hour = currentTime.getHours()
    const firstName = session?.user?.name?.split(' ')[0] || 'Cher membre'
    
    if (hour < 12) {
      return `Bon matin, ${firstName} ☀️`
    } else if (hour < 17) {
      return `Bon après-midi, ${firstName} 🌤️`
    } else {
      return `Bonsoir, ${firstName} 🌙`
    }
  }

  return (
    <ClientLayout>
      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header de bienvenue avec thème café */}
        <motion.div 
          className="relative"
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <div 
            className="rounded-2xl p-6 md:p-8 border"
            style={{
              backgroundColor: 'var(--color-coffee-secondary)',
              borderColor: 'var(--color-coffee-light)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 
                  className="text-2xl md:text-3xl font-bold mb-2"
                  style={{ color: 'var(--color-coffee-primary)' }}
                >
                  {getWelcomeMessage()}
                </h1>
                <p 
                  className="text-base md:text-lg"
                  style={{ color: 'var(--color-client-text)' }}
                >
                  Prêt pour une journée productive au café ? ☕
                </p>
                <p 
                  className="text-sm mt-1"
                  style={{ color: 'var(--color-client-muted)' }}
                >
                  {format(currentTime, 'EEEE d MMMM yyyy • HH:mm', { locale: fr })}
                </p>
              </div>
              <div className="hidden md:block">
                <motion.div 
                  className="relative"
                  variants={coffeeStreamVariants}
                  animate="animate"
                >
                  <Coffee 
                    className="h-16 w-16 opacity-20" 
                    style={{ color: 'var(--color-coffee-primary)' }} 
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Thermometer className="h-6 w-6" style={{ color: 'var(--color-coffee-accent)' }} />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions rapides avec style café */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <QuickActionCard
            title="Réserver un espace"
            description="Trouvez votre spot idéal"
            icon={MapPin}
            href="/reservation"
          />
          
          <QuickActionCard
            title="Commander café"
            description="Menu du jour disponible"
            icon={Coffee}
            href="/dashboard/client/commandes"
          />
          
          <QuickActionCard
            title="Mes réservations"
            description="Gérer mes réservations"
            icon={Calendar}
            href="/dashboard/client/reservations"
          />
          
          <QuickActionCard
            title="Espaces favoris"
            description="Accès rapide"
            icon={Star}
            href="/dashboard/client/favoris"
          />
        </motion.div>

        {/* Statistiques avec thème café */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <StatsCard
            title="Réservations actives"
            value={stats.active}
            description="En cours"
            icon={Clock}
            trend={{ value: "2", isPositive: true }}
          />
          
          <StatsCard
            title="Espaces disponibles"
            value="12"
            description="Maintenant"
            icon={MapPin}
          />
          
          <StatsCard
            title="Ce mois-ci"
            value={stats.thisMonth}
            description="Réservations totales"
            icon={BarChart3}
            trend={{ value: "15%", isPositive: true }}
          />
          
          <StatsCard
            title="Commandes café"
            value="8"
            description="Ce mois"
            icon={ShoppingBag}
            trend={{ value: "3", isPositive: true }}
          />
        </motion.div>

        {/* Mes réservations récentes avec style café */}
        <ClientCard
          title="Mes prochaines réservations"
          description={loading ? 'Chargement...' : `${bookings.length} réservation${bookings.length > 1 ? 's' : ''} au total`}
          icon={Calendar}
          variant="warm"
        >
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div 
                key="loading"
                className="flex items-center justify-center py-8"
                variants={loadingVariants}
                initial="hidden"
                animate="animate"
                exit={{ opacity: 0 }}
              >
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-coffee-primary)' }} />
                <span className="ml-2" style={{ color: 'var(--color-client-muted)' }}>
                  Chargement de vos réservations...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.reload()}
                style={{ borderColor: 'var(--color-coffee-primary)', color: 'var(--color-coffee-primary)' }}
              >
                Réessayer
              </Button>
            </div>
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="text-center py-12">
              <Coffee className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--color-coffee-muted)' }} />
              <h3 
                className="text-lg font-medium mb-2"
                style={{ color: 'var(--color-client-text)' }}
              >
                Aucune réservation
              </h3>
              <p 
                className="mb-4"
                style={{ color: 'var(--color-client-muted)' }}
              >
                Vous n&apos;avez encore aucune réservation. Commencez par explorer nos espaces !
              </p>
              <Link href="/reservation">
                <Button 
                  style={{ 
                    backgroundColor: 'var(--color-coffee-primary)', 
                    borderColor: 'var(--color-coffee-primary)' 
                  }}
                >
                  Faire ma première réservation
                </Button>
              </Link>
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <motion.div 
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {bookings
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10) // Afficher les 10 dernières réservations
                .map((booking, index) => {
                  const statusInfo = getBookingStatusInfo(booking)
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <motion.div 
                      key={booking.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      style={{
                        borderColor: 'var(--color-client-border)',
                        backgroundColor: 'var(--color-client-bg)'
                      }}
                      variants={listItemVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 
                            className="font-semibold"
                            style={{ color: 'var(--color-client-text)' }}
                          >
                            {booking.space.name}
                          </h3>
                          <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div 
                          className="space-y-1 text-sm"
                          style={{ color: 'var(--color-client-muted)' }}
                        >
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(booking.date), 'EEEE d MMMM yyyy', { locale: fr })}
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {booking.startTime} - {booking.endTime}
                            <span style={{ color: 'var(--color-client-muted)', opacity: 0.7 }}>
                              ({booking.durationType === 'hour' ? `${booking.duration}h` : `${booking.duration} jour${booking.duration > 1 ? 's' : ''}`})
                            </span>
                          </p>
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {booking.space.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div 
                          className="font-semibold text-lg"
                          style={{ color: 'var(--color-coffee-primary)' }}
                        >
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR'
                          }).format(booking.totalPrice)}
                        </div>
                        <div 
                          className="text-xs capitalize"
                          style={{ color: 'var(--color-client-muted)' }}
                        >
                          {booking.paymentMethod === 'onsite' ? 'Sur place' : 
                           booking.paymentMethod === 'stripe_card' ? 'Carte' : 'PayPal'}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              
              {bookings.length > 10 && (
                <div 
                  className="text-center pt-4 border-t"
                  style={{ borderColor: 'var(--color-client-border)' }}
                >
                  <Link href="/dashboard/client/reservations">
                    <Button 
                      variant="outline" 
                      size="sm"
                      style={{ 
                        borderColor: 'var(--color-coffee-primary)', 
                        color: 'var(--color-coffee-primary)' 
                      }}
                    >
                      Voir toutes mes réservations ({bookings.length})
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </ClientCard>
      </motion.div>
    </ClientLayout>
  )
}