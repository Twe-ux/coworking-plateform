import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import { Space, type ISpace, type CreateSpaceData, insertDefaultSpaces } from '@/lib/models'

// Schema de validation pour les query parameters
const getSpacesQuerySchema = z.object({
  specialty: z.enum(['Café coworking', 'Salle privée', 'Zone silencieuse']).optional(),
  minCapacity: z.string().transform(val => parseInt(val)).refine(val => val > 0 && val <= 100, 'Capacité invalide').optional(),
  available: z.string().transform(val => val === 'true').optional(),
  popular: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional(),
  limit: z.string().transform(val => parseInt(val) || 20).refine(val => val <= 50, 'Limite trop élevée').optional(),
  offset: z.string().transform(val => parseInt(val) || 0).refine(val => val >= 0, 'Offset invalide').optional()
})

// Schema pour la création d'espaces (admin uniquement)
const createSpaceSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  name: z.string().min(1, 'Nom requis').max(100, 'Nom trop long'),
  location: z.string().min(1, 'Localisation requise').max(200, 'Localisation trop longue'),
  capacity: z.number().min(1, 'Capacité minimale: 1').max(100, 'Capacité maximale: 100'),
  pricePerHour: z.number().min(0, 'Prix invalide'),
  pricePerDay: z.number().min(0, 'Prix invalide'),
  pricePerWeek: z.number().min(0, 'Prix invalide'),
  pricePerMonth: z.number().min(0, 'Prix invalide'),
  features: z.array(z.string().max(50, 'Feature trop longue')),
  image: z.string().url('URL d\'image invalide').or(z.string().startsWith('/', 'Chemin d\'image invalide')),
  specialty: z.enum(['Café coworking', 'Salle privée', 'Zone silencieuse']),
  description: z.string().max(1000, 'Description trop longue').optional(),
  amenities: z.array(z.string().max(50, 'Amenity trop longue')).optional(),
  isPopular: z.boolean().optional()
})

/**
 * GET /api/spaces - Liste publique des espaces disponibles
 * Pas d'authentification requise - endpoint public
 */
export async function GET(request: NextRequest) {
  try {
    // Parser les query parameters
    const { searchParams } = new URL(request.url)
    const queryValidation = getSpacesQuerySchema.safeParse({
      specialty: searchParams.get('specialty'),
      minCapacity: searchParams.get('minCapacity'),
      available: searchParams.get('available'),
      popular: searchParams.get('popular'),
      search: searchParams.get('search'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        { 
          error: 'Paramètres de requête invalides', 
          code: 'QUERY_VALIDATION_ERROR',
          details: queryValidation.error.errors
        },
        { status: 400 }
      )
    }

    const { specialty, minCapacity, available, popular, search, limit = 20, offset = 0 } = queryValidation.data

    // Connexion à la base de données
    await connectToDatabase()
    
    // S'assurer que les espaces par défaut existent
    await insertDefaultSpaces()

    // Construire la requête de filtre
    const query: any = {}

    // Filtrer par disponibilité générale
    if (available) {
      query.available = true
    }

    // Filtrer par spécialité
    if (specialty) {
      query.specialty = specialty
    }

    // Filtrer par capacité minimale
    if (minCapacity) {
      query.capacity = { $gte: minCapacity }
    }

    // Filtrer par popularité
    if (popular) {
      query.isPopular = true
    }

    // Recherche textuelle dans nom, location et description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // Compter le total pour la pagination
    const total = await Space.countDocuments(query)

    // Récupérer les espaces avec pagination
    const spaces = await Space.find(query)
      .sort({ isPopular: -1, rating: -1, name: 1 }) // Populaires d'abord, puis par note et nom
      .skip(offset)
      .limit(limit)
      .select('id name location capacity specialty image features rating description amenities isPopular pricePerHour pricePerDay pricePerWeek pricePerMonth available openingHours') // Sélectionner les champs nécessaires
      .lean() // Optimisation pour la lecture seule

    // Formater les données pour la réponse publique
    const formattedSpaces = spaces.map((space: any) => ({
      id: space.id,
      name: space.name,
      location: space.location,
      capacity: space.capacity,
      specialty: space.specialty,
      image: space.image,
      features: space.features,
      rating: space.rating,
      description: space.description,
      amenities: space.amenities,
      isPopular: space.isPopular,
      available: space.available,
      pricing: {
        perHour: space.pricePerHour,
        perDay: space.pricePerDay,
        perWeek: space.pricePerWeek,
        perMonth: space.pricePerMonth
      },
      openingHours: space.openingHours,
      // Propriétés calculées
      isOpen: space.isOpen // Virtual field from schema
    }))

    return NextResponse.json({
      spaces: formattedSpaces,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      filters: {
        specialty,
        minCapacity,
        available,
        popular,
        search
      }
    })

  } catch (error) {
    console.error('[GET /api/spaces] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des espaces', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/spaces - Créer un nouvel espace (Admin uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et les droits
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Vérifier les droits administrateur
    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Droits administrateur requis', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Parser et valider les données
    const body = await request.json()
    const validationResult = createSpaceSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const spaceData: CreateSpaceData = validationResult.data

    await connectToDatabase()

    // Vérifier l'unicité de l'ID
    const existingSpace = await Space.findOne({ id: spaceData.id })
    if (existingSpace) {
      return NextResponse.json(
        { error: 'Un espace avec cet ID existe déjà', code: 'DUPLICATE_ID' },
        { status: 409 }
      )
    }

    // Créer le nouvel espace
    const newSpace = new Space({
      ...spaceData,
      available: true, // Nouveau espaces disponibles par défaut
      rating: 4.5 // Note par défaut
    })

    await newSpace.save()

    console.log(`[SPACE_CREATED] Admin ${session.user.id} created space ${newSpace.id}`);

    return NextResponse.json(
      { 
        message: 'Espace créé avec succès',
        space: {
          id: newSpace.id,
          name: newSpace.name,
          location: newSpace.location,
          capacity: newSpace.capacity,
          specialty: newSpace.specialty,
          available: newSpace.available,
          createdAt: newSpace.createdAt.toISOString()
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('[POST /api/spaces] Error:', error)
    
    // Gestion des erreurs spécifiques
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'ID d\'espace déjà utilisé', code: 'DUPLICATE_ERROR' },
          { status: 409 }
        )
      }
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { error: 'Erreur de validation des données', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'espace', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}