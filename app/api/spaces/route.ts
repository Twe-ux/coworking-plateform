import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') || ''
    const available = searchParams.get('available') === 'true'
    const date = searchParams.get('date') || ''

    const { db } = await connectToDatabase()
    
    // Construire la requête de filtre
    const filter: any = { status: 'active' }
    
    if (type) {
      filter.type = type
    }
    
    if (available && date) {
      // Vérifier la disponibilité pour une date donnée
      const targetDate = new Date(date)
      filter.availability = {
        $elemMatch: {
          date: {
            $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            $lt: new Date(targetDate.setHours(23, 59, 59, 999))
          },
          available: true
        }
      }
    }

    // Pagination
    const skip = (page - 1) * limit
    
    const [spaces, total] = await Promise.all([
      db.collection('spaces')
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 })
        .toArray(),
      db.collection('spaces').countDocuments(filter)
    ])

    return NextResponse.json({
      spaces,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    })
  } catch (error) {
    console.error('Erreur récupération espaces:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Accès refusé - Privilèges insuffisants' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { name, type, capacity, description, amenities, pricePerHour, images } = data

    if (!name || !type || !capacity || !pricePerHour) {
      return NextResponse.json(
        { error: 'Les champs name, type, capacity et pricePerHour sont requis' },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Créer l'espace
    const space = {
      name,
      type,
      capacity: parseInt(capacity),
      description: description || '',
      amenities: amenities || [],
      pricePerHour: parseFloat(pricePerHour),
      images: images || [],
      status: 'active',
      availability: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: session.user.id
    }

    const result = await db.collection('spaces').insertOne(space)
    
    return NextResponse.json({
      space: { ...space, _id: result.insertedId },
      message: 'Espace créé avec succès'
    }, { status: 201 })
  } catch (error) {
    console.error('Erreur création espace:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}