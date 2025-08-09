'use client'

import { useState, useEffect } from 'react'
import { format, parseISO, addDays, isBefore, isAfter, startOfToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, Clock, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

interface BookingData {
  id: string
  space: {
    name: string
    location: string
  }
  date: string
  startTime: string
  endTime: string
  duration: number
  durationType: 'hour' | 'day'
  guests: number
  totalPrice: number
  status: string
}

interface ModifyBookingModalProps {
  booking: BookingData | null
  isOpen: boolean
  onClose: () => void
  onModify: (bookingId: string, newDate: string, newStartTime: string, newEndTime: string) => Promise<void>
}

export function ModifyBookingModal({ booking, isOpen, onClose, onModify }: ModifyBookingModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndTime, setNewEndTime] = useState('')
  const [conflicts, setConflicts] = useState<any[]>([])
  const [checkingConflicts, setCheckingConflicts] = useState(false)

  // Initialize form with current booking data
  useEffect(() => {
    if (booking) {
      setNewDate(booking.date)
      setNewStartTime(booking.startTime)
      setNewEndTime(booking.endTime)
    }
  }, [booking])

  // Check for conflicts when date/time changes
  useEffect(() => {
    if (booking && newDate && newStartTime && newEndTime) {
      const checkConflicts = async () => {
        // Only check if values have actually changed
        if (newDate === booking.date && newStartTime === booking.startTime && newEndTime === booking.endTime) {
          setConflicts([])
          return
        }

        setCheckingConflicts(true)
        try {
          const response = await fetch('/api/spaces/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              spaceId: 'temp', // We'll need to get space ID from booking
              date: newDate,
              startTime: newStartTime,
              endTime: newEndTime,
              excludeBookingId: booking.id // Exclude current booking from conflict check
            })
          })

          const data = await response.json()
          setConflicts(data.conflicts || [])
        } catch (error) {
          console.error('Erreur vérification conflits:', error)
        } finally {
          setCheckingConflicts(false)
        }
      }

      // Debounce the conflict check
      const timeoutId = setTimeout(checkConflicts, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [booking, newDate, newStartTime, newEndTime])

  const handleSubmit = async () => {
    if (!booking) return

    // Validation
    if (!newDate || !newStartTime || !newEndTime) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      })
      return
    }

    // Check if date is not in the past
    const selectedDate = parseISO(newDate)
    if (isBefore(selectedDate, startOfToday())) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier pour une date passée",
        variant: "destructive",
      })
      return
    }

    // Check if there are conflicts
    if (conflicts.length > 0) {
      toast({
        title: "Erreur",
        description: "Ce créneau n'est pas disponible",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await onModify(booking.id, newDate, newStartTime, newEndTime)
      onClose()
      toast({
        title: "Succès",
        description: "Réservation modifiée avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la réservation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = booking && (
    newDate !== booking.date ||
    newStartTime !== booking.startTime ||
    newEndTime !== booking.endTime
  )

  const canModify = booking && hasChanges && conflicts.length === 0 && !checkingConflicts

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-orange-500" />
            Modifier la réservation
          </DialogTitle>
          <DialogDescription>
            Modifiez les détails de votre réservation. Les changements seront confirmés immédiatement.
          </DialogDescription>
        </DialogHeader>

        {booking && (
          <div className="space-y-6">
            {/* Current booking info */}
            <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{booking.space.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(parseISO(booking.date), 'EEEE d MMMM yyyy', { locale: fr })}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {booking.startTime} - {booking.endTime}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modification form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Nouvelle date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newDate}
                    min={format(addDays(new Date(), 1), 'yyyy-MM-dd')} // Minimum tomorrow
                    onChange={(e) => setNewDate(e.target.value)}
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                {/* Start time */}
                <div className="space-y-2">
                  <Label htmlFor="startTime">Heure de début</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                {/* End time */}
                <div className="space-y-2">
                  <Label htmlFor="endTime">Heure de fin</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
              </div>

              {/* Status indicators */}
              <div className="space-y-2">
                {checkingConflicts && (
                  <div className="flex items-center text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Vérification de la disponibilité...
                  </div>
                )}

                {conflicts.length > 0 && !checkingConflicts && (
                  <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Créneau non disponible</p>
                      <p className="text-xs text-red-600">
                        Ce créneau entre en conflit avec d&apos;autres réservations
                      </p>
                    </div>
                  </div>
                )}

                {hasChanges && conflicts.length === 0 && !checkingConflicts && (
                  <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Check className="h-4 w-4 text-green-500" />
                    <p className="text-sm font-medium text-green-800">Créneau disponible</p>
                  </div>
                )}

                {!hasChanges && (
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <p className="text-sm text-gray-600">Aucune modification détectée</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing info */}
            {hasChanges && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Nouveau prix</p>
                      <p className="text-xs text-blue-600">
                        Le prix peut changer selon la nouvelle durée
                      </p>
                    </div>
                    <div className="text-xl font-bold text-blue-900">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                      }).format(booking.totalPrice)} {/* For now, same price */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canModify || loading}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Modification...
              </div>
            ) : (
              'Confirmer les modifications'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}