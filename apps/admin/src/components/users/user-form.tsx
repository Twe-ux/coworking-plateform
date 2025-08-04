"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  SaveIcon, 
  XIcon, 
  EyeIcon, 
  EyeOffIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  ShieldIcon,
  KeyIcon
} from 'lucide-react'
import { User, UserFormData, CreateUserData, UserRole, UserStatus } from '@/types/admin'
import { 
  Button, 
  Input, 
  Label, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Card,
  Switch
} from '@coworking/ui'

interface UserFormProps {
  user?: User
  isEditing?: boolean
  onSave?: (data: UserFormData | CreateUserData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  { 
    value: 'admin', 
    label: 'Administrateur', 
    description: 'Accès complet à toutes les fonctionnalités' 
  },
  { 
    value: 'manager', 
    label: 'Manager', 
    description: 'Gestion des utilisateurs et espaces' 
  },
  { 
    value: 'staff', 
    label: 'Personnel', 
    description: 'Accès aux fonctionnalités de base' 
  },
  { 
    value: 'client', 
    label: 'Client', 
    description: 'Accès client standard' 
  }
]

const statusOptions: { value: UserStatus; label: string; description: string }[] = [
  { 
    value: 'active', 
    label: 'Actif', 
    description: 'Utilisateur peut se connecter' 
  },
  { 
    value: 'inactive', 
    label: 'Inactif', 
    description: 'Utilisateur temporairement désactivé' 
  },
  { 
    value: 'suspended', 
    label: 'Suspendu', 
    description: 'Utilisateur suspendu' 
  },
  { 
    value: 'pending', 
    label: 'En attente', 
    description: 'En attente de validation' 
  }
]

export const UserForm: React.FC<UserFormProps> = ({
  user,
  isEditing = false,
  onSave,
  onCancel,
  loading = false
}) => {
  const router = useRouter()
  
  // État du formulaire
  const [formData, setFormData] = useState<UserFormData>({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'client',
    status: user?.status || 'active',
    phone: user?.phone || '',
    department: user?.department || '',
    password: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)

  // Gestionnaires
  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
    
    // Nettoyer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validation nom
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères'
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide'
    }

    // Validation mot de passe (requis seulement pour la création)
    if (!isEditing && !formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    // Validation téléphone (optionnel mais format)
    if (formData.phone) {
      const phoneRegex = /^[\+]?[(]?[\d\s\-\(\)]{10,}$/
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Format de téléphone invalide'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      if (isEditing) {
        // Mode édition - ne pas inclure le mot de passe s'il est vide
        const updateData: UserFormData = { ...formData }
        if (!updateData.password) {
          delete updateData.password
        }
        await onSave?.(updateData)
      } else {
        // Mode création - le mot de passe est requis
        const createData: CreateUserData = formData as CreateUserData
        await onSave?.(createData)
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      if (confirm('Voulez-vous vraiment annuler ? Vos modifications seront perdues.')) {
        onCancel?.() || router.back()
      }
    } else {
      onCancel?.() || router.back()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations personnelles */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Informations personnelles</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nom complet de l'utilisateur"
                error={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                  className="pl-10"
                  error={!!errors.email}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                  className="pl-10"
                  error={!!errors.phone}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Département</Label>
              <div className="relative">
                <BuildingIcon className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="ex: IT, RH, Commercial..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Paramètres de compte */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <ShieldIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Paramètres de compte</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: UserRole) => handleInputChange('role', value)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: UserStatus) => handleInputChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">
                {isEditing ? 'Nouveau mot de passe' : 'Mot de passe *'}
              </Label>
              <div className="relative">
                <KeyIcon className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={isEditing ? 'Laisser vide pour ne pas changer' : 'Mot de passe'}
                  className="pl-10 pr-10"
                  error={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour conserver le mot de passe actuel
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Boutons d'action */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
        >
          <XIcon className="h-4 w-4 mr-2" />
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading || !isDirty}
        >
          <SaveIcon className="h-4 w-4 mr-2" />
          {loading ? 'Sauvegarde...' : isEditing ? 'Mettre à jour' : 'Créer l\'utilisateur'}
        </Button>
      </div>
    </form>
  )
}