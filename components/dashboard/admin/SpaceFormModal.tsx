'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Plus, Trash2 } from 'lucide-react'

interface SpaceFormData {
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
  specialty: string
  isPopular: boolean
  color: string
  openingHours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (space: SpaceFormData) => Promise<void>
  editingSpace?: any
}

const defaultOpeningHours = {
  monday: { open: '09:00', close: '20:00', closed: false },
  tuesday: { open: '09:00', close: '20:00', closed: false },
  wednesday: { open: '09:00', close: '20:00', closed: false },
  thursday: { open: '09:00', close: '20:00', closed: false },
  friday: { open: '09:00', close: '20:00', closed: false },
  saturday: { open: '10:00', close: '18:00', closed: false },
  sunday: { open: '10:00', close: '18:00', closed: true },
}

export default function SpaceFormModal({ isOpen, onClose, onSave, editingSpace }: Props) {
  const [formData, setFormData] = useState<SpaceFormData>({
    id: '',
    name: '',
    description: '',
    location: '',
    capacity: 1,
    pricePerHour: 0,
    pricePerDay: 0,
    pricePerWeek: 0,
    pricePerMonth: 0,
    features: [],
    amenities: [],
    image: '/images/spaces/default.jpg',
    specialty: 'Café coworking',
    isPopular: false,
    color: 'from-coffee-primary to-coffee-accent',
    openingHours: defaultOpeningHours
  })

  const [isLoading, setIsLoading] = useState(false)
  const [newFeature, setNewFeature] = useState('')
  const [newAmenity, setNewAmenity] = useState('')

  useEffect(() => {
    if (editingSpace) {
      setFormData({
        id: editingSpace.id || '',
        name: editingSpace.name || '',
        description: editingSpace.description || '',
        location: editingSpace.location || '',
        capacity: editingSpace.capacity || 1,
        pricePerHour: editingSpace.pricePerHour || 0,
        pricePerDay: editingSpace.pricePerDay || 0,
        pricePerWeek: editingSpace.pricePerWeek || 0,
        pricePerMonth: editingSpace.pricePerMonth || 0,
        features: editingSpace.features || [],
        amenities: editingSpace.amenities || [],
        image: editingSpace.image || '/images/spaces/default.jpg',
        specialty: editingSpace.specialty || 'Café coworking',
        isPopular: editingSpace.isPopular || false,
        color: editingSpace.color || 'from-coffee-primary to-coffee-accent',
        openingHours: editingSpace.openingHours || defaultOpeningHours
      })
    } else {
      setFormData({
        id: '',
        name: '',
        description: '',
        location: '',
        capacity: 1,
        pricePerHour: 0,
        pricePerDay: 0,
        pricePerWeek: 0,
        pricePerMonth: 0,
        features: [],
        amenities: [],
        image: '/images/spaces/default.jpg',
        specialty: 'Café coworking',
        isPopular: false,
        color: 'from-coffee-primary to-coffee-accent',
        openingHours: defaultOpeningHours
      })
    }
  }, [editingSpace, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      })
      setNewFeature('')
    }
  }

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    })
  }

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, newAmenity.trim()]
      })
      setNewAmenity('')
    }
  }

  const removeAmenity = (index: number) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((_, i) => i !== index)
    })
  }

  const updateOpeningHours = (day: keyof typeof formData.openingHours, field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      openingHours: {
        ...formData.openingHours,
        [day]: {
          ...formData.openingHours[day],
          [field]: value
        }
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingSpace ? 'Modifier l\'espace' : 'Ajouter un espace'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID de l'espace *
              </label>
              <input
                type="text"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
                placeholder="ex: salle-reunion-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'espace *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
                placeholder="ex: Salle de réunion Verrière"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localisation *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
                placeholder="ex: Rez-de-chaussée - Zone privée"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacité *
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spécialité *
              </label>
              <select
                required
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
              >
                <option value="Café coworking">Café coworking</option>
                <option value="Salle privée">Salle privée</option>
                <option value="Zone silencieuse">Zone silencieuse</option>
              </select>
            </div>

            {/* Couleur de la carte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur de la carte
              </label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
              >
                <option value="from-coffee-primary to-coffee-accent">Café (Vert/Orange)</option>
                <option value="from-amber-400 to-orange-500">Chaleureux (Ambre/Orange)</option>
                <option value="from-emerald-400 to-teal-500">Nature (Émeraude/Sarcelle)</option>
                <option value="from-blue-400 to-purple-500">Moderne (Bleu/Violet)</option>
                <option value="from-pink-400 to-rose-500">Créatif (Rose/Rose)</option>
                <option value="from-indigo-400 to-blue-500">Professionnel (Indigo/Bleu)</option>
                <option value="from-green-400 to-emerald-500">Naturel (Vert/Émeraude)</option>
                <option value="from-purple-400 to-pink-500">Artistique (Violet/Rose)</option>
                <option value="from-yellow-400 to-amber-500">Énergique (Jaune/Ambre)</option>
                <option value="from-cyan-400 to-blue-500">Tech (Cyan/Bleu)</option>
              </select>
              
              {/* Prévisualisation de la couleur */}
              <div className="mt-2">
                <div className={`h-12 w-full rounded-lg bg-gradient-to-r ${formData.color} flex items-center justify-center text-white font-semibold text-sm`}>
                  Prévisualisation
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPopular"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="h-4 w-4 text-coffee-primary focus:ring-coffee-primary border-gray-300 rounded"
              />
              <label htmlFor="isPopular" className="text-sm font-medium text-gray-700">
                Espace populaire
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
              placeholder="Description détaillée de l'espace..."
            />
          </div>

          {/* Prix */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tarification</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix/heure (€) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.pricePerHour}
                  onChange={(e) => setFormData({ ...formData, pricePerHour: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix/jour (€) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.pricePerDay}
                  onChange={(e) => setFormData({ ...formData, pricePerDay: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix/semaine (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricePerWeek}
                  onChange={(e) => setFormData({ ...formData, pricePerWeek: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix/mois (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricePerMonth}
                  onChange={(e) => setFormData({ ...formData, pricePerMonth: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
              placeholder="/images/spaces/mon-espace.jpg"
            />
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caractéristiques
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
                placeholder="Ajouter une caractéristique..."
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-3 py-2 bg-coffee-primary text-white rounded-lg hover:bg-coffee-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.features.map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Équipements
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
                placeholder="Ajouter un équipement..."
              />
              <button
                type="button"
                onClick={addAmenity}
                className="px-3 py-2 bg-coffee-primary text-white rounded-lg hover:bg-coffee-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => removeAmenity(index)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-coffee-primary text-white rounded-lg hover:bg-coffee-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Enregistrement...' : editingSpace ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}