import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongodb'
import { 
  Space,
  getAvailableTimeSlots,
  findConsecutiveFreeSlots,
  checkBookingConflicts
} from '@/lib/models'

// Schema de validation pour les paramètres de disponibilité
const availabilityQuerySchema = z.object({
  spaceId: z.string().min(1, 'L\'ID de l\'espace est requis'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Date invalide'),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:mm)').optional(),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:mm)').optional(),
  duration: z.string().transform(val => parseInt(val)).refine(val => val > 0 && val <= 720, 'Durée invalide (1-720 minutes)').optional(),
  slotDuration: z.string().transform(val => parseInt(val) || 60).refine(val => [15, 30, 60, 120].includes(val), 'Durée de créneau invalide (15, 30, 60 ou 120 min)').optional()
})

/**
 * GET /api/bookings/availability - Vérifier la disponibilité d'un espace
 */
export async function GET(request: NextRequest) {
  try {
    // Parser les query parameters
    const { searchParams } = new URL(request.url)
    const queryValidation = availabilityQuerySchema.safeParse({
      spaceId: searchParams.get('spaceId'),
      date: searchParams.get('date'),
      startTime: searchParams.get('startTime'),
      endTime: searchParams.get('endTime'),
      duration: searchParams.get('duration'),
      slotDuration: searchParams.get('slotDuration')
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

    const { spaceId, date, startTime, endTime, duration, slotDuration = 60 } = queryValidation.data

    // Connexion à la base de données
    await connectToDatabase()

    // Vérifier que l'espace existe et est disponible
    const space = await Space.findOne({
      $or: [
        { _id: ObjectId.isValid(spaceId) ? new ObjectId(spaceId) : null },
        { id: spaceId }
      ]
    })

    if (!space) {
      return NextResponse.json(
        { error: 'Espace non trouvé', code: 'SPACE_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (!space.available) {
      return NextResponse.json({
        available: false,
        reason: 'Espace temporairement indisponible',
        timeSlots: [],
        consecutiveSlots: [],
        spaceInfo: {
          id: space.id,
          name: space.name,
          location: space.location,
          available: space.available
        }
      })
    }

    const targetDate = new Date(date)

    // Cas 1: Vérification spécifique d'un créneau (startTime + endTime fournis)
    if (startTime && endTime) {
      const conflicts = await checkBookingConflicts(
        space._id,
        targetDate,
        startTime,
        endTime
      )

      const isAvailable = conflicts.length === 0

      return NextResponse.json({
        available: isAvailable,
        reason: isAvailable ? 'Créneau disponible' : 'Créneau déjà réservé',
        requestedSlot: {
          startTime,
          endTime,
          available: isAvailable
        },
        conflicts: conflicts.map(conflict => ({
          reason: conflict.reason,
          bookingId: conflict.conflictingBooking._id.toString(),
          conflictStartTime: conflict.conflictingBooking.startTime,
          conflictEndTime: conflict.conflictingBooking.endTime
        })),
        spaceInfo: {
          id: space.id,
          name: space.name,
          location: space.location,
          capacity: space.capacity,
          specialty: space.specialty,
          available: space.available
        }
      })
    }

    // Cas 2: Récupération de tous les créneaux disponibles
    const timeSlots = await getAvailableTimeSlots(space._id, targetDate, slotDuration)

    // Cas 3: Si une durée minimale est spécifiée, trouver les créneaux consécutifs
    let consecutiveSlots: any[] = []
    if (duration) {
      const consecutiveSlotsResult = await findConsecutiveFreeSlots(space._id, targetDate, duration)
      consecutiveSlots = consecutiveSlotsResult.map(slot => ({
        startTime: slot.start,
        endTime: slot.end,
        duration: slot.duration,
        available: slot.available
      }))
    }

    // Calculer les statistiques de disponibilité
    const totalSlots = timeSlots.length
    const availableSlots = timeSlots.filter(slot => slot.available).length
    const occupancyRate = totalSlots > 0 ? ((totalSlots - availableSlots) / totalSlots) * 100 : 0

    // Regrouper les créneaux consécutifs libres pour faciliter l'affichage
    const freeBlocks: any[] = []
    let currentBlock: any = null

    for (const slot of timeSlots.filter(s => s.available)) {
      if (!currentBlock) {
        currentBlock = {
          startTime: slot.start,
          endTime: slot.end,
          duration: slot.duration
        }
      } else {
        // Vérifier si ce créneau est consécutif au précédent
        if (slot.start === currentBlock.endTime) {
          currentBlock.endTime = slot.end
          currentBlock.duration += slot.duration
        } else {
          // Nouveau bloc libre
          freeBlocks.push(currentBlock)
          currentBlock = {
            startTime: slot.start,
            endTime: slot.end,
            duration: slot.duration
          }
        }
      }
    }

    // Ajouter le dernier bloc
    if (currentBlock) {
      freeBlocks.push(currentBlock)
    }

    // Informations sur les heures d'ouverture de l'espace pour cette date
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][targetDate.getDay()]
    const openingHours = space.openingHours?.[dayName]

    return NextResponse.json({
      available: availableSlots > 0,
      date: targetDate.toISOString().split('T')[0],
      spaceInfo: {
        id: space.id,
        name: space.name,
        location: space.location,
        capacity: space.capacity,
        specialty: space.specialty,
        image: space.image,
        features: space.features,
        rating: space.rating,
        available: space.available,
        openingHours: openingHours ? {
          open: openingHours.open,
          close: openingHours.close,
          closed: openingHours.closed || false
        } : null
      },
      availability: {
        totalSlots,
        availableSlots,
        occupiedSlots: totalSlots - availableSlots,
        occupancyRate: Math.round(occupancyRate * 100) / 100
      },
      timeSlots: timeSlots.map(slot => ({
        startTime: slot.start,
        endTime: slot.end,
        available: slot.available,
        duration: slot.duration
      })),
      freeBlocks,
      consecutiveSlots: duration ? consecutiveSlots : undefined,
      recommendations: {
        bestAvailability: freeBlocks.length > 0 ? freeBlocks.reduce((max, block) => 
          block.duration > max.duration ? block : max
        ) : null,
        suggestedDuration: duration || (freeBlocks.length > 0 ? freeBlocks[0].duration : slotDuration)
      }
    })

  } catch (error) {
    console.error('[GET /api/bookings/availability] Error:', error)
    
    // Gestion des erreurs spécifiques
    if (error instanceof Error) {
      if (error.message.includes('Espace non trouvé')) {
        return NextResponse.json(
          { error: 'Espace non trouvé', code: 'SPACE_NOT_FOUND' },
          { status: 404 }
        )
      }
      if (error.message.includes('ferme')) {
        return NextResponse.json(
          { 
            available: false, 
            reason: 'Espace fermé ce jour-là',
            code: 'SPACE_CLOSED'
          },
          { status: 200 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de la vérification de disponibilité', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}