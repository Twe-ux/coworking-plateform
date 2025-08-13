import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongodb'
import Shift from '@/lib/models/shift'
import Employee from '@/lib/models/employee'
import { authOptions } from '@/lib/auth'

// Fonction utilitaire pour créer une date UTC pure à partir d'une string YYYY-MM-DD
function createLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  // Créer une date UTC pure (minuit UTC) pour représenter uniquement la date
  return new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0))
}

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/shifts/[id] - Récupérer un créneau spécifique
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    await dbConnect()

    const shift = await Shift.findById(params.id)
      .populate('employeeId', 'firstName lastName fullName role color')
      .lean()

    if (!shift) {
      return NextResponse.json(
        { success: false, error: 'Créneau non trouvé' },
        { status: 404 }
      )
    }

    const transformedShift = {
      id: shift._id.toString(),
      employeeId: shift.employeeId._id.toString(),
      employee: {
        id: shift.employeeId._id.toString(),
        firstName: shift.employeeId.firstName,
        lastName: shift.employeeId.lastName,
        fullName: shift.employeeId.fullName,
        role: shift.employeeId.role,
        color: shift.employeeId.color
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
      updatedAt: shift.updatedAt
    }

    return NextResponse.json({
      success: true,
      data: transformedShift
    })

  } catch (error) {
    console.error('Erreur API GET shift:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la récupération du créneau' },
      { status: 500 }
    )
  }
}

// PUT /api/shifts/[id] - Mettre à jour un créneau
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    if (!['admin', 'manager'].includes(userRole) && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { employeeId, date, startTime, endTime, type, location, notes, isActive } = body

    await dbConnect()

    // Vérifier que le créneau existe
    const existingShift = await Shift.findById(params.id)
    if (!existingShift) {
      return NextResponse.json(
        { success: false, error: 'Créneau non trouvé' },
        { status: 404 }
      )
    }

    // Si l'employé change, vérifier qu'il existe
    if (employeeId && employeeId !== existingShift.employeeId.toString()) {
      const employee = await Employee.findById(employeeId)
      if (!employee) {
        return NextResponse.json(
          { success: false, error: 'Employé non trouvé' },
          { status: 404 }
        )
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    if (employeeId !== undefined) updateData.employeeId = employeeId
    if (date !== undefined) updateData.date = createLocalDate(date)
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (type !== undefined) updateData.type = type
    if (location !== undefined) updateData.location = location?.trim() || undefined
    if (notes !== undefined) updateData.notes = notes?.trim() || undefined
    if (isActive !== undefined) updateData.isActive = isActive

    // Vérifier les conflits si les données de timing changent
    if (employeeId || date || startTime || endTime) {
      const checkEmployeeId = employeeId || existingShift.employeeId
      const checkDate = date ? createLocalDate(date) : existingShift.date
      const checkStartTime = startTime || existingShift.startTime
      const checkEndTime = endTime || existingShift.endTime

      const conflictingShift = await Shift.findOne({
        _id: { $ne: params.id }, // Exclure le créneau actuel
        employeeId: checkEmployeeId,
        date: checkDate,
        isActive: true,
        $or: [
          {
            $and: [
              { startTime: { $lte: checkStartTime } },
              { endTime: { $gt: checkStartTime } }
            ]
          },
          {
            $and: [
              { startTime: { $lt: checkEndTime } },
              { endTime: { $gte: checkEndTime } }
            ]
          },
          {
            $and: [
              { startTime: { $gte: checkStartTime } },
              { endTime: { $lte: checkEndTime } }
            ]
          }
        ]
      })

      if (conflictingShift) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Conflit de créneaux détecté',
            details: {
              conflict: `Un créneau existe déjà de ${conflictingShift.startTime} à ${conflictingShift.endTime}`
            }
          },
          { status: 409 }
        )
      }
    }

    // Mettre à jour le créneau
    const updatedShift = await Shift.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('employeeId', 'firstName lastName fullName role color').lean()

    const transformedShift = {
      id: updatedShift._id.toString(),
      employeeId: updatedShift.employeeId._id.toString(),
      employee: {
        id: updatedShift.employeeId._id.toString(),
        firstName: updatedShift.employeeId.firstName,
        lastName: updatedShift.employeeId.lastName,
        fullName: updatedShift.employeeId.fullName,
        role: updatedShift.employeeId.role,
        color: updatedShift.employeeId.color
      },
      date: updatedShift.date,
      startTime: updatedShift.startTime,
      endTime: updatedShift.endTime,
      type: updatedShift.type,
      location: updatedShift.location,
      notes: updatedShift.notes,
      isActive: updatedShift.isActive,
      timeRange: `${updatedShift.startTime} - ${updatedShift.endTime}`,
      createdAt: updatedShift.createdAt,
      updatedAt: updatedShift.updatedAt
    }

    return NextResponse.json({
      success: true,
      data: transformedShift,
      message: 'Créneau mis à jour avec succès'
    })

  } catch (error: any) {
    console.error('Erreur API PUT shift:', error)
    
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
          details: validationErrors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la mise à jour du créneau' },
      { status: 500 }
    )
  }
}

// DELETE /api/shifts/[id] - Supprimer un créneau (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    if (!['admin', 'manager'].includes(userRole) && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    await dbConnect()

    // Vérifier que le créneau existe
    const existingShift = await Shift.findById(params.id)
    if (!existingShift) {
      return NextResponse.json(
        { success: false, error: 'Créneau non trouvé' },
        { status: 404 }
      )
    }

    // Soft delete : marquer comme inactif
    await Shift.findByIdAndUpdate(params.id, { isActive: false })

    return NextResponse.json({
      success: true,
      message: 'Créneau supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur API DELETE shift:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la suppression du créneau' },
      { status: 500 }
    )
  }
}