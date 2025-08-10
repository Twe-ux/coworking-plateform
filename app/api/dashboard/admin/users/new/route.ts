import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/user'
import bcrypt from 'bcryptjs'

/**
 * API pour créer un nouvel utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et les permissions admin
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès refusé - Permissions administrateur requises' },
        { status: 403 }
      )
    }

    const { firstName, lastName, email, role, password } = await request.json()

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)

    // Créer l'utilisateur
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'client',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await newUser.save()

    return NextResponse.json(
      {
        success: true,
        message: 'Utilisateur créé avec succès',
        data: {
          _id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.isActive,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ Erreur création utilisateur:', error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création de l'utilisateur",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
