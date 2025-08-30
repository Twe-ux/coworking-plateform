'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Shift {
  id: string
  employeeId: string
  employee?: {
    id: string
    firstName: string
    lastName: string
    fullName: string
    role: string
    color: string
  }
  date: Date
  startTime: string
  endTime: string
  type: string
  location?: string
  notes?: string
  isActive: boolean
  timeRange: string
  createdAt: string
  updatedAt: string
}

interface UseShiftsOptions {
  employeeId?: string
  startDate?: string
  endDate?: string
  type?: string
  active?: boolean
}

export function useShifts(options: UseShiftsOptions = {}) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchShifts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Construire les paramètres de requête
      const params = new URLSearchParams()
      if (options.employeeId) params.append('employeeId', options.employeeId)
      if (options.startDate) params.append('startDate', options.startDate)
      if (options.endDate) params.append('endDate', options.endDate)
      if (options.type) params.append('type', options.type)
      if (options.active !== undefined)
        params.append('active', String(options.active))

      const response = await fetch(`/api/shifts?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        // Convertir les dates string en objets Date (les dates viennent maintenant en UTC pur)
        const shiftsWithDates = result.data.map((shift: any) => ({
          ...shift,
          date:
            typeof shift.date === 'string'
              ? new Date(shift.date) // Les dates sont maintenant stockées correctement en UTC
              : shift.date,
        }))
        
        // Debug pour créneaux mercredi après-midi
        const wednesdayAfternoonShifts = shiftsWithDates.filter((shift: any) => {
          const day = shift.date.getDay()
          const startTime = shift.startTime
          return day === 3 && startTime >= '14:30'
        })
        if (wednesdayAfternoonShifts.length > 0) {
          console.log('🔍 useShifts: Créneaux mercredi après-midi trouvés:', 
            wednesdayAfternoonShifts.map((s: any) => ({
              date: s.date.toDateString(),
              startTime: s.startTime,
              employeeId: s.employeeId
            })))
        }

        // Éviter les re-renders inutiles en comparant le contenu
        setShifts((prev) => {
          if (prev.length !== shiftsWithDates.length) return shiftsWithDates

          const hasChanges = shiftsWithDates.some((newShift: any, index: number) => {
            const oldShift = prev[index]
            return (
              !oldShift ||
              oldShift.id !== newShift.id ||
              oldShift.employeeId !== newShift.employeeId ||
              oldShift.date.getTime() !== newShift.date.getTime() ||
              oldShift.startTime !== newShift.startTime ||
              oldShift.endTime !== newShift.endTime
            )
          })

          return hasChanges ? shiftsWithDates : prev
        })
        setError(null)
      } else {
        setError(result.error || 'Erreur lors de la récupération des créneaux')
        setShifts([])
      }
    } catch (err) {
      console.error('Erreur useShifts:', err)
      setError('Erreur de connexion au serveur')
      setShifts([])
    } finally {
      setIsLoading(false)
    }
  }, [
    options.employeeId,
    options.startDate,
    options.endDate,
    options.type,
    options.active,
  ])

  useEffect(() => {
    fetchShifts()
  }, [fetchShifts])

  const createShift = useCallback(
    async (shiftData: {
      employeeId: string
      date: string | Date
      startTime: string
      endTime: string
      type: string
      location?: string
      notes?: string
    }) => {
      try {
        const response = await fetch('/api/shifts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...shiftData,
            date:
              typeof shiftData.date === 'string'
                ? shiftData.date
                : shiftData.date.toISOString().split('T')[0],
          }),
        })

        const result = await response.json()

        if (result.success) {
          // Ajouter le nouveau créneau à la liste locale
          const newShift = {
            ...result.data,
            date: new Date(result.data.date),
          }
          setShifts((prev) => [...prev, newShift])
          return { success: true, data: newShift }
        } else {
          return {
            success: false,
            error: result.error,
            details: result.details,
          }
        }
      } catch (error) {
        console.error('Erreur création créneau:', error)
        return { success: false, error: 'Erreur de connexion au serveur' }
      }
    },
    []
  )

  const updateShift = useCallback(
    async (
      id: string,
      updateData: Partial<
        Omit<Shift, 'id' | 'timeRange' | 'createdAt' | 'updatedAt' | 'employee'>
      >
    ) => {
      try {
        const response = await fetch(`/api/shifts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...updateData,
            date: updateData.date
              ? typeof updateData.date === 'string'
                ? updateData.date
                : updateData.date.toISOString().split('T')[0]
              : undefined,
          }),
        })

        const result = await response.json()

        if (result.success) {
          // Mettre à jour le créneau dans la liste locale
          const updatedShift = {
            ...result.data,
            date: new Date(result.data.date),
          }
          setShifts((prev) =>
            prev.map((shift) => (shift.id === id ? updatedShift : shift))
          )
          return { success: true, data: updatedShift }
        } else {
          return {
            success: false,
            error: result.error,
            details: result.details,
          }
        }
      } catch (error) {
        console.error('Erreur mise à jour créneau:', error)
        return { success: false, error: 'Erreur de connexion au serveur' }
      }
    },
    []
  )

  const deleteShift = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/shifts/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Supprimer complètement le créneau de la liste locale (au lieu de le marquer inactif)
        setShifts((prev) => prev.filter((shift) => shift.id !== id))
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Erreur suppression créneau:', error)
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  }, [])

  const getShiftById = useCallback(
    (id: string) => {
      return shifts.find((shift) => shift.id === id)
    },
    [shifts]
  )

  const getShiftsByDate = useCallback(
    (date: Date) => {
      return shifts.filter(
        (shift) =>
          shift.isActive && shift.date.toDateString() === date.toDateString()
      )
    },
    [shifts]
  )

  const getShiftsByEmployee = useCallback(
    (employeeId: string) => {
      return shifts.filter(
        (shift) => shift.isActive && shift.employeeId === employeeId
      )
    },
    [shifts]
  )

  const getShiftsByDateRange = useCallback(
    (startDate: Date, endDate: Date) => {
      return shifts.filter(
        (shift) =>
          shift.isActive && shift.date >= startDate && shift.date <= endDate
      )
    },
    [shifts]
  )

  // Statistiques
  const statistics = {
    total: shifts.length,
    active: shifts.filter((shift) => shift.isActive).length,
    inactive: shifts.filter((shift) => !shift.isActive).length,
    byType: shifts.reduce(
      (acc, shift) => {
        if (shift.isActive) {
          acc[shift.type] = (acc[shift.type] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>
    ),
    totalHours: shifts.reduce((total, shift) => {
      if (!shift.isActive) return total

      const start = new Date(`2000-01-01 ${shift.startTime}`)
      let end = new Date(`2000-01-01 ${shift.endTime}`)

      if (end <= start) {
        end.setDate(end.getDate() + 1)
      }

      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return total + hours
    }, 0),
  }

  return {
    shifts,
    isLoading,
    error,
    refreshShifts: fetchShifts,
    createShift,
    updateShift,
    deleteShift,
    getShiftById,
    getShiftsByDate,
    getShiftsByEmployee,
    getShiftsByDateRange,
    statistics,
  }
}
