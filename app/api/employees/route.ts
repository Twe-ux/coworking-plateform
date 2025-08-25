import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import Employee from '@/lib/models/employee'

/**
 * GET /api/employees - Récupérer tous les employés
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les permissions (admin, manager ou staff pour lecture seule)
    const userRole = (session?.user as any)?.role
    if (!['admin', 'manager', 'staff'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    await connectToDatabase()

    // Paramètres de recherche depuis l'URL
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const active = searchParams.get('active')
    const search = searchParams.get('search')

    // Construction de la requête
    let query: any = {}

    if (role) {
      query.role = role
    }

    if (active !== null) {
      query.isActive = active === 'true'
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    const employees = await Employee.find(query)
      .sort({ firstName: 1, lastName: 1 })
      .lean()

    // Formater les données pour l'interface
    const formattedEmployees = employees.map((employee) => ({
      id: (employee._id as any).toString(),
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      color: employee.color,
      startDate: employee.startDate,
      pin: employee.pin,
      isActive: employee.isActive,
      fullName: `${employee.firstName} ${employee.lastName}`,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      data: formattedEmployees,
      count: formattedEmployees.length,
    })
  } catch (error: any) {
    console.error('❌ Erreur API GET employees:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des employés',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/employees - Créer un nouvel employé
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les permissions (admin ou manager)
    const userRole = (session?.user as any)?.role
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const { firstName, lastName, email, phone, role, color, startDate, pin } =
      await request.json()

    // Validation des données obligatoires
    if (!firstName || !lastName || !role) {
      return NextResponse.json(
        { success: false, error: 'Prénom, nom et rôle sont obligatoires' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Créer le nouvel employé
    const employeeData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
    }

    if (email) employeeData.email = email.trim()
    if (phone) employeeData.phone = phone.trim()
    if (color) employeeData.color = color
    if (startDate) employeeData.startDate = new Date(startDate)
    if (pin) employeeData.pin = pin

    const newEmployee = new Employee(employeeData)
    await newEmployee.save()

    // Formater la réponse
    const formattedEmployee = {
      id: newEmployee._id.toString(),
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      email: newEmployee.email,
      phone: newEmployee.phone,
      role: newEmployee.role,
      color: newEmployee.color,
      startDate: newEmployee.startDate,
      pin: newEmployee.pin,
      isActive: newEmployee.isActive,
      fullName: `${newEmployee.firstName} ${newEmployee.lastName}`,
      createdAt: newEmployee.createdAt,
      updatedAt: newEmployee.updatedAt,
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Employé créé avec succès',
        data: formattedEmployee,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ Erreur API POST employees:', error)

    // Gestion des erreurs de validation Mongoose
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

    // Gestion des erreurs de duplication
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
        error: "Erreur lors de la création de l'employé",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
