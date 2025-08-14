'use client'

import React, { useState, useEffect } from 'react'
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
import { Employee } from '@/hooks/useEmployees'

interface EditEmployeeModalProps {
  employee: Employee | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (employee: Employee) => void
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
  { value: 'bg-slate-500', label: 'Gris', color: '#64748B' },
]

export default function EditEmployeeModal({
  employee,
  isOpen,
  onClose,
  onSuccess,
}: EditEmployeeModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    color: 'bg-blue-500',
    startDate: '',
    pin: '1111',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Remplir le formulaire avec les données de l'employé
  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role || '',
        color: employee.color || 'bg-blue-500',
        startDate: employee.startDate
          ? new Date(employee.startDate).toISOString().split('T')[0]
          : '',
        pin: employee.pin || '1111',
      })
      setErrors({})
    }
  }, [employee, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide"
    }

    if (
      formData.phone &&
      !/^(\+33|0)[1-9](\d{8})$/.test(formData.phone.replace(/\s/g, ''))
    ) {
      newErrors.phone = 'Format de téléphone invalide (ex: 01 23 45 67 89)'
    }

    if (!formData.role) {
      newErrors.role = 'Le rôle est requis'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La date de début est requise'
    }

    if (!formData.pin || !/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = 'Le PIN doit contenir exactement 4 chiffres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !employee) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          role: formData.role,
          color: formData.color,
          startDate: formData.startDate,
          pin: formData.pin,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 409) {
          setErrors({ email: 'Un employé avec cet email existe déjà' })
          return
        }
        throw new Error(errorData.error || 'Erreur lors de la modification')
      }

      const updatedEmployee = await response.json()
      onSuccess(updatedEmployee)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la modification',
      })
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
      startDate: '',
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

  if (!employee) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Modifier l&apos;employé
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations de {employee.fullName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="mb-4 font-medium text-gray-900">
                Informations personnelles
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    placeholder="Jean"
                    error={!!errors.firstName}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="Dupont"
                    error={!!errors.lastName}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="mb-4 font-medium text-gray-900">Contact</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="jean.dupont@example.com"
                    error={!!errors.email}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="01 23 45 67 89"
                    error={!!errors.phone}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Code PIN <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pin"
                    type="password"
                    value={formData.pin}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pin: e.target.value,
                      }))
                    }
                    placeholder="1111"
                    maxLength={4}
                    error={!!errors.pin}
                  />
                  {errors.pin && (
                    <p className="text-sm text-red-600">{errors.pin}</p>
                  )}
                  <p className="text-xs text-gray-600">
                    Code à 4 chiffres pour le pointage
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rôle et apparence */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="mb-4 font-medium text-gray-900">
                Rôle et apparence
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Rôle <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger error={!!errors.role}>
                      <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div>
                            <div className="font-medium">{role.label}</div>
                            <div className="text-sm text-gray-500">
                              {role.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-600">{errors.role}</p>
                  )}
                  {selectedRole && (
                    <Badge variant="outline" className="w-fit">
                      {selectedRole.label}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Couleur
                  </Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, color: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {selectedColor && (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded-full"
                              style={{ backgroundColor: selectedColor.color }}
                            />
                            {selectedColor.label}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded-full"
                              style={{ backgroundColor: color.color }}
                            />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date de début */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de début <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  error={!!errors.startDate}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <p className="text-sm">{errors.submit}</p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
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
                  Modification...
                </>
              ) : (
                "Modifier l'employé"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
