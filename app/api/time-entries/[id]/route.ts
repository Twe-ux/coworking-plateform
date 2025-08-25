import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import TimeEntry from '@/lib/models/timeEntry'
import type {
  TimeEntryUpdate,
  ApiResponse,
  TimeEntry as TimeEntryType,
} from '@/types/timeEntry'
import { TIME_ENTRY_ERRORS } from '@/types/timeEntry'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/time-entries/[id] - Récupérer un time entry spécifique
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id && process.env.NODE_ENV !== 'development') {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Non authentifié',
          details: TIME_ENTRY_ERRORS.UNAUTHORIZED,
        },
        { status: 401 }
      )
    }

    const userRole = (session?.user as any)?.role
    if (
      !['admin', 'manager', 'staff'].includes(userRole) &&
      process.env.NODE_ENV !== 'development'
    ) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Permissions insuffisantes',
          details: TIME_ENTRY_ERRORS.UNAUTHORIZED,
        },
        { status: 403 }
      )
    }

    await connectToDatabase()

    const timeEntry = await TimeEntry.findOne({
      _id: params.id,
      isActive: true,
    })
      .populate('employeeId', 'firstName lastName role color')
      .lean()

    if (!timeEntry) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Time entry introuvable',
          details: TIME_ENTRY_ERRORS.TIME_ENTRY_NOT_FOUND,
        },
        { status: 404 }
      )
    }

    // Formater la réponse
    const employee = (timeEntry as any).employeeId
    const formattedTimeEntry: TimeEntryType = {
      id: (timeEntry as any)._id.toString(),
      employeeId: employee._id
        ? employee._id.toString()
        : (timeEntry as any).employeeId.toString(),
      employee: employee
        ? {
            id: employee._id.toString(),
            firstName: employee.firstName,
            lastName: employee.lastName,
            fullName: `${employee.firstName} ${employee.lastName}`,
            role: employee.role,
          }
        : undefined,
      date: (timeEntry as any).date,
      clockIn: (timeEntry as any).clockIn,
      clockOut: (timeEntry as any).clockOut,
      shiftNumber: (timeEntry as any).shiftNumber,
      totalHours: (timeEntry as any).totalHours,
      status: (timeEntry as any).status,
      isActive: (timeEntry as any).isActive,
      createdAt: (timeEntry as any).createdAt,
      updatedAt: (timeEntry as any).updatedAt,
      currentDuration:
        !(timeEntry as any).clockOut && (timeEntry as any).status === 'active'
          ? Math.max(
              0,
              (new Date().getTime() - new Date((timeEntry as any).clockIn).getTime()) /
                (1000 * 60 * 60)
            )
          : (timeEntry as any).totalHours || 0,
    }

    return NextResponse.json<ApiResponse<TimeEntryType>>({
      success: true,
      data: formattedTimeEntry,
    })
  } catch (error: any) {
    console.error('❌ Erreur API GET time-entries/[id]:', error)

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
        error: 'Erreur lors de la récupération du time entry',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/time-entries/[id] - Modifier un time entry (admin/manager uniquement)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Non authentifié',
          details: TIME_ENTRY_ERRORS.UNAUTHORIZED,
        },
        { status: 401 }
      )
    }

    // Vérification des permissions (admin ou manager uniquement)
    const userRole = (session?.user as any)?.role
    if (
      !['admin', 'manager'].includes(userRole) &&
      process.env.NODE_ENV !== 'development'
    ) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error:
            'Seuls les administrateurs et managers peuvent modifier les time entries',
          details: TIME_ENTRY_ERRORS.UNAUTHORIZED,
        },
        { status: 403 }
      )
    }

    const updates = (await request.json()) as TimeEntryUpdate

    await connectToDatabase()

    // Trouver le time entry à modifier
    const timeEntry = await TimeEntry.findOne({
      _id: params.id,
      isActive: true,
    })

    if (!timeEntry) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Time entry introuvable',
          details: TIME_ENTRY_ERRORS.TIME_ENTRY_NOT_FOUND,
        },
        { status: 404 }
      )
    }

    // Appliquer les modifications
    const allowedUpdates = [
      'clockIn',
      'clockOut',
      'totalHours',
      'status',
      'date',
    ]
    const actualUpdates: any = {}

    for (const key of allowedUpdates) {
      if (
        key in updates &&
        updates[key as keyof TimeEntryUpdate] !== undefined
      ) {
        actualUpdates[key] = updates[key as keyof TimeEntryUpdate]
      }
    }

    // Validation spéciale pour les dates
    if (actualUpdates.date) {
      actualUpdates.date = new Date(actualUpdates.date)
    }

    if (actualUpdates.clockIn) {
      actualUpdates.clockIn = new Date(actualUpdates.clockIn)
    }

    if (actualUpdates.clockOut === null) {
      // Permettre de définir clockOut à null
      actualUpdates.clockOut = null
      actualUpdates.status = 'active'
      actualUpdates.totalHours = undefined
    } else if (actualUpdates.clockOut) {
      actualUpdates.clockOut = new Date(actualUpdates.clockOut)
    }

    // Validation: clockOut doit être après clockIn
    const finalClockIn = actualUpdates.clockIn || (timeEntry as any).clockIn
    const finalClockOut =
      actualUpdates.clockOut !== undefined
        ? actualUpdates.clockOut
        : (timeEntry as any).clockOut

    if (finalClockOut && finalClockOut <= finalClockIn) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "L'heure de sortie doit être postérieure à l'heure d'entrée",
          details: TIME_ENTRY_ERRORS.INVALID_TIME_RANGE,
        },
        { status: 400 }
      )
    }

    // Appliquer les modifications
    Object.assign(timeEntry, actualUpdates)

    // Recalculer les heures si nécessaire
    if (
      (timeEntry as any).clockOut &&
      (!actualUpdates.totalHours || actualUpdates.totalHours === undefined)
    ) {
      (timeEntry as any).totalHours = timeEntry.calculateTotalHours()
    }

    // Mettre à jour le statut automatiquement
    if ((timeEntry as any).clockOut && (timeEntry as any).status === 'active') {
      (timeEntry as any).status = 'completed'
    } else if (!(timeEntry as any).clockOut && (timeEntry as any).status === 'completed') {
      (timeEntry as any).status = 'active'
    }

    await timeEntry.save()

    // Populer les données de l'employé pour la réponse
    await timeEntry.populate('employeeId', 'firstName lastName role')

    // Formater la réponse
    const employee = (timeEntry as any).employeeId
    const formattedTimeEntry: TimeEntryType = {
      id: (timeEntry as any)._id.toString(),
      employeeId: (timeEntry as any).employeeId.toString(),
      employee: employee
        ? {
            id: employee._id.toString(),
            firstName: employee.firstName,
            lastName: employee.lastName,
            fullName: `${employee.firstName} ${employee.lastName}`,
            role: employee.role,
          }
        : undefined,
      date: (timeEntry as any).date,
      clockIn: (timeEntry as any).clockIn,
      clockOut: (timeEntry as any).clockOut,
      shiftNumber: (timeEntry as any).shiftNumber,
      totalHours: (timeEntry as any).totalHours,
      status: (timeEntry as any).status,
      isActive: (timeEntry as any).isActive,
      createdAt: (timeEntry as any).createdAt,
      updatedAt: (timeEntry as any).updatedAt,
    }

    return NextResponse.json<ApiResponse<TimeEntryType>>({
      success: true,
      data: formattedTimeEntry,
      message: 'Time entry modifié avec succès',
    })
  } catch (error: any) {
    console.error('❌ Erreur API PUT time-entries/[id]:', error)

    // Gestion des erreurs de validation Mongoose
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
        error: 'Erreur lors de la modification du time entry',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/time-entries/[id] - Supprimer (désactiver) un time entry
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Non authentifié',
          details: TIME_ENTRY_ERRORS.UNAUTHORIZED,
        },
        { status: 401 }
      )
    }

    // Seuls les admins peuvent supprimer
    const userRole = (session?.user as any)?.role
    if (userRole !== 'admin' && process.env.NODE_ENV !== 'development') {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Seuls les administrateurs peuvent supprimer les time entries',
          details: TIME_ENTRY_ERRORS.UNAUTHORIZED,
        },
        { status: 403 }
      )
    }

    await connectToDatabase()

    const timeEntry = await TimeEntry.findOne({
      _id: params.id,
      isActive: true,
    })

    if (!timeEntry) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Time entry introuvable',
          details: TIME_ENTRY_ERRORS.TIME_ENTRY_NOT_FOUND,
        },
        { status: 404 }
      )
    }

    // Soft delete - désactiver au lieu de supprimer
    (timeEntry as any).isActive = false
    await timeEntry.save()

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: 'Time entry supprimé avec succès',
    })
  } catch (error: any) {
    console.error('❌ Erreur API DELETE time-entries/[id]:', error)

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
        error: 'Erreur lors de la suppression du time entry',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/time-entries/[id] - Gestion CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
