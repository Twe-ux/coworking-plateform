"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeftIcon, 
  EditIcon, 
  TrashIcon, 
  RefreshCwIcon,
  UserCheckIcon,
  UserXIcon,
  ShieldIcon,
  MoreVerticalIcon
} from 'lucide-react'
import { User, UserFormData } from '@/types/admin'
import { 
  Button, 
  Card, 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge
} from '@coworking/ui'
import { UserDetails } from '@/components/users/user-details'
import { UserForm } from '@/components/users/user-form'
import { getStatusColor, getRoleColor } from '@/lib/utils'

const UserDetailPage = () => {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  
  // États
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Charger les données utilisateur
  const fetchUser = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/users')
          return
        }
        throw new Error('Erreur lors du chargement')
      }

      const data = await response.json()
      
      if (data.success) {
        setUser(data.data)
      } else {
        console.error('Erreur API:', data.error)
        router.push('/users')
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      router.push('/users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  // Gestionnaires d'événements
  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleSave = async (formData: UserFormData) => {
    setSaveLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setUser(result.data)
        setIsEditing(false)
      } else {
        console.error('Erreur lors de la mise à jour:', result.error)
        alert(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur réseau:', error)
      alert('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/users')
      } else {
        const result = await response.json()
        alert(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const handleStatusToggle = async (newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await fetchUser()
      } else {
        console.error('Erreur lors de la mise à jour du statut')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  // Affichage de chargement
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-8 w-8 bg-muted rounded"></div>
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-64"></div>
              <div className="h-4 bg-muted rounded w-48"></div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  // Utilisateur non trouvé
  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Utilisateur non trouvé</h2>
          <p className="text-muted-foreground mt-2">
            L'utilisateur demandé n'existe pas ou a été supprimé.
          </p>
          <Button onClick={() => router.push('/users')} className="mt-4">
            Retour à la liste
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/users')}
            className="gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {user.name}
              </h1>
              <Badge variant="outline" className={getRoleColor(user.role)}>
                {user.role}
              </Badge>
              <Badge variant="outline" className={getStatusColor(user.status)}>
                {user.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchUser}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          
          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreVerticalIcon className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <EditIcon className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleStatusToggle(user.status === 'active' ? 'inactive' : 'active')}
                >
                  {user.status === 'active' ? (
                    <>
                      <UserXIcon className="mr-2 h-4 w-4" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <UserCheckIcon className="mr-2 h-4 w-4" />
                      Activer
                    </>
                  )}
                </DropdownMenuItem>
                {user.status !== 'suspended' && (
                  <DropdownMenuItem onClick={() => handleStatusToggle('suspended')}>
                    <ShieldIcon className="mr-2 h-4 w-4" />
                    Suspendre
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-6xl">
        {isEditing ? (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Modifier l'utilisateur</h2>
              </div>
              <UserForm
                user={user}
                isEditing={true}
                onSave={handleSave}
                onCancel={handleCancelEdit}
                loading={saveLoading}
              />
            </div>
          </Card>
        ) : (
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="activity">Activité</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <UserDetails user={user} />
            </TabsContent>
            
            <TabsContent value="activity">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Journal d'activité</h3>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Fonctionnalité en cours de développement</p>
                  <p className="text-sm">
                    Le journal d'activité détaillé sera disponible prochainement
                  </p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{user.name}</strong> ?
              Cette action est irréversible et supprimera toutes les données associées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserDetailPage