import { authOptions } from '@/lib/auth'
import Employee from '@/lib/models/employee'
import { connectToDatabase } from '@/lib/mongodb'
import mongoose from 'mongoose'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/employees/[id] - Récupérer un employé par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID employé invalide' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const employee = await Employee.findById(params.id).lean()

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employé non trouvé' },
        { status: 404 }
      )
    }

    const formattedEmployee = {
      id: (employee as any)._id.toString(),
      firstName: (employee as any).firstName,
      lastName: (employee as any).lastName,
      email: (employee as any).email,
      phone: (employee as any).phone,
      role: (employee as any).role,
      color: (employee as any).color,
      startDate: (employee as any).startDate,
      pin: (employee as any).pin,
      isActive: (employee as any).isActive,
      fullName: `${(employee as any).firstName} ${(employee as any).lastName}`,
      createdAt: (employee as any).createdAt,
      updatedAt: (employee as any).updatedAt,
    }

    return NextResponse.json({
      success: true,
      data: formattedEmployee,
    })
  } catch (error: any) {
    console.error('❌ Erreur API GET employee:', error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération de l'employé",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/employees/[id] - Mettre à jour un employé
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID employé invalide' },
        { status: 400 }
      )
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      color,
      startDate,
      isActive,
      pin,
    } = await request.json()

    await connectToDatabase()

    // Préparer les données à mettre à jour
    const updateData: any = {}

    if (firstName !== undefined) updateData.firstName = firstName.trim()
    if (lastName !== undefined) updateData.lastName = lastName.trim()
    if (email !== undefined) updateData.email = email ? email.trim() : null
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null
    if (role !== undefined) updateData.role = role
    if (color !== undefined) updateData.color = color
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (isActive !== undefined) updateData.isActive = isActive
    if (pin !== undefined) updateData.pin = pin

    const updatedEmployee = await Employee.findByIdAndUpdate(
      params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).lean()

    if (!updatedEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employé non trouvé' },
        { status: 404 }
      )
    }

    const formattedEmployee = {
      id: (updatedEmployee as any)._id.toString(),
      firstName: (updatedEmployee as any).firstName,
      lastName: (updatedEmployee as any).lastName,
      email: (updatedEmployee as any).email,
      phone: (updatedEmployee as any).phone,
      role: (updatedEmployee as any).role,
      color: (updatedEmployee as any).color,
      startDate: (updatedEmployee as any).startDate,
      pin: (updatedEmployee as any).pin,
      isActive: (updatedEmployee as any).isActive,
      fullName: `${(updatedEmployee as any).firstName} ${(updatedEmployee as any).lastName}`,
      createdAt: (updatedEmployee as any).createdAt,
      updatedAt: (updatedEmployee as any).updatedAt,
    }

    return NextResponse.json({
      success: true,
      message: 'Employé mis à jour avec succès',
      data: formattedEmployee,
    })
  } catch (error: any) {
    console.error('❌ Erreur API PUT employee:', error)

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      )
      return NextResponse.json(
        {
          success: false,
          error: 'Données invalides',
          details: validationErrors,
        },
        { status: 400 }
      )
    }

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Un employé avec cet email existe déjà',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour de l'employé",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/employees/[id] - Supprimer un employé (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID employé invalide' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Vérifier si l'employé existe
    const employee = await Employee.findById(params.id)

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employé non trouvé' },
        { status: 404 }
      )
    }

    // Soft delete : désactiver l'employé au lieu de le supprimer
    await employee.deactivate()

    return NextResponse.json({
      success: true,
      message: 'Employé désactivé avec succès',
    })
  } catch (error: any) {
    console.error('❌ Erreur API DELETE employee:', error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la suppression de l'employé",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
