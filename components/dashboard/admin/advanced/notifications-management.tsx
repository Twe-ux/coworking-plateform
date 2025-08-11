'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { 
  Bell, 
  Mail, 
  Settings, 
  Play, 
  Square, 
  TestTube, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface NotificationStats {
  totalNotifications: number
  sentNotifications: number
  failedNotifications: number
  cacheSize: number
}

interface SystemStatus {
  emailConfigured: boolean
  schedulerRunning: boolean
  statistics: NotificationStats
  lastCheck: string
}

export function NotificationsManagement() {
  const [loading, setLoading] = useState(true)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [testBookingId, setTestBookingId] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadSystemStatus()
  }, [])

  const loadSystemStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications')
      const data = await response.json()

      if (data.success) {
        setSystemStatus(data.data)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erreur chargement status:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger le statut du système",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string, bookingId?: string) => {
    try {
      setActionLoading(action)
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, bookingId })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Action réussie",
          description: data.message
        })
        
        // Recharger le statut après l'action
        if (action !== 'test_reminder') {
          await loadSystemStatus()
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erreur action:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Action échouée",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleTestReminder = () => {
    if (!testBookingId.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un ID de réservation",
        variant: "destructive"
      })
      return
    }
    handleAction('test_reminder', testBookingId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status général */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <CardTitle>État du système</CardTitle>
                <CardDescription>
                  Supervision en temps réel des notifications
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadSystemStatus}
              disabled={loading}
            >
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {systemStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Service Email</span>
                </div>
                <Badge variant={systemStatus.emailConfigured ? "default" : "destructive"}>
                  {systemStatus.emailConfigured ? "Configuré" : "Non configuré"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Scheduler</span>
                </div>
                <Badge variant={systemStatus.schedulerRunning ? "default" : "destructive"}>
                  {systemStatus.schedulerRunning ? "Actif" : "Arrêté"}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques */}
      {systemStatus && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-amber-600" />
              <div>
                <CardTitle>Statistiques des notifications</CardTitle>
                <CardDescription>
                  Performance et utilisation du système
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {systemStatus.statistics.totalNotifications}
                </div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {systemStatus.statistics.sentNotifications}
                </div>
                <div className="text-xs text-gray-600">Envoyées</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {systemStatus.statistics.failedNotifications}
                </div>
                <div className="text-xs text-gray-600">Échouées</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {systemStatus.statistics.cacheSize}
                </div>
                <div className="text-xs text-gray-600">En cache</div>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              Dernière vérification : {new Date(systemStatus.lastCheck).toLocaleString('fr-FR')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contrôles système */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <div>
              <CardTitle>Contrôles système</CardTitle>
              <CardDescription>
                Actions de maintenance et tests
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex items-center space-x-2"
              onClick={() => handleAction('start')}
              disabled={actionLoading === 'start'}
            >
              <Play className="h-4 w-4" />
              <span>{actionLoading === 'start' ? 'Démarrage...' : 'Démarrer scheduler'}</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center space-x-2"
              onClick={() => handleAction('stop')}
              disabled={actionLoading === 'stop'}
            >
              <Square className="h-4 w-4" />
              <span>{actionLoading === 'stop' ? 'Arrêt...' : 'Arrêter scheduler'}</span>
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Test de rappel de réservation</h4>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="booking-id" className="text-xs">ID de réservation</Label>
                <Input
                  id="booking-id"
                  value={testBookingId}
                  onChange={(e) => setTestBookingId(e.target.value)}
                  placeholder="Saisir l'ID d'une réservation..."
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleTestReminder}
                  disabled={actionLoading === 'test_reminder' || !testBookingId.trim()}
                  className="flex items-center space-x-2"
                >
                  <TestTube className="h-4 w-4" />
                  <span>{actionLoading === 'test_reminder' ? 'Envoi...' : 'Tester'}</span>
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Envoie un rappel immédiat pour tester le système d'email
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alertes */}
      {systemStatus && !systemStatus.emailConfigured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Le service email n'est pas configuré. Les notifications ne seront pas envoyées.
            Vérifiez la variable d'environnement RESEND_API_KEY.
          </AlertDescription>
        </Alert>
      )}

      {systemStatus && systemStatus.statistics.failedNotifications > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {systemStatus.statistics.failedNotifications} notifications ont échoué. 
            Vérifiez les logs du serveur pour plus de détails.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}