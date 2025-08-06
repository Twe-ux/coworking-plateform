import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'

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
        { email: { $regex: search, $options: 'i' } }
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
      db.collection('users')
        .find(filter, { projection: { password: 0 } })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray(),
      db.collection('users').countDocuments(filter)
    ])

    return NextResponse.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    })
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.collection('users').findOne({ email })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 12)

    // Créer l'utilisateur
    const user = {
      name,
      email,
      role,
      password: hashedPassword,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('users').insertOne(user)
    
    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json({
      user: { ...userWithoutPassword, _id: result.insertedId },
      message: 'Utilisateur créé avec succès'
    }, { status: 201 })
  } catch (error) {
    console.error('Erreur création utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}