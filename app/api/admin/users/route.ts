import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import { withCSRF } from '@/lib/csrf-middleware'
import {
  validateEmail,
  validateName,
  validatePasswordInput,
  sanitizeInput,
} from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé - Privilèges administrateur requis' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    const { db } = await connectToDatabase()

    // Construire la requête de filtre
    const filter: any = {}

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    if (role) {
      filter.role = role
    }

    if (status) {
      filter.status = status
    }

    // Pagination
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      db
        .collection('users')
        .find(filter, { projection: { password: 0 } })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray(),
      db.collection('users').countDocuments(filter),
    ])

    return NextResponse.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    })
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// Appliquer la protection CSRF pour les requêtes POST
export const POST = withCSRF(async function (request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé - Privilèges administrateur requis' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { name, email, role, password } = data

    // SECURITY: Validation stricte des entrées
    const nameValidation = validateName(name, 'Nom')
    const emailValidation = validateEmail(email)
    const passwordValidation = validatePasswordInput(password)

    if (!nameValidation.isValid) {
      return NextResponse.json(
        { error: 'Nom invalide', details: nameValidation.errors },
        { status: 400 }
      )
    }

    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: 'Email invalide', details: emailValidation.errors },
        { status: 400 }
      )
    }

    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Mot de passe invalide', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Validation du rôle
    const validRoles = ['admin', 'manager', 'staff', 'client']
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Vérifier si l'utilisateur existe déjà avec l'email sanitisé
    const existingUser = await db.collection('users').findOne({
      email: emailValidation.sanitized,
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      )
    }

    // Hasher le mot de passe avec un salt élevé pour l'admin
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(passwordValidation.sanitized, 14) // Salt plus élevé pour admin

    // Créer l'utilisateur avec données sanitisées
    const user = {
      name: nameValidation.sanitized,
      email: emailValidation.sanitized,
      firstName: nameValidation.sanitized?.split(' ')[0] || '',
      lastName: nameValidation.sanitized?.split(' ')[1] || '',
      role: role as any,
      password: hashedPassword,
      status: 'active',
      isActive: true,
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: session.user.id, // Traçabilité
    }

    const result = await db.collection('users').insertOne(user)

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        user: { ...userWithoutPassword, _id: result.insertedId },
        message: 'Utilisateur créé avec succès',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur création utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
})

// Force Node.js runtime for admin middleware and database compatibility
export const runtime = 'nodejs'
