'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Coffee, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  Shield,
  Star
} from 'lucide-react'
import { ClientLayout } from '@/components/dashboard/client/client-layout'
import { ClientCard, StatsCard } from '@/components/dashboard/client/client-cards'

export default function ClientProfilPage() {
  const { data: session, update } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    address: '',
    company: '',
    preferences: {
      notifications: true,
      newsletter: true,
      marketing: false
    }
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simuler la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsEditing(false)
      // Mettre à jour la session si nécessaire
      if (formData.name !== session?.user?.name) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: formData.name
          }
        })
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      phone: '',
      address: '',
      company: '',
      preferences: {
        notifications: true,
        newsletter: true,
        marketing: false
      }
    })
    setIsEditing(false)
  }

  const memberStats = {
    joinDate: '15 Mars 2024',
    totalBookings: 23,
    favoriteSpaces: 4,
    totalSpent: 456
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--color-coffee-primary)' }}
          >
            Mon profil
          </h1>
          <p style={{ color: 'var(--color-client-muted)' }}>
            Gérez vos informations personnelles et préférences
          </p>
        </div>

        {/* Informations principales */}
        <ClientCard
          title="Informations personnelles"
          icon={User}
        >
          <div className="space-y-6">
            {/* Photo de profil */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={session?.user?.image || undefined} alt="Avatar" />
                  <AvatarFallback 
                    className="text-xl"
                    style={{ backgroundColor: 'var(--color-coffee-light)' }}
                  >
                    {session?.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    style={{ borderColor: 'var(--color-coffee-primary)' }}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 
                    className="text-xl font-semibold"
                    style={{ color: 'var(--color-client-text)' }}
                  >
                    {session?.user?.name || 'Utilisateur'}
                  </h2>
                  <div 
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: 'var(--color-coffee-secondary)',
                      color: 'var(--color-coffee-primary)'
                    }}
                  >
                    <Coffee className="h-3 w-3" />
                    Membre café
                  </div>
                </div>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--color-client-muted)' }}
                >
                  Membre depuis {memberStats.joinDate}
                </p>
              </div>

              {!isEditing ? (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  style={{ borderColor: 'var(--color-coffee-primary)', color: 'var(--color-coffee-primary)' }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    style={{ 
                      backgroundColor: 'var(--color-coffee-primary)', 
                      borderColor: 'var(--color-coffee-primary)' 
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>
              )}
            </div>

            {/* Formulaire */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nom complet
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={!isEditing}
                  style={{ backgroundColor: 'var(--color-client-bg)' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={!isEditing}
                  style={{ backgroundColor: 'var(--color-client-bg)' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                  placeholder="06 12 34 56 78"
                  style={{ backgroundColor: 'var(--color-client-bg)' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Entreprise
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Nom de votre entreprise"
                  style={{ backgroundColor: 'var(--color-client-bg)' }}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Votre adresse complète"
                  style={{ backgroundColor: 'var(--color-client-bg)' }}
                />
              </div>
            </div>
          </div>
        </ClientCard>

        {/* Statistiques membre */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Réservations"
            value={memberStats.totalBookings}
            change="Total effectuées"
            icon={Calendar}
          />
          
          <StatsCard
            title="Dépenses totales"
            value={`${memberStats.totalSpent}€`}
            change="Depuis l'inscription"
            icon={Coffee}
          />
          
          <StatsCard
            title="Espaces favoris"
            value={memberStats.favoriteSpaces}
            change="Dans votre liste"
            icon={Star}
          />
          
          <StatsCard
            title="Statut"
            value="Premium"
            change="Membre fidèle"
            icon={Shield}
          />
        </div>

        {/* Préférences */}
        <ClientCard
          title="Préférences"
          description="Gérez vos notifications et paramètres"
          icon={Shield}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 
                  className="font-medium"
                  style={{ color: 'var(--color-client-text)' }}
                >
                  Notifications de réservation
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--color-client-muted)' }}
                >
                  Recevoir des confirmations et rappels
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    notifications: !formData.preferences.notifications
                  }
                })}
                style={formData.preferences.notifications ? {
                  backgroundColor: 'var(--color-coffee-primary)',
                  borderColor: 'var(--color-coffee-primary)',
                  color: 'white'
                } : {}}
              >
                {formData.preferences.notifications ? 'Activé' : 'Désactivé'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 
                  className="font-medium"
                  style={{ color: 'var(--color-client-text)' }}
                >
                  Newsletter
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--color-client-muted)' }}
                >
                  Actualités et nouveautés du café
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    newsletter: !formData.preferences.newsletter
                  }
                })}
                style={formData.preferences.newsletter ? {
                  backgroundColor: 'var(--color-coffee-primary)',
                  borderColor: 'var(--color-coffee-primary)',
                  color: 'white'
                } : {}}
              >
                {formData.preferences.newsletter ? 'Activé' : 'Désactivé'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 
                  className="font-medium"
                  style={{ color: 'var(--color-client-text)' }}
                >
                  Communications marketing
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--color-client-muted)' }}
                >
                  Offres spéciales et promotions
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    marketing: !formData.preferences.marketing
                  }
                })}
                style={formData.preferences.marketing ? {
                  backgroundColor: 'var(--color-coffee-primary)',
                  borderColor: 'var(--color-coffee-primary)',
                  color: 'white'
                } : {}}
              >
                {formData.preferences.marketing ? 'Activé' : 'Désactivé'}
              </Button>
            </div>
          </div>
        </ClientCard>
      </div>
    </ClientLayout>
  )
}