'use client'

import { useState, useEffect } from 'react'
import { Building, MapPin, Users, Euro, Clock, Plus, Edit, Trash2, Eye, BarChart3 } from 'lucide-react'
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

  const toggleSpaceStatus = async (spaceId: string, newStatus: boolean) => {
    try {
      const response = await fetch('/api/dashboard/admin/spaces', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId, available: newStatus })
      })

      const result = await response.json()
      
      if (result.success) {
        setSpaces(spaces.map(space => 
          space._id === spaceId 
            ? { ...space, available: newStatus }
            : space
        ))
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
        body: JSON.stringify(body)
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
        body: JSON.stringify({ spaceId })
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchSpaces() // Recharger la liste
      } else {
        alert('Erreur: ' + result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression de l\'espace')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des espaces</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des espaces</h1>
          <p className="text-gray-600">
            {spaces.length} espace{spaces.length > 1 ? 's' : ''} de coworking
          </p>
        </div>

        <div className="flex gap-3">
          {spaces.length === 0 && (
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/dashboard/admin/spaces/init', {
                    method: 'POST'
                  })
                  const result = await response.json()
                  
                  if (result.success) {
                    await fetchSpaces()
                    alert('Espaces par défaut initialisés avec succès !')
                  } else {
                    alert('Erreur: ' + result.message)
                  }
                } catch (error) {
                  console.error('Erreur initialisation:', error)
                  alert('Erreur lors de l\'initialisation')
                }
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Initialiser espaces par défaut
            </button>
          )}

          <button
            onClick={() => {
              setEditingSpace(null)
              setShowFormModal(true)
            }}
            className="flex items-center gap-2 bg-coffee-primary text-white px-4 py-2 rounded-lg hover:bg-coffee-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter un espace
          </button>
        </div>
      </div>

      {/* Cartes des espaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spaces.map((space) => (
          <div key={space._id} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
            {/* Image placeholder */}
            <div className="h-48 bg-gradient-to-br from-coffee-primary/10 to-coffee-primary/5 flex items-center justify-center">
              <Building className="h-16 w-16 text-coffee-primary/30" />
            </div>

            <div className="p-6">
              {/* En-tête de la carte */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{space.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <MapPin className="h-3 w-3" />
                    {space.location}
                  </div>
                </div>
                
                <div className={`w-3 h-3 rounded-full ${space.available ? 'bg-green-400' : 'bg-red-400'}`} 
                     title={space.available ? 'Disponible' : 'Indisponible'} />
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {space.description}
              </p>

              {/* Statistiques */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">Capacité</span>
                  </div>
                  <span className="font-medium">{space.capacity} personnes</span>
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
                  <span className="font-medium text-green-600">€{space.totalRevenue}</span>
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
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    title="Voir les détails"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  <button
                    title="Modifier"
                    onClick={() => handleEditSpace(space)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <button
                    title="Supprimer"
                    onClick={() => handleDeleteSpace(space._id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => toggleSpaceStatus(space._id, !space.available)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
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
        ))}
      </div>

      {/* Statistiques résumées */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {spaces.length}
          </div>
          <div className="text-sm text-gray-600">Total espaces</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">
            {spaces.filter(s => s.available).length}
          </div>
          <div className="text-sm text-gray-600">Espaces disponibles</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {spaces.reduce((sum, space) => sum + space.bookingsCount, 0)}
          </div>
          <div className="text-sm text-gray-600">Total réservations</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">
            €{spaces.reduce((sum, space) => sum + space.totalRevenue, 0)}
          </div>
          <div className="text-sm text-gray-600">Revenus totaux</div>
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