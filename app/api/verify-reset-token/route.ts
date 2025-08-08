import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Token de réinitialisation manquant.' },
        { status: 400 }
      )
    }

    // Connexion à la base de données
    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    // Chercher l'utilisateur avec le token valide
    const user = await usersCollection.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() }, // Token non expiré
    })

    if (!user) {
      return NextResponse.json(
        { 
          message: 'Token de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.',
          valid: false 
        },
        { status: 400 }
      )
    }

    // Token valide
    return NextResponse.json(
      { 
        message: 'Token valide.',
        valid: true,
        email: user.email // Pour afficher l'email dans l'interface (optionnel)
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur verify-reset-token:', error)

    return NextResponse.json(
      { 
        message: 'Erreur lors de la vérification du token.',
        valid: false 
      },
      { status: 500 }
    )
  }
}