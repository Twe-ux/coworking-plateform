import { authOptions } from '@/lib/auth'
import Employee from '@/lib/models/employee'
import Shift from '@/lib/models/shift'
import dbConnect from '@/lib/mongodb'
import { log } from 'console'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// Fonction utilitaire pour créer une date UTC pure à partir d'une string YYYY-MM-DD
function createLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  // Créer une date UTC pure (minuit UTC) pour représenter uniquement la date
  return new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0))
}

// GET /api/shifts - Récupérer la liste des créneaux
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Temporary debug bypass for development
    if (!session?.user && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les permissions (admin, manager ou staff pour lecture seule)
    const userRole = (session?.user as any)?.role
    if (
      !['admin', 'manager', 'staff'].includes(userRole) &&
      process.env.NODE_ENV !== 'development'
    ) {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)

    // Paramètres de filtrage
    const employeeId = searchParams.get('employeeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')
    const active = searchParams.get('active')

    // Construction de la requête de filtrage
    const filter: any = {}

    if (employeeId) {
      filter.employeeId = employeeId
    }

    if (startDate || endDate) {
      filter.date = {}
      if (startDate) {
        filter.date.$gte = createLocalDate(startDate)
      }
      if (endDate) {
        filter.date.$lte = createLocalDate(endDate)
      }
    }

    if (type) {
      filter.type = type
    }

    if (active !== null && active !== undefined) {
      filter.isActive = active === 'true'
    }

    // Récupérer les créneaux avec les informations de l'employé
    const shifts = await Shift.find(filter)
      .populate('employeeId', 'firstName lastName fullName role color')
      .sort({ date: 1, startTime: 1 })
      .lean()

    // Transformer les données pour le frontend
    const transformedShifts = shifts.map((shift) => ({
      id: shift._id.toString(),
      employeeId: shift.employeeId._id.toString(),
      employee: {
        id: shift.employeeId._id.toString(),
        firstName: shift.employeeId.firstName,
        lastName: shift.employeeId.lastName,
        fullName: shift.employeeId.fullName,
        role: shift.employeeId.role,
        color: shift.employeeId.color,
      },
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      type: shift.type,
      location: shift.location,
      notes: shift.notes,
      isActive: shift.isActive,
      timeRange: `${shift.startTime} - ${shift.endTime}`,
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      data: transformedShifts,
      count: transformedShifts.length,
    })
  } catch (error) {
    console.error('Erreur API GET shifts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur lors de la récupération des créneaux',
      },
      { status: 500 }
    )
  }
}

// POST /api/shifts - Créer un nouveau créneau
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Temporary debug bypass for development
    if (!session?.user && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const userRole = (session?.user as any)?.role
    if (
      !['admin', 'manager'].includes(userRole) &&
      process.env.NODE_ENV !== 'development'
    ) {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { employeeId, date, startTime, endTime, type, location, notes } = body

    // Validation des champs requis
    if (!employeeId || !date || !startTime || !endTime || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Champs requis manquants',
          details: {
            employeeId: !employeeId
              ? "L'ID de l'employé est requis"
              : undefined,
            date: !date ? 'La date est requise' : undefined,
            startTime: !startTime ? "L'heure de début est requise" : undefined,
            endTime: !endTime ? "L'heure de fin est requise" : undefined,
            type: !type ? 'Le type de créneau est requis' : undefined,
          },
        },
        { status: 400 }
      )
    }

    await dbConnect()

    // Vérifier que l'employé existe
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employé non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier les conflits de créneaux
    const conflictingShift = await Shift.findOne({
      employeeId,
      date: createLocalDate(date),
      isActive: true,
      $or: [
        {
          $and: [
            { startTime: { $lte: startTime } },
            { endTime: { $gt: startTime } },
          ],
        },
        {
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gte: endTime } },
          ],
        },
        {
          $and: [
            { startTime: { $gte: startTime } },
            { endTime: { $lte: endTime } },
          ],
        },
      ],
    })

    if (conflictingShift) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conflit de créneaux détecté',
          details: {
            conflict: `Un créneau existe déjà de ${conflictingShift.startTime} à ${conflictingShift.endTime}`,
          },
        },
        { status: 409 }
      )
    }

    // Créer le nouveau créneau
    const newShift = new Shift({
      employeeId,
      date: createLocalDate(date),
      startTime,
      endTime,
      type,
      location: location?.trim() || undefined,
      notes: notes?.trim() || undefined,
    })

    log('Creating new shift:', newShift)

    await newShift.save()

    // Récupérer le créneau créé avec les informations de l'employé
    const populatedShift = await Shift.findById(newShift._id)
      .populate('employeeId', 'firstName lastName fullName role color')
      .lean()

    const transformedShift = {
      id: populatedShift._id.toString(),
      employeeId: populatedShift.employeeId._id.toString(),
      employee: {
        id: populatedShift.employeeId._id.toString(),
        firstName: populatedShift.employeeId.firstName,
        lastName: populatedShift.employeeId.lastName,
        fullName: populatedShift.employeeId.fullName,
        role: populatedShift.employeeId.role,
        color: populatedShift.employeeId.color,
      },
      date: populatedShift.date,
      startTime: populatedShift.startTime,
      endTime: populatedShift.endTime,
      type: populatedShift.type,
      location: populatedShift.location,
      notes: populatedShift.notes,
      isActive: populatedShift.isActive,
      timeRange: `${populatedShift.startTime} - ${populatedShift.endTime}`,
      createdAt: populatedShift.createdAt,
      updatedAt: populatedShift.updatedAt,
    }

    return NextResponse.json(
      {
        success: true,
        data: transformedShift,
        message: 'Créneau créé avec succès',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erreur API POST shifts:', error)

    // Gestion des erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors: Record<string, string> = {}
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Erreurs de validation',
          details: validationErrors,
        },
        { status: 400 }
      )
    }

    // Gestion des erreurs de duplicata
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Un créneau existe déjà pour cet employé à cette date et heure',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur lors de la création du créneau',
      },
      { status: 500 }
    )
  }
}
