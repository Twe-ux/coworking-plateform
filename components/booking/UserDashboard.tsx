'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Edit3,
  History,
  Plus,
  QrCode,
  Search,
  Settings,
  Trash2,
  User,
  Users,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'

// Types for dashboard
interface Reservation {
  id: string
  spaceId: string
  spaceName: string
  location: string
  date: Date
  startTime: string
  endTime?: string
  duration: number
  durationType: 'hour' | 'day' | 'week' | 'month'
  guests: number
  totalPrice: number
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  qrCode?: string
  features: string[]
}

interface UserProfile {
  name: string
  email: string
  phone: string
  memberSince: Date
  totalBookings: number
  favoriteSpace: string
  membershipType: string
  loyaltyPoints: number
}

const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'res-001',
    spaceId: 'places',
    spaceName: 'Places',
    location: 'Rez-de-chaussée',
    date: new Date('2024-08-05'),
    startTime: '09:00',
    endTime: '12:00',
    duration: 3,
    durationType: 'hour',
    guests: 1,
    totalPrice: 24,
    status: 'confirmed',
    qrCode: 'QR123456',
    features: ['WiFi Fibre', 'Accès boissons'],
  },
  {
    id: 'res-002',
    spaceId: 'verriere',
    spaceName: 'Salle Verrière',
    location: 'Niveau intermédiaire',
    date: new Date('2024-08-07'),
    startTime: '14:00',
    endTime: '18:00',
    duration: 4,
    durationType: 'hour',
    guests: 2,
    totalPrice: 48,
    status: 'pending',
    features: ['Lumière naturelle', 'Tableau blanc'],
  },
  {
    id: 'res-003',
    spaceId: 'etage',
    spaceName: 'Étage',
    location: 'Premier étage',
    date: new Date('2024-07-28'),
    startTime: '10:00',
    duration: 1,
    durationType: 'day',
    guests: 1,
    totalPrice: 40,
    status: 'completed',
    features: ['Zone silencieuse', 'Écrans partagés'],
  },
]

const MOCK_USER: UserProfile = {
  name: 'Marie Dubois',
  email: 'marie.dubois@email.com',
  phone: '06 12 34 56 78',
  memberSince: new Date('2024-01-15'),
  totalBookings: 12,
  favoriteSpace: 'Salle Verrière',
  membershipType: 'Premium',
  loyaltyPoints: 150,
}

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<
    'reservations' | 'profile' | 'history'
  >('reservations')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredReservations = MOCK_RESERVATIONS.filter((reservation) => {
    const matchesStatus =
      filterStatus === 'all' || reservation.status === filterStatus
    const matchesSearch =
      reservation.spaceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-orange-600 bg-orange-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      case 'completed':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return CheckCircle
      case 'pending':
        return AlertCircle
      case 'cancelled':
        return XCircle
      case 'completed':
        return CheckCircle
      default:
        return AlertCircle
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <div className="from-coffee-secondary/20 min-h-screen bg-linear-to-br to-white">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-md px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-coffee-primary text-xl font-bold">
                Mon Espace
              </h1>
              <p className="text-sm text-gray-600">Gérez vos réservations</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative rounded-full p-2 transition-colors hover:bg-gray-100">
                <Bell className="text-coffee-primary h-6 w-6" />
                <div className="bg-coffee-primary absolute -top-1 -right-1 h-3 w-3 rounded-full"></div>
              </button>
              <button className="rounded-full p-2 transition-colors hover:bg-gray-100">
                <Settings className="text-coffee-primary h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4">
        {/* Quick Stats */}
        <motion.div
          className="py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="from-coffee-primary to-coffee-accent mb-6 rounded-2xl bg-linear-to-r p-6 text-white">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  Bonjour, {MOCK_USER.name.split(' ')[0]}!
                </h2>
                <p className="text-coffee-secondary/90 text-sm">
                  Membre {MOCK_USER.membershipType}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {MOCK_USER.loyaltyPoints}
                </div>
                <div className="text-coffee-secondary/90 text-sm">points</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold">
                  {MOCK_USER.totalBookings}
                </div>
                <div className="text-coffee-secondary/90 text-xs">
                  Réservations
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">
                  {
                    filteredReservations.filter((r) => r.status === 'confirmed')
                      .length
                  }
                </div>
                <div className="text-coffee-secondary/90 text-xs">À venir</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">⭐ 4.9</div>
                <div className="text-coffee-secondary/90 text-xs">
                  Satisfaction
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <motion.button
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="text-coffee-accent mx-auto mb-2 h-6 w-6" />
              <span className="text-coffee-primary text-sm font-medium">
                Nouvelle réservation
              </span>
            </motion.button>

            <motion.button
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <QrCode className="text-coffee-accent mx-auto mb-2 h-6 w-6" />
              <span className="text-coffee-primary text-sm font-medium">
                Scanner QR
              </span>
            </motion.button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
          {[
            { id: 'reservations', label: 'Réservations', icon: Calendar },
            { id: 'profile', label: 'Profil', icon: User },
            { id: 'history', label: 'Historique', icon: History },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'text-coffee-primary bg-white shadow-sm'
                  : 'hover:text-coffee-primary text-gray-600'
              }`}
              onClick={() => setActiveTab(tab.id as any)}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Reservations Tab */}
          {activeTab === 'reservations' && (
            <motion.div
              key="reservations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 pb-20"
            >
              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une réservation..."
                    className="focus:ring-coffee-primary w-full rounded-xl border border-gray-300 py-3 pr-4 pl-10 focus:border-transparent focus:ring-2"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[
                    { id: 'all', label: 'Tous' },
                    { id: 'confirmed', label: 'Confirmés' },
                    { id: 'pending', label: 'En attente' },
                    { id: 'completed', label: 'Terminés' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                        filterStatus === filter.id
                          ? 'bg-coffee-primary text-white'
                          : 'hover:border-coffee-primary border border-gray-200 bg-white text-gray-600'
                      }`}
                      onClick={() => setFilterStatus(filter.id)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reservations List */}
              <div className="space-y-4">
                {filteredReservations.map((reservation) => {
                  const StatusIcon = getStatusIcon(reservation.status)
                  return (
                    <motion.div
                      key={reservation.id}
                      className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md"
                      whileHover={{ scale: 1.02 }}
                      layout
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="text-coffee-primary font-bold">
                              {reservation.spaceName}
                            </h3>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(reservation.status)}`}
                            >
                              {reservation.status === 'confirmed'
                                ? 'Confirmé'
                                : reservation.status === 'pending'
                                  ? 'En attente'
                                  : reservation.status === 'cancelled'
                                    ? 'Annulé'
                                    : 'Terminé'}
                            </span>
                          </div>
                          <p className="mb-2 text-sm text-gray-600">
                            {reservation.location}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(reservation.date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {reservation.startTime}
                              {reservation.endTime &&
                                ` - ${reservation.endTime}`}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {reservation.guests}
                            </div>
                          </div>
                        </div>

                        <StatusIcon
                          className={`h-6 w-6 ${
                            reservation.status === 'confirmed'
                              ? 'text-green-600'
                              : reservation.status === 'pending'
                                ? 'text-orange-600'
                                : reservation.status === 'cancelled'
                                  ? 'text-red-600'
                                  : 'text-blue-600'
                          }`}
                        />
                      </div>

                      <div className="mb-4 flex flex-wrap gap-2">
                        {reservation.features
                          .slice(0, 2)
                          .map((feature, index) => (
                            <span
                              key={index}
                              className="bg-coffee-secondary/30 text-coffee-primary rounded-full px-2 py-1 text-xs"
                            >
                              {feature}
                            </span>
                          ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-coffee-accent text-lg font-bold">
                          {reservation.totalPrice}€
                        </div>

                        <div className="flex gap-2">
                          {reservation.status === 'confirmed' &&
                            reservation.qrCode && (
                              <motion.button
                                className="bg-coffee-primary/10 text-coffee-accent hover:bg-coffee-primary/20 rounded-lg p-2"
                                whileTap={{ scale: 0.95 }}
                              >
                                <QrCode className="h-5 w-5" />
                              </motion.button>
                            )}

                          {(reservation.status === 'confirmed' ||
                            reservation.status === 'pending') && (
                            <>
                              <motion.button
                                className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
                                whileTap={{ scale: 0.95 }}
                              >
                                <Edit3 className="h-5 w-5" />
                              </motion.button>

                              <motion.button
                                className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200"
                                whileTap={{ scale: 0.95 }}
                              >
                                <Trash2 className="h-5 w-5" />
                              </motion.button>
                            </>
                          )}

                          <motion.button
                            className="rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                            whileTap={{ scale: 0.95 }}
                          >
                            <Download className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {filteredReservations.length === 0 && (
                <div className="py-12 text-center">
                  <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-600">
                    Aucune réservation
                  </h3>
                  <p className="mb-6 text-gray-500">
                    {searchQuery || filterStatus !== 'all'
                      ? 'Aucune réservation ne correspond à vos critères'
                      : "Vous n'avez pas encore de réservation"}
                  </p>
                  <motion.button
                    className="from-coffee-primary to-coffee-accent rounded-xl bg-linear-to-r px-6 py-3 font-semibold text-white"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="mr-2 inline h-5 w-5" />
                    Faire une réservation
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 pb-20"
            >
              {/* Profile Info */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-coffee-primary mb-4 font-bold">
                  Informations personnelles
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={MOCK_USER.name}
                      className="focus:ring-coffee-primary w-full rounded-xl border border-gray-300 p-3 focus:border-transparent focus:ring-2"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={MOCK_USER.email}
                      className="focus:ring-coffee-primary w-full rounded-xl border border-gray-300 p-3 focus:border-transparent focus:ring-2"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={MOCK_USER.phone}
                      className="focus:ring-coffee-primary w-full rounded-xl border border-gray-300 p-3 focus:border-transparent focus:ring-2"
                      readOnly
                    />
                  </div>
                </div>

                <motion.button
                  className="bg-coffee-primary mt-4 w-full rounded-xl py-3 font-semibold text-white"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Modifier les informations
                </motion.button>
              </div>

              {/* Membership Info */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-coffee-primary mb-4 font-bold">Adhésion</h3>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type d'adhésion:</span>
                    <span className="text-coffee-primary font-semibold">
                      {MOCK_USER.membershipType}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Membre depuis:</span>
                    <span className="font-semibold">
                      {MOCK_USER.memberSince.toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Espace favori:</span>
                    <span className="font-semibold">
                      {MOCK_USER.favoriteSpace}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Points de fidélité:</span>
                    <span className="text-coffee-accent font-semibold">
                      {MOCK_USER.loyaltyPoints} points
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-coffee-primary mb-4 font-bold">
                  Moyens de paiement
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center gap-3">
                      <CreditCard className="text-coffee-accent h-6 w-6" />
                      <div>
                        <p className="font-medium">•••• •••• •••• 1234</p>
                        <p className="text-sm text-gray-600">Expire 12/26</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-600">
                      Principal
                    </span>
                  </div>
                </div>

                <motion.button
                  className="border-coffee-primary text-coffee-accent hover:bg-coffee-primary mt-4 w-full rounded-xl border py-3 font-semibold transition-colors hover:text-white"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ajouter un moyen de paiement
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 pb-20"
            >
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-coffee-primary mb-4 font-bold">
                  Statistiques
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-coffee-secondary/20 rounded-xl p-4 text-center">
                    <div className="text-coffee-accent text-2xl font-bold">
                      {MOCK_USER.totalBookings}
                    </div>
                    <div className="text-sm text-gray-600">
                      Réservations totales
                    </div>
                  </div>

                  <div className="bg-coffee-secondary/20 rounded-xl p-4 text-center">
                    <div className="text-coffee-accent text-2xl font-bold">
                      {filteredReservations.reduce(
                        (sum, r) => sum + r.totalPrice,
                        0
                      )}
                      €
                    </div>
                    <div className="text-sm text-gray-600">
                      Dépenses totales
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-3">
                <h3 className="text-coffee-primary font-semibold">
                  Activité récente
                </h3>

                {[
                  {
                    action: 'Réservation confirmée',
                    space: 'Salle Verrière',
                    date: '2 août',
                    type: 'success',
                  },
                  {
                    action: 'Paiement effectué',
                    space: 'Places',
                    date: '1 août',
                    type: 'payment',
                  },
                  {
                    action: 'Check-in effectué',
                    space: 'Étage',
                    date: '28 juillet',
                    type: 'checkin',
                  },
                  {
                    action: 'Avis laissé',
                    space: 'Places',
                    date: '25 juillet',
                    type: 'review',
                  },
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        activity.type === 'success'
                          ? 'bg-green-500'
                          : activity.type === 'payment'
                            ? 'bg-blue-500'
                            : activity.type === 'checkin'
                              ? 'bg-coffee-primary'
                              : 'bg-yellow-500'
                      }`}
                    />

                    <div className="flex-1">
                      <p className="text-coffee-primary font-medium">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-600">{activity.space}</p>
                    </div>

                    <span className="text-sm text-gray-500">
                      {activity.date}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
