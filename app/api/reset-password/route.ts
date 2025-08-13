import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import { z } from 'zod'
import { ObjectId } from 'mongodb'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation des données
    const validatedData = resetPasswordSchema.parse(body)
    const { token, password } = validatedData

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
          message:
            'Token de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.',
        },
        { status: 400 }
      )
    }

    // Hacher le nouveau mot de passe
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Mettre à jour le mot de passe et supprimer le token
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        $unset: {
          resetPasswordToken: '',
          resetPasswordExpiry: '',
        },
      }
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { message: 'Erreur lors de la mise à jour du mot de passe.' },
        { status: 500 }
      )
    }

    // Log de sécurité (optionnel)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Mot de passe réinitialisé pour: ${user.email}`)
    }

    return NextResponse.json(
      {
        message:
          'Votre mot de passe a été réinitialisé avec succès ! Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur reset-password:', error)

    // Erreur de validation
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Données invalides',
          errors: error.errors.map((e) => e.message),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Erreur interne du serveur.' },
      { status: 500 }
    )
  }
}
