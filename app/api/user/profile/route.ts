import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/lib/models/user'

/**
 * GET /api/user/profile - Récupérer le profil utilisateur
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

    await connectToDatabase()
    
    const user = await User.findById(session.user.id).select('-password')
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        bio: user.bio,
        createdAt: user.createdAt
      }
    })

  } catch (error) {
    console.error('Erreur API GET profile:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/profile - Mettre à jour le profil utilisateur
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const {
      name,
      firstName,
      lastName,
      phone,
      bio,
      image
    } = await request.json()

    // Validation des données
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Le nom est obligatoire' },
        { status: 400 }
      )
    }

    await connectToDatabase()
    
    // Préparer les données à mettre à jour
    const updateData: any = {
      name: name.trim(),
      firstName: firstName?.trim() || '',
      lastName: lastName?.trim() || '',
      phone: phone?.trim() || '',
      bio: bio?.trim() || '',
      updatedAt: new Date()
    }

    // Ajouter l'image seulement si elle est fournie
    if (image && image !== '') {
      updateData.image = image
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true, select: '-password' }
    )

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        role: updatedUser.role,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        bio: updatedUser.bio
      }
    })

  } catch (error) {
    console.error('Erreur API PUT profile:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}