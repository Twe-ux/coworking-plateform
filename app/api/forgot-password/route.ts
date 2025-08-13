import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { sendPasswordResetEmail, checkEmailConfiguration } from '@/lib/email'
import { z } from 'zod'
import crypto from 'crypto'

const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide'),
})

// Configuration des tokens de réinitialisation
const TOKEN_EXPIRY_HOURS = 24
const TOKEN_LENGTH = 32

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation des données
    const validatedData = forgotPasswordSchema.parse(body)
    const { email } = validatedData

    // Connexion à la base de données
    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    // Chercher l'utilisateur
    const user = await usersCollection.findOne({
      email: email.toLowerCase(),
    })

    // Pour la sécurité, toujours retourner le même message
    // même si l'utilisateur n'existe pas (évite l'énumération d'emails)
    const successMessage =
      'Si cette adresse email existe dans notre système, vous recevrez un lien de réinitialisation dans quelques minutes.'

    if (!user) {
      return NextResponse.json({ message: successMessage }, { status: 200 })
    }

    // Générer un token sécurisé
    const resetToken = crypto.randomBytes(TOKEN_LENGTH).toString('hex')
    const resetTokenExpiry = new Date(
      Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
    )

    // Sauvegarder le token dans la base de données
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: resetToken,
          resetPasswordExpiry: resetTokenExpiry,
          updatedAt: new Date(),
        },
      }
    )

    // Envoyer l'email de réinitialisation
    const emailConfigured = checkEmailConfiguration()

    if (emailConfigured) {
      const emailResult = await sendPasswordResetEmail({
        email: user.email,
        resetToken,
        firstName: user.firstName || 'Utilisateur',
      })

      if (!emailResult.success) {
        console.error('Échec envoi email:', emailResult.error)
        // On continue quand même pour ne pas révéler d'informations
      }
    } else {
      // Mode développement - afficher le token dans les logs
      if (process.env.NODE_ENV === 'development') {
        console.log('='.repeat(50))
        console.log('🔑 TOKEN DE RÉINITIALISATION (DEV ONLY)')
        console.log('='.repeat(50))
        console.log(`Email: ${email}`)
        console.log(`Token: ${resetToken}`)
        console.log(
          `Lien: ${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
        )
        console.log(`Expire: ${resetTokenExpiry.toLocaleString('fr-FR')}`)
        console.log('='.repeat(50))
      }
    }

    return NextResponse.json({ message: successMessage }, { status: 200 })
  } catch (error) {
    console.error('Erreur forgot-password:', error)

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
