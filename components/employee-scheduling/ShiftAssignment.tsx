'use client'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Employee } from '@/hooks/useEmployees'
import { type Shift } from '@/hooks/useShifts'
import {
  AlertCircle,
  Calendar,
  Clock,
  Edit2,
  MapPin,
  Plus,
  Save,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import React, { useState } from 'react'

// Fonction utilitaire pour normaliser les dates et éviter les problèmes de fuseau horaire
const normalizeDate = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export interface ShiftAssignmentProps {
  employees: Employee[]
  selectedDate?: Date
  existingShift?: Shift | null
  onSave: (shift: {
    employeeId: string
    date: Date
    startTime: string
    endTime: string
    type: 'morning' | 'afternoon' | 'evening' | 'night'
    location?: string
  }) => void
  onUpdate: (shiftId: string, shift: Partial<Shift>) => void
  onDelete: (shiftId: string) => void
  onClose: () => void
  open: boolean
  className?: string
}

interface ShiftTypeConfig {
  label: string
  defaultStart: string
  defaultEnd: string
  color: string
  icon: string
}

const DEFAULT_SHIFT_TYPES: Record<string, ShiftTypeConfig> = {
  morning: {
    label: 'Morning',
    defaultStart: '09:30',
    defaultEnd: '14:30',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '🌅',
  },
  afternoon: {
    label: 'Afternoon',
    defaultStart: '12:00',
    defaultEnd: '18:00',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '☀️',
  },
  evening: {
    label: 'Evening',
    defaultStart: '18:00',
    defaultEnd: '22:00',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '🌆',
  },
  night: {
    label: 'Night',
    defaultStart: '22:00',
    defaultEnd: '06:00',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '🌙',
  },
}

const LOCATIONS = [
  'Reception',
  'Main Floor',
  'Meeting Rooms',
  'Kitchen Area',
  'Security Desk',
  'Maintenance Room',
  'Parking Area',
  'Rooftop Terrace',
]

export default function ShiftAssignment({
  employees,
  selectedDate = new Date(),
  existingShift = null,
  onSave,
  onUpdate,
  onDelete,
  onClose,
  open,
  className = '',
}: ShiftAssignmentProps) {
  // État pour l'employé sélectionné de façon persistante
  const [persistentEmployeeId, setPersistentEmployeeId] = useState<string>(
    () => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('lastSelectedEmployeeId') || ''
      }
      return ''
    }
  )

  const [formData, setFormData] = useState({
    employeeId: existingShift?.employeeId || persistentEmployeeId || '',
    date: normalizeDate(existingShift?.date || selectedDate),
    startTime: existingShift?.startTime || '09:00',
    endTime: existingShift?.endTime || '17:00',
    type: existingShift?.type || ('morning' as const),
    location: existingShift?.location || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [shiftTypes, setShiftTypes] =
    useState<Record<string, ShiftTypeConfig>>(DEFAULT_SHIFT_TYPES)
  const [editingShiftType, setEditingShiftType] = useState<string | null>(null)
  const [newShiftType, setNewShiftType] = useState<ShiftTypeConfig>({
    label: '',
    defaultStart: '09:00',
    defaultEnd: '17:00',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '⚡',
  })

  const isEditing = !!existingShift

  // Reset form when dialog opens/closes or shift changes
  React.useEffect(() => {
    if (open) {
      // Pour les nouveaux shifts, utiliser l'employé persistant ; pour l'édition, utiliser l'employé du shift existant
      const defaultEmployeeId =
        existingShift?.employeeId || persistentEmployeeId || ''

      setFormData({
        employeeId: defaultEmployeeId,
        date: normalizeDate(existingShift?.date || selectedDate),
        startTime: existingShift?.startTime || '09:00',
        endTime: existingShift?.endTime || '17:00',
        type: existingShift?.type || ('morning' as const),
        location: existingShift?.location || '',
      })
      setErrors({})
    }
  }, [open, existingShift, selectedDate, persistentEmployeeId])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee'
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required'
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required'
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01 ${formData.startTime}`)
      const end = new Date(`2000-01-01 ${formData.endTime}`)

      // Handle overnight shifts
      if (formData.type === 'night' && end < start) {
        end.setDate(end.getDate() + 1)
      }

      if (end <= start && formData.type !== 'night') {
        newErrors.endTime = 'End time must be after start time'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleShiftTypeChange = (type: string) => {
    const shiftType = shiftTypes[type]
    const newFormData = {
      ...formData,
      type: type as any,
      startTime: shiftType.defaultStart,
      endTime: shiftType.defaultEnd,
    }

    setFormData(newFormData)

    // Auto-validation si un employé est sélectionné
    if (newFormData.employeeId && newFormData.employeeId.trim() !== '') {
      // Valider et soumettre avec les nouvelles données
      setTimeout(() => {
        handleSubmitWithData(newFormData)
      }, 100)
    }
  }

  const handleSubmitWithData = async (dataToSubmit = formData) => {
    // Validation avec les données fournies
    const newErrors: Record<string, string> = {}

    if (!dataToSubmit.employeeId) {
      newErrors.employeeId = 'Please select an employee'
    }

    if (!dataToSubmit.startTime) {
      newErrors.startTime = 'Start time is required'
    }

    if (!dataToSubmit.endTime) {
      newErrors.endTime = 'End time is required'
    }

    if (dataToSubmit.startTime && dataToSubmit.endTime) {
      const start = new Date(`2000-01-01 ${dataToSubmit.startTime}`)
      const end = new Date(`2000-01-01 ${dataToSubmit.endTime}`)

      // Handle overnight shifts
      if (dataToSubmit.type === 'night' && end < start) {
        end.setDate(end.getDate() + 1)
      }

      if (end <= start && dataToSubmit.type !== 'night') {
        newErrors.endTime = 'End time must be after start time'
      }
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const shiftData = {
        employeeId: dataToSubmit.employeeId,
        date: dataToSubmit.date,
        startTime: dataToSubmit.startTime,
        endTime: dataToSubmit.endTime,
        type: dataToSubmit.type,
        location: dataToSubmit.location,
      }

      if (isEditing && existingShift) {
        onUpdate(existingShift.id, shiftData)
      } else {
        onSave(shiftData)
      }

      onClose()
    } catch (error) {
      console.error('Error saving shift:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    await handleSubmitWithData(formData)
  }

  const handleDelete = () => {
    if (
      existingShift &&
      window.confirm('Are you sure you want to delete this shift?')
    ) {
      onDelete(existingShift.id)
      onClose()
    }
  }

  const getEmployee = (employeeId: string) => {
    return employees.find((emp) => emp.id === employeeId)
  }

  const selectedEmployee = getEmployee(formData.employeeId)

  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return ''

    const start = new Date(`2000-01-01 ${formData.startTime}`)
    let end = new Date(`2000-01-01 ${formData.endTime}`)

    // Handle overnight shifts
    if (formData.type === 'night' && end < start) {
      end.setDate(end.getDate() + 1)
    }

    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    return diffHours > 0 ? `${diffHours.toFixed(1)} hours` : ''
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <Edit2 className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            {isEditing ? 'Edit Shift' : 'Add New Shift'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Display */}
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="font-medium">
                  {formData.date.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'Europe/Paris',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Employee Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Employee *</Label>
              {persistentEmployeeId && !existingShift && (
                <span className="text-xs text-gray-500">
                  {
                    employees.find((emp) => emp.id === persistentEmployeeId)
                      ?.firstName
                  }{' '}
                  pré-sélectionné
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {employees.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => {
                    // Sauvegarder la sélection dans localStorage pour persistance
                    if (typeof window !== 'undefined') {
                      localStorage.setItem(
                        'lastSelectedEmployeeId',
                        employee.id
                      )
                    }
                    setPersistentEmployeeId(employee.id)
                    setFormData((prev) => ({
                      ...prev,
                      employeeId: employee.id,
                    }))
                  }}
                  className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                    formData.employeeId === employee.id
                      ? `${employee.color} border-blue-500 text-white shadow-lg ring-2 ring-blue-200`
                      : `${employee.color} border-gray-300 text-white opacity-40 hover:border-gray-400 hover:opacity-70`
                  }`}
                >
                  {employee.firstName}
                </button>
              ))}
            </div>
            {errors.employeeId && (
              <p className="flex items-center gap-1 text-sm text-red-500">
                <AlertCircle className="h-3 w-3" />
                {errors.employeeId}
              </p>
            )}
          </div>

          {/* Shift Type Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Shift Type</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>

            {showSettings && (
              <Card className="border-dashed border-gray-300 bg-gray-50">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Manage Shift Types</h4>
                    {Object.entries(shiftTypes).map(([key, shiftType]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded border bg-white p-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{shiftType.icon}</span>
                          <span className="text-sm font-medium">
                            {shiftType.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {shiftType.defaultStart} - {shiftType.defaultEnd}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingShiftType(key)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newTypes = { ...shiftTypes }
                              delete newTypes[key]
                              setShiftTypes(newTypes)
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingShiftType('new')}
                      className="flex w-full items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add New Shift Type
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(shiftTypes).map(([key, shift]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleShiftTypeChange(key)}
                  className={`rounded-lg border-2 p-3 text-left transition-all ${
                    formData.type === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } `}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-lg">{shift.icon}</span>
                    <span className="font-medium">{shift.label}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {shift.defaultStart} - {shift.defaultEnd}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <div className="relative">
                <Clock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                  className={`pl-9 ${errors.startTime ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.startTime && (
                <p className="text-sm text-red-500">{errors.startTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <div className="relative">
                <Clock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                  className={`pl-9 ${errors.endTime ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.endTime && (
                <p className="text-sm text-red-500">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Duration Display */}
          {calculateDuration() && (
            <div className="rounded-lg bg-blue-50 p-3">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Duration: {calculateDuration()}
                </span>
              </div>
            </div>
          )}

          {/* Location Selection */}
          {/* <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select
              value={formData.location}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, location: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a location (optional)">
                  {formData.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{formData.location}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((location) => (
                  <SelectItem key={location} value={location}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{location}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}

          {/* Shift Preview */}
          {selectedEmployee && (
            <Card className="border-2 border-dashed border-gray-200 bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-700">
                  Shift Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div
                  className={`rounded-lg p-3 ${shiftTypes[formData.type]?.color || 'border-gray-200 bg-gray-100 text-gray-800'}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <div
                        className={`h-full w-full ${selectedEmployee.color} flex items-center justify-center text-xs font-semibold text-white`}
                      >
                        {selectedEmployee.firstName.charAt(0)}
                        {selectedEmployee.lastName.charAt(0)}
                      </div>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {selectedEmployee.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span>{shiftTypes[formData.type]?.icon || '⚡'}</span>
                      <span className="font-medium">
                        {shiftTypes[formData.type]?.label || formData.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formData.startTime} - {formData.endTime}
                      </span>
                      {calculateDuration() && (
                        <span className="text-xs opacity-75">
                          ({calculateDuration()})
                        </span>
                      )}
                    </div>
                    {formData.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{formData.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          {isEditing && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex w-full items-center gap-2 sm:w-auto"
            >
              <Trash2 className="h-4 w-4" />
              Delete Shift
            </Button>
          )}

          <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex flex-1 items-center gap-2 sm:flex-none"
            >
              <Save className="h-4 w-4" />
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Update Shift'
                  : 'Add Shift'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Shift Type Editor Dialog */}
      <Dialog
        open={!!editingShiftType}
        onOpenChange={() => setEditingShiftType(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingShiftType === 'new'
                ? 'Add New Shift Type'
                : 'Edit Shift Type'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={
                  editingShiftType === 'new'
                    ? newShiftType.label
                    : shiftTypes[editingShiftType || '']?.label || ''
                }
                onChange={(e) => {
                  if (editingShiftType === 'new') {
                    setNewShiftType((prev) => ({
                      ...prev,
                      label: e.target.value,
                    }))
                  } else if (editingShiftType) {
                    setShiftTypes((prev) => ({
                      ...prev,
                      [editingShiftType]: {
                        ...prev[editingShiftType],
                        label: e.target.value,
                      },
                    }))
                  }
                }}
                placeholder="e.g., Morning, Custom Shift"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={
                    editingShiftType === 'new'
                      ? newShiftType.defaultStart
                      : shiftTypes[editingShiftType || '']?.defaultStart || ''
                  }
                  onChange={(e) => {
                    if (editingShiftType === 'new') {
                      setNewShiftType((prev) => ({
                        ...prev,
                        defaultStart: e.target.value,
                      }))
                    } else if (editingShiftType) {
                      setShiftTypes((prev) => ({
                        ...prev,
                        [editingShiftType]: {
                          ...prev[editingShiftType],
                          defaultStart: e.target.value,
                        },
                      }))
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={
                    editingShiftType === 'new'
                      ? newShiftType.defaultEnd
                      : shiftTypes[editingShiftType || '']?.defaultEnd || ''
                  }
                  onChange={(e) => {
                    if (editingShiftType === 'new') {
                      setNewShiftType((prev) => ({
                        ...prev,
                        defaultEnd: e.target.value,
                      }))
                    } else if (editingShiftType) {
                      setShiftTypes((prev) => ({
                        ...prev,
                        [editingShiftType]: {
                          ...prev[editingShiftType],
                          defaultEnd: e.target.value,
                        },
                      }))
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex gap-2">
                <Input
                  value={
                    editingShiftType === 'new'
                      ? newShiftType.icon
                      : shiftTypes[editingShiftType || '']?.icon || ''
                  }
                  onChange={(e) => {
                    if (editingShiftType === 'new') {
                      setNewShiftType((prev) => ({
                        ...prev,
                        icon: e.target.value,
                      }))
                    } else if (editingShiftType) {
                      setShiftTypes((prev) => ({
                        ...prev,
                        [editingShiftType]: {
                          ...prev[editingShiftType],
                          icon: e.target.value,
                        },
                      }))
                    }
                  }}
                  placeholder="🌅"
                  className="flex-1"
                />
                <div className="flex gap-1">
                  {['🌅', '☀️', '🌆', '🌙', '⚡', '💼', '🏢', '🔧'].map(
                    (emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="rounded px-2 py-1 text-lg hover:bg-gray-100"
                        onClick={() => {
                          if (editingShiftType === 'new') {
                            setNewShiftType((prev) => ({
                              ...prev,
                              icon: emoji,
                            }))
                          } else if (editingShiftType) {
                            setShiftTypes((prev) => ({
                              ...prev,
                              [editingShiftType]: {
                                ...prev[editingShiftType],
                                icon: emoji,
                              },
                            }))
                          }
                        }}
                      >
                        {emoji}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color Theme</Label>
              <Select
                value={
                  editingShiftType === 'new'
                    ? newShiftType.color
                    : shiftTypes[editingShiftType || '']?.color || ''
                }
                onValueChange={(value) => {
                  if (editingShiftType === 'new') {
                    setNewShiftType((prev) => ({ ...prev, color: value }))
                  } else if (editingShiftType) {
                    setShiftTypes((prev) => ({
                      ...prev,
                      [editingShiftType]: {
                        ...prev[editingShiftType],
                        color: value,
                      },
                    }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Yellow
                  </SelectItem>
                  <SelectItem value="bg-blue-100 text-blue-800 border-blue-200">
                    Blue
                  </SelectItem>
                  <SelectItem value="bg-green-100 text-green-800 border-green-200">
                    Green
                  </SelectItem>
                  <SelectItem value="bg-purple-100 text-purple-800 border-purple-200">
                    Purple
                  </SelectItem>
                  <SelectItem value="bg-pink-100 text-pink-800 border-pink-200">
                    Pink
                  </SelectItem>
                  <SelectItem value="bg-red-100 text-red-800 border-red-200">
                    Red
                  </SelectItem>
                  <SelectItem value="bg-gray-100 text-gray-800 border-gray-200">
                    Gray
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingShiftType(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingShiftType === 'new') {
                  if (newShiftType.label) {
                    const key = newShiftType.label
                      .toLowerCase()
                      .replace(/\s+/g, '_')
                    setShiftTypes((prev) => ({
                      ...prev,
                      [key]: newShiftType,
                    }))
                    setNewShiftType({
                      label: '',
                      defaultStart: '09:00',
                      defaultEnd: '17:00',
                      color: 'bg-gray-100 text-gray-800 border-gray-200',
                      icon: '⚡',
                    })
                  }
                }
                setEditingShiftType(null)
              }}
            >
              {editingShiftType === 'new' ? 'Add' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
