import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Space from '@/lib/models/space'

/**
 * API publique pour récupérer les espaces disponibles
 * Utilisée par le système de réservation
 */
export async function GET() {
  try {
    await dbConnect()

    // Récupérer seulement les espaces disponibles
    const spaces = await Space.find({ available: true })
      .select('id name location capacity pricePerHour pricePerDay pricePerWeek pricePerMonth features amenities image rating specialty isPopular description openingHours color')
      .sort({ isPopular: -1, rating: -1 })
      .lean()

    // Formater les données pour l'interface de réservation
    const formattedSpaces = spaces.map(space => ({
      id: space.id,
      name: space.name,
      location: space.location,
      capacity: space.capacity,
      pricePerHour: space.pricePerHour,
      pricePerDay: space.pricePerDay,
      pricePerWeek: space.pricePerWeek,
      pricePerMonth: space.pricePerMonth,
      features: space.features || [],
      amenities: space.amenities || [],
      image: space.image,
      rating: space.rating,
      specialty: space.specialty,
      isPopular: space.isPopular,
      description: space.description || '',
      color: space.color || 'from-coffee-primary to-coffee-accent',
      openingHours: space.openingHours
    }))

    return NextResponse.json({
      success: true,
      data: formattedSpaces,
      count: formattedSpaces.length
    })

  } catch (error: any) {
    console.error('❌ Erreur API Spaces publique:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des espaces',
        details: error.message 
      },
      { status: 500 }
    )
  }
}