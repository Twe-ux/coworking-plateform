'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  MapPin,
  Users,
  Euro,
  Clock,
  Wifi,
  Monitor,
  Coffee,
  Car,
  Shield,
  RefreshCw,
} from 'lucide-react'
import Image from 'next/image'

interface Space {
  _id: string
  name: string
  description: string
  capacity: number
  pricePerHour: number
  pricePerDay?: number
  pricePerWeek?: number
  pricePerMonth?: number
  amenities: string[]
  images: string[]
  location: string
  isActive: boolean
  openingHours: {
    [key: string]: {
      open: string
      close: string
      closed: boolean
    }
  }
  createdAt: string
  updatedAt: string
}

const AMENITIES_OPTIONS = [
  { id: 'wifi', label: 'WiFi gratuit', icon: Wifi },
  { id: 'screen', label: 'Écran partagé', icon: Monitor },
  { id: 'coffee', label: 'Café offert', icon: Coffee },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'security', label: 'Sécurisé 24/7', icon: Shield },
  { id: 'quiet', label: 'Zone calme', icon: Building },
]

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
]

export function SpaceManagement() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 4,
    pricePerHour: 0,
    pricePerDay: 0,
    pricePerWeek: 0,
    pricePerMonth: 0,
    location: '',
    amenities: [] as string[],
    images: [] as string[],
    openingHours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '10:00', close: '17:00', closed: true },
    },
  })

  const loadSpaces = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/admin/spaces')
      const data = await response.json()

      if (data.success) {
        setSpaces(data.data.spaces || [])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erreur chargement espaces:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les espaces',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSpaces()
  }, [loadSpaces])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      capacity: 4,
      pricePerHour: 0,
      pricePerDay: 0,
      pricePerWeek: 0,
      pricePerMonth: 0,
      location: '',
      amenities: [],
      images: [],
      openingHours: {
        monday: { open: '08:00', close: '20:00', closed: false },
        tuesday: { open: '08:00', close: '20:00', closed: false },
        wednesday: { open: '08:00', close: '20:00', closed: false },
        thursday: { open: '08:00', close: '20:00', closed: false },
        friday: { open: '08:00', close: '20:00', closed: false },
        saturday: { open: '09:00', close: '18:00', closed: false },
        sunday: { open: '10:00', close: '17:00', closed: true },
      },
    })
    setEditingSpace(null)
    setIsCreateMode(false)
  }

  const startEdit = (space: Space) => {
    setEditingSpace(space)
    setIsCreateMode(false)
    setFormData({
      name: space.name,
      description: space.description,
      capacity: space.capacity,
      pricePerHour: space.pricePerHour,
      pricePerDay: space.pricePerDay || 0,
      pricePerWeek: space.pricePerWeek || 0,
      pricePerMonth: space.pricePerMonth || 0,
      location: space.location,
      amenities: space.amenities || [],
      images: space.images || [],
      openingHours: (space.openingHours || formData.openingHours) as any,
    })
  }

  const startCreate = () => {
    resetForm()
    setIsCreateMode(true)
  }

  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return

    setUploadingImages(true)
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Valider le type de fichier
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Erreur',
            description: `${file.name} n&apos;est pas une image valide`,
            variant: 'destructive',
          })
          continue
        }

        // Valider la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'Erreur',
            description: `${file.name} est trop volumineux (max 5MB)`,
            variant: 'destructive',
          })
          continue
        }

        // Upload réel via API
        const formData = new FormData()
        formData.append('images', file)

        const response = await fetch('/api/upload/images', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()
        if (result.success && result.images.length > 0) {
          uploadedUrls.push(result.images[0].url)
        } else {
          throw new Error(result.error || 'Erreur upload')
        }
      }

      // Ajouter les nouvelles images
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }))

      toast({
        title: 'Images uploadées',
        description: `${uploadedUrls.length} image(s) ajoutée(s)`,
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l&apos;upload des images',
        variant: 'destructive',
      })
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const toggleAmenity = (amenityId: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...prev.amenities, amenityId],
    }))
  }

  const updateOpeningHours = (
    day: string,
    field: 'open' | 'close' | 'closed',
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...(prev.openingHours as any)[day],
          [field]: value,
        },
      },
    }))
  }

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Erreur',
          description: 'Le nom de l&apos;espace est requis',
          variant: 'destructive',
        })
        return
      }

      const url = isCreateMode
        ? '/api/dashboard/admin/spaces'
        : `/api/dashboard/admin/spaces/${editingSpace?._id}`

      const method = isCreateMode ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Succès',
          description: isCreateMode
            ? 'Espace créé avec succès'
            : 'Espace mis à jour',
        })
        resetForm()
        loadSpaces()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la sauvegarde',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (spaceId: string, spaceName: string) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer l&apos;espace "${spaceName}" ? Cette action est irréversible.`
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/dashboard/admin/spaces/${spaceId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Espace supprimé',
          description: `L&apos;espace "${spaceName}" a été supprimé`,
        })
        loadSpaces()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l&apos;espace',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton création */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gestion des espaces
          </h2>
          <p className="text-gray-600">
            Créer et gérer les espaces de coworking
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSpaces}
            disabled={loading}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>

          <Button onClick={startCreate} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nouvel espace</span>
          </Button>
        </div>
      </div>

      {/* Formulaire de création/édition */}
      {(isCreateMode || editingSpace) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreateMode
                ? 'Créer un nouvel espace'
                : `Modifier ${editingSpace?.name}`}
            </CardTitle>
            <CardDescription>
              Remplissez les informations de l&apos;espace de travail
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Nom de l&apos;espace *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Salle Focus"
                />
              </div>

              <div>
                <Label htmlFor="location">Localisation</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Ex: 1er étage, côté jardin"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Décrivez l'ambiance et les caractéristiques de cet espace..."
                className="min-h-20 w-full rounded-md border p-2"
              />
            </div>

            {/* Capacité et tarifs */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <Label htmlFor="capacity">Capacité (personnes)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      capacity: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="pricePerHour">Prix/heure (€)</Label>
                <Input
                  id="pricePerHour"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.pricePerHour}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pricePerHour: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="pricePerDay">Prix/jour (€)</Label>
                <Input
                  id="pricePerDay"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.pricePerDay}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pricePerDay: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="pricePerWeek">Prix/semaine (€)</Label>
                <Input
                  id="pricePerWeek"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.pricePerWeek}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pricePerWeek: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="pricePerMonth">Prix/mois (€)</Label>
                <Input
                  id="pricePerMonth"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.pricePerMonth}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pricePerMonth: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            {/* Équipements */}
            <div>
              <Label>Équipements disponibles</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
                {AMENITIES_OPTIONS.map((amenity) => {
                  const Icon = amenity.icon
                  const isSelected = formData.amenities.includes(amenity.id)

                  return (
                    <Button
                      key={amenity.id}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleAmenity(amenity.id)}
                      className="flex items-center space-x-1 text-xs"
                    >
                      <Icon className="h-3 w-3" />
                      <span>{amenity.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Upload d'images */}
            <div>
              <Label>Images de l&apos;espace</Label>
              <div className="mt-2 space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>
                    {uploadingImages
                      ? 'Upload en cours...'
                      : 'Ajouter des images'}
                  </span>
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files && handleImageUpload(e.target.files)
                  }
                  className="hidden"
                />

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={image}
                          alt={`Image ${index + 1}`}
                          width={200}
                          height={96}
                          className="h-24 w-full rounded border object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Horaires d'ouverture */}
            <div>
              <Label>Horaires d&apos;ouverture</Label>
              <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {DAYS_OF_WEEK.map((day) => {
                  const hours = (formData.openingHours as any)[day.key]

                  return (
                    <div key={day.key} className="space-y-2 rounded border p-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          {day.label}
                        </Label>
                        <label className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={!hours.closed}
                            onChange={(e) =>
                              updateOpeningHours(
                                day.key,
                                'closed',
                                !e.target.checked
                              )
                            }
                            className="rounded"
                          />
                          <span className="text-xs">Ouvert</span>
                        </label>
                      </div>

                      {!hours.closed && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Ouverture</Label>
                            <Input
                              type="time"
                              value={hours.open}
                              onChange={(e) =>
                                updateOpeningHours(
                                  day.key,
                                  'open',
                                  e.target.value
                                )
                              }
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Fermeture</Label>
                            <Input
                              type="time"
                              value={hours.close}
                              onChange={(e) =>
                                updateOpeningHours(
                                  day.key,
                                  'close',
                                  e.target.value
                                )
                              }
                              className="text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {hours.closed && (
                        <div className="py-2 text-center text-sm text-gray-500">
                          Fermé
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                className="flex items-center space-x-2"
              >
                <span>{isCreateMode ? 'Créer' : 'Sauvegarder'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des espaces */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => (
          <Card key={space._id} className="overflow-hidden">
            <div className="relative">
              {space.images && space.images.length > 0 ? (
                <Image
                  src={space.images[0]}
                  alt={space.name}
                  width={400}
                  height={160}
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-gray-200">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}

              <div className="absolute top-2 right-2">
                <Badge
                  className={
                    space.isActive !== false ? 'bg-green-500' : 'bg-red-500'
                  }
                >
                  {space.isActive !== false ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="truncate pr-2 text-lg font-semibold">
                    {space.name}
                  </h3>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(space)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(space._id, space.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {space.description && (
                  <p className="line-clamp-2 text-sm text-gray-600">
                    {space.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{space.capacity}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Euro className="h-4 w-4 text-gray-400" />
                      <span>{space.pricePerHour}€/h</span>
                    </div>
                  </div>
                </div>

                {space.location && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{space.location}</span>
                  </div>
                )}

                {space.amenities && space.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {space.amenities.slice(0, 3).map((amenityId) => {
                      const amenity = AMENITIES_OPTIONS.find(
                        (a) => a.id === amenityId
                      )
                      if (!amenity) return null

                      const Icon = amenity.icon
                      return (
                        <Badge
                          key={amenityId}
                          variant="secondary"
                          className="text-xs"
                        >
                          <Icon className="mr-1 h-3 w-3" />
                          {amenity.label}
                        </Badge>
                      )
                    })}
                    {space.amenities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{space.amenities.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {spaces.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-gray-500">
              <Building className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium">Aucun espace trouvé</h3>
              <p className="mb-4">
                Commencez par créer votre premier espace de coworking
              </p>
              <Button
                onClick={startCreate}
                className="mx-auto flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Créer un espace</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
