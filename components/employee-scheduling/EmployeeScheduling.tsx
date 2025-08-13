'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Employee } from '@/hooks/useEmployees'
import { type Shift } from '@/hooks/useShifts'
import { Calendar, ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

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
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  // Calendar calculations
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  )
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  )
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())

  const calendarDays = useMemo(() => {
    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      // 6 weeks
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [startDate])

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

  // Organiser les shifts par position d'employé pour une date donnée
  const getShiftsPositionedByEmployee = (date: Date) => {
    const daySchedules = getSchedulesForDate(date)
    
    // Créer un tableau avec une position pour chaque employé
    const positionedShifts = employees.map(employee => {
      const employeeShift = daySchedules.find(shift => shift.employeeId === employee.id)
      return {
        employee,
        shift: employeeShift || null
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
    
    schedules.forEach(shift => {
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
        shifts: shifts
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
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun créneau planifié</h3>
            <p className="text-gray-600">Vous n'avez aucun créneau de travail programmé pour les semaines à venir.</p>
          </div>
        </div>
      )
    }

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header Staff */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Planning</h1>
          <p className="mt-1 text-gray-600">Vos créneaux de travail par semaine</p>
        </div>

        {/* Semaines avec créneaux */}
        <div className="space-y-6">
          {weeksWithShifts.map((week, weekIndex) => {
            const daysInWeek = getDaysInWeek(week.weekStart)
            
            return (
              <Card key={weekIndex}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">
                    Semaine du {week.weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} 
                    {' '}au{' '}
                    {week.weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {/* En-têtes des jours */}
                    {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day, dayIndex) => (
                      <div key={dayIndex} className="text-center text-sm font-medium text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                    
                    {/* Jours de la semaine */}
                    {daysInWeek.map((day, dayIndex) => {
                      const positionedShifts = getShiftsPositionedByEmployee(day)
                      const isToday = day.toDateString() === new Date().toDateString()
                      
                      return (
                        <div key={dayIndex} className={`flex min-h-[120px] flex-col bg-white p-2 ${isToday ? 'ring-2 ring-blue-500 ring-inset' : 'border rounded-lg'}`}>
                          <div className={`mb-1 text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                            {day.getDate()}
                          </div>
                          <div className="flex-1 space-y-1 overflow-hidden">
                            {positionedShifts.map((positionedShift, employeeIndex) => {
                              const { employee, shift } = positionedShift
                              
                              // Si l'employé n'a pas de shift ce jour-là, on affiche une ligne vide pour maintenir la position
                              if (!shift) {
                                return (
                                  <div key={employee.id} className="h-4 text-xs">
                                    {/* Ligne vide pour maintenir la position */}
                                  </div>
                                )
                              }

                              return (
                                <div
                                  key={shift.id}
                                  className={`rounded px-2 py-1 text-xs text-white font-medium ${employee.color} flex justify-between items-center`}
                                  title={`${employee.firstName} - ${shift.startTime} à ${shift.endTime}`}
                                >
                                  <span className="truncate">{employee.firstName}</span>
                                  <span className="ml-1">{shift.startTime}-{shift.endTime}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
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
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Employee Scheduling
          </h1>
          <p className="mt-1 text-gray-600">
            Manage staff schedules and assignments
          </p>
        </div>

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

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Shift
              </Button>
            </div>
          </div>
        </CardHeader>

        {viewMode === 'calendar' && (
          <CardContent className="pt-0">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-gray-200">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="flex min-h-[40px] items-center justify-center bg-gray-50 p-2 text-center text-sm font-medium text-gray-600"
                >
                  {day}
                </div>
              ))}

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
                      {positionedShifts.map((positionedShift, employeeIndex) => {
                        const { employee, shift } = positionedShift
                        
                        // Si l'employé n'a pas de shift ce jour-là, on affiche une ligne vide pour maintenir la position
                        if (!shift) {
                          return (
                            <div key={employee.id} className="h-4 text-xs">
                              {/* Ligne vide pour maintenir la position */}
                            </div>
                          )
                        }

                        return (
                          <div
                            key={shift.id}
                            className={`rounded px-2 py-1 text-xs text-white font-medium ${employee.color} flex justify-between items-center`}
                            title={`${employee.firstName} - ${shift.startTime} à ${shift.endTime}`}
                          >
                            <span className="truncate">{employee.firstName}</span>
                            <span className="ml-1">{shift.startTime}-{shift.endTime}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
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
      </Card>

      {/* Legend */}
      {/* <LegendSchedule SHIFT_TYPES={SHIFT_TYPES} /> */}
    </div>
  )
}
