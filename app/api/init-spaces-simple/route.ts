import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

// Espaces par défaut à insérer
const defaultSpaces = [
  {
    id: 'places',
    name: 'Places',
    location: 'Rez-de-chaussée',
    capacity: 12,
    pricePerHour: 8,
    pricePerDay: 35,
    pricePerWeek: 149,
    pricePerMonth: 399,
    features: [
      'WiFi Fibre',
      'Prises électriques',
      'Vue sur rue',
      'Accès boissons',
      'Ambiance café',
    ],
    image: 'bg-gradient-to-br from-coffee-primary to-coffee-accent',
    available: true,
    rating: 4.8,
    specialty: 'Ambiance café conviviale',
    isPopular: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'verriere',
    name: 'Salle Verrière',
    location: 'Niveau intermédiaire',
    capacity: 8,
    pricePerHour: 12,
    pricePerDay: 45,
    pricePerWeek: 189,
    pricePerMonth: 499,
    features: [
      'Lumière naturelle',
      'Espace privé',
      'Tableau blanc',
      'Climatisation',
      'Calme',
    ],
    image: 'bg-gradient-to-br from-blue-400 to-indigo-600',
    available: true,
    rating: 4.9,
    specialty: 'Luminosité naturelle',
    isPopular: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'etage',
    name: 'Étage',
    location: 'Premier étage',
    capacity: 15,
    pricePerHour: 10,
    pricePerDay: 40,
    pricePerWeek: 169,
    pricePerMonth: 449,
    features: [
      'Zone silencieuse',
      'Écrans partagés',
      'Salon détente',
      'Vue dégagée',
      'Concentration',
    ],
    image: 'bg-gradient-to-br from-green-400 to-emerald-600',
    available: true,
    rating: 4.7,
    specialty: 'Calme et concentration',
    isPopular: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

/**
 * POST /api/init-spaces-simple
 * Initialise les espaces par défaut dans la base de données
 */
export async function POST() {
  try {
    console.log('🔄 Connexion à MongoDB...')

    const { db } = await connectToDatabase()
    const spacesCollection = db.collection('spaces')

    console.log('🔄 Vérification des espaces existants...')

    // Vérifier si des espaces existent déjà
    const existingSpacesCount = await spacesCollection.countDocuments()

    if (existingSpacesCount > 0) {
      console.log(`ℹ️  ${existingSpacesCount} espace(s) déjà présent(s)`)
      return NextResponse.json({
        message: `${existingSpacesCount} espace(s) déjà présent(s)`,
        existingCount: existingSpacesCount,
      })
    }

    console.log('🔄 Insertion des espaces par défaut...')

    // Insérer les espaces par défaut
    const result = await spacesCollection.insertMany(defaultSpaces)

    console.log(`✅ ${result.insertedCount} espace(s) inséré(s) avec succès`)

    return NextResponse.json({
      message: `${result.insertedCount} espace(s) initialisé(s) avec succès`,
      spaces: defaultSpaces.map((space, index) => ({
        ...space,
        _id: result.insertedIds[index],
      })),
    })
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation des espaces:", error)

    return NextResponse.json(
      {
        error: "Erreur lors de l'initialisation des espaces",
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
