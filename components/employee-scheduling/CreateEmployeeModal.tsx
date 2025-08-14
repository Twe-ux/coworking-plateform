'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  Palette,
  Lock,
} from 'lucide-react'

interface CreateEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (employee: any) => void
}

const EMPLOYEE_ROLES = [
  {
    value: 'Manager',
    label: 'Manager',
    description: "Gestion d'équipe et supervision",
  },
  {
    value: 'Reception',
    label: 'Réception',
    description: 'Accueil et service client',
  },
  {
    value: 'Security',
    label: 'Sécurité',
    description: 'Surveillance et sécurité',
  },
  {
    value: 'Maintenance',
    label: 'Maintenance',
    description: 'Entretien et réparations',
  },
  {
    value: 'Cleaning',
    label: 'Nettoyage',
    description: 'Nettoyage et hygiène',
  },
  { value: 'Staff', label: 'Personnel', description: 'Personnel polyvalent' },
]

const EMPLOYEE_COLORS = [
  { value: 'bg-blue-500', label: 'Bleu', color: '#3B82F6' },
  { value: 'bg-green-500', label: 'Vert', color: '#10B981' },
  { value: 'bg-purple-500', label: 'Violet', color: '#8B5CF6' },
  { value: 'bg-orange-500', label: 'Orange', color: '#F97316' },
  { value: 'bg-red-500', label: 'Rouge', color: '#EF4444' },
  { value: 'bg-teal-500', label: 'Teal', color: '#14B8A6' },
  { value: 'bg-indigo-500', label: 'Indigo', color: '#6366F1' },
  { value: 'bg-pink-500', label: 'Rose', color: '#EC4899' },
  { value: 'bg-yellow-500', label: 'Jaune', color: '#EAB308' },
  { value: 'bg-cyan-500', label: 'Cyan', color: '#06B6D4' },
]

export default function CreateEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateEmployeeModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    color: 'bg-blue-500',
    startDate: new Date().toISOString().split('T')[0],
    pin: '1111',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire'
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est obligatoire'
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caractères'
    }

    if (!formData.role) {
      newErrors.role = 'Le rôle est obligatoire'
    }

    if (
      formData.email &&
      !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)
    ) {
      newErrors.email = "Format d'email invalide"
    }

    if (
      formData.phone &&
      !/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(formData.phone)
    ) {
      newErrors.phone = 'Format de téléphone français invalide'
    }

    if (!formData.pin || !/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = 'Le PIN doit contenir exactement 4 chiffres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        onSuccess(result.data)
        handleClose()
        // Optionnel : afficher une notification de succès
      } else {
        if (result.details && Array.isArray(result.details)) {
          // Erreurs de validation du serveur
          const serverErrors: Record<string, string> = {}
          result.details.forEach((error: string) => {
            if (error.includes('prénom') || error.includes('firstName')) {
              serverErrors.firstName = error
            } else if (error.includes('nom') || error.includes('lastName')) {
              serverErrors.lastName = error
            } else if (error.includes('email')) {
              serverErrors.email = error
            } else if (error.includes('phone') || error.includes('téléphone')) {
              serverErrors.phone = error
            } else if (error.includes('rôle') || error.includes('role')) {
              serverErrors.role = error
            } else {
              serverErrors.general = error
            }
          })
          setErrors(serverErrors)
        } else {
          setErrors({
            general: result.error || "Erreur lors de la création de l'employé",
          })
        }
      }
    } catch (error) {
      console.error('Erreur création employé:', error)
      setErrors({ general: 'Erreur de connexion au serveur' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      color: 'bg-blue-500',
      startDate: new Date().toISOString().split('T')[0],
      pin: '1111',
    })
    setErrors({})
    onClose()
  }

  const selectedRole = EMPLOYEE_ROLES.find(
    (role) => role.value === formData.role
  )
  const selectedColor = EMPLOYEE_COLORS.find(
    (color) => color.value === formData.color
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Ajouter un nouvel employé
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau profil d&apos;employé pour la planification des
            équipes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Erreur générale */}
          {errors.general && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {errors.general}
            </div>
          )}

          {/* Informations personnelles */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-4 text-lg font-medium">
                Informations personnelles
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange('firstName', e.target.value)
                    }
                    placeholder="Jean"
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange('lastName', e.target.value)
                    }
                    placeholder="Dupont"
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      placeholder="jean.dupont@example.com"
                      className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                      placeholder="01 23 45 67 89"
                      className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin">Code PIN *</Label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      id="pin"
                      type="password"
                      value={formData.pin}
                      onChange={(e) => handleInputChange('pin', e.target.value)}
                      placeholder="1111"
                      maxLength={4}
                      className={`pl-10 ${errors.pin ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.pin && (
                    <p className="text-sm text-red-600">{errors.pin}</p>
                  )}
                  <p className="text-xs text-gray-600">
                    Code à 4 chiffres pour le pointage (par défaut: 1111)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations professionnelles */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-4 text-lg font-medium">
                Informations professionnelles
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                  >
                    <SelectTrigger
                      className={errors.role ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{role.label}</span>
                            <span className="text-xs text-gray-500">
                              {role.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-600">{errors.role}</p>
                  )}
                  {selectedRole && (
                    <p className="text-sm text-gray-600">
                      {selectedRole.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début</Label>
                  <div className="relative">
                    <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleInputChange('startDate', e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Apparence */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-medium">
                <Palette className="h-5 w-5" />
                Couleur d&apos;identification
              </h3>

              <div className="space-y-4">
                <Label>Couleur pour le planning</Label>
                <div className="grid grid-cols-5 gap-3">
                  {EMPLOYEE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleInputChange('color', color.value)}
                      className={`relative rounded-lg border-2 p-3 transition-all ${
                        formData.color === color.value
                          ? 'border-coffee-primary ring-coffee-primary/20 ring-2'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="mx-auto mb-1 h-8 w-8 rounded-full"
                        style={{ backgroundColor: color.color }}
                      />
                      <span className="text-xs text-gray-600">
                        {color.label}
                      </span>
                      {formData.color === color.value && (
                        <div className="bg-coffee-primary absolute top-1 right-1 h-3 w-3 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Aperçu */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="mb-2 text-sm text-gray-600">Aperçu :</p>
                  <Badge className={`${formData.color} text-white`}>
                    {formData.firstName || 'Prénom'}{' '}
                    {formData.lastName || 'Nom'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-coffee-primary hover:bg-coffee-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer l'employé"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
