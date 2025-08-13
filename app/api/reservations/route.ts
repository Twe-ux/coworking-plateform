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
    const status = searchParams.get('status') || ''
    const userId = searchParams.get('userId') || ''
    const spaceId = searchParams.get('spaceId') || ''

    const { db } = await connectToDatabase()

    // Construire la requête de filtre
    const filter: any = {}

    // Filtrer par utilisateur pour les clients
    if (session.user.role === 'client') {
      filter.userId = session.user.id
    } else if (userId) {
      filter.userId = userId
    }

    if (status) {
      filter.status = status
    }

    if (spaceId) {
      filter.spaceId = spaceId
    }

    // Pagination
    const skip = (page - 1) * limit

    const [reservations, total] = await Promise.all([
      db
        .collection('bookings')
        .aggregate([
          { $match: filter },
          {
            $lookup: {
              from: 'spaces',
              localField: 'spaceId',
              foreignField: '_id',
              as: 'space',
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $project: {
              'user.password': 0,
              'user.email': session.user.role === 'client' ? 0 : 1,
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ])
        .toArray(),
      db.collection('bookings').countDocuments(filter),
    ])

    return NextResponse.json({
      reservations,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    })
  } catch (error) {
    console.error('Erreur récupération réservations:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { spaceId, startTime, endTime, notes } = data

    if (!spaceId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Les champs spaceId, startTime et endTime sont requis' },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = require('mongodb')

    // Vérifier que l'espace existe
    const space = await db
      .collection('spaces')
      .findOne({ _id: new ObjectId(spaceId) })

    if (!space) {
      return NextResponse.json({ error: 'Espace non trouvé' }, { status: 404 })
    }

    // Vérifier les conflits de réservation
    const startDate = new Date(startTime)
    const endDate = new Date(endTime)

    const conflictingReservation = await db.collection('bookings').findOne({
      spaceId: new ObjectId(spaceId),
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          startTime: { $lt: endDate },
          endTime: { $gt: startDate },
        },
      ],
    })

    if (conflictingReservation) {
      return NextResponse.json(
        {
          error:
            'Créneau non disponible - conflit avec une réservation existante',
        },
        { status: 400 }
      )
    }

    // Calculer le prix
    const duration =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60) // en heures
    const totalPrice = duration * space.pricePerHour

    // Créer la réservation
    const reservation = {
      userId: new ObjectId(session.user.id),
      spaceId: new ObjectId(spaceId),
      startTime: startDate,
      endTime: endDate,
      duration,
      totalPrice,
      notes: notes || '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('bookings').insertOne(reservation)

    return NextResponse.json(
      {
        reservation: { ...reservation, _id: result.insertedId },
        message: 'Réservation créée avec succès',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur création réservation:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
