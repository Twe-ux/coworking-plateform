'use client'

import { useState, useEffect } from 'react'
import {
  Building,
  MapPin,
  Users,
  Euro,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from 'lucide-react'
import SpaceFormModal from '@/components/dashboard/admin/SpaceFormModal'

interface SpaceData {
  _id: string
  id: string
  name: string
  description: string
  location: string
  capacity: number
  pricePerHour: number
  pricePerDay: number
  pricePerWeek: number
  pricePerMonth: number
  features: string[]
  amenities: string[]
  image: string
  available: boolean
  rating: number
  specialty: string
  isPopular: boolean
  openingHours?: any
  bookingsCount: number
  totalRevenue: number
  lastBooking?: string
  createdAt: string
  updatedAt: string
}

/**
 * Page de gestion des espaces pour l'admin
 */
export default function SpacesManagementPage() {
  const [spaces, setSpaces] = useState<SpaceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingSpace, setEditingSpace] = useState<SpaceData | null>(null)

  useEffect(() => {
    fetchSpaces()
  }, [])

  const fetchSpaces = async () => {
    try {
      const response = await fetch('/api/dashboard/admin/spaces')
      const result = await response.json()

      if (result.success) {
        setSpaces(result.data)
      } else {
        console.error('Erreur API:', result.error)
        setSpaces([])
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des espaces:', error)
      setSpaces([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrage des espaces
  const filteredSpaces = spaces.filter((space) => {
    const name = space.name || ''
    const location = space.location || ''
    const description = space.description || ''

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'available' && space.available) ||
      (statusFilter === 'unavailable' && !space.available)

    return matchesSearch && matchesStatus
  })

  // Calculs pour la pagination
  const totalPages = Math.ceil(filteredSpaces.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSpaces = filteredSpaces.slice(startIndex, endIndex)

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, itemsPerPage])

  const toggleSpaceStatus = async (spaceId: string, newStatus: boolean) => {
    try {
      const response = await fetch('/api/dashboard/admin/spaces', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId, available: newStatus }),
      })

      const result = await response.json()

      if (result.success) {
        setSpaces(
          spaces.map((space) =>
            space._id === spaceId ? { ...space, available: newStatus } : space
          )
        )
      } else {
        console.error('Erreur lors de la mise à jour:', result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
    }
  }

  const handleSaveSpace = async (spaceData: any) => {
    try {
      const method = editingSpace ? 'PUT' : 'POST'
      const body = editingSpace
        ? { spaceId: editingSpace._id, ...spaceData }
        : spaceData

      const response = await fetch('/api/dashboard/admin/spaces', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        await fetchSpaces() // Recharger la liste
        setShowFormModal(false)
        setEditingSpace(null)
      } else {
        console.error('Erreur lors de la sauvegarde:', result.error)
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      throw error
    }
  }

  const handleEditSpace = (space: SpaceData) => {
    setEditingSpace(space)
    setShowFormModal(true)
  }

  const handleDeleteSpace = async (spaceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet espace ?')) return

    try {
      const response = await fetch('/api/dashboard/admin/spaces', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId }),
      })

      const result = await response.json()

      if (result.success) {
        await fetchSpaces() // Recharger la liste
      } else {
        alert('Erreur: ' + result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert("Erreur lors de la suppression de l'espace")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des espaces
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des espaces
          </h1>
          <p className="text-gray-600">
            {filteredSpaces.length} espace{filteredSpaces.length > 1 ? 's' : ''}{' '}
            de coworking
            {filteredSpaces.length > itemsPerPage && (
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
              placeholder="Rechercher un espace..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="focus:ring-coffee-primary rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:outline-none"
            />
          </div>

          {/* Filtre de statut */}
          <div className="relative">
            <Filter className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="focus:ring-coffee-primary appearance-none rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="available">Disponibles</option>
              <option value="unavailable">Indisponibles</option>
            </select>
          </div>
          {spaces.length === 0 && (
            <button
              onClick={async () => {
                try {
                  const response = await fetch(
                    '/api/dashboard/admin/spaces/init',
                    {
                      method: 'POST',
                    }
                  )
                  const result = await response.json()

                  if (result.success) {
                    await fetchSpaces()
                    alert('Espaces par défaut initialisés avec succès !')
                  } else {
                    alert('Erreur: ' + result.message)
                  }
                } catch (error) {
                  console.error('Erreur initialisation:', error)
                  alert("Erreur lors de l'initialisation")
                }
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Initialiser espaces par défaut
            </button>
          )}

          <button
            onClick={() => {
              setEditingSpace(null)
              setShowFormModal(true)
            }}
            className="bg-coffee-primary hover:bg-coffee-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter un espace
          </button>
        </div>
      </div>

      {/* Cartes ou Liste des espaces */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginatedSpaces.length === 0 ? (
            <div className="col-span-full rounded-lg border border-gray-200 bg-white p-8 text-center">
              <Building className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-500">Aucun espace trouvé</p>
            </div>
          ) : (
            paginatedSpaces.map((space) => (
              <div
                key={space._id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
              >
                {/* Image placeholder */}
                <div className="from-coffee-primary/10 to-coffee-primary/5 flex h-48 items-center justify-center bg-gradient-to-br">
                  <Building className="text-coffee-primary/30 h-16 w-16" />
                </div>

                <div className="p-6">
                  {/* En-tête de la carte */}
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {space.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {space.location}
                      </div>
                    </div>

                    <div
                      className={`h-3 w-3 rounded-full ${space.available ? 'bg-green-400' : 'bg-red-400'}`}
                      title={space.available ? 'Disponible' : 'Indisponible'}
                    />
                  </div>

                  {/* Description */}
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                    {space.description}
                  </p>

                  {/* Statistiques */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Capacité</span>
                      </div>
                      <span className="font-medium">
                        {space.capacity} personnes
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Euro className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Tarif/heure</span>
                      </div>
                      <span className="font-medium">€{space.pricePerHour}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Réservations</span>
                      </div>
                      <span className="font-medium">{space.bookingsCount}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Revenus totaux</span>
                      <span className="font-medium text-green-600">
                        €{space.totalRevenue}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Note moyenne</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{space.rating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-2">
                      <button
                        title="Voir les détails"
                        className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        title="Modifier"
                        onClick={() => handleEditSpace(space)}
                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        title="Supprimer"
                        onClick={() => handleDeleteSpace(space._id)}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        toggleSpaceStatus(space._id, !space.available)
                      }
                      className={`rounded-md px-3 py-1 text-xs transition-colors ${
                        space.available
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {space.available ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {paginatedSpaces.length === 0 ? (
            <div className="p-8 text-center">
              <Building className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-500">Aucun espace trouvé</p>
            </div>
          ) : (
            <>
              {/* En-tête du tableau */}
              <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                <div className="col-span-3">Espace</div>
                <div className="col-span-2">Localisation</div>
                <div className="col-span-2">Capacité & Prix</div>
                <div className="col-span-2">Statut</div>
                <div className="col-span-2">Performance</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Corps du tableau */}
              <div className="divide-y divide-gray-200">
                {paginatedSpaces.map((space) => (
                  <div
                    key={space._id}
                    className="grid grid-cols-12 gap-4 p-4 transition-colors hover:bg-gray-50"
                  >
                    {/* Espace */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="from-coffee-primary/20 to-coffee-primary/10 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br">
                        <Building className="text-coffee-primary h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">
                          {space.name}
                        </p>
                        <p className="truncate text-sm text-gray-600">
                          {space.specialty}
                        </p>
                      </div>
                    </div>

                    {/* Localisation */}
                    <div className="col-span-2 flex items-center">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{space.location}</span>
                      </div>
                    </div>

                    {/* Capacité & Prix */}
                    <div className="col-span-2 flex items-center">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">{space.capacity}</span>
                          <span className="text-gray-500">pers.</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          €{space.pricePerHour}/h
                        </div>
                      </div>
                    </div>

                    {/* Statut */}
                    <div className="col-span-2 flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${space.available ? 'bg-green-400' : 'bg-red-400'}`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          space.available ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {space.available ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>

                    {/* Performance */}
                    <div className="col-span-2 flex items-center">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {space.bookingsCount} réservations
                        </div>
                        <div className="text-xs text-green-600">
                          €{space.totalRevenue} CA
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center gap-1">
                      <button
                        title="Voir détails"
                        className="rounded p-1 text-gray-600 transition-colors hover:bg-gray-100"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        title="Modifier"
                        onClick={() => handleEditSpace(space)}
                        className="rounded p-1 text-blue-600 transition-colors hover:bg-blue-100"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        title={space.available ? 'Désactiver' : 'Activer'}
                        onClick={() =>
                          toggleSpaceStatus(space._id, !space.available)
                        }
                        className={`rounded p-1 transition-colors ${
                          space.available
                            ? 'text-red-600 hover:bg-red-100'
                            : 'text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {space.available ? '🔴' : '🟢'}
                      </button>
                      <button
                        title="Supprimer"
                        onClick={() => handleDeleteSpace(space._id)}
                        className="rounded p-1 text-red-600 transition-colors hover:bg-red-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {filteredSpaces.length > itemsPerPage && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{startIndex + 1}</span>{' '}
              à{' '}
              <span className="font-medium">
                {Math.min(endIndex, filteredSpaces.length)}
              </span>{' '}
              sur <span className="font-medium">{filteredSpaces.length}</span>{' '}
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

      {/* Statistiques résumées */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-lg">
          <div className="text-2xl font-bold text-gray-900">
            {filteredSpaces.length}
          </div>
          <div className="text-sm text-gray-600">
            {filteredSpaces.length === spaces.length
              ? 'Total espaces'
              : `Espaces filtrés (${spaces.length} au total)`}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-lg">
          <div className="text-2xl font-bold text-green-600">
            {filteredSpaces.filter((s) => s.available).length}
          </div>
          <div className="text-sm text-gray-600">Espaces disponibles</div>
          <div className="mt-1 text-xs text-gray-500">
            {filteredSpaces.length > 0
              ? (
                  (filteredSpaces.filter((s) => s.available).length /
                    filteredSpaces.length) *
                  100
                ).toFixed(0)
              : 0}
            % du total affiché
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-lg">
          <div className="text-2xl font-bold text-blue-600">
            {filteredSpaces.reduce(
              (sum, space) => sum + space.bookingsCount,
              0
            )}
          </div>
          <div className="text-sm text-gray-600">Total réservations</div>
          <div className="mt-1 text-xs text-gray-500">
            Moy:{' '}
            {filteredSpaces.length > 0
              ? (
                  filteredSpaces.reduce(
                    (sum, space) => sum + space.bookingsCount,
                    0
                  ) / filteredSpaces.length
                ).toFixed(1)
              : 0}{' '}
            par espace
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-lg">
          <div className="text-2xl font-bold text-purple-600">
            €
            {filteredSpaces.reduce((sum, space) => sum + space.totalRevenue, 0)}
          </div>
          <div className="text-sm text-gray-600">Revenus totaux</div>
          <div className="mt-1 text-xs text-gray-500">
            Moy: €
            {filteredSpaces.length > 0
              ? (
                  filteredSpaces.reduce(
                    (sum, space) => sum + space.totalRevenue,
                    0
                  ) / filteredSpaces.length
                ).toFixed(0)
              : 0}{' '}
            par espace
          </div>
        </div>
      </div>

      {/* Modal de formulaire d'espace */}
      <SpaceFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false)
          setEditingSpace(null)
        }}
        onSave={handleSaveSpace}
        editingSpace={editingSpace}
      />
    </div>
  )
}
