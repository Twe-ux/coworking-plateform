'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  User,
  Upload,
  Camera,
  Mail,
  Shield,
  Calendar,
  Save,
  X,
} from 'lucide-react'
import { redirect } from 'next/navigation'

interface UserProfile {
  id: string
  name?: string
  email: string
  image?: string
  role: string
  firstName?: string
  lastName?: string
  phone?: string
  bio?: string
  createdAt?: string
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (session?.user) {
        try {
          // Charger le profil depuis l'API pour avoir les données à jour de la BD
          const response = await fetch('/api/user/profile')
          const result = await response.json()
          
          if (result.success) {
            setProfile({
              id: result.data.id,
              name: result.data.name,
              email: result.data.email,
              image: result.data.image,
              role: result.data.role,
              firstName: result.data.firstName || '',
              lastName: result.data.lastName || '',
              phone: result.data.phone || '',
              bio: result.data.bio || '',
              createdAt: result.data.createdAt,
            })
          } else {
            // Fallback vers les données de session en cas d'erreur API
            const firstName = session.user.firstName || ''
            const lastName = session.user.lastName || ''
            const computedName = `${firstName} ${lastName}`.trim() || session.user.name || ''
            
            setProfile({
              id: session.user.id,
              name: computedName,
              email: session.user.email || '',
              image: session.user.image || '',
              role: (session.user as any).role || 'client',
              firstName: firstName,
              lastName: lastName,
              phone: '',
              bio: '',
            })
          }
        } catch (error) {
          console.error('Erreur lors du chargement du profil:', error)
          // Fallback vers les données de session en cas d'erreur
          const firstName = session.user.firstName || ''
          const lastName = session.user.lastName || ''
          const computedName = `${firstName} ${lastName}`.trim() || session.user.name || ''
          
          setProfile({
            id: session.user.id,
            name: computedName,
            email: session.user.email || '',
            image: session.user.image || '',
            role: (session.user as any).role || 'client',
            firstName: firstName,
            lastName: lastName,
            phone: '',
            bio: '',
          })
        }
        setIsLoading(false)
      } else if (session === null) {
        redirect('/auth/signin')
      }
    }

    loadProfile()
  }, [session])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleAvatarUpload = async () => {
    if (!selectedImage) return

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('images', selectedImage)

      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success && result.images.length > 0) {
        const avatarUrl = result.images[0].url
        setProfile((prev) => (prev ? { ...prev, image: avatarUrl } : null))

        // Mettre à jour le profil dans la DB
        await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: profile?.firstName,
            lastName: profile?.lastName,
            image: avatarUrl,
          }),
        })

        // Nettoyer la prévisualisation
        setSelectedImage(null)
        setPreviewUrl(null)

        // Mettre à jour la session
        await update({ image: avatarUrl })

        alert('Avatar mis à jour avec succès !')
      } else {
        alert(result.error || "Erreur lors de l'upload")
      }
    } catch (error) {
      console.error('Erreur upload avatar:', error)
      alert("Erreur lors de l'upload de l'avatar")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setIsSaving(true)
    try {
      // Calculer le nom complet à partir de firstName + lastName
      const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          bio: profile.bio,
          image: profile.image,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Mettre à jour la session avec les nouveaux champs
        if (profile.firstName !== session?.user?.firstName ||
            profile.lastName !== session?.user?.lastName) {
          await update({ 
            name: fullName,
            firstName: profile.firstName,
            lastName: profile.lastName
          })
        }
        alert('Profil mis à jour avec succès !')
      } else {
        alert(result.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error)
      alert('Erreur lors de la sauvegarde du profil')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="space-y-4">
            <div className="h-32 w-full rounded-lg bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-600">
          Gérez vos informations personnelles et préférences
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Section Avatar */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Photo de profil
          </h2>

          <div className="flex items-center gap-6">
            {/* Avatar actuel */}
            <div className="relative">
              <img
                src={previewUrl || profile.image || '/avatars/admin.png'}
                alt="Avatar"
                className="h-24 w-24 rounded-full border-4 border-gray-200 object-cover"
              />
              {uploadingAvatar && (
                <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center rounded-full bg-black">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-white"></div>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              {/* Sélection de fichier */}
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 transition-colors hover:bg-gray-50"
                >
                  <Camera className="h-4 w-4" />
                  Choisir une photo
                </label>

                {selectedImage && (
                  <>
                    <button
                      type="button"
                      onClick={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="bg-coffee-primary hover:bg-coffee-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" />
                      {uploadingAvatar ? 'Upload...' : 'Uploader'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null)
                        setPreviewUrl(null)
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 transition-colors hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Formats acceptés : JPG, PNG. Taille max : 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Informations personnelles
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Prénom *
              </label>
              <input
                type="text"
                required
                value={profile.firstName || ''}
                onChange={(e) =>
                  setProfile({ ...profile, firstName: e.target.value })
                }
                className="focus:ring-coffee-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none"
                placeholder="John"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nom *
              </label>
              <input
                type="text"
                required
                value={profile.lastName || ''}
                onChange={(e) =>
                  setProfile({ ...profile, lastName: e.target.value })
                }
                className="focus:ring-coffee-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none"
                placeholder="Doe"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 py-2 pr-3 pl-10 text-gray-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                L&apos;email ne peut pas être modifié
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                className="focus:ring-coffee-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none"
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Rôle
              </label>
              <div className="relative">
                <Shield className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 py-2 pr-3 pl-10 text-gray-500 capitalize"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Bio / Description
            </label>
            <textarea
              rows={4}
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="focus:ring-coffee-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none"
              placeholder="Parlez-nous de vous..."
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500">
              {(profile.bio || '').length}/500 caractères
            </p>
          </div>
        </div>

        {/* Informations du compte */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Informations du compte
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                ID Utilisateur
              </label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="text"
                  value={profile.id}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 py-2 pr-3 pl-10 font-mono text-sm text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Membre depuis
              </label>
              <div className="relative">
                <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="text"
                  value={
                    profile.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString('fr-FR')
                      : 'Non disponible'
                  }
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 py-2 pr-3 pl-10 text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 border-t pt-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg px-6 py-2 text-gray-600 transition-colors hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-coffee-primary hover:bg-coffee-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-2 text-white transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </div>
  )
}
