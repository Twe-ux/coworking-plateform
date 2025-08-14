'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type Employee } from '@/hooks/useEmployees'
import { AlertCircle, Clock, Play, Square, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import PINKeypad from './PINKeypad'

interface TimeEntry {
  id: string
  employeeId: string
  date: Date
  clockIn: Date
  clockOut?: Date | null
  shiftNumber: 1 | 2
  totalHours?: number
  status: 'active' | 'completed'
}

interface TimeTrackingCardProps {
  employee: Employee
  onStatusChange?: () => void
  className?: string
}

export default function TimeTrackingCard({
  employee,
  onStatusChange,
  className = '',
}: TimeTrackingCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPINDialog, setShowPINDialog] = useState(false)
  const [pinAction, setPinAction] = useState<'clock-in' | 'clock-out' | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [activeEntries, setActiveEntries] = useState<TimeEntry[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second for timer display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch active time entries for this employee
  const fetchActiveEntries = useCallback(async () => {
    try {
      // Récupérer les entrées actives sans filtre de date pour éviter les problèmes de timezone
      const url = `/api/time-entries?employeeId=${employee.id}&status=active&limit=10`

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()

        // Filtrer côté client pour ne garder que les entrées d'aujourd'hui
        const today = new Date()
        const todayEntries = (data.data || []).filter((entry: any) => {
          const entryDate = new Date(entry.clockIn)
          return entryDate.toDateString() === today.toDateString()
        })

        setActiveEntries(todayEntries)
      }
    } catch (error) {
      console.error('Error fetching active entries:', error)
    }
  }, [employee.id])

  useEffect(() => {
    fetchActiveEntries()
  }, [fetchActiveEntries])

  const handleClockAction = (action: 'clock-in' | 'clock-out') => {
    setPinAction(action)
    setShowPINDialog(true)
    setError(null)
  }

  const handleCardClick = () => {
    if (hasActiveShift) {
      handleClockAction('clock-out')
    } else if (canClockIn) {
      handleClockAction('clock-in')
    }
  }

  const handlePINSubmit = async (pin: string) => {
    if (!pinAction) return

    setIsLoading(true)
    setError(null)

    try {
      // First verify PIN
      const pinResponse = await fetch('/api/employees/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employee.id,
          pin,
        }),
      })

      const pinResult = await pinResponse.json()

      if (!pinResult.success) {
        setError('Code PIN incorrect')
        setIsLoading(false)
        return
      }

      // Proceed with clock action
      const endpoint = `/api/time-entries/${pinAction}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employee.id,
          pin: pin,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setShowPINDialog(false)
        setPinAction(null)
        await fetchActiveEntries()
        onStatusChange?.()
      } else {
        setError(result.error || 'Erreur lors du pointage')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePINCancel = () => {
    setShowPINDialog(false)
    setPinAction(null)
    setError(null)
  }

  const formatElapsedTime = (clockIn: Date) => {
    const elapsed = Math.floor(
      (currentTime.getTime() - new Date(clockIn).getTime()) / 1000
    )
    const hours = Math.floor(elapsed / 3600)
    const minutes = Math.floor((elapsed % 3600) / 60)
    const seconds = elapsed % 60

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const canClockIn = activeEntries.length < 2
  const hasActiveShift = activeEntries.length > 0

  return (
    <>
      <Card
        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
          hasActiveShift
            ? 'bg-green-50 ring-2 ring-green-500'
            : canClockIn
              ? 'hover:ring-2 hover:ring-blue-500'
              : 'cursor-not-allowed opacity-75'
        } ${className}`}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`h-4 w-4 rounded-full ${employee.color}`} />
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base font-medium">
                {employee.firstName} {employee.lastName}
              </CardTitle>
              {/* <Badge variant="secondary" className="mt-1 text-xs">
                {employee.role}
              </Badge> */}
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                {activeEntries.length}/2
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Active Shifts Display */}
          {activeEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-5"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-sm font-medium">
                  Shift {entry.shiftNumber}
                </span>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-green-700">
                  {formatElapsedTime(entry.clockIn)}
                </div>
                <div className="text-xs text-gray-600">
                  Début:{' '}
                  {new Date(entry.clockIn).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* No Active Shifts */}
          {!hasActiveShift && (
            <div className="text-center text-gray-500">
              <Clock className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm">Aucun pointage actif</p>
              <p className="mt-1 text-xs text-gray-400">
                Cliquez pour commencer
              </p>
            </div>
          )}

          {/* Single Action Button */}
          <div className="flex justify-center">
            {hasActiveShift ? (
              <Button
                className="flex w-full items-center justify-center gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClockAction('clock-out')
                }}
                variant="destructive"
              >
                <Square className="h-4 w-4" />
                Arrêter le pointage
              </Button>
            ) : canClockIn ? (
              <Button
                className="flex w-full items-center justify-center gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClockAction('clock-in')
                }}
                variant="default"
              >
                <Play className="h-4 w-4" />
                Commencer le pointage
              </Button>
            ) : null}
          </div>

          {/* Status Messages */}
          {!canClockIn && (
            <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4" />
              Maximum 2 pointages par jour atteint
            </div>
          )}
        </CardContent>
      </Card>

      {/* PIN Dialog */}
      <Dialog open={showPINDialog} onOpenChange={handlePINCancel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pinAction === 'clock-in'
                ? 'Commencer le pointage'
                : 'Arrêter le pointage'}
            </DialogTitle>
          </DialogHeader>
          <PINKeypad
            onSubmit={handlePINSubmit}
            onCancel={handlePINCancel}
            isLoading={isLoading}
            error={error || undefined}
            employeeName={`${employee.firstName} ${employee.lastName}`}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
