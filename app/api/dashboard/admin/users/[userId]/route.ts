import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/user'
import bcrypt from 'bcryptjs'

/**
 * API pour modifier un utilisateur existant
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params
    const { firstName, lastName, email, role, isActive } = await request.json()

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Les champs firstName, lastName et email sont requis' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
    if (user.email !== email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } })
      if (existingUser) {
        return NextResponse.json(
          { error: 'Un utilisateur avec cet email existe déjà' },
          { status: 409 }
        )
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        email,
        role: role || user.role,
        isActive: isActive !== undefined ? isActive : user.isActive,
        updatedAt: new Date(),
      },
      { new: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Utilisateur modifié avec succès',
      data: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    })
  } catch (error: any) {
    console.error('❌ Erreur modification utilisateur:', error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la modification de l'utilisateur",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * API pour supprimer un utilisateur
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params

    // Empêcher la suppression de son propre compte
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(userId)

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
    })
  } catch (error: any) {
    console.error('❌ Erreur suppression utilisateur:', error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la suppression de l'utilisateur",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
