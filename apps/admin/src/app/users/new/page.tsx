"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'
import { CreateUserData } from '@/types/admin'
import { Button, Card } from '@coworking/ui'
import { UserForm } from '@/components/users/user-form'

const NewUserPage = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSave = async (data: CreateUserData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Rediriger vers la page de détails du nouvel utilisateur
        router.push(`/users/${result.data._id}`)
      } else {
        console.error('Erreur lors de la création:', result.error)
        alert(result.error || 'Erreur lors de la création de l\'utilisateur')
      }
    } catch (error) {
      console.error('Erreur réseau:', error)
      alert('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/users')
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Créer un nouvel utilisateur
          </h1>
          <p className="text-muted-foreground">
            Ajoutez un nouvel utilisateur à la plateforme
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="max-w-4xl">
        <UserForm
          isEditing={false}
          onSave={handleSave}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default NewUserPage