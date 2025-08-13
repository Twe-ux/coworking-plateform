import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import Employee from '@/lib/models/employee'
import mongoose from 'mongoose'

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
      id: employee._id.toString(),
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      color: employee.color,
      startDate: employee.startDate,
      isActive: employee.isActive,
      fullName: `${employee.firstName} ${employee.lastName}`,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    }

    return NextResponse.json({
      success: true,
      data: formattedEmployee
    })

  } catch (error: any) {
    console.error('❌ Erreur API GET employee:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération de l\'employé',
        details: error.message 
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

    const updatedEmployee = await Employee.findByIdAndUpdate(
      params.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).lean()

    if (!updatedEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employé non trouvé' },
        { status: 404 }
      )
    }

    const formattedEmployee = {
      id: updatedEmployee._id.toString(),
      firstName: updatedEmployee.firstName,
      lastName: updatedEmployee.lastName,
      email: updatedEmployee.email,
      phone: updatedEmployee.phone,
      role: updatedEmployee.role,
      color: updatedEmployee.color,
      startDate: updatedEmployee.startDate,
      isActive: updatedEmployee.isActive,
      fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
      createdAt: updatedEmployee.createdAt,
      updatedAt: updatedEmployee.updatedAt,
    }

    return NextResponse.json({
      success: true,
      message: 'Employé mis à jour avec succès',
      data: formattedEmployee
    })

  } catch (error: any) {
    console.error('❌ Erreur API PUT employee:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides',
          details: validationErrors 
        },
        { status: 400 }
      )
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Un employé avec cet email existe déjà' 
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la mise à jour de l\'employé',
        details: error.message 
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
      message: 'Employé désactivé avec succès'
    })

  } catch (error: any) {
    console.error('❌ Erreur API DELETE employee:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la suppression de l\'employé',
        details: error.message 
      },
      { status: 500 }
    )
  }
}