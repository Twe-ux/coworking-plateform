import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import { sendWelcomeEmail, checkEmailConfiguration } from '@/lib/email'
import { UserRole } from '@/types/auth'
import { z } from 'zod'

const registerSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
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
    const validatedData = registerSchema.parse(body)
    const { firstName, lastName, email, password } = validatedData

    // Connexion à la base de données
    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { message: 'Un compte avec cette adresse email existe déjà.' },
        { status: 400 }
      )
    }

    // Hacher le mot de passe
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Créer le nouvel utilisateur
    const newUser = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: UserRole.CLIENT, // Rôle par défaut
      permissions: [],
      isActive: true,
      status: 'active', // Ajout du champ status nécessaire pour l'authentification
      emailVerified: false, // À implémenter plus tard
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await usersCollection.insertOne(newUser)

    if (!result.insertedId) {
      return NextResponse.json(
        { message: 'Erreur lors de la création du compte.' },
        { status: 500 }
      )
    }

    // Envoyer l'email de bienvenue (optionnel, ne fait pas échouer l'inscription)
    const emailConfigured = checkEmailConfiguration()
    if (emailConfigured) {
      const emailResult = await sendWelcomeEmail({
        email,
        firstName,
        lastName,
      })

      if (!emailResult.success) {
        console.error('Échec envoi email de bienvenue:', emailResult.error)
        // On continue, l'inscription a réussi
      }
    }

    // Retourner une réponse sans le mot de passe
    return NextResponse.json(
      {
        message: 'Compte créé avec succès !',
        user: {
          id: result.insertedId.toString(),
          firstName,
          lastName,
          email,
          role: UserRole.CLIENT,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur registration:', error)

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
