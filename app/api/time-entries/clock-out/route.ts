import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Employee from '@/lib/models/employee'
import TimeEntry from '@/lib/models/timeEntry'
import type {
  ClockOutRequest,
  ApiResponse,
  TimeEntry as TimeEntryType,
} from '@/types/timeEntry'
import { TIME_ENTRY_ERRORS } from '@/types/timeEntry'

/**
 * POST /api/time-entries/clock-out - Terminer un shift actif
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ClockOutRequest

    // Validation des données d'entrée
    if (!body.employeeId || !body.pin) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'ID employé et PIN sont obligatoires',
          details: TIME_ENTRY_ERRORS.VALIDATION_ERROR,
        },
        { status: 400 }
      )
    }

    // Validation du format PIN
    if (!/^\d{4}$/.test(body.pin)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Le PIN doit être composé de 4 chiffres',
          details: TIME_ENTRY_ERRORS.INVALID_PIN,
        },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Vérifier l'employé et le PIN
    const employee = await Employee.findById(body.employeeId).select('+pin')

    if (!employee) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Employé introuvable',
          details: TIME_ENTRY_ERRORS.EMPLOYEE_NOT_FOUND,
        },
        { status: 404 }
      )
    }

    if (!employee.isActive) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Employé inactif',
          details: TIME_ENTRY_ERRORS.EMPLOYEE_NOT_FOUND,
        },
        { status: 403 }
      )
    }

    if (!employee.verifyPin(body.pin)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'PIN incorrect',
          details: TIME_ENTRY_ERRORS.INVALID_PIN,
        },
        { status: 401 }
      )
    }

    // Trouver le time entry à mettre à jour
    let timeEntry

    if (body.timeEntryId) {
      // Si un ID spécifique est fourni, l'utiliser
      timeEntry = await TimeEntry.findOne({
        _id: body.timeEntryId,
        employeeId: body.employeeId,
        status: 'active',
        isActive: true,
      }).populate('employeeId', 'firstName lastName role')
    } else {
      // Sinon, trouver le shift actif le plus récent
      timeEntry = await TimeEntry.findOne({
        employeeId: body.employeeId,
        status: 'active',
        isActive: true,
      })
        .sort({ clockIn: -1 })
        .populate('employeeId', 'firstName lastName role')
    }

    if (!timeEntry) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Aucun shift actif trouvé pour cet employé',
          details: TIME_ENTRY_ERRORS.NOT_CLOCKED_IN,
        },
        { status: 404 }
      )
    }

    // Vérifier que le shift n'est pas déjà terminé
    if (timeEntry.status === 'completed') {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Ce shift est déjà terminé',
          details: TIME_ENTRY_ERRORS.SHIFT_ALREADY_COMPLETED,
        },
        { status: 409 }
      )
    }

    // Définir l'heure de sortie avec timezone correct  
    const clockOutTime = body.clockOut ? new Date(body.clockOut) : new Date()
    // Utiliser directement l'heure locale du client (pas de conversion)
    const localClockOutTime = clockOutTime

    // Valider que l'heure de sortie est après l'heure d'entrée
    if (localClockOutTime <= timeEntry.clockIn) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "L'heure de sortie doit être postérieure à l'heure d'entrée",
          details: TIME_ENTRY_ERRORS.INVALID_TIME_RANGE,
        },
        { status: 400 }
      )
    }

    // Mettre à jour le time entry
    timeEntry.clockOut = localClockOutTime
    timeEntry.totalHours = timeEntry.calculateTotalHours()
    timeEntry.status = 'completed'

    await timeEntry.save()

    // Formater la réponse
    const populatedEmployee = timeEntry.employeeId as any
    const formattedTimeEntry: TimeEntryType = {
      id: timeEntry._id.toString(),
      employeeId: employee._id.toString(),
      employee: {
        id: populatedEmployee._id?.toString() || employee._id.toString(),
        firstName: populatedEmployee.firstName || employee.firstName,
        lastName: populatedEmployee.lastName || employee.lastName,
        fullName: populatedEmployee.fullName || employee.fullName,
        role: populatedEmployee.role || employee.role,
      },
      date: timeEntry.date,
      clockIn: timeEntry.clockIn,
      clockOut: timeEntry.clockOut,
      shiftNumber: timeEntry.shiftNumber,
      totalHours: timeEntry.totalHours,
      status: timeEntry.status,
      isActive: timeEntry.isActive,
      createdAt: timeEntry.createdAt,
      updatedAt: timeEntry.updatedAt,
    }

    return NextResponse.json<ApiResponse<TimeEntryType>>({
      success: true,
      data: formattedTimeEntry,
      message: `Shift ${timeEntry.shiftNumber} terminé avec succès. Durée: ${timeEntry.totalHours}h`,
    })
  } catch (error: any) {
    console.error('❌ Erreur API POST time-entries/clock-out:', error)

    // Gestion des erreurs spécifiques de MongoDB
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      )
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Données invalides',
          details: validationErrors,
        },
        { status: 400 }
      )
    }

    if (error.name === 'CastError' && error.path === '_id') {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Format d'ID invalide",
          details: TIME_ENTRY_ERRORS.TIME_ENTRY_NOT_FOUND,
        },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Erreur lors du pointage de sortie',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/time-entries/clock-out - Gestion CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
