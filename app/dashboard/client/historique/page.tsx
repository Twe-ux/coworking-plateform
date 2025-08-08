'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { format, parseISO, isToday, isYesterday, isThisWeek, isThisMonth, startOfDay, endOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  History, 
  Search, 
  Filter,
  Calendar,
  Coffee,
  MapPin,
  ShoppingBag,
  User,
  ChevronDown,
  Clock,
  Euro,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Download,
  Loader2,
  BarChart3
} from 'lucide-react'
import { ClientLayout } from '@/components/dashboard/client/client-layout'
import { ClientCard, StatsCard } from '@/components/dashboard/client/client-cards'
import { containerVariants, listItemVariants } from '@/lib/animations'

type ActivityType = 'reservation' | 'order' | 'payment' | 'profile' | 'login'

interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  amount?: number
  status: 'success' | 'pending' | 'failed' | 'cancelled'
  timestamp: string
  location?: string
  metadata?: Record<string, any>
}

interface FilterOptions {
  type: ActivityType | 'all'
  status: 'all' | 'success' | 'pending' | 'failed' | 'cancelled'
  dateRange: 'all' | 'today' | 'yesterday' | 'week' | 'month'
  sortBy: 'date' | 'type' | 'amount'
  sortOrder: 'desc' | 'asc'
}

export default function ClientHistoriquePage() {
  const { data: session } = useSession()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    status: 'all',
    dateRange: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  })

  // Données mockées d'historique avec activités diverses pour "Cow or King Café"
  const mockActivities: Activity[] = [
    {
      id: 'ACT001',
      type: 'reservation',
      title: 'Réservation confirmée',
      description: 'Espace de coworking "Salon Barista" réservé',
      amount: 25.00,
      status: 'success',
      timestamp: '2024-01-08T09:15:00Z',
      location: '1er étage, près de la fenêtre',
      metadata: {
        duration: '4 heures',
        guests: 1,
        spaceType: 'individual'
      }
    },
    {
      id: 'ACT002',
      type: 'order',
      title: 'Commande café livrée',
      description: 'Cappuccino King + Croissant au beurre',
      amount: 6.70,
      status: 'success',
      timestamp: '2024-01-08T08:45:00Z',
      metadata: {
        items: 2,
        preparationTime: '5 minutes'
      }
    },
    {
      id: 'ACT003',
      type: 'payment',
      title: 'Paiement réussi',
      description: 'Paiement par carte bancaire',
      amount: 31.70,
      status: 'success',
      timestamp: '2024-01-08T08:43:00Z',
      metadata: {
        method: 'stripe_card',
        reference: 'PAY_8X9Y7Z'
      }
    },
    {
      id: 'ACT004',
      type: 'login',
      title: 'Connexion compte',
      description: 'Connexion depuis application mobile',
      status: 'success',
      timestamp: '2024-01-08T08:30:00Z',
      metadata: {
        device: 'Mobile',
        ip: '192.168.1.1'
      }
    },
    {
      id: 'ACT005',
      type: 'reservation',
      title: 'Réservation annulée',
      description: 'Annulation espace "Coin Mousseux"',
      amount: 18.50,
      status: 'cancelled',
      timestamp: '2024-01-07T16:20:00Z',
      location: 'Rez-de-chaussée',
      metadata: {
        reason: 'Annulation utilisateur',
        refundAmount: 18.50
      }
    },
    {
      id: 'ACT006',
      type: 'order',
      title: 'Commande en préparation',
      description: 'Latte Caramel Cow + Muffin myrtilles',
      amount: 8.30,
      status: 'pending',
      timestamp: '2024-01-07T14:15:00Z',
      metadata: {
        estimatedReady: '14:25'
      }
    },
    {
      id: 'ACT007',
      type: 'profile',
      title: 'Profil mis à jour',
      description: 'Modification des préférences de notification',
      status: 'success',
      timestamp: '2024-01-07T10:30:00Z',
      metadata: {
        changes: ['notifications', 'newsletter']
      }
    },
    {
      id: 'ACT008',
      type: 'reservation',
      title: 'Réservation terminée',
      description: 'Session coworking "Zone Focus" terminée',
      amount: 32.00,
      status: 'success',
      timestamp: '2024-01-06T18:00:00Z',
      location: '2ème étage, espace silencieux',
      metadata: {
        duration: '6 heures',
        rating: 5
      }
    },
    {
      id: 'ACT009',
      type: 'payment',
      title: 'Échec de paiement',
      description: 'Paiement PayPal échoué',
      amount: 15.20,
      status: 'failed',
      timestamp: '2024-01-06T09:12:00Z',
      metadata: {
        error: 'Insufficient funds',
        retryCount: 2
      }
    },
    {
      id: 'ACT010',
      type: 'order',
      title: 'Commande livrée',
      description: 'Earl Grey Premium + Pain au chocolat',
      amount: 5.70,
      status: 'success',
      timestamp: '2024-01-05T15:45:00Z',
      metadata: {
        rating: 4.5,
        feedback: 'Parfait comme toujours!'
      }
    }
  ]

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Simuler un appel API
        await new Promise(resolve => setTimeout(resolve, 1000))
        setActivities(mockActivities)
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  // Filtrer et trier les activités
  const filteredActivities = useMemo(() => {
    let filtered = [...activities]

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtre par type
    if (filters.type !== 'all') {
      filtered = filtered.filter(activity => activity.type === filters.type)
    }

    // Filtre par statut
    if (filters.status !== 'all') {
      filtered = filtered.filter(activity => activity.status === filters.status)
    }

    // Filtre par période
    if (filters.dateRange !== 'all') {
      const now = new Date()
      filtered = filtered.filter(activity => {
        const activityDate = parseISO(activity.timestamp)
        
        switch (filters.dateRange) {
          case 'today':
            return isToday(activityDate)
          case 'yesterday':
            return isYesterday(activityDate)
          case 'week':
            return isThisWeek(activityDate)
          case 'month':
            return isThisMonth(activityDate)
          default:
            return true
        }
      })
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'amount':
          const amountA = a.amount || 0
          const amountB = b.amount || 0
          comparison = amountA - amountB
          break
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [activities, searchQuery, filters])

  // Statistiques de l'historique
  const stats = useMemo(() => {
    const totalActivities = activities.length
    const totalAmount = activities
      .filter(a => a.amount && a.status === 'success')
      .reduce((sum, a) => sum + (a.amount || 0), 0)
    
    const reservations = activities.filter(a => a.type === 'reservation').length
    const orders = activities.filter(a => a.type === 'order').length
    
    return {
      totalActivities,
      totalAmount,
      reservations,
      orders
    }
  }, [activities])

  // Fonctions utilitaires
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'reservation': return Calendar
      case 'order': return Coffee
      case 'payment': return Euro
      case 'profile': return User
      case 'login': return CheckCircle
      default: return History
    }
  }

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'reservation': return 'var(--color-coffee-accent)'
      case 'order': return 'var(--color-coffee-primary)'
      case 'payment': return 'var(--color-coffee-warm)'
      case 'profile': return 'var(--color-client-muted)'
      case 'login': return 'var(--color-coffee-light)'
      default: return 'var(--color-client-muted)'
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'success':
        return { label: 'Succès', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'pending':
        return { label: 'En cours', color: 'bg-orange-100 text-orange-800', icon: Clock }
      case 'failed':
        return { label: 'Échec', color: 'bg-red-100 text-red-800', icon: AlertCircle }
      case 'cancelled':
        return { label: 'Annulé', color: 'bg-gray-100 text-gray-800', icon: X }
      default:
        return { label: 'Inconnu', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    }
  }

  const formatRelativeDate = (timestamp: string) => {
    const date = parseISO(timestamp)
    if (isToday(date)) return 'Aujourd\'hui'
    if (isYesterday(date)) return 'Hier'
    return format(date, 'EEEE d MMMM', { locale: fr })
  }

  // Exporter l'historique
  const exportHistory = async () => {
    setExportLoading(true)
    try {
      // Simuler l'export
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const csv = [
        ['Date', 'Type', 'Titre', 'Description', 'Montant', 'Statut'].join(','),
        ...filteredActivities.map(activity => [
          format(parseISO(activity.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          activity.type,
          activity.title,
          activity.description,
          activity.amount?.toFixed(2) || '',
          activity.status
        ].join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `historique_${format(new Date(), 'yyyy-MM-dd')}.csv`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
    } finally {
      setExportLoading(false)
    }
  }

  const activityTypes = [
    { id: 'all', label: 'Tout', icon: History },
    { id: 'reservation', label: 'Réservations', icon: Calendar },
    { id: 'order', label: 'Commandes', icon: Coffee },
    { id: 'payment', label: 'Paiements', icon: Euro },
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'login', label: 'Connexions', icon: CheckCircle }
  ]

  return (
    <ClientLayout>
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div>
          <h1 
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--color-coffee-primary)' }}
          >
            Historique complet
          </h1>
          <p style={{ color: 'var(--color-client-muted)' }}>
            Toutes vos activités et transactions au Cow or King Café
          </p>
        </div>

        {/* Statistiques générales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total activités"
            value={stats.totalActivities}
            description="Toutes activités"
            icon={History}
          />
          
          <StatsCard
            title="Montant total"
            value={`${stats.totalAmount.toFixed(2)}€`}
            description="Dépenses confirmées"
            icon={Euro}
          />
          
          <StatsCard
            title="Réservations"
            value={stats.reservations}
            description="Espaces réservés"
            icon={Calendar}
          />
          
          <StatsCard
            title="Commandes"
            value={stats.orders}
            description="Café & nourriture"
            icon={Coffee}
          />
        </div>

        {/* Recherche et filtres */}
        <ClientCard title="Recherche et filtres" icon={Search}>
          <div className="space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" 
                style={{ color: 'var(--color-client-muted)' }} 
              />
              <Input
                placeholder="Rechercher dans l'historique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                style={{ backgroundColor: 'var(--color-client-bg)' }}
              />
            </div>

            {/* Filtres rapides */}
            <div className="flex flex-wrap gap-2">
              {activityTypes.map(type => {
                const Icon = type.icon
                return (
                  <Button
                    key={type.id}
                    variant={filters.type === type.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, type: type.id as any }))}
                    style={filters.type === type.id ? {
                      backgroundColor: 'var(--color-coffee-primary)',
                      borderColor: 'var(--color-coffee-primary)'
                    } : {}}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {type.label}
                  </Button>
                )
              })}
            </div>

            {/* Filtres avancés */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-1" />
                Filtres avancés
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={exportHistory}
                disabled={exportLoading || filteredActivities.length === 0}
              >
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-1" />
                )}
                Exporter CSV
              </Button>
            </div>

            {/* Filtres avancés détaillés */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-client-bg)', borderColor: 'var(--color-client-border)' }}
                >
                  {/* Filtre par statut */}
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-client-text)' }}>
                      Statut
                    </label>
                    <div className="space-y-1">
                      {['all', 'success', 'pending', 'failed', 'cancelled'].map(status => (
                        <Button
                          key={status}
                          variant={filters.status === status ? 'default' : 'ghost'}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setFilters(prev => ({ ...prev, status: status as any }))}
                          style={filters.status === status ? {
                            backgroundColor: 'var(--color-coffee-primary)',
                            borderColor: 'var(--color-coffee-primary)'
                          } : {}}
                        >
                          {status === 'all' ? 'Tous' : 
                           status === 'success' ? 'Succès' :
                           status === 'pending' ? 'En cours' :
                           status === 'failed' ? 'Échec' : 'Annulé'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Filtre par période */}
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-client-text)' }}>
                      Période
                    </label>
                    <div className="space-y-1">
                      {[
                        { id: 'all', label: 'Toute la période' },
                        { id: 'today', label: 'Aujourd\'hui' },
                        { id: 'yesterday', label: 'Hier' },
                        { id: 'week', label: 'Cette semaine' },
                        { id: 'month', label: 'Ce mois' }
                      ].map(period => (
                        <Button
                          key={period.id}
                          variant={filters.dateRange === period.id ? 'default' : 'ghost'}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setFilters(prev => ({ ...prev, dateRange: period.id as any }))}
                          style={filters.dateRange === period.id ? {
                            backgroundColor: 'var(--color-coffee-primary)',
                            borderColor: 'var(--color-coffee-primary)'
                          } : {}}
                        >
                          {period.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Tri */}
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-client-text)' }}>
                      Tri
                    </label>
                    <div className="space-y-1">
                      {[
                        { id: 'date', label: 'Par date' },
                        { id: 'type', label: 'Par type' },
                        { id: 'amount', label: 'Par montant' }
                      ].map(sort => (
                        <Button
                          key={sort.id}
                          variant={filters.sortBy === sort.id ? 'default' : 'ghost'}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setFilters(prev => ({ ...prev, sortBy: sort.id as any }))}
                          style={filters.sortBy === sort.id ? {
                            backgroundColor: 'var(--color-coffee-primary)',
                            borderColor: 'var(--color-coffee-primary)'
                          } : {}}
                        >
                          {sort.label}
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc' }))}
                      >
                        {filters.sortOrder === 'desc' ? '↓ Décroissant' : '↑ Croissant'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ClientCard>

        {/* Liste des activités */}
        <ClientCard
          title="Activités"
          description={`${filteredActivities.length} activité${filteredActivities.length > 1 ? 's' : ''} trouvée${filteredActivities.length > 1 ? 's' : ''}`}
          icon={History}
          variant="warm"
        >
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-coffee-primary)' }} />
              <span className="ml-2" style={{ color: 'var(--color-client-muted)' }}>
                Chargement de l'historique...
              </span>
            </div>
          )}

          {!loading && filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <History className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--color-coffee-muted)' }} />
              <h3 
                className="text-lg font-medium mb-2"
                style={{ color: 'var(--color-client-text)' }}
              >
                Aucune activité trouvée
              </h3>
              <p style={{ color: 'var(--color-client-muted)' }}>
                {searchQuery || filters.type !== 'all' || filters.status !== 'all' || filters.dateRange !== 'all'
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Votre historique d\'activités apparaîtra ici'
                }
              </p>
            </div>
          )}

          {!loading && filteredActivities.length > 0 && (
            <div className="space-y-4">
              {filteredActivities.map((activity, index) => {
                const Icon = getActivityIcon(activity.type)
                const statusInfo = getStatusInfo(activity.status)
                const StatusIcon = statusInfo.icon
                
                return (
                  <motion.div
                    key={activity.id}
                    variants={listItemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                    style={{
                      borderColor: 'var(--color-client-border)',
                      backgroundColor: 'var(--color-client-bg)'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icône de type */}
                      <div 
                        className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0"
                        style={{ backgroundColor: 'var(--color-coffee-secondary)' }}
                      >
                        <Icon 
                          className="h-5 w-5" 
                          style={{ color: getActivityColor(activity.type) }} 
                        />
                      </div>

                      {/* Contenu principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 
                                className="font-semibold text-sm md:text-base"
                                style={{ color: 'var(--color-client-text)' }}
                              >
                                {activity.title}
                              </h3>
                              <Badge className={`text-xs ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                            <p 
                              className="text-sm"
                              style={{ color: 'var(--color-client-muted)' }}
                            >
                              {activity.description}
                            </p>
                            {activity.location && (
                              <p 
                                className="text-xs mt-1 flex items-center gap-1"
                                style={{ color: 'var(--color-client-muted)' }}
                              >
                                <MapPin className="w-3 h-3" />
                                {activity.location}
                              </p>
                            )}
                          </div>

                          {/* Montant et date */}
                          <div className="text-right flex-shrink-0 ml-4">
                            {activity.amount && (
                              <div 
                                className="font-semibold text-sm md:text-base"
                                style={{ 
                                  color: activity.status === 'success' 
                                    ? 'var(--color-coffee-primary)' 
                                    : 'var(--color-client-muted)'
                                }}
                              >
                                {activity.amount.toFixed(2)}€
                              </div>
                            )}
                            <div 
                              className="text-xs"
                              style={{ color: 'var(--color-client-muted)' }}
                            >
                              {formatRelativeDate(activity.timestamp)}
                            </div>
                            <div 
                              className="text-xs"
                              style={{ color: 'var(--color-client-muted)' }}
                            >
                              {format(parseISO(activity.timestamp), 'HH:mm')}
                            </div>
                          </div>
                        </div>

                        {/* Métadonnées supplémentaires */}
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-3 text-xs space-y-1" style={{ color: 'var(--color-client-muted)' }}>
                            {activity.type === 'reservation' && activity.metadata.duration && (
                              <span className="inline-block mr-3">
                                Durée: {activity.metadata.duration}
                              </span>
                            )}
                            {activity.type === 'order' && activity.metadata.items && (
                              <span className="inline-block mr-3">
                                {activity.metadata.items} article{activity.metadata.items > 1 ? 's' : ''}
                              </span>
                            )}
                            {activity.metadata.rating && (
                              <span className="inline-block mr-3">
                                Note: {activity.metadata.rating}/5 ⭐
                              </span>
                            )}
                            {activity.metadata.method && (
                              <span className="inline-block mr-3">
                                Paiement: {activity.metadata.method.replace('stripe_', '')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </ClientCard>
      </motion.div>
    </ClientLayout>
  )
}