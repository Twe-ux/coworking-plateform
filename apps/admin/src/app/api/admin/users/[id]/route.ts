import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { UpdateUserData } from '@/types/admin'
import bcrypt from 'bcryptjs'

interface Params {
  id: string
}

// GET /api/admin/users/[id] - Récupérer un utilisateur spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur invalide' },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    const user = await usersCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } } // Exclure le mot de passe
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        _id: user._id.toString()
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id] - Modifier un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const { id } = params
    const updateData: UpdateUserData = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur invalide' },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    // Vérifier si l'utilisateur existe
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(id) })
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Préparer les données de mise à jour
    const updateFields: any = {
      updatedAt: new Date()
    }

    // Ajouter les champs modifiables
    if (updateData.name) updateFields.name = updateData.name
    if (updateData.email) updateFields.email = updateData.email
    if (updateData.role) updateFields.role = updateData.role
    if (updateData.status) updateFields.status = updateData.status
    if (updateData.phone !== undefined) updateFields.phone = updateData.phone
    if (updateData.department !== undefined) updateFields.department = updateData.department

    // Gérer le mot de passe si fourni
    if (updateData.password) {
      updateFields.password = await bcrypt.hash(updateData.password, 12)
    }

    // Vérifier l'unicité de l'email si modifié
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await usersCollection.findOne({ 
        email: updateData.email,
        _id: { $ne: new ObjectId(id) }
      })
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Cet email est déjà utilisé par un autre utilisateur' },
          { status: 409 }
        )
      }
    }

    // Mettre à jour l'utilisateur
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await usersCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    )

    return NextResponse.json({
      success: true,
      data: {
        ...updatedUser,
        _id: updatedUser!._id.toString()
      },
      message: 'Utilisateur mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur invalide' },
        { status: 400 }
      )
    }

    // Empêcher la suppression de son propre compte
    if (session.user.id === id) {
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    // Vérifier si l'utilisateur existe
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(id) })
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Supprimer l'utilisateur
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}