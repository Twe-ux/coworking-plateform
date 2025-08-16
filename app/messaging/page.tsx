'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Shield, Wifi, WifiOff } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { ImprovedChatInterface } from '@/components/messaging/ImprovedChatInterface'

interface Channel {
  _id: string
  name: string
  type: 'public' | 'private' | 'direct' | 'ai_assistant'
  description?: string
  unreadCount: number
  lastActivity: string
  members: {
    user: {
      _id: string
      name: string
      avatar?: string
      role: string
    }
    role: string
    lastSeen?: string
  }[]
  settings: {
    allowFileUploads: boolean
    allowReactions: boolean
    slowModeSeconds: number
  }
}

export default function MessagingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ipRestricted, setIpRestricted] = useState(false)
  const [clientIP, setClientIP] = useState<string>('')
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting')

  // Redirection si non authentifié
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/messaging')
    }
  }, [status, router])

  // Vérification des restrictions IP
  useEffect(() => {
    const checkIPRestriction = async () => {
      try {
        const response = await fetch('/api/messaging/ip-check')
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 403) {
            setIpRestricted(true)
            setClientIP(data.clientIP || '')
            setError(data.message || 'Accès refusé depuis cette adresse IP')
          } else {
            setError(data.message || 'Erreur de vérification IP')
          }
          return
        }

        setClientIP(data.clientIP || '')
        setIpRestricted(false)
      } catch (error) {
        console.error('Erreur lors de la vérification IP:', error)
        setError('Impossible de vérifier les restrictions IP')
      }
    }

    if (session?.user) {
      checkIPRestriction()
    }
  }, [session])

  // Chargement des channels
  useEffect(() => {
    const loadChannels = async () => {
      if (!session?.user || ipRestricted) return

      try {
        setLoading(true)
        const response = await fetch('/api/messaging/channels')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Erreur lors du chargement des channels'
          )
        }

        setChannels(data.data.channels || [])
        setError(null)
      } catch (error) {
        console.error('Erreur lors du chargement des channels:', error)
        setError(error instanceof Error ? error.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    loadChannels()
  }, [session, ipRestricted])

  // Gestion des changements de connexion
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('connected')
    const handleOffline = () => setConnectionStatus('disconnected')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Redirection en cours
  }

  if (ipRestricted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-red-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Accès Restreint</CardTitle>
              <CardDescription>
                Le système de messagerie est restreint à certaines adresses IP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error ||
                    "Votre adresse IP n'est pas autorisée à accéder au système de messagerie."}
                </AlertDescription>
              </Alert>

              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-sm text-gray-600">Votre adresse IP :</p>
                <Badge variant="outline" className="font-mono">
                  {clientIP || 'Inconnue'}
                </Badge>
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  Retour à l&apos;accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (error && !ipRestricted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-yellow-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle className="text-yellow-900">
                Erreur de Chargement
              </CardTitle>
              <CardDescription>
                Impossible de charger le système de messagerie
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Réessayer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="flex-1"
                >
                  Retour
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Chargement des channels...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-[110px] min-h-screen bg-gray-100">
      {/* Header de statut */}
      <div className="border-b bg-white px-4 py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Messagerie Interne</h1>

            {/* Indicateur de connexion */}
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">En ligne</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">Hors ligne</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Informations IP */}
            <div className="text-xs text-gray-500">
              IP: <span className="font-mono">{clientIP}</span>
            </div>

            {/* Badge sécurisé */}
            <Badge
              variant="outline"
              className="border-green-300 text-green-700"
            >
              <Shield className="mr-1 h-3 w-3" />
              Sécurisé
            </Badge>
          </div>
        </div>
      </div>

      {/* Interface de chat principale */}
      <div className="mx-auto max-w-7xl p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-lg bg-white shadow-lg"
          style={{ height: 'calc(100vh - 120px)' }}
        >
          <ImprovedChatInterface />
        </motion.div>
      </div>

      {/* Footer d'information */}
      <div className="border-t bg-white px-4 py-2">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>Système de messagerie sécurisé</span>
              <span>•</span>
              <span>Restriction IP activée</span>
              <span>•</span>
              <span>Chiffrement des communications</span>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Connecté en tant que{' '}
                {(session.user.firstName && session.user.lastName) 
                  ? `${session.user.firstName} ${session.user.lastName}`
                  : session.user.name || session.user.email || 'Utilisateur'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
