'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Settings,
  CreditCard,
  Bell,
  History,
  Star,
  Edit3,
  Trash2,
  Download,
  Coffee,
  Wifi,
  Users,
  ChevronRight,
  Filter,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  QrCode
} from 'lucide-react'

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
    features: ['WiFi Fibre', 'Accès boissons']
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
    features: ['Lumière naturelle', 'Tableau blanc']
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
    features: ['Zone silencieuse', 'Écrans partagés']
  }
]

const MOCK_USER: UserProfile = {
  name: 'Marie Dubois',
  email: 'marie.dubois@email.com',
  phone: '06 12 34 56 78',
  memberSince: new Date('2024-01-15'),
  totalBookings: 12,
  favoriteSpace: 'Salle Verrière',
  membershipType: 'Premium',
  loyaltyPoints: 150
}

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<'reservations' | 'profile' | 'history'>('reservations')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredReservations = MOCK_RESERVATIONS.filter(reservation => {
    const matchesStatus = filterStatus === 'all' || reservation.status === filterStatus
    const matchesSearch = reservation.spaceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      month: 'short'
    })
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-coffee-secondary/20 to-white">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-coffee-accent">Mon Espace</h1>
              <p className="text-sm text-gray-600">Gérez vos réservations</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
                <Bell className="w-6 h-6 text-coffee-accent" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-coffee-primary rounded-full"></div>
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Settings className="w-6 h-6 text-coffee-accent" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        {/* Quick Stats */}
        <motion.div
          className="py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-linear-to-r from-coffee-primary to-coffee-accent rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Bonjour, {MOCK_USER.name.split(' ')[0]}!</h2>
                <p className="text-coffee-secondary/90 text-sm">Membre {MOCK_USER.membershipType}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{MOCK_USER.loyaltyPoints}</div>
                <div className="text-coffee-secondary/90 text-sm">points</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold">{MOCK_USER.totalBookings}</div>
                <div className="text-coffee-secondary/90 text-xs">Réservations</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">
                  {filteredReservations.filter(r => r.status === 'confirmed').length}
                </div>
                <div className="text-coffee-secondary/90 text-xs">À venir</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">⭐ 4.9</div>
                <div className="text-coffee-secondary/90 text-xs">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <motion.button
              className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-6 h-6 text-coffee-primary mx-auto mb-2" />
              <span className="text-sm font-medium text-coffee-accent">Nouvelle réservation</span>
            </motion.button>
            
            <motion.button
              className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <QrCode className="w-6 h-6 text-coffee-primary mx-auto mb-2" />
              <span className="text-sm font-medium text-coffee-accent">Scanner QR</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {[
            { id: 'reservations', label: 'Réservations', icon: Calendar },
            { id: 'profile', label: 'Profil', icon: User },
            { id: 'history', label: 'Historique', icon: History }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-white text-coffee-accent shadow-sm'
                  : 'text-gray-600 hover:text-coffee-accent'
              }`}
              onClick={() => setActiveTab(tab.id as any)}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="w-4 h-4" />
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une réservation..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[
                    { id: 'all', label: 'Tous' },
                    { id: 'confirmed', label: 'Confirmés' },
                    { id: 'pending', label: 'En attente' },
                    { id: 'completed', label: 'Terminés' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                        filterStatus === filter.id
                          ? 'bg-coffee-primary text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-coffee-primary'
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
                      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                      layout
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-coffee-accent">{reservation.spaceName}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                              {reservation.status === 'confirmed' ? 'Confirmé' :
                               reservation.status === 'pending' ? 'En attente' :
                               reservation.status === 'cancelled' ? 'Annulé' : 'Terminé'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{reservation.location}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(reservation.date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {reservation.startTime}
                              {reservation.endTime && ` - ${reservation.endTime}`}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {reservation.guests}
                            </div>
                          </div>
                        </div>
                        
                        <StatusIcon className={`w-6 h-6 ${
                          reservation.status === 'confirmed' ? 'text-green-600' :
                          reservation.status === 'pending' ? 'text-orange-600' :
                          reservation.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'
                        }`} />
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {reservation.features.slice(0, 2).map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-coffee-secondary/30 text-coffee-accent text-xs rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-coffee-primary">
                          {reservation.totalPrice}€
                        </div>
                        
                        <div className="flex gap-2">
                          {reservation.status === 'confirmed' && reservation.qrCode && (
                            <motion.button
                              className="p-2 bg-coffee-primary/10 text-coffee-primary rounded-lg hover:bg-coffee-primary/20"
                              whileTap={{ scale: 0.95 }}
                            >
                              <QrCode className="w-5 h-5" />
                            </motion.button>
                          )}
                          
                          {(reservation.status === 'confirmed' || reservation.status === 'pending') && (
                            <>
                              <motion.button
                                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                whileTap={{ scale: 0.95 }}
                              >
                                <Edit3 className="w-5 h-5" />
                              </motion.button>
                              
                              <motion.button
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                whileTap={{ scale: 0.95 }}
                              >
                                <Trash2 className="w-5 h-5" />
                              </motion.button>
                            </>
                          )}
                          
                          <motion.button
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                            whileTap={{ scale: 0.95 }}
                          >
                            <Download className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {filteredReservations.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune réservation</h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery || filterStatus !== 'all'
                      ? 'Aucune réservation ne correspond à vos critères'
                      : 'Vous n\'avez pas encore de réservation'}
                  </p>
                  <motion.button
                    className="px-6 py-3 bg-linear-to-r from-coffee-primary to-coffee-accent text-white rounded-xl font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-5 h-5 inline mr-2" />
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
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-coffee-accent mb-4">Informations personnelles</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                    <input
                      type="text"
                      value={MOCK_USER.name}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={MOCK_USER.email}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={MOCK_USER.phone}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
                      readOnly
                    />
                  </div>
                </div>
                
                <motion.button
                  className="w-full mt-4 py-3 bg-coffee-primary text-white rounded-xl font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Modifier les informations
                </motion.button>
              </div>

              {/* Membership Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-coffee-accent mb-4">Adhésion</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type d'adhésion:</span>
                    <span className="font-semibold text-coffee-accent">{MOCK_USER.membershipType}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Membre depuis:</span>
                    <span className="font-semibold">{MOCK_USER.memberSince.toLocaleDateString('fr-FR')}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Espace favori:</span>
                    <span className="font-semibold">{MOCK_USER.favoriteSpace}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points de fidélité:</span>
                    <span className="font-semibold text-coffee-primary">{MOCK_USER.loyaltyPoints} points</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-coffee-accent mb-4">Moyens de paiement</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-coffee-primary" />
                      <div>
                        <p className="font-medium">•••• •••• •••• 1234</p>
                        <p className="text-sm text-gray-600">Expire 12/26</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                      Principal
                    </span>
                  </div>
                </div>
                
                <motion.button
                  className="w-full mt-4 py-3 border border-coffee-primary text-coffee-primary rounded-xl font-semibold hover:bg-coffee-primary hover:text-white transition-colors"
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
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-coffee-accent mb-4">Statistiques</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-coffee-secondary/20 rounded-xl">
                    <div className="text-2xl font-bold text-coffee-primary">{MOCK_USER.totalBookings}</div>
                    <div className="text-sm text-gray-600">Réservations totales</div>
                  </div>
                  
                  <div className="text-center p-4 bg-coffee-secondary/20 rounded-xl">
                    <div className="text-2xl font-bold text-coffee-primary">
                      {filteredReservations.reduce((sum, r) => sum + r.totalPrice, 0)}€
                    </div>
                    <div className="text-sm text-gray-600">Dépenses totales</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-3">
                <h3 className="font-semibold text-coffee-accent">Activité récente</h3>
                
                {[
                  { action: 'Réservation confirmée', space: 'Salle Verrière', date: '2 août', type: 'success' },
                  { action: 'Paiement effectué', space: 'Places', date: '1 août', type: 'payment' },
                  { action: 'Check-in effectué', space: 'Étage', date: '28 juillet', type: 'checkin' },
                  { action: 'Avis laissé', space: 'Places', date: '25 juillet', type: 'review' }
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'payment' ? 'bg-blue-500' :
                      activity.type === 'checkin' ? 'bg-coffee-primary' : 'bg-yellow-500'
                    }`} />
                    
                    <div className="flex-1">
                      <p className="font-medium text-coffee-accent">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.space}</p>
                    </div>
                    
                    <span className="text-sm text-gray-500">{activity.date}</span>
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