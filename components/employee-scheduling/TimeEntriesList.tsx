'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Clock, Edit, Filter, User, Download } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { type Employee } from '@/hooks/useEmployees'

interface TimeEntry {
  id: string
  employeeId: string
  employee?: {
    id: string
    firstName: string
    lastName: string
    role: string
    color: string
  }
  date: Date
  clockIn: Date
  clockOut?: Date | null
  shiftNumber: 1 | 2
  totalHours?: number
  status: 'active' | 'completed'
}

interface TimeEntriesListProps {
  employees: Employee[]
  className?: string
}

export default function TimeEntriesList({
  employees,
  className = '',
}: TimeEntriesListProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    status: '',
  })

  const fetchTimeEntries = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.employeeId) params.append('employeeId', filters.employeeId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.status) params.append('status', filters.status)

      const response = await fetch(`/api/time-entries?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setTimeEntries(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching time entries:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTimeEntries()
  }, [fetchTimeEntries])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      employeeId: '',
      startDate: '',
      endDate: '',
      status: '',
    })
  }

  const formatHours = (hours?: number) => {
    if (!hours) return '--'

    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const getStatusBadge = (entry: TimeEntry) => {
    if (entry.status === 'active') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <div className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
          En cours
        </Badge>
      )
    }
    return <Badge variant="secondary">Terminé</Badge>
  }

  const getEmployee = (employeeId: string) => {
    return employees.find((emp) => emp.id === employeeId)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Historique des Pointages
          </h2>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="employee-select">Employé</Label>
              <Select
                value={filters.employeeId}
                onValueChange={(value) =>
                  handleFilterChange('employeeId', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les employés" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les employés</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${employee.color}`}
                        />
                        {employee.firstName} {employee.lastName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Date début</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange('startDate', e.target.value)
                }
              />
            </div>

            <div>
              <Label htmlFor="end-date">Date fin</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="status-select">Statut</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="active">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Effacer les filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="text-gray-600">Chargement des pointages...</p>
          </div>
        ) : timeEntries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Aucun pointage trouvé
              </h3>
              <p className="text-gray-600">
                Aucun pointage ne correspond aux critères sélectionnés.
              </p>
            </CardContent>
          </Card>
        ) : (
          timeEntries.map((entry) => {
            const employee = entry.employee || getEmployee(entry.employeeId)
            if (!employee) return null

            return (
              <Card
                key={entry.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-3 w-3 rounded-full ${employee.color}`}
                      />
                      <div>
                        <div className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(entry.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          Shift {entry.shiftNumber}
                        </div>
                        {getStatusBadge(entry)}
                      </div>

                      <div className="text-center">
                        <div className="text-sm font-medium">Début</div>
                        <div className="text-sm text-gray-600">
                          {new Date(entry.clockIn).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm font-medium">Fin</div>
                        <div className="text-sm text-gray-600">
                          {entry.clockOut
                            ? new Date(entry.clockOut).toLocaleTimeString(
                                'fr-FR',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )
                            : '--:--'}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm font-medium">Durée</div>
                        <div className="font-mono text-sm text-gray-600">
                          {formatHours(entry.totalHours)}
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Pagination placeholder */}
      {timeEntries.length > 0 && (
        <div className="mt-6 flex justify-center">
          <p className="text-sm text-gray-600">
            {timeEntries.length} pointage{timeEntries.length > 1 ? 's' : ''}{' '}
            affiché{timeEntries.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
