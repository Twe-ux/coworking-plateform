'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type Employee } from '@/hooks/useEmployees'
import { type Shift } from '@/hooks/useShifts'
import { Clock, User, Calendar, Target } from 'lucide-react'
import { useMemo } from 'react'

interface EmployeeMonthlyCardProps {
  employees: Employee[]
  shifts: Shift[]
  currentDate: Date // The month being displayed
  className?: string
}

export default function EmployeeMonthlyCard({
  employees,
  shifts,
  currentDate,
  className = '',
}: EmployeeMonthlyCardProps) {
  // Calculate first and last day of the current month
  const { firstDayOfMonth, lastDayOfMonth } = useMemo(() => {
    const firstDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    )
    const lastDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    )
    return { firstDayOfMonth: firstDay, lastDayOfMonth: lastDay }
  }, [currentDate])

  // Format hours from decimal to HH:MM
  const formatHoursToHHMM = (decimalHours: number): string => {
    if (decimalHours <= 0) return '0:00'

    const hours = Math.floor(decimalHours)
    const minutes = Math.round((decimalHours - hours) * 60)

    // Handle case where rounded minutes reach 60
    if (minutes === 60) {
      return `${String(hours + 1).padStart(2, '0')}:00`
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  // Calculate shift hours
  const calculateShiftHours = (shift: Shift): number => {
    const start = new Date(`2000-01-01 ${shift.startTime}`)
    let end = new Date(`2000-01-01 ${shift.endTime}`)

    // Handle night shifts that end the next day
    if (shift.type === 'night' && end <= start) {
      end.setDate(end.getDate() + 1)
    }

    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return Math.max(0, hours)
  }

  // Calculate monthly statistics for each employee
  const employeeMonthlyStats = useMemo(() => {
    return employees.map((employee) => {
      // Filter shifts for this employee within the current month
      const monthlyShifts = shifts.filter(
        (shift) =>
          shift.employeeId === employee.id &&
          shift.isActive &&
          shift.date >= firstDayOfMonth &&
          shift.date <= lastDayOfMonth
      )

      // Calculate planned hours (sum of all scheduled shift hours)
      const plannedHours = monthlyShifts.reduce((total, shift) => {
        return total + calculateShiftHours(shift)
      }, 0)

      // Placeholder for actual/clocked hours (to be implemented later)
      const actualHours = 0 // TODO: Implement actual clocked hours calculation

      // Calculate projected hours (actual + remaining planned)
      // For now, this equals planned hours since actual hours is 0
      const projectedHours = actualHours + plannedHours

      // Count shift days
      const shiftDays = new Set(
        monthlyShifts.map((shift) => shift.date.toDateString())
      ).size

      return {
        employee,
        plannedHours,
        actualHours,
        projectedHours,
        shiftDays,
        totalShifts: monthlyShifts.length,
      }
    })
  }, [employees, shifts, firstDayOfMonth, lastDayOfMonth])

  // Get color classes for different statistics
  const getHoursColorClass = (hours: number) => {
    if (hours >= 140) return 'text-red-600 bg-red-50 border-red-200'
    if (hours >= 100) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (hours >= 60) return 'text-green-600 bg-green-50 border-green-200'
    if (hours > 0) return 'text-blue-600 bg-blue-50 border-blue-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getShiftDaysColorClass = (days: number) => {
    if (days >= 20) return 'text-purple-600 bg-purple-50'
    if (days >= 15) return 'text-indigo-600 bg-indigo-50'
    if (days >= 10) return 'text-blue-600 bg-blue-50'
    if (days > 0) return 'text-green-600 bg-green-50'
    return 'text-gray-600 bg-gray-50'
  }

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          Monthly Statistics - {monthName}
        </h2>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employeeMonthlyStats.map(
          ({
            employee,
            plannedHours,
            actualHours,
            projectedHours,
            shiftDays,
            totalShifts,
          }) => (
            <Card
              key={employee.id}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${employee.color}`} />
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base font-medium">
                      {employee.firstName} {employee.lastName}
                    </CardTitle>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {employee.role}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Planned Hours */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Planned Hours
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`font-mono text-sm ${getHoursColorClass(plannedHours)}`}
                  >
                    {formatHoursToHHMM(plannedHours)}
                  </Badge>
                </div>

                {/* Projected Hours */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Projected Hours
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`font-mono text-sm ${getHoursColorClass(projectedHours)}`}
                  >
                    {formatHoursToHHMM(projectedHours)}
                  </Badge>
                </div>

                {/* Shift Days */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Shift Days
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getShiftDaysColorClass(shiftDays)}`}
                  >
                    {shiftDays} days
                  </Badge>
                </div>

                {/* Summary */}
                <div className="border-t border-gray-100 pt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Total Shifts:</span>
                    <span className="font-medium">{totalShifts}</span>
                  </div>
                  {actualHours === 0 && plannedHours > 0 && (
                    <div className="mt-1 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-600">
                      Clocked hours coming soon
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Empty State */}
      {employeeMonthlyStats.length === 0 && (
        <div className="py-8 text-center">
          <User className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No Employees Found
          </h3>
          <p className="text-gray-600">
            Add employees to see their monthly statistics.
          </p>
        </div>
      )}

      {/* Statistics Summary */}
      {employeeMonthlyStats.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {employeeMonthlyStats.length}
                </div>
                <div className="text-sm text-gray-600">Active Employees</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatHoursToHHMM(
                    employeeMonthlyStats.reduce(
                      (sum, stat) => sum + stat.plannedHours,
                      0
                    )
                  )}
                </div>
                <div className="text-sm text-gray-600">Total Planned Hours</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {employeeMonthlyStats.reduce(
                    (sum, stat) => sum + stat.totalShifts,
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600">Total Shifts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(
                    employeeMonthlyStats.reduce(
                      (sum, stat) => sum + stat.plannedHours,
                      0
                    ) / Math.max(employeeMonthlyStats.length, 1)
                  )}
                </div>
                <div className="text-sm text-gray-600">Avg Hours/Employee</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
