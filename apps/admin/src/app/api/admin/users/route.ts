import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import { User, UserFilters, CreateUserData } from '@/types/admin'
import bcrypt from 'bcryptjs'

// GET /api/admin/users - Récupérer la liste des utilisateurs avec filtres
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const department = searchParams.get('department') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortDirection = searchParams.get('sortDirection') || 'desc'

    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    // Construction du filtre de recherche
    const filter: any = {}
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (role) filter.role = role
    if (status) filter.status = status
    if (department) filter.department = department

    // Calcul de la pagination
    const skip = (page - 1) * limit
    
    // Tri
    const sort: any = {}
    sort[sortBy] = sortDirection === 'asc' ? 1 : -1

    // Exécution des requêtes en parallèle
    const [users, totalCount] = await Promise.all([
      usersCollection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      usersCollection.countDocuments(filter)
    ])

    // Calculer les statistiques
    const stats = {
      totalUsers: await usersCollection.countDocuments({}),
      activeUsers: await usersCollection.countDocuments({ status: 'active' }),
      inactiveUsers: await usersCollection.countDocuments({ status: 'inactive' }),
      suspendedUsers: await usersCollection.countDocuments({ status: 'suspended' }),
      newUsersThisMonth: await usersCollection.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }),
      usersByRole: {
        admin: await usersCollection.countDocuments({ role: 'admin' }),
        manager: await usersCollection.countDocuments({ role: 'manager' }),
        staff: await usersCollection.countDocuments({ role: 'staff' }),
        client: await usersCollection.countDocuments({ role: 'client' })
      },
      usersByDepartment: {},
      recentLogins: await usersCollection.countDocuments({
        lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    }

    const pagination = {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    }

    return NextResponse.json({
      success: true,
      data: {
        users: users.map(user => ({
          ...user,
          _id: user._id.toString()
        })),
        stats
      },
      pagination
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const userData: CreateUserData = await request.json()

    // Validation des données
    if (!userData.email || !userData.name || !userData.password || !userData.role) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes requises' },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    // Vérifier si l'email existe déjà
    const existingUser = await usersCollection.findOne({ email: userData.email })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Cet email est déjà utilisé' },
        { status: 409 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    // Créer l'utilisateur
    const newUser = {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      status: 'active',
      password: hashedPassword,
      phone: userData.phone || '',
      department: userData.department || '',
      isEmailVerified: false,
      loginHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await usersCollection.insertOne(newUser)

    if (!result.insertedId) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création de l\'utilisateur' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...newUser,
        _id: result.insertedId.toString(),
        password: undefined // Ne pas retourner le mot de passe
      },
      message: 'Utilisateur créé avec succès'
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}