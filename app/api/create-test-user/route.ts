import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import { UserRole } from '@/types/auth'

/**
 * POST /api/create-test-user - Créer un utilisateur de test (développement uniquement)
 */
export async function POST(request: NextRequest) {
  // Sécurité: uniquement en développement
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Endpoint disponible uniquement en développement' },
      { status: 403 }
    )
  }

  try {
    console.log("🔄 Création d'un utilisateur de test...")

    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await usersCollection.findOne({
      email: 'test@coworking.com',
    })

    if (existingUser) {
      return NextResponse.json({
        message: 'Utilisateur de test déjà existant',
        user: {
          email: 'test@coworking.com',
          role: existingUser.role,
        },
      })
    }

    // Créer un mot de passe hashé
    const hashedPassword = await bcrypt.hash('testpassword123', 12)

    // Créer l'utilisateur de test
    const testUser = {
      email: 'test@coworking.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.CLIENT,
      permissions: [],
      isActive: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      loginHistory: [],
    }

    const result = await usersCollection.insertOne(testUser)

    if (!result.insertedId) {
      throw new Error("Erreur lors de la création de l'utilisateur de test")
    }

    console.log(`✅ Utilisateur de test créé avec l'ID: ${result.insertedId}`)

    return NextResponse.json({
      message: 'Utilisateur de test créé avec succès',
      user: {
        id: result.insertedId,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role,
      },
      credentials: {
        email: 'test@coworking.com',
        password: 'testpassword123',
      },
    })
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création de l'utilisateur de test:",
      error
    )

    return NextResponse.json(
      {
        error: "Erreur lors de la création de l'utilisateur de test",
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/create-test-user - Informations sur l'utilisateur de test
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Endpoint disponible uniquement en développement' },
      { status: 403 }
    )
  }

  try {
    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    const testUser = await usersCollection.findOne(
      { email: 'test@coworking.com' },
      { projection: { password: 0 } } // Exclure le mot de passe
    )

    if (!testUser) {
      return NextResponse.json(
        { message: 'Aucun utilisateur de test trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Utilisateur de test trouvé',
      user: {
        id: testUser._id,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role,
        isActive: testUser.isActive,
      },
      credentials: {
        email: 'test@coworking.com',
        password: 'testpassword123',
      },
    })
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de l'utilisateur de test:",
      error
    )

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération de l'utilisateur de test",
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
