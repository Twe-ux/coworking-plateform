'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'

import EmployeeScheduling from '@/components/employee-scheduling/EmployeeScheduling'
import ShiftAssignment from '@/components/employee-scheduling/ShiftAssignment'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useEmployees, type Employee } from '@/hooks/useEmployees'
import { useShifts, type Shift } from '@/hooks/useShifts'
import { Calendar, Clock, Edit2, Plus, Trash2 } from 'lucide-react'
import HeaderSchedule from './HeaderSchedule'
import MainContentTabsSchedule from './MainContentTabsSchedule'
import StatisticsCardsSchedule from './StatisticsCardsSchedule'

// Note: Employees are now loaded dynamically from the API

// Note: Shifts are now loaded dynamically from the API

export default function SchedulePage() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role

  // Charger les employés et shifts depuis l'API
  const {
    employees,
    isLoading: employeesLoading,
    error: employeesError,
  } = useEmployees({ active: true })
  const {
    shifts,
    isLoading: shiftsLoading,
    error: shiftsError,
    createShift,
    updateShift,
    deleteShift,
  } = useShifts({ active: true })
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  )
  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [activeTab, setActiveTab] = useState('schedule')
  const [showDateChoiceModal, setShowDateChoiceModal] = useState(false)
  const [showDayShiftsModal, setShowDayShiftsModal] = useState(false)
  const [selectedDateShifts, setSelectedDateShifts] = useState<Shift[]>([])
  const [clickedDate, setClickedDate] = useState<Date | null>(null)

  // Définir les permissions selon le rôle
  const canManageEmployees = ['admin', 'manager'].includes(userRole)
  const canCreateShifts = ['admin', 'manager'].includes(userRole)
  const isStaff = userRole === 'staff'

  // Shift management functions
  const handleAddShift = async (shiftData: {
    employeeId: string
    date: Date
    startTime: string
    endTime: string
    type: string
    location?: string
  }) => {
    // Utiliser la date locale pour éviter les problèmes de fuseau horaire
    const localDate = new Date(
      shiftData.date.getFullYear(),
      shiftData.date.getMonth(),
      shiftData.date.getDate()
    )
    const result = await createShift({
      ...shiftData,
      date: localDate.toISOString().split('T')[0],
    })

    if (!result.success) {
      console.error('Erreur lors de la création du créneau:', result.error)
      // TODO: Afficher une notification d'erreur
    }
  }

  const handleUpdateShift = async (
    shiftId: string,
    updates: Partial<Shift>
  ) => {
    const result = await updateShift(shiftId, updates)

    if (!result.success) {
      console.error('Erreur lors de la mise à jour du créneau:', result.error)
      // TODO: Afficher une notification d'erreur
    }
  }

  const handleDeleteShift = async (shiftId: string) => {
    const result = await deleteShift(shiftId)

    if (result.success) {
      // Fermer les modals et rafraîchir
      setShowDayShiftsModal(false)
      setSelectedDateShifts([])
    } else {
      console.error('Erreur lors de la suppression du créneau:', result.error)
      // TODO: Afficher une notification d'erreur
    }
  }

  const openShiftModal = (date?: Date, shift?: Shift) => {
    if (shift) {
      // Si un shift spécifique est fourni, ouvrir directement le modal d'édition
      setSelectedDate(shift.date)
      setEditingShift(shift)
      setShiftModalOpen(true)
      return
    }

    if (date) {
      setClickedDate(date)
      setSelectedDate(date)

      // Vérifier s'il y a des shifts existants pour cette date
      const dayShifts = shifts.filter(
        (s) => s.date.toDateString() === date.toDateString()
      )

      if (dayShifts.length > 0) {
        // Il y a des shifts existants, ouvrir directement la fenêtre de gestion
        setSelectedDateShifts(dayShifts)
        setShowDayShiftsModal(true)
      } else {
        // Pas de shifts, ouvrir directement le modal de création
        setEditingShift(null)
        setShiftModalOpen(true)
      }
    }
  }

  const handleAddNewShift = () => {
    setShowDateChoiceModal(false)
    setEditingShift(null)
    setShiftModalOpen(true)
  }

  const handleViewDayShifts = () => {
    setShowDateChoiceModal(false)
    setShowDayShiftsModal(true)
  }

  const closeShiftModal = () => {
    setShiftModalOpen(false)
    setEditingShift(null)
  }

  // Employee management functions
  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee)
    // Could open employee details modal or navigate to employee profile
    console.log('Selected employee:', employee)
  }

  const handleEmployeeEdit = (employee: Employee) => {
    // Could open employee edit modal
    console.log('Edit employee:', employee)
  }

  const handleAddEmployee = () => {
    // Could open add employee modal
    console.log('Add new employee')
  }

  // Statistics calculations
  const totalHoursThisWeek = shifts.reduce((total, shift) => {
    const start = new Date(`2000-01-01 ${shift.startTime}`)
    let end = new Date(`2000-01-01 ${shift.endTime}`)

    if (shift.type === 'night' && end < start) {
      end.setDate(end.getDate() + 1)
    }

    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return total + hours
  }, 0)

  const shiftsThisWeek = shifts.length
  const activeEmployees = employees.length
  const coveragePercentage = Math.round(
    (shiftsThisWeek / (activeEmployees * 5)) * 100
  ) // Assuming 5 working days

  // Gérer les états de chargement et d'erreur
  if (employeesLoading || shiftsLoading) {
    return (
      <div className="container space-y-6 p-2">
        <HeaderSchedule
          title={isStaff ? 'Mon Planning' : 'Staff Scheduling'}
          subtitle="Chargement..."
          showActions={false}
        />
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded bg-gray-200"></div>
          <div className="h-64 rounded bg-gray-200"></div>
        </div>
      </div>
    )
  }

  if (employeesError || shiftsError) {
    return (
      <div className="container space-y-6 p-2">
        <HeaderSchedule
          title={isStaff ? 'Mon Planning' : 'Staff Scheduling'}
          subtitle="Erreur de chargement"
          showActions={false}
        />
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <p className="font-medium">Erreur lors du chargement des données</p>
          {employeesError && (
            <p className="text-sm">Employés: {employeesError}</p>
          )}
          {shiftsError && <p className="text-sm">Créneaux: {shiftsError}</p>}
        </div>
      </div>
    )
  }

  // Interface simplifiée pour le staff - seulement le planning
  if (isStaff) {
    return (
      <div className="container space-y-6 p-2">
        {/* Page Header */}
        {/* <HeaderSchedule
          title="Mon Planning"
          subtitle="Consultez vos créneaux de travail"
          showActions={false}
        /> */}

        {/* Planning uniquement pour le staff */}
        <EmployeeScheduling
          employees={employees}
          shifts={shifts}
          onAddShift={canCreateShifts ? openShiftModal : undefined}
          readOnly={!canCreateShifts}
          userRole={userRole}
        />

        {/* Modal de consultation des créneaux (lecture seule pour le staff) */}
        {canCreateShifts && (
          <ShiftAssignment
            open={shiftModalOpen}
            onClose={closeShiftModal}
            employees={employees}
            selectedDate={selectedDate}
            existingShift={editingShift}
            onSave={handleAddShift}
            onUpdate={handleUpdateShift}
            onDelete={handleDeleteShift}
          />
        )}
      </div>
    )
  }

  // Interface complète pour admin et manager
  return (
    <div className="container space-y-6 p-2">
      {/* Page Header */}
      <HeaderSchedule />

      {/* Main Content Tabs */}
      <MainContentTabsSchedule
        employees={employees}
        shifts={shifts}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openShiftModal={openShiftModal}
        handleEmployeeSelect={handleEmployeeSelect}
        handleEmployeeEdit={handleEmployeeEdit}
        handleAddEmployee={handleAddEmployee}
        canManageEmployees={canManageEmployees}
        userRole={userRole}
      />

      {/* Statistics Cards */}
      <StatisticsCardsSchedule
        activeEmployees={activeEmployees}
        shiftsThisWeek={shiftsThisWeek}
        totalHoursThisWeek={totalHoursThisWeek}
        coveragePercentage={coveragePercentage}
      />

      {/* Shift Assignment Modal */}
      <ShiftAssignment
        open={shiftModalOpen}
        onClose={closeShiftModal}
        employees={employees}
        selectedDate={selectedDate}
        existingShift={editingShift}
        onSave={handleAddShift}
        onUpdate={handleUpdateShift}
        onDelete={handleDeleteShift}
      />

      {/* Quick Actions */}
      {/* {(canManageEmployees || canCreateShifts) && (
        <QuickActionsSchedule
          openShiftModal={openShiftModal}
          handleAddEmployee={handleAddEmployee}
          canManageEmployees={canManageEmployees}
          canCreateShifts={canCreateShifts}
        />
      )} */}

      {/* Date Choice Modal */}
      <Dialog open={showDateChoiceModal} onOpenChange={setShowDateChoiceModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {clickedDate?.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="mb-4 text-sm text-gray-600">
              Cette date contient déjà {selectedDateShifts.length} créneau
              {selectedDateShifts.length > 1 ? 'x' : ''}. Que souhaitez-vous
              faire ?
            </p>

            <div className="space-y-3">
              {selectedDateShifts.slice(0, 3).map((shift) => {
                const employee = employees.find(
                  (emp) => emp.id === shift.employeeId
                )
                return (
                  <div
                    key={shift.id}
                    className="flex items-center gap-2 rounded bg-gray-50 p-2 text-sm text-gray-700"
                  >
                    <Avatar className="h-6 w-6">
                      <div
                        className={`h-full w-full ${employee?.color} flex items-center justify-center text-xs font-semibold text-white`}
                      >
                        {employee?.firstName?.charAt(0)}
                        {employee?.lastName?.charAt(0)}
                      </div>
                    </Avatar>
                    <span>
                      {employee?.firstName} {employee?.lastName}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {shift.type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                )
              })}
              {selectedDateShifts.length > 3 && (
                <p className="text-xs text-gray-500">
                  ... et {selectedDateShifts.length - 3} autre
                  {selectedDateShifts.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleAddNewShift}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
            <Button
              onClick={handleViewDayShifts}
              className="flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day Shifts Management Modal */}
      <Dialog open={showDayShiftsModal} onOpenChange={setShowDayShiftsModal}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Gérer les créneaux -{' '}
              {clickedDate?.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedDateShifts.map((shift) => {
              const employee = employees.find(
                (emp) => emp.id === shift.employeeId
              )
              return (
                <Card key={shift.id} className="border border-gray-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <div
                            className={`h-full w-full ${employee?.color} flex items-center justify-center text-sm font-semibold text-white`}
                          >
                            {employee?.firstName?.charAt(0)}
                            {employee?.lastName?.charAt(0)}
                          </div>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {employee?.firstName} {employee?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee?.role}
                          </div>
                        </div>
                        <Badge variant="secondary">{shift.type}</Badge>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {shift.startTime} - {shift.endTime}
                        </div>
                        {shift.location && (
                          <span className="text-xs text-gray-500">
                            📍 {shift.location}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowDayShiftsModal(false)
                            openShiftModal(undefined, shift)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteShift(shift.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDayShiftsModal(false)}
            >
              Fermer
            </Button>
            <Button
              onClick={() => {
                setShowDayShiftsModal(false)
                handleAddNewShift()
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un créneau
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
