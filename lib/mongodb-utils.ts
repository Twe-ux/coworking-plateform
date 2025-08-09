import { ObjectId } from 'mongodb'
import { startOfDay, endOfDay, format, addMinutes, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { connectMongoose } from './mongoose'
import { Booking, IBooking } from './models/booking'
import { Space, ISpace } from './models/space'

// Interface pour les créneaux horaires disponibles
export interface TimeSlot {
  start: string
  end: string
  available: boolean
  duration: number // en minutes
}

// Interface pour les conflits de réservation
export interface BookingConflict {
  conflictingBooking: IBooking
  reason: string
}

// Interface pour les statistiques d'occupation
export interface OccupancyStats {
  spaceId: string
  spaceName: string
  date: string
  totalSlots: number
  occupiedSlots: number
  occupancyRate: number
  revenue: number
}

/**
 * Vérifie s'il y a des conflits pour une nouvelle réservation
 * @param spaceId - ID de l'espace
 * @param date - Date de la réservation
 * @param startTime - Heure de début (format HH:mm)
 * @param endTime - Heure de fin (format HH:mm)
 * @param excludeBookingId - ID de réservation à exclure (pour les modifications)
 * @returns Promise<BookingConflict[]> - Liste des conflits détectés
 */
export async function checkBookingConflicts(
  spaceId: string | ObjectId,
  date: Date,
  startTime: string,
  endTime: string,
  excludeBookingId?: string | ObjectId
): Promise<BookingConflict[]> {
  try {
    await connectMongoose()

    // Convertir spaceId en ObjectId si nécessaire
    const spaceObjectId = typeof spaceId === 'string' ? new ObjectId(spaceId) : spaceId

    // Construire la requête de base
    const query: any = {
      spaceId: spaceObjectId,
      date: {
        $gte: startOfDay(date),
        $lte: endOfDay(date),
      },
      status: { $in: ['pending', 'confirmed'] },
    }

    // Exclure une réservation spécifique (utile pour les modifications)
    if (excludeBookingId) {
      const excludeObjectId = typeof excludeBookingId === 'string' ? new ObjectId(excludeBookingId) : excludeBookingId
      query._id = { $ne: excludeObjectId }
    }

    // Trouver les réservations existantes
    const existingBookings = await Booking.find(query).sort({ startTime: 1 })

    const conflicts: BookingConflict[] = []
    const newStartMinutes = timeToMinutes(startTime)
    const newEndMinutes = timeToMinutes(endTime)

    for (const booking of existingBookings) {
      const existingStartMinutes = timeToMinutes(booking.startTime)
      const existingEndMinutes = timeToMinutes(booking.endTime)

      // Vérifier les chevauchements
      const hasOverlap = !(
        newEndMinutes <= existingStartMinutes || newStartMinutes >= existingEndMinutes
      )

      if (hasOverlap) {
        let reason = `Conflit avec la réservation ${booking._id}`
        
        if (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes) {
          reason = `Chevauchement de ${Math.max(newStartMinutes, existingStartMinutes)} à ${Math.min(newEndMinutes, existingEndMinutes)} minutes`
        }

        conflicts.push({
          conflictingBooking: booking,
          reason,
        })
      }
    }

    return conflicts
  } catch (error) {
    console.error('Erreur lors de la vérification des conflits:', error)
    throw new Error('Impossible de vérifier les conflits de réservation')
  }
}

/**
 * Obtient les créneaux horaires disponibles pour un espace à une date donnée
 * @param spaceId - ID de l'espace
 * @param date - Date concernée
 * @param slotDuration - Durée de chaque créneau en minutes (défaut: 60)
 * @returns Promise<TimeSlot[]> - Liste des créneaux disponibles
 */
export async function getAvailableTimeSlots(
  spaceId: string | ObjectId,
  date: Date,
  slotDuration: number = 60
): Promise<TimeSlot[]> {
  try {
    await connectMongoose()

    // Récupérer l'espace pour connaître les heures d'ouverture
    const space = await Space.findOne({
      $or: [
        { _id: typeof spaceId === 'string' ? new ObjectId(spaceId) : spaceId },
        { id: spaceId.toString() }
      ]
    })

    if (!space) {
      throw new Error('Espace non trouvé')
    }

    // Déterminer les heures d'ouverture pour cette date
    const dayName = getDayName(date)
    const openingHours = space.openingHours?.[dayName]

    if (!openingHours || openingHours.closed) {
      return [] // L'espace est fermé ce jour-là
    }

    const openMinutes = timeToMinutes(openingHours.open)
    const closeMinutes = timeToMinutes(openingHours.close)

    // Générer tous les créneaux possibles
    const allSlots: TimeSlot[] = []
    for (let minutes = openMinutes; minutes < closeMinutes; minutes += slotDuration) {
      const slotEnd = Math.min(minutes + slotDuration, closeMinutes)
      
      allSlots.push({
        start: minutesToTime(minutes),
        end: minutesToTime(slotEnd),
        available: true,
        duration: slotEnd - minutes,
      })
    }

    // Récupérer les réservations existantes pour cette date
    const spaceObjectId = typeof spaceId === 'string' ? new ObjectId(spaceId) : spaceId
    const existingBookings = await Booking.find({
      spaceId: spaceObjectId,
      date: {
        $gte: startOfDay(date),
        $lte: endOfDay(date),
      },
      status: { $in: ['pending', 'confirmed'] },
    }).sort({ startTime: 1 })

    // Marquer les créneaux occupés
    for (const slot of allSlots) {
      const slotStartMinutes = timeToMinutes(slot.start)
      const slotEndMinutes = timeToMinutes(slot.end)

      for (const booking of existingBookings) {
        const bookingStartMinutes = timeToMinutes(booking.startTime)
        const bookingEndMinutes = timeToMinutes(booking.endTime)

        // Vérifier le chevauchement
        const hasOverlap = !(
          slotEndMinutes <= bookingStartMinutes || slotStartMinutes >= bookingEndMinutes
        )

        if (hasOverlap) {
          slot.available = false
          break
        }
      }
    }

    return allSlots
  } catch (error) {
    console.error('Erreur lors de la récupération des créneaux:', error)
    throw new Error('Impossible de récupérer les créneaux disponibles')
  }
}

/**
 * Calcule les statistiques d'occupation pour un espace et une date donnée
 * @param spaceId - ID de l'espace
 * @param date - Date concernée
 * @returns Promise<OccupancyStats> - Statistiques d'occupation
 */
export async function getOccupancyStats(
  spaceId: string | ObjectId,
  date: Date
): Promise<OccupancyStats> {
  try {
    await connectMongoose()

    // Récupérer l'espace
    const space = await Space.findOne({
      $or: [
        { _id: typeof spaceId === 'string' ? new ObjectId(spaceId) : spaceId },
        { id: spaceId.toString() }
      ]
    })

    if (!space) {
      throw new Error('Espace non trouvé')
    }

    // Récupérer tous les créneaux possibles
    const allSlots = await getAvailableTimeSlots(spaceId, date, 60)
    const totalSlots = allSlots.length
    const occupiedSlots = allSlots.filter(slot => !slot.available).length

    // Calculer les revenus pour cette date
    const spaceObjectId = typeof spaceId === 'string' ? new ObjectId(spaceId) : spaceId
    const bookings = await Booking.find({
      spaceId: spaceObjectId,
      date: {
        $gte: startOfDay(date),
        $lte: endOfDay(date),
      },
      status: { $in: ['confirmed', 'completed'] },
    })

    const revenue = bookings.reduce((total, booking) => total + booking.totalPrice, 0)

    return {
      spaceId: space.id,
      spaceName: space.name,
      date: format(date, 'yyyy-MM-dd'),
      totalSlots,
      occupiedSlots,
      occupancyRate: totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0,
      revenue,
    }
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error)
    throw new Error('Impossible de calculer les statistiques d\'occupation')
  }
}

/**
 * Trouve les créneaux libres consécutifs d'une durée minimum
 * @param spaceId - ID de l'espace
 * @param date - Date concernée
 * @param minimumDuration - Durée minimum en minutes
 * @returns Promise<TimeSlot[]> - Créneaux libres consécutifs
 */
export async function findConsecutiveFreeSlots(
  spaceId: string | ObjectId,
  date: Date,
  minimumDuration: number
): Promise<TimeSlot[]> {
  try {
    const allSlots = await getAvailableTimeSlots(spaceId, date, 30) // Créneaux de 30 minutes pour plus de précision
    const consecutiveSlots: TimeSlot[] = []

    let currentBlock: TimeSlot[] = []

    for (const slot of allSlots) {
      if (slot.available) {
        currentBlock.push(slot)
      } else {
        // Fin d'un bloc libre, vérifier s'il respecte la durée minimum
        if (currentBlock.length > 0) {
          const totalDuration = currentBlock.reduce((sum, s) => sum + s.duration, 0)
          if (totalDuration >= minimumDuration) {
            consecutiveSlots.push({
              start: currentBlock[0].start,
              end: currentBlock[currentBlock.length - 1].end,
              available: true,
              duration: totalDuration,
            })
          }
        }
        currentBlock = []
      }
    }

    // Vérifier le dernier bloc
    if (currentBlock.length > 0) {
      const totalDuration = currentBlock.reduce((sum, s) => sum + s.duration, 0)
      if (totalDuration >= minimumDuration) {
        consecutiveSlots.push({
          start: currentBlock[0].start,
          end: currentBlock[currentBlock.length - 1].end,
          available: true,
          duration: totalDuration,
        })
      }
    }

    return consecutiveSlots
  } catch (error) {
    console.error('Erreur lors de la recherche de créneaux consécutifs:', error)
    throw new Error('Impossible de trouver les créneaux libres consécutifs')
  }
}

/**
 * Valide les données d'une réservation
 * @param bookingData - Données de la réservation à valider
 * @returns Promise<{ isValid: boolean; errors: string[] }>
 */
export async function validateBookingData(bookingData: {
  spaceId: string | ObjectId
  date: Date
  startTime: string
  endTime: string
  guests: number
  durationType: 'hour' | 'day' | 'week' | 'month'
}): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = []

  try {
    // Vérifier que l'espace existe - recherche flexible par _id ou id
    let spaceQuery: any

    if (bookingData.spaceId instanceof ObjectId) {
      // Si c'est un ObjectId, rechercher par _id
      spaceQuery = { _id: bookingData.spaceId }
    } else if (typeof bookingData.spaceId === 'string') {
      if (ObjectId.isValid(bookingData.spaceId)) {
        // String qui ressemble à un ObjectId - chercher par _id ET id
        spaceQuery = {
          $or: [
            { _id: new ObjectId(bookingData.spaceId) },
            { id: bookingData.spaceId }
          ]
        }
      } else {
        // String normal - chercher par id
        spaceQuery = { id: bookingData.spaceId }
      }
    } else {
      // Fallback - convertir en string et chercher par id
      spaceQuery = { id: String(bookingData.spaceId) }
    }
    
    const space = await Space.findOne(spaceQuery)

    if (!space) {
      errors.push('Espace non trouvé')
      return { isValid: false, errors }
    }

    // Vérifier que l'espace est disponible
    if (!space.available) {
      errors.push('Cet espace n\'est actuellement pas disponible')
    }

    // Vérifier la capacité
    if (bookingData.guests > space.capacity) {
      errors.push(`Le nombre d'invités (${bookingData.guests}) dépasse la capacité de l'espace (${space.capacity})`)
    }

    // Vérifier que la date n'est pas dans le passé
    // Utiliser la timezone française pour une comparaison correcte
    const todayParis = new Date(new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))
    const todayStartParis = startOfDay(todayParis)
    const bookingDateLocal = new Date(bookingData.date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))
    const bookingDayStart = startOfDay(bookingDateLocal)
    
    console.log('📅 [Validation Date] Comparaison:', {
      todayParis: todayParis.toISOString(),
      todayStartParis: todayStartParis.toISOString(),
      bookingDate: bookingData.date.toISOString(),
      bookingDateLocal: bookingDateLocal.toISOString(),
      bookingDayStart: bookingDayStart.toISOString(),
      isPast: bookingDayStart < todayStartParis
    })
    
    if (bookingDayStart < todayStartParis) {
      errors.push('La date ne peut pas être dans le passé')
    }

    // Debug: vérifier les valeurs reçues
    console.log('🕐 Validation heures:', {
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      startTimeType: typeof bookingData.startTime,
      endTimeType: typeof bookingData.endTime
    })

    // Vérifier le format des heures
    if (!isValidTimeFormat(bookingData.startTime)) {
      errors.push('Format d\'heure de début invalide')
    }

    if (!isValidTimeFormat(bookingData.endTime)) {
      errors.push('Format d\'heure de fin invalide')
    }

    // Vérifier que l'heure de fin est après l'heure de début (seulement si les heures sont valides)
    if (bookingData.startTime && bookingData.endTime && 
        isValidTimeFormat(bookingData.startTime) && isValidTimeFormat(bookingData.endTime)) {
      if (timeToMinutes(bookingData.endTime) <= timeToMinutes(bookingData.startTime)) {
        errors.push('L\'heure de fin doit être après l\'heure de début')
      }
    }

    // Vérifier les heures d'ouverture
    const dayName = getDayName(bookingData.date)
    const openingHours = space.openingHours?.[dayName]
    
    console.log('🏪 Debug heures d\'ouverture:', {
      dayName,
      openingHours,
      spaceHasOpeningHours: !!space.openingHours,
      allOpeningHours: space.openingHours,
      spaceId: bookingData.spaceId,
      spaceName: space.name
    })

    if (openingHours && !openingHours.closed) {
      // Vérifier que les heures sont définies avant de les traiter
      if (!openingHours.open || !openingHours.close) {
        console.log('⚠️ Heures d\'ouverture manquantes pour', space.name, ':', openingHours)
        console.log('📋 Données complètes espace:', {
          id: space.id,
          _id: space._id,
          name: space.name,
          openingHours: space.openingHours
        })
        // Ignorer la validation des heures d'ouverture si elles ne sont pas définies
      } else {
        const openMinutes = timeToMinutes(openingHours.open)
        const closeMinutes = timeToMinutes(openingHours.close)
        const startMinutes = timeToMinutes(bookingData.startTime)
        const endMinutes = timeToMinutes(bookingData.endTime)

        if (startMinutes < openMinutes || endMinutes > closeMinutes) {
          errors.push(`L'horaire doit être entre ${openingHours.open} et ${openingHours.close}`)
        }
      }
    } else if (openingHours?.closed) {
      errors.push('L\'espace est fermé ce jour-là')
    }

    // Vérifier les conflits de réservation
    const conflicts = await checkBookingConflicts(
      bookingData.spaceId,
      bookingData.date,
      bookingData.startTime,
      bookingData.endTime
    )

    if (conflicts.length > 0) {
      errors.push('Créneau déjà réservé pour cette période')
    }

    if (errors.length > 0) {
      console.log('❌ Erreurs de validation:', errors)
    }

    return { isValid: errors.length === 0, errors }
  } catch (error) {
    console.error('Erreur lors de la validation:', error)
    errors.push('Erreur lors de la validation des données')
    return { isValid: false, errors }
  }
}

// Fonctions utilitaires

/**
 * Convertit une heure au format HH:mm en minutes depuis minuit
 */
function timeToMinutes(time: string): number {
  if (!time || typeof time !== 'string') {
    throw new Error(`timeToMinutes: time invalide - reçu: ${time}`)
  }
  const parts = time.split(':')
  if (parts.length !== 2) {
    throw new Error(`timeToMinutes: format invalide - reçu: ${time}`)
  }
  const [hours, minutes] = parts.map(Number)
  return hours * 60 + minutes
}

/**
 * Convertit les minutes depuis minuit en format HH:mm
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Obtient le nom du jour pour les heures d'ouverture
 * Utilise l'heure locale française pour éviter les problèmes de timezone
 */
function getDayName(date: Date): 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  
  // Créer une nouvelle date en heure locale française
  // pour éviter les décalages UTC
  const localDate = new Date(date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))
  const dayIndex = localDate.getDay()
  
  console.log('📅 [getDayName] Conversion timezone:', {
    originalDate: date,
    originalUTC: date.toISOString(),
    localDateParis: localDate,
    originalDayIndex: date.getDay(),
    localDayIndex: dayIndex,
    originalDayName: days[date.getDay()],
    localDayName: days[dayIndex]
  })
  
  return days[dayIndex] as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
}

/**
 * Valide le format d'une heure (HH:mm)
 */
function isValidTimeFormat(time: string): boolean {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)
}

/**
 * Calcule le prix d'une réservation
 */
export function calculateBookingPrice(
  space: ISpace,
  duration: number,
  durationType: 'hour' | 'day' | 'week' | 'month'
): number {
  return space.getPriceForDuration(duration, durationType)
}

/**
 * Génère un rapport d'occupation pour une période donnée
 */
export async function generateOccupancyReport(
  startDate: Date,
  endDate: Date,
  spaceIds?: string[]
): Promise<OccupancyStats[]> {
  try {
    await connectMongoose()

    const report: OccupancyStats[] = []
    let spacesToAnalyze: ISpace[]

    if (spaceIds && spaceIds.length > 0) {
      spacesToAnalyze = await Space.find({ 
        $or: [
          { _id: { $in: spaceIds.map(id => new ObjectId(id)) } },
          { id: { $in: spaceIds } }
        ]
      })
    } else {
      spacesToAnalyze = await Space.find({ available: true })
    }

    for (const space of spacesToAnalyze) {
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const stats = await getOccupancyStats(space._id, currentDate)
        report.push(stats)
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    return report
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error)
    throw new Error('Impossible de générer le rapport d\'occupation')
  }
}