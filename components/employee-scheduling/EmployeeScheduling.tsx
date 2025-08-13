'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Employee } from '@/hooks/useEmployees'
import { type Shift } from '@/hooks/useShifts'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  Clock,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import EmployeeMonthlyCard from './EmployeeMonthlyCard'
import TimeTrackingCard from './TimeTrackingCard'
import TimeEntriesList from './TimeEntriesList'

// Types

export interface EmployeeSchedulingProps {
  className?: string
  employees?: Employee[]
  shifts?: Shift[]
  onAddShift?: (date: Date) => void
  readOnly?: boolean
  userRole?: string
}

// Default employees if none provided
const DEFAULT_EMPLOYEES: Employee[] = []

// Shift type configurations
const SHIFT_TYPES = {
  morning: {
    label: 'Morning',
    time: '08:00-12:00',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  afternoon: {
    label: 'Afternoon',
    time: '12:00-18:00',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  evening: {
    label: 'Evening',
    time: '18:00-22:00',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  night: {
    label: 'Night',
    time: '22:00-06:00',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
}

export default function EmployeeScheduling({
  className = '',
  employees: propEmployees = DEFAULT_EMPLOYEES,
  shifts: propShifts = [],
  onAddShift,
  readOnly = false,
  userRole = '',
}: EmployeeSchedulingProps) {
  // Utiliser les employés passés en props ou les employés par défaut
  const employees = propEmployees
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  )

  // Utiliser directement les shifts passés en props
  const schedules = propShifts
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'pointage'>(
    'calendar'
  )

  // Calendar calculations
  const firstDayOfMonth = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    [currentDate]
  )

  const lastDayOfMonth = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
    [currentDate]
  )

  const startDateMemo = useMemo(() => {
    const start = new Date(firstDayOfMonth)
    start.setDate(start.getDate() - firstDayOfMonth.getDay())
    return start
  }, [firstDayOfMonth])

  const calendarDays = useMemo(() => {
    const days = []
    const current = new Date(startDateMemo)

    for (let i = 0; i < 42; i++) {
      // 6 weeks
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [startDateMemo])

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    )
  }

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    )
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get schedules for a specific date
  const getSchedulesForDate = (date: Date): Shift[] => {
    return schedules.filter(
      (schedule) => schedule.date.toDateString() === date.toDateString()
    )
  }

  // Get employee by id
  const getEmployee = (employeeId: string): Employee | undefined => {
    return employees.find((emp) => emp.id === employeeId)
  }

  // Fonction pour déterminer si le créneau commence avant 14h30
  const isShiftBeforeCutoff = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startTimeInMinutes = hours * 60 + minutes
    const cutoffTime = 14 * 60 + 30 // 14h30 en minutes

    return startTimeInMinutes < cutoffTime
  }

  // Organiser les shifts d'un employé par créneaux matin/après-midi
  const organizeShiftsByTimeSlots = (shifts: Shift[]) => {
    return {
      morning: shifts.filter((shift) => isShiftBeforeCutoff(shift.startTime)),
      afternoon: shifts.filter(
        (shift) => !isShiftBeforeCutoff(shift.startTime)
      ),
    }
  }

  // Organiser les shifts par position d'employé pour une date donnée avec créneaux matin/après-midi
  const getShiftsPositionedByEmployee = (date: Date) => {
    const daySchedules = getSchedulesForDate(date)

    // Créer un tableau avec une position pour chaque employé
    const positionedShifts = employees.map((employee) => {
      const employeeShifts = daySchedules.filter(
        (shift) => shift.employeeId === employee.id
      )
      const organizedShifts = organizeShiftsByTimeSlots(employeeShifts)

      return {
        employee,
        shifts: employeeShifts,
        morningShifts: organizedShifts.morning,
        afternoonShifts: organizedShifts.afternoon,
      }
    })

    return positionedShifts
  }

  // Fonctions spécifiques pour la vue staff par semaines
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const getWeekEnd = (date: Date) => {
    const weekStart = getWeekStart(date)
    return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
  }

  const getWeeksWithShifts = () => {
    const today = new Date()
    const currentWeekStart = getWeekStart(today)

    // Grouper les shifts par semaine
    const shiftsByWeek = new Map()

    schedules.forEach((shift) => {
      const shiftWeekStart = getWeekStart(shift.date)
      const weekKey = shiftWeekStart.getTime()

      // Seulement les semaines actuelles et futures
      if (shiftWeekStart >= currentWeekStart) {
        if (!shiftsByWeek.has(weekKey)) {
          shiftsByWeek.set(weekKey, [])
        }
        shiftsByWeek.get(weekKey).push(shift)
      }
    })

    // Convertir en tableau et trier par date
    return Array.from(shiftsByWeek.entries())
      .map(([weekStartTime, shifts]) => ({
        weekStart: new Date(weekStartTime),
        weekEnd: getWeekEnd(new Date(weekStartTime)),
        shifts: shifts,
      }))
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
  }

  const getDaysInWeek = (weekStart: Date) => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Calculer les heures totales d'un employé pour une semaine donnée
  const calculateWeeklyHours = (
    employeeId: string,
    weekStart: Date,
    weekEnd: Date
  ) => {
    const employeeShifts = schedules.filter(
      (shift) =>
        shift.employeeId === employeeId &&
        shift.date >= weekStart &&
        shift.date <= weekEnd
    )

    return employeeShifts.reduce((totalHours, shift) => {
      const start = new Date(`2000-01-01 ${shift.startTime}`)
      let end = new Date(`2000-01-01 ${shift.endTime}`)

      // Gérer les shifts de nuit qui se terminent le jour suivant
      if (shift.type === 'night' && end <= start) {
        end.setDate(end.getDate() + 1)
      }

      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return totalHours + Math.max(0, hours)
    }, 0)
  }

  // Convertir les heures décimales en format HH:MM
  const formatHoursToHHMM = (decimalHours: number) => {
    if (decimalHours <= 0) return ''

    const hours = Math.floor(decimalHours)
    const minutes = Math.round((decimalHours - hours) * 60)

    // Gérer le cas où les minutes arrondies atteignent 60
    if (minutes === 60) {
      return `${String(hours + 1).padStart(2, '0')}:00`
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  // Vue spéciale pour le staff - uniquement les semaines avec shifts
  if (userRole === 'staff') {
    const weeksWithShifts = getWeeksWithShifts()

    if (weeksWithShifts.length === 0) {
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="py-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Aucun créneau planifié
            </h3>
            <p className="text-gray-600">
              Vous n&apos;avez aucun créneau de travail programmé pour les
              semaines à venir.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header Staff */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Planning</h1>
          <p className="mt-1 text-gray-600">
            Vos créneaux de travail par semaine
          </p>
        </div>

        {/* Semaines avec créneaux */}
        <div className="space-y-3">
          {weeksWithShifts.map((week, weekIndex) => {
            const daysInWeek = getDaysInWeek(week.weekStart)

            return (
              <Card key={weekIndex}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">
                    Semaine du{' '}
                    {week.weekStart.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    au{' '}
                    {week.weekEnd.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {/* Colonne Staff séparée */}
                    <div className="w-32 flex-shrink-0">
                      {/* En-tête Staff */}
                      <div className="flex min-h-[40px] items-center justify-center rounded-t-lg border border-gray-400 bg-gray-50 p-2 text-center text-sm font-medium text-gray-600">
                        Staff
                      </div>

                      {/* Case Staff pour la semaine */}
                      <div className="flex min-h-[120px] flex-col rounded-b-lg border-r border-b border-l border-gray-400 bg-gray-50 p-2">
                        <div className="h-6"></div>
                        <div className="flex-1 space-y-1 overflow-hidden">
                          {employees.map((employee, employeeIndex) => {
                            const weeklyHours = calculateWeeklyHours(
                              employee.id,
                              week.weekStart,
                              week.weekEnd
                            )

                            return (
                              <div
                                key={employee.id}
                                className={`rounded text-xs font-medium text-white ${employee.color} flex h-5 items-center justify-between px-1`}
                              >
                                <span className="flex-1 truncate">
                                  {employee.firstName}
                                </span>
                                <span className="ml-1 text-xs opacity-90">
                                  {formatHoursToHHMM(weeklyHours)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Calendrier principal */}
                    <div className="flex-1 rounded-lg border border-gray-400">
                      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-gray-400">
                        {/* En-têtes des jours */}
                        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(
                          (day, dayIndex) => (
                            <div
                              key={dayIndex}
                              className="flex min-h-[40px] items-center justify-center bg-gray-50 p-2 text-center text-sm font-medium text-gray-600"
                            >
                              {day}
                            </div>
                          )
                        )}

                        {/* Jours de la semaine */}
                        {daysInWeek.map((day, dayIndex) => {
                          const positionedShifts =
                            getShiftsPositionedByEmployee(day)
                          const isToday =
                            day.toDateString() === new Date().toDateString()

                          return (
                            <div
                              key={dayIndex}
                              className={`flex min-h-[120px] flex-col bg-white p-2 ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''} cursor-pointer transition-colors hover:bg-gray-50`}
                            >
                              <div
                                className={`mb-1 text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}
                              >
                                {day.getDate()}
                              </div>
                              <div className="flex-1 space-y-1 overflow-hidden">
                                {employees.map((employee) => {
                                  // Trouver les shifts de cet employé pour cette date
                                  const employeeShifts = positionedShifts.find(
                                    (ps) => ps.employee.id === employee.id
                                  )
                                  const morningShifts = employeeShifts
                                    ? employeeShifts.morningShifts
                                    : []
                                  const afternoonShifts = employeeShifts
                                    ? employeeShifts.afternoonShifts
                                    : []

                                  return (
                                    <div
                                      key={employee.id}
                                      className="grid min-h-4 grid-cols-2 gap-2"
                                    >
                                      {/* Colonne matin (avant 14h30) */}
                                      <div className="space-y-1 text-center">
                                        {morningShifts.length > 0 ? (
                                          morningShifts.map((shift) => (
                                            <div
                                              key={shift.id}
                                              className={`rounded px-1 py-0.5 text-xs font-medium text-white ${employee.color}`}
                                              title={`${employee.firstName} - ${shift.startTime} à ${shift.endTime}`}
                                            >
                                              {shift.startTime}-{shift.endTime}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="h-5 py-0.5"></div>
                                        )}
                                      </div>

                                      {/* Colonne après-midi (après 14h30) */}
                                      <div className="space-y-1 text-center">
                                        {afternoonShifts.length > 0 ? (
                                          afternoonShifts.map((shift) => (
                                            <div
                                              key={shift.id}
                                              className={`rounded px-1 py-0.5 text-xs font-medium text-white ${employee.color}`}
                                              title={`${employee.firstName} - ${shift.startTime} à ${shift.endTime}`}
                                            >
                                              {shift.startTime}-{shift.endTime}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="h-5 py-0.5"></div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // Vue normale pour admin et manager
  return (
    <div className={`space-y-1 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* <div>
          <h1 className="text-2xl font-bold text-gray-900">
            PLanning des Employés
          </h1>
          <p className="mt-1 text-gray-600">
            Gérer les plannings et les affectations du personnel
          </p>
        </div> */}

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </Button>
          <Button
            variant={viewMode === 'pointage' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('pointage')}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Pointage</span>
          </Button>
        </div>
      </div>

      {/* Navigation Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-9 w-9 p-0"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h2 className="min-w-[180px] text-center text-lg font-semibold">
                {formatMonth(currentDate)}
              </h2>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-9 w-9 p-0"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Shift
              </Button>
            </div> */}
          </div>
        </CardHeader>

        {viewMode === 'calendar' && (
          <CardContent className="pt-0">
            <div className="flex gap-4">
              {/* Colonne Staff séparée */}
              <div className="w-32 flex-shrink-0">
                {/* En-tête Staff */}
                <div className="flex min-h-[40px] items-center justify-center rounded-t-lg border border-gray-400 bg-gray-50 p-2 text-center text-sm font-medium text-gray-600">
                  Staff
                </div>

                {/* Cases Staff par semaine */}
                {Array.from(
                  { length: Math.ceil(calendarDays.length / 7) },
                  (_, weekIndex) => {
                    const weekStart = weekIndex * 7
                    const weekDays = calendarDays.slice(
                      weekStart,
                      weekStart + 7
                    )

                    // Calculer les dates de début et fin de la semaine pour le calcul des heures
                    const weekStartDate = weekDays[0]
                    const weekEndDate = weekDays[6]

                    return (
                      <div
                        key={weekIndex}
                        className="flex min-h-[120px] flex-col border-r border-b border-l border-gray-400 bg-gray-50 p-2"
                      >
                        <div className="h-6"></div>
                        <div className="flex-1 space-y-1 overflow-hidden">
                          {employees.map((employee, employeeIndex) => {
                            const weeklyHours = calculateWeeklyHours(
                              employee.id,
                              weekStartDate,
                              weekEndDate
                            )

                            return (
                              <div
                                key={employee.id}
                                className={`rounded text-xs font-medium text-white ${employee.color} flex h-5 items-center justify-between px-1`}
                              >
                                <span className="flex-1 truncate">
                                  {employee.firstName}
                                </span>
                                <span className="ml-1 text-xs opacity-90">
                                  {formatHoursToHHMM(weeklyHours)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  }
                )}
              </div>

              {/* Calendrier principal */}
              <div className="flex-1 rounded-lg border border-gray-400">
                <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-gray-400">
                  {/* Day Headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                    (day) => (
                      <div
                        key={day}
                        className="flex min-h-[40px] items-center justify-center bg-gray-50 p-2 text-center text-sm font-medium text-gray-600"
                      >
                        {day}
                      </div>
                    )
                  )}

                  {/* Calendar Days */}
                  {calendarDays.map((date, index) => {
                    const positionedShifts = getShiftsPositionedByEmployee(date)
                    const isCurrentMonthDay = isCurrentMonth(date)
                    const isTodayDay = isToday(date)

                    return (
                      <div
                        key={index}
                        className={`flex min-h-[120px] flex-col bg-white p-2 ${!isCurrentMonthDay ? 'bg-gray-50 text-gray-400' : ''} ${isTodayDay ? 'ring-2 ring-blue-500 ring-inset' : ''} cursor-pointer transition-colors hover:bg-gray-50`}
                        onClick={() => {
                          if (onAddShift && !readOnly) {
                            onAddShift(date)
                          }
                        }}
                      >
                        <div
                          className={`mb-1 text-sm font-medium ${isTodayDay ? 'text-blue-600' : ''}`}
                        >
                          {date.getDate()}
                        </div>

                        <div className="flex-1 space-y-1 overflow-hidden">
                          {employees.map((employee) => {
                            // Trouver les shifts de cet employé pour cette date
                            const employeeShifts = positionedShifts.find(
                              (ps) => ps.employee.id === employee.id
                            )
                            const morningShifts = employeeShifts
                              ? employeeShifts.morningShifts
                              : []
                            const afternoonShifts = employeeShifts
                              ? employeeShifts.afternoonShifts
                              : []

                            return (
                              <div
                                key={employee.id}
                                className="grid min-h-4 grid-cols-2 gap-2"
                              >
                                {/* Colonne matin (avant 14h30) */}
                                <div className="space-y-1 text-center">
                                  {morningShifts.length > 0 ? (
                                    morningShifts.map((shift) => (
                                      <div
                                        key={shift.id}
                                        className={`rounded px-1 py-0.5 text-xs font-medium text-white ${employee.color}`}
                                        title={`${employee.firstName} - ${shift.startTime} à ${shift.endTime}`}
                                      >
                                        {shift.startTime}-{shift.endTime}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="h-5 py-0.5"></div>
                                  )}
                                </div>

                                {/* Colonne après-midi (après 14h30) */}
                                <div className="space-y-1 text-center">
                                  {afternoonShifts.length > 0 ? (
                                    afternoonShifts.map((shift) => (
                                      <div
                                        key={shift.id}
                                        className={`rounded px-1 py-0.5 text-xs font-medium text-white ${employee.color}`}
                                        title={`${employee.firstName} - ${shift.startTime} à ${shift.endTime}`}
                                      >
                                        {shift.startTime}-{shift.endTime}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="h-5 py-0.5"></div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {viewMode === 'list' && (
          <CardContent className="pt-0">
            {/* Employee List View */}
            <div className="space-y-4">
              {employees.map((employee) => {
                const employeeShifts = schedules.filter(
                  (s) => s.employeeId === employee.id
                )

                return (
                  <Card key={employee.id} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-4 w-4 rounded-full ${employee.color}`}
                        />
                        <div>
                          <CardTitle className="text-lg">
                            {employee.firstName} {employee.lastName}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {employee.role}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {employeeShifts.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {employeeShifts.map((shift) => {
                            const shiftType = SHIFT_TYPES[shift.type]

                            return (
                              <div
                                key={shift.id}
                                className={`rounded-lg border p-3 ${shiftType.color}`}
                              >
                                <div className="text-sm font-medium">
                                  {shift.date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </div>
                                <div className="text-sm opacity-75">
                                  {shiftType.label} ({shiftType.time})
                                </div>
                                {shift.location && (
                                  <div className="mt-1 text-xs opacity-60">
                                    📍 {shift.location}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No shifts scheduled for this month
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        )}

        {viewMode === 'pointage' && (
          <CardContent className="pt-0">
            {/* Time Tracking View */}
            <div className="space-y-6">
              {/* Time Tracking Cards */}
              <div>
                <h3 className="mb-4 text-lg font-medium">
                  Pointage des Employés
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {employees.map((employee) => (
                    <TimeTrackingCard
                      key={employee.id}
                      employee={employee}
                      onStatusChange={() => {
                        // Refresh data when status changes
                        // This could trigger a re-fetch of time entries
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Time Entries List */}
              <div>
                <TimeEntriesList employees={employees} />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Employee Monthly Statistics Cards - Only for admin/manager */}
      <EmployeeMonthlyCard
        employees={employees}
        shifts={schedules}
        currentDate={currentDate}
        className="mt-6"
      />

      {/* Legend */}
      {/* <LegendSchedule SHIFT_TYPES={SHIFT_TYPES} /> */}
    </div>
  )
}
