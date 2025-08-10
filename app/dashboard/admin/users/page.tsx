'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Calendar,
  Shield,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface UserData {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: 'client' | 'staff' | 'manager' | 'admin'
  isActive: boolean
  bookingsCount: number
  totalSpent: number
  lastBooking?: string
  createdAt: string
}

const roleConfig = {
  client: {
    label: 'Client',
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  staff: {
    label: 'Staff',
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  manager: {
    label: 'Manager',
    icon: ShieldCheck,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  admin: {
    label: 'Administrateur',
    icon: ShieldCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
}

/**
 * Page de gestion des utilisateurs pour l'admin
 */
export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'client' as 'client' | 'staff' | 'manager' | 'admin',
    password: '',
  })

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

  const createUser = async () => {
    try {
      const response = await fetch('/api/dashboard/admin/users/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        await fetchUsers()
        setShowCreateModal(false)
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          role: 'client',
          password: '',
        })
      } else {
        alert('Erreur: ' + result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      alert("Erreur lors de la création de l'utilisateur")
    }
  }

  const editUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(
        `/api/dashboard/admin/users/${selectedUser._id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            role: formData.role,
            isActive: selectedUser.isActive,
          }),
        }
      )

      const result = await response.json()

      if (result.success) {
        await fetchUsers()
        setShowEditModal(false)
        setSelectedUser(null)
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          role: 'client',
          password: '',
        })
      } else {
        alert('Erreur: ' + result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      alert("Erreur lors de la modification de l'utilisateur")
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return

    try {
      const response = await fetch(`/api/dashboard/admin/users/${userId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        await fetchUsers()
      } else {
        alert('Erreur: ' + result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert("Erreur lors de la suppression de l'utilisateur")
    }
  }

  const openEditModal = (user: UserData) => {
    setSelectedUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      password: '',
    })
    setShowEditModal(true)
  }

  const toggleUserStatus = async (userId: string, newStatus: boolean) => {
    try {
      const response = await fetch('/api/dashboard/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: newStatus }),
      })

      const result = await response.json()

      if (result.success) {
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, isActive: newStatus } : user
          )
        )
      } else {
        console.error('Erreur lors de la mise à jour:', result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
    }
  }

  const filteredUsers = users.filter((user) => {
    const firstName = user.firstName || ''
    const lastName = user.lastName || ''
    const email = user.email || ''

    const matchesSearch =
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  // Calculs pour la pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, itemsPerPage])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des utilisateurs
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="mb-4 h-4 w-1/2 rounded bg-gray-200"></div>
              <div className="mb-2 h-4 w-1/3 rounded bg-gray-200"></div>
              <div className="h-4 w-2/3 rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête et filtres */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-600">
            {filteredUsers.length} utilisateur
            {filteredUsers.length > 1 ? 's' : ''}
            {filteredUsers.length > itemsPerPage && (
              <span className="text-gray-500">
                {' '}
                (page {currentPage}/{totalPages})
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Sélecteur d'items par page */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Afficher:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="focus:ring-coffee-primary rounded-md border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">par page</span>
          </div>

          {/* Bouton Créer */}
          <button
            onClick={() => {
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                role: 'client',
                password: '',
              })
              setShowCreateModal(true)
            }}
            className="bg-coffee-primary hover:bg-coffee-accent flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvel utilisateur
          </button>

          {/* Toggle Vue */}
          <div className="flex items-center rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode('cards')}
              className={`rounded-l-lg p-2 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-coffee-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Vue cartes"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-r-lg p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-coffee-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Vue liste"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="focus:ring-coffee-primary rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:outline-none"
            />
          </div>

          {/* Filtre de rôle */}
          <div className="relative">
            <Filter className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="focus:ring-coffee-primary appearance-none rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:outline-none"
            >
              <option value="all">Tous les rôles</option>
              <option value="client">Clients</option>
              <option value="staff">Staff</option>
              <option value="manager">Managers</option>
              <option value="admin">Administrateurs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grille ou Liste des utilisateurs */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginatedUsers.length === 0 ? (
            <div className="col-span-full rounded-lg border border-gray-200 bg-white p-8 text-center">
              <User className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            paginatedUsers.map((user) => {
              const roleInfo = roleConfig[user.role]
              const RoleIcon = roleInfo?.icon || User

              return (
                <div
                  key={user._id}
                  className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
                >
                  {/* En-tête de la carte */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-coffee-primary flex h-12 w-12 items-center justify-center rounded-full font-semibold text-white">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>

                    {/* Indicateur de statut */}
                    <div
                      className={`h-3 w-3 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`}
                      title={user.isActive ? 'Actif' : 'Inactif'}
                    />
                  </div>

                  {/* Badge de rôle */}
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${roleInfo?.bgColor || 'bg-gray-50'} mb-4`}
                  >
                    <RoleIcon
                      className={`h-4 w-4 ${roleInfo?.color || 'text-gray-600'}`}
                    />
                    <span
                      className={`text-sm font-medium ${roleInfo?.color || 'text-gray-600'}`}
                    >
                      {roleInfo?.label || 'Client'}
                    </span>
                  </div>

                  {/* Statistiques */}
                  <div className="mb-4 space-y-2">
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
                        <span className="text-gray-600">
                          Dernière réservation
                        </span>
                        <span className="font-medium">{user.lastBooking}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <div className="text-xs text-gray-500">
                      Inscrit{' '}
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="rounded p-1 text-blue-600 transition-colors hover:bg-blue-100"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          toggleUserStatus(user._id, !user.isActive)
                        }
                        className={`rounded-md px-3 py-1 text-xs transition-colors ${
                          user.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {user.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => deleteUser(user._id)}
                        className="rounded p-1 text-red-600 transition-colors hover:bg-red-100"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {paginatedUsers.length === 0 ? (
            <div className="p-8 text-center">
              <User className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <>
              {/* En-tête du tableau */}
              <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                <div className="col-span-3">Utilisateur</div>
                <div className="col-span-2">Rôle</div>
                <div className="col-span-2">Statut</div>
                <div className="col-span-2">Réservations</div>
                <div className="col-span-2">Inscription</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Corps du tableau */}
              <div className="divide-y divide-gray-200">
                {paginatedUsers.map((user) => {
                  const roleInfo = roleConfig[user.role]
                  const RoleIcon = roleInfo?.icon || User

                  return (
                    <div
                      key={user._id}
                      className="grid grid-cols-12 gap-4 p-4 transition-colors hover:bg-gray-50"
                    >
                      {/* Utilisateur */}
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="bg-coffee-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="truncate text-sm text-gray-600">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Rôle */}
                      <div className="col-span-2 flex items-center">
                        <div
                          className={`inline-flex items-center gap-2 rounded-full px-2 py-1 ${roleInfo?.bgColor || 'bg-gray-50'}`}
                        >
                          <RoleIcon
                            className={`h-3 w-3 ${roleInfo?.color || 'text-gray-600'}`}
                          />
                          <span
                            className={`text-xs font-medium ${roleInfo?.color || 'text-gray-600'}`}
                          >
                            {roleInfo?.label || 'Client'}
                          </span>
                        </div>
                      </div>

                      {/* Statut */}
                      <div className="col-span-2 flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            user.isActive ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>

                      {/* Réservations */}
                      <div className="col-span-2 flex items-center">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">
                            {user.bookingsCount}
                          </span>
                          <span className="ml-1 text-gray-500">
                            réservations
                          </span>
                          {user.totalSpent > 0 && (
                            <div className="text-xs text-gray-500">
                              €{user.totalSpent} dépensés
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Inscription */}
                      <div className="col-span-2 flex items-center">
                        <div className="text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                          {user.lastBooking && (
                            <div className="text-xs text-gray-500">
                              Dernière: {user.lastBooking}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(user)}
                          className="rounded p-1 text-blue-600 transition-colors hover:bg-blue-100"
                          title="Modifier"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() =>
                            toggleUserStatus(user._id, !user.isActive)
                          }
                          className={`rounded p-1 transition-colors ${
                            user.isActive
                              ? 'text-red-600 hover:bg-red-100'
                              : 'text-green-600 hover:bg-green-100'
                          }`}
                          title={user.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {user.isActive ? '🔴' : '🟢'}
                        </button>
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="rounded p-1 text-red-600 transition-colors hover:bg-red-100"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {filteredUsers.length > itemsPerPage && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{startIndex + 1}</span>{' '}
              à{' '}
              <span className="font-medium">
                {Math.min(endIndex, filteredUsers.length)}
              </span>{' '}
              sur <span className="font-medium">{filteredUsers.length}</span>{' '}
              résultats
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton précédent */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`rounded-md border p-2 ${
                currentPage === 1
                  ? 'cursor-not-allowed border-gray-200 text-gray-400'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Numéros de page */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (currentPage <= 3) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`rounded-md px-3 py-1 text-sm ${
                      currentPage === pageNumber
                        ? 'bg-coffee-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              })}
            </div>

            {/* Bouton suivant */}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`rounded-md border p-2 ${
                currentPage === totalPages
                  ? 'cursor-not-allowed border-gray-200 text-gray-400'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Statistiques résumées dynamiques */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total utilisateurs */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-lg">
          <div className="text-2xl font-bold text-gray-900">
            {filteredUsers.length}
          </div>
          <div className="text-sm text-gray-600">
            {filteredUsers.length === users.length
              ? 'Total utilisateurs'
              : `Utilisateurs filtrés (${users.length} au total)`}
          </div>
        </div>

        {/* Utilisateurs actifs */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-lg">
          <div className="text-2xl font-bold text-green-600">
            {filteredUsers.filter((u) => u.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Utilisateurs actifs</div>
          <div className="mt-1 text-xs text-gray-500">
            {(
              (filteredUsers.filter((u) => u.isActive).length /
                filteredUsers.length) *
              100
            ).toFixed(0)}
            % du total affiché
          </div>
        </div>

        {/* Répartition par rôles */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-lg">
          <div className="space-y-2">
            {Object.entries(roleConfig).map(([roleKey, roleInfo]) => {
              const count = filteredUsers.filter(
                (u) => u.role === roleKey
              ).length
              if (count === 0) return null
              const RoleIcon = roleInfo.icon
              return (
                <div
                  key={roleKey}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <RoleIcon className={`h-3 w-3 ${roleInfo.color}`} />
                    <span className="text-gray-600">{roleInfo.label}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Statistiques d'activité */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-lg">
          <div className="text-2xl font-bold text-blue-600">
            {filteredUsers.reduce((sum, user) => sum + user.bookingsCount, 0)}
          </div>
          <div className="text-sm text-gray-600">Total réservations</div>
          <div className="mt-1 text-xs text-gray-500">
            Moy:{' '}
            {filteredUsers.length > 0
              ? (
                  filteredUsers.reduce(
                    (sum, user) => sum + user.bookingsCount,
                    0
                  ) / filteredUsers.length
                ).toFixed(1)
              : 0}{' '}
            par utilisateur
          </div>
        </div>
      </div>

      {/* Statistiques détaillées par rôle */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Object.entries(roleConfig).map(([roleKey, roleInfo]) => {
          const roleUsers = filteredUsers.filter((u) => u.role === roleKey)
          if (roleUsers.length === 0) return null

          const RoleIcon = roleInfo.icon
          const totalSpent = roleUsers.reduce(
            (sum, user) => sum + user.totalSpent,
            0
          )
          const totalBookings = roleUsers.reduce(
            (sum, user) => sum + user.bookingsCount,
            0
          )

          return (
            <div
              key={roleKey}
              className={`rounded-lg border-2 p-4 ${roleInfo.borderColor} ${roleInfo.bgColor} transition-all hover:shadow-lg`}
            >
              <div className="mb-2 flex items-center gap-2">
                <RoleIcon className={`h-5 w-5 ${roleInfo.color}`} />
                <h3 className={`font-semibold ${roleInfo.color}`}>
                  {roleInfo.label}s
                </h3>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre:</span>
                  <span className="font-medium">{roleUsers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Actifs:</span>
                  <span className="font-medium">
                    {roleUsers.filter((u) => u.isActive).length}/
                    {roleUsers.length}
                  </span>
                </div>
                {totalBookings > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Réservations:</span>
                    <span className="font-medium">{totalBookings}</span>
                  </div>
                )}
                {totalSpent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">CA généré:</span>
                    <span className="font-medium">€{totalSpent}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">
              Créer un nouvel utilisateur
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="focus:ring-coffee-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="focus:ring-coffee-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="focus:ring-coffee-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="focus:ring-coffee-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Rôle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as
                        | 'client'
                        | 'staff'
                        | 'manager'
                        | 'admin',
                    })
                  }
                  className="focus:ring-coffee-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
                >
                  <option value="client">Client</option>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={createUser}
                className="bg-coffee-primary hover:bg-coffee-accent flex-1 rounded-md px-4 py-2 text-white transition-colors"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">
              Modifier l&apos;utilisateur
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="focus:ring-coffee-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="focus:ring-coffee-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="focus:ring-coffee-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Rôle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as
                        | 'client'
                        | 'staff'
                        | 'manager'
                        | 'admin',
                    })
                  }
                  className="focus:ring-coffee-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
                >
                  <option value="client">Client</option>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                }}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={editUser}
                className="bg-coffee-primary hover:bg-coffee-accent flex-1 rounded-md px-4 py-2 text-white transition-colors"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
