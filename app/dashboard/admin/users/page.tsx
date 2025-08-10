'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Calendar, Shield, ShieldCheck, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react'

interface UserData {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: 'USER' | 'ADMIN'
  isActive: boolean
  bookingsCount: number
  totalSpent: number
  lastBooking?: string
  createdAt: string
}

const roleConfig = {
  USER: {
    label: 'Utilisateur',
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  ADMIN: {
    label: 'Administrateur',
    icon: ShieldCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
}

/**
 * Page de gestion des utilisateurs pour l'admin
 */
export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/dashboard/admin/users')
      const result = await response.json()
      
      if (result.success) {
        setUsers(result.data)
      } else {
        console.error('Erreur API:', result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, newStatus: boolean) => {
    try {
      const response = await fetch('/api/dashboard/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: newStatus })
      })

      const result = await response.json()
      
      if (result.success) {
        setUsers(users.map(user => 
          user._id === userId 
            ? { ...user, isActive: newStatus }
            : user
        ))
      } else {
        console.error('Erreur lors de la mise à jour:', result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête et filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600">
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
            />
          </div>

          {/* Filtre de rôle */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="all">Tous les rôles</option>
              <option value="USER">Utilisateurs</option>
              <option value="ADMIN">Administrateurs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grille des utilisateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg p-8 border border-gray-200 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const roleInfo = roleConfig[user.role]
            const RoleIcon = roleInfo.icon
            
            return (
              <div key={user._id} className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                {/* En-tête de la carte */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-coffee-primary text-white rounded-full flex items-center justify-center font-semibold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>

                  {/* Indicateur de statut */}
                  <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`} 
                       title={user.isActive ? 'Actif' : 'Inactif'} />
                </div>

                {/* Badge de rôle */}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${roleInfo.bgColor} mb-4`}>
                  <RoleIcon className={`h-4 w-4 ${roleInfo.color}`} />
                  <span className={`text-sm font-medium ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </div>

                {/* Statistiques */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Réservations</span>
                    <span className="font-medium">{user.bookingsCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total dépensé</span>
                    <span className="font-medium">€{user.totalSpent}</span>
                  </div>
                  {user.lastBooking && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Dernière réservation</span>
                      <span className="font-medium">{user.lastBooking}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Inscrit {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleUserStatus(user._id, !user.isActive)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        user.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {user.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Statistiques résumées */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {users.length}
          </div>
          <div className="text-sm text-gray-600">Total utilisateurs</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Utilisateurs actifs</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.role === 'ADMIN').length}
          </div>
          <div className="text-sm text-gray-600">Administrateurs</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {users.reduce((sum, user) => sum + user.bookingsCount, 0)}
          </div>
          <div className="text-sm text-gray-600">Total réservations</div>
        </div>
      </div>
    </div>
  )
}