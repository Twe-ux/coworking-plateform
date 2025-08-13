'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Clock, Play, Square, User, AlertCircle } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { type Employee } from '@/hooks/useEmployees'
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
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(
        `/api/time-entries?employeeId=${employee.id}&date=${today}&status=active`
      )

      if (response.ok) {
        const data = await response.json()
        setActiveEntries(data.data || [])
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
      <Card className={`transition-shadow hover:shadow-md ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`h-4 w-4 rounded-full ${employee.color}`} />
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base font-medium">
                {employee.firstName} {employee.lastName}
              </CardTitle>
              <Badge variant="secondary" className="mt-1 text-xs">
                {employee.role}
              </Badge>
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
              className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3"
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
            <div className="py-6 text-center text-gray-500">
              <Clock className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm">Aucun pointage actif</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              className="flex flex-1 items-center justify-center gap-2"
              onClick={() => handleClockAction('clock-in')}
              disabled={!canClockIn}
              variant={canClockIn ? 'default' : 'outline'}
            >
              <Play className="h-4 w-4" />
              Pointer
            </Button>
            <Button
              className="flex flex-1 items-center justify-center gap-2"
              onClick={() => handleClockAction('clock-out')}
              disabled={!hasActiveShift}
              variant={hasActiveShift ? 'destructive' : 'outline'}
            >
              <Square className="h-4 w-4" />
              Arrêter
            </Button>
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
