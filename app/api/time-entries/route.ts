import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import TimeEntry from '@/lib/models/timeEntry'
import type { TimeEntryFilter, PaginatedResponse, TimeEntry as TimeEntryType, ApiResponse } from '@/types/timeEntry'
import { TIME_ENTRY_ERRORS } from '@/types/timeEntry'

/**
 * GET /api/time-entries - Récupérer les time entries avec filtres et pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Vérification d'authentification (bypass en développement)
    if (!session?.user?.id && process.env.NODE_ENV !== 'development') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Non authentifié',
        details: TIME_ENTRY_ERRORS.UNAUTHORIZED,
      }, { status: 401 })
    }

    // Vérification des permissions (admin, manager ou staff pour lecture)
    const userRole = (session?.user as any)?.role
    if (
      !['admin', 'manager', 'staff'].includes(userRole) &&
      process.env.NODE_ENV !== 'development'
    ) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Permissions insuffisantes',
        details: TIME_ENTRY_ERRORS.UNAUTHORIZED,
      }, { status: 403 })
    }

    await connectToDatabase()

    // Extraction des paramètres de recherche
    const { searchParams } = new URL(request.url)
    
    const filters: TimeEntryFilter = {
      employeeId: searchParams.get('employeeId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      status: searchParams.get('status') as 'active' | 'completed' || undefined,
      shiftNumber: searchParams.get('shiftNumber') ? parseInt(searchParams.get('shiftNumber')!) as 1 | 2 : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    }

    // Validation des paramètres
    if (filters.page < 1) filters.page = 1
    if (filters.limit < 1 || filters.limit > 100) filters.limit = 50

    // Construction de la requête MongoDB
    const query: any = { isActive: true }

    if (filters.employeeId) {
      query.employeeId = filters.employeeId
    }

    if (filters.status) {
      query.status = filters.status
    }

    if (filters.shiftNumber) {
      query.shiftNumber = filters.shiftNumber
    }

    // Filtrage par plage de dates
    if (filters.startDate || filters.endDate) {
      query.date = {}
      if (filters.startDate) {
        query.date.$gte = filters.startDate
      }
      if (filters.endDate) {
        query.date.$lte = filters.endDate
      }
    }

    // Calcul de la pagination
    const skip = (filters.page - 1) * filters.limit

    // Exécution des requêtes en parallèle
    const [timeEntries, totalCount] = await Promise.all([
      TimeEntry.find(query)
        .populate('employee', 'firstName lastName role color')
        .sort({ date: -1, clockIn: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      TimeEntry.countDocuments(query)
    ])

    // Formatage des données
    const formattedTimeEntries: TimeEntryType[] = timeEntries.map((entry: any) => ({
      id: entry._id.toString(),
      employeeId: entry.employeeId.toString(),
      employee: entry.employee ? {
        id: entry.employee._id.toString(),
        firstName: entry.employee.firstName,
        lastName: entry.employee.lastName,
        fullName: `${entry.employee.firstName} ${entry.employee.lastName}`,
        role: entry.employee.role,
      } : undefined,
      date: entry.date,
      clockIn: entry.clockIn,
      clockOut: entry.clockOut,
      shiftNumber: entry.shiftNumber,
      totalHours: entry.totalHours,
      status: entry.status,
      isActive: entry.isActive,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      // Calculer la durée actuelle pour les shifts actifs
      currentDuration: !entry.clockOut && entry.status === 'active' ? 
        Math.max(0, (new Date().getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60 * 60)) : 
        entry.totalHours || 0,
    }))

    // Calcul de la pagination
    const totalPages = Math.ceil(totalCount / filters.limit)
    const hasNext = filters.page < totalPages
    const hasPrev = filters.page > 1

    const response: PaginatedResponse<TimeEntryType> = {
      success: true,
      data: formattedTimeEntries,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev,
      },
      message: `${formattedTimeEntries.length} entrées trouvées`,
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ Erreur API GET time-entries:', error)

    // Gestion des erreurs de date invalide
    if (error.message.includes('Invalid Date') || error.name === 'CastError') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Format de date invalide',
        details: TIME_ENTRY_ERRORS.VALIDATION_ERROR,
      }, { status: 400 })
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erreur lors de la récupération des time entries',
      details: error.message,
    }, { status: 500 })
  }
}

/**
 * POST /api/time-entries - Créer un time entry manuellement (admin/manager uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Non authentifié',
        details: TIME_ENTRY_ERRORS.UNAUTHORIZED,
      }, { status: 401 })
    }

    // Vérification des permissions (admin ou manager uniquement)
    const userRole = (session?.user as any)?.role
    if (
      !['admin', 'manager'].includes(userRole) &&
      process.env.NODE_ENV !== 'development'
    ) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Seuls les administrateurs et managers peuvent créer des time entries manuellement',
        details: TIME_ENTRY_ERRORS.UNAUTHORIZED,
      }, { status: 403 })
    }

    const {
      employeeId,
      date,
      clockIn,
      clockOut,
      shiftNumber,
    } = await request.json()

    // Validation des données obligatoires
    if (!employeeId || !clockIn) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'ID employé et heure d\'arrivée sont obligatoires',
        details: TIME_ENTRY_ERRORS.VALIDATION_ERROR,
      }, { status: 400 })
    }

    await connectToDatabase()

    // Créer les données du time entry
    const entryDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())

    const timeEntryData: any = {
      employeeId,
      date: startOfDay,
      clockIn: new Date(clockIn),
      shiftNumber: shiftNumber || 1,
      status: clockOut ? 'completed' : 'active',
    }

    if (clockOut) {
      timeEntryData.clockOut = new Date(clockOut)
    }

    const newTimeEntry = new TimeEntry(timeEntryData)
    await newTimeEntry.save()

    // Populer les données de l'employé
    await newTimeEntry.populate('employee', 'firstName lastName role')

    // Formater la réponse
    const employee = (newTimeEntry as any).employee
    const formattedTimeEntry: TimeEntryType = {
      id: newTimeEntry._id.toString(),
      employeeId: newTimeEntry.employeeId.toString(),
      employee: employee ? {
        id: employee._id.toString(),
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: `${employee.firstName} ${employee.lastName}`,
        role: employee.role,
      } : undefined,
      date: newTimeEntry.date,
      clockIn: newTimeEntry.clockIn,
      clockOut: newTimeEntry.clockOut,
      shiftNumber: newTimeEntry.shiftNumber,
      totalHours: newTimeEntry.totalHours,
      status: newTimeEntry.status,
      isActive: newTimeEntry.isActive,
      createdAt: newTimeEntry.createdAt,
      updatedAt: newTimeEntry.updatedAt,
    }

    return NextResponse.json<ApiResponse<TimeEntryType>>({
      success: true,
      data: formattedTimeEntry,
      message: 'Time entry créé avec succès',
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Erreur API POST time-entries:', error)

    // Gestion des erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      )
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Données invalides',
        details: validationErrors,
      }, { status: 400 })
    }

    if (error.code === 11000) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Un shift avec ce numéro existe déjà pour cette date et cet employé',
        details: TIME_ENTRY_ERRORS.MAX_SHIFTS_EXCEEDED,
      }, { status: 409 })
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erreur lors de la création du time entry',
      details: error.message,
    }, { status: 500 })
  }
}

/**
 * OPTIONS /api/time-entries - Gestion CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}