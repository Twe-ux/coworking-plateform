import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Employee from '@/lib/models/employee'
import type { VerifyPinRequest, ApiResponse } from '@/types/timeEntry'
import { TIME_ENTRY_ERRORS } from '@/types/timeEntry'

/**
 * POST /api/employees/verify-pin - Vérifier le PIN d'un employé
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VerifyPinRequest

    // Validation des données d'entrée
    if (!body.employeeId || !body.pin) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'ID employé et PIN sont obligatoires',
        details: TIME_ENTRY_ERRORS.VALIDATION_ERROR,
      }, { status: 400 })
    }

    // Validation du format PIN
    if (!/^\d{4}$/.test(body.pin)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Le PIN doit être composé de 4 chiffres',
        details: TIME_ENTRY_ERRORS.INVALID_PIN,
      }, { status: 400 })
    }

    await connectToDatabase()

    // Rechercher l'employé
    const employee = await Employee.findById(body.employeeId).select('+pin')
    
    if (!employee) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Employé introuvable',
        details: TIME_ENTRY_ERRORS.EMPLOYEE_NOT_FOUND,
      }, { status: 404 })
    }

    // Vérifier que l'employé est actif
    if (!employee.isActive) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Employé inactif',
        details: TIME_ENTRY_ERRORS.EMPLOYEE_NOT_FOUND,
      }, { status: 403 })
    }

    // Vérifier le PIN
    const isPinValid = employee.verifyPin(body.pin)
    
    if (!isPinValid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'PIN incorrect',
        details: TIME_ENTRY_ERRORS.INVALID_PIN,
      }, { status: 401 })
    }

    // Retourner les informations de l'employé (sans le PIN)
    const employeeData = {
      id: employee._id.toString(),
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: employee.fullName,
      role: employee.role,
      color: employee.color,
      isActive: employee.isActive,
    }

    return NextResponse.json<ApiResponse<typeof employeeData>>({
      success: true,
      data: employeeData,
      message: 'PIN vérifié avec succès',
    })

  } catch (error: any) {
    console.error('❌ Erreur API POST employees/verify-pin:', error)

    // Gestion des erreurs spécifiques
    if (error.name === 'CastError' && error.path === '_id') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Format d\'ID employé invalide',
        details: TIME_ENTRY_ERRORS.EMPLOYEE_NOT_FOUND,
      }, { status: 400 })
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erreur lors de la vérification du PIN',
      details: error.message,
    }, { status: 500 })
  }
}

/**
 * OPTIONS /api/employees/verify-pin - Gestion CORS
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