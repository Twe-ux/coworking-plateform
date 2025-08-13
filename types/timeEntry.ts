export interface TimeEntry {
  id: string
  employeeId: string
  employee?: {
    id: string
    firstName: string
    lastName: string
    fullName: string
    role: string
  }
  date: Date
  clockIn: Date
  clockOut?: Date | null
  shiftNumber: 1 | 2
  totalHours?: number
  status: 'active' | 'completed'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  currentDuration?: number
}

export interface ClockInRequest {
  employeeId: string
  pin: string
  clockIn?: Date
}

export interface ClockOutRequest {
  timeEntryId: string
  employeeId: string
  pin: string
  clockOut?: Date
}

export interface VerifyPinRequest {
  employeeId: string
  pin: string
}

export interface TimeEntryFilter {
  employeeId?: string
  startDate?: Date
  endDate?: Date
  status?: 'active' | 'completed'
  shiftNumber?: 1 | 2
  page?: number
  limit?: number
}

export interface TimeEntryUpdate {
  clockIn?: Date
  clockOut?: Date | null
  totalHours?: number
  status?: 'active' | 'completed'
}

export interface EmployeeTimeReport {
  employeeId: string
  employee: {
    firstName: string
    lastName: string
    fullName: string
    role: string
  }
  shifts: Array<{
    shiftNumber: 1 | 2
    clockIn: Date
    clockOut?: Date | null
    totalHours?: number
    status: 'active' | 'completed'
  }>
  totalHours: number
  activeShifts: number
}

export interface TimeTrackingStats {
  totalHours: number
  totalShifts: number
  averageHoursPerShift: number
  activeShifts: number
  completedShifts: number
}

export interface DailyTimeReport {
  date: Date
  employees: EmployeeTimeReport[]
  totalActiveShifts: number
  totalCompletedShifts: number
  totalHoursWorked: number
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  details?: string | string[]
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  message?: string
}

// Validation schemas
export interface TimeEntryValidation {
  employeeId: {
    required: true
    message: string
  }
  pin: {
    required: true
    pattern: string
    message: string
  }
  clockIn: {
    type: 'date'
    message: string
  }
  clockOut: {
    type: 'date'
    message: string
    validator?: (clockOut: Date, clockIn: Date) => boolean
  }
}

export type TimeEntryStatus = 'active' | 'completed'
export type ShiftNumber = 1 | 2

// Error types
export interface TimeEntryError {
  code: string
  message: string
  field?: string
}

export const TIME_ENTRY_ERRORS = {
  INVALID_PIN: 'INVALID_PIN',
  EMPLOYEE_NOT_FOUND: 'EMPLOYEE_NOT_FOUND',
  MAX_SHIFTS_EXCEEDED: 'MAX_SHIFTS_EXCEEDED',
  ALREADY_CLOCKED_IN: 'ALREADY_CLOCKED_IN',
  NOT_CLOCKED_IN: 'NOT_CLOCKED_IN',
  INVALID_TIME_RANGE: 'INVALID_TIME_RANGE',
  SHIFT_ALREADY_COMPLETED: 'SHIFT_ALREADY_COMPLETED',
  TIME_ENTRY_NOT_FOUND: 'TIME_ENTRY_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const

export type TimeEntryErrorCode = typeof TIME_ENTRY_ERRORS[keyof typeof TIME_ENTRY_ERRORS]