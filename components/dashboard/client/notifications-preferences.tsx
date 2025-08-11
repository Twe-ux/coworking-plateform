'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Switch } from '@/components/ui/switch' // Pas disponible
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { Bell, Mail, Smartphone, Monitor } from 'lucide-react'

interface NotificationPreferences {
  email: boolean
  sms: boolean
  push: boolean
}

interface EmailSettings {
  bookingConfirmation: boolean
  bookingReminder24h: boolean
  bookingReminder2h: boolean
  bookingCancellation: boolean
  promotions: boolean
}

export function NotificationsPreferences() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email: true,
    sms: false,
    push: true
  })
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    bookingConfirmation: true,
    bookingReminder24h: true,
    bookingReminder2h: true,
    bookingCancellation: true,
    promotions: false
  })

  useEffect(() => {
    if (session?.user) {
      const prefs = (session.user as any).preferences?.notifications
      if (prefs) {
        setNotifications({
          email: prefs.email ?? true,
          sms: prefs.sms ?? false,
          push: prefs.push ?? true
        })
      }

      const emailPrefs = (session.user as any).preferences?.emailSettings
      if (emailPrefs) {
        setEmailSettings(emailPrefs)
      }
    }
  }, [session])

  const handleSave = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notifications,
          emailSettings
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      // Mettre à jour la session
      await update({
        ...session,
        user: {
          ...session?.user,
          preferences: {
            ...(session?.user as any)?.preferences,
            notifications,
            emailSettings
          }
        }
      })

      toast({
        title: "Préférences sauvegardées",
        description: "Vos préférences de notifications ont été mises à jour.",
      })

    } catch (error) {
      console.error('Erreur sauvegarde préférences:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder les préférences",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Canaux de notification */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-amber-600" />
            <div>
              <CardTitle>Canaux de notification</CardTitle>
              <CardDescription>
                Choisissez comment vous souhaitez recevoir vos notifications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-blue-600" />
              <div>
                <Label htmlFor="email-notifications" className="text-base">
                  Notifications par email
                </Label>
                <p className="text-sm text-gray-500">
                  Recevez vos confirmations et rappels par email
                </p>
              </div>
            </div>
            <input type="checkbox"
              id="email-notifications"
              checked={notifications.email}
              onChange={(e) => {
                const checked = e.target.checked
                setNotifications(prev => ({ ...prev, email: checked }))
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-4 w-4 text-green-600" />
              <div>
                <Label htmlFor="sms-notifications" className="text-base">
                  Notifications SMS
                </Label>
                <p className="text-sm text-gray-500">
                  Recevez des rappels urgents par SMS
                </p>
              </div>
            </div>
            <input type="checkbox"
              id="sms-notifications"
              checked={notifications.sms}
              disabled
              onChange={(e) => {
                const checked = e.target.checked
                setNotifications(prev => ({ ...prev, sms: checked }))
              }}
              disabled
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Monitor className="h-4 w-4 text-purple-600" />
              <div>
                <Label htmlFor="push-notifications" className="text-base">
                  Notifications push
                </Label>
                <p className="text-sm text-gray-500">
                  Recevez des notifications dans votre navigateur
                </p>
              </div>
            </div>
            <input type="checkbox"
              id="push-notifications"
              checked={notifications.push}
              onChange={(e) => {
                const checked = e.target.checked
                setNotifications(prev => ({ ...prev, push: checked }))
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Préférences email détaillées */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Préférences d'emails</CardTitle>
              <CardDescription>
                Personnalisez quels types d'emails vous souhaitez recevoir
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="booking-confirmation" className="text-base">
                Confirmations de réservation
              </Label>
              <p className="text-sm text-gray-500">
                Email immédiat après chaque réservation
              </p>
            </div>
            <input type="checkbox"
              id="booking-confirmation"
              checked={emailSettings.bookingConfirmation}
              onChange={(e) => {const checked = e.target.checked;
                setEmailSettings(prev => ({ ...prev, bookingConfirmation: checked }))
              }}
              disabled={!notifications.email}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reminder-24h" className="text-base">
                Rappels 24h avant
              </Label>
              <p className="text-sm text-gray-500">
                Rappel la veille de votre réservation
              </p>
            </div>
            <input type="checkbox"
              id="reminder-24h"
              checked={emailSettings.bookingReminder24h}
              onChange={(e) => {const checked = e.target.checked;
                setEmailSettings(prev => ({ ...prev, bookingReminder24h: checked }))
              }}
              disabled={!notifications.email}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reminder-2h" className="text-base">
                Rappels 2h avant
              </Label>
              <p className="text-sm text-gray-500">
                Rappel le jour même de votre réservation
              </p>
            </div>
            <input type="checkbox"
              id="reminder-2h"
              checked={emailSettings.bookingReminder2h}
              onChange={(e) => {const checked = e.target.checked;
                setEmailSettings(prev => ({ ...prev, bookingReminder2h: checked }))
              }}
              disabled={!notifications.email}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="cancellation" className="text-base">
                Confirmations d'annulation
              </Label>
              <p className="text-sm text-gray-500">
                Email lors de l'annulation d'une réservation
              </p>
            </div>
            <input type="checkbox"
              id="cancellation"
              checked={emailSettings.bookingCancellation}
              onChange={(e) => {const checked = e.target.checked;
                setEmailSettings(prev => ({ ...prev, bookingCancellation: checked }))
              }}
              disabled={!notifications.email}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="promotions" className="text-base">
                Offres promotionnelles
              </Label>
              <p className="text-sm text-gray-500">
                Recevez nos offres spéciales et événements
              </p>
            </div>
            <input type="checkbox"
              id="promotions"
              checked={emailSettings.promotions}
              onChange={(e) => {const checked = e.target.checked;
                setEmailSettings(prev => ({ ...prev, promotions: checked }))
              }}
              disabled={!notifications.email}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {loading ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
        </Button>
      </div>
    </div>
  )
}