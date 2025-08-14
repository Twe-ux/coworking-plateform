import { connectToDatabase } from '@/lib/mongodb'
import TimeEntry from '@/lib/models/timeEntry'

/**
 * Fonction pour réinitialiser les shifts actifs à minuit
 * Cette fonction doit être appelée par un cron job à 00:00 chaque jour
 */
export async function resetActiveShiftsAtMidnight() {
  try {
    await connectToDatabase()

    // Récupérer tous les shifts actifs de la veille (avant minuit)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(23, 59, 59, 999)

    const activeShifts = await TimeEntry.find({
      status: 'active',
      clockIn: { $lte: yesterday },
      isActive: true,
    })

    console.log(
      `🔄 Réinitialisation: ${activeShifts.length} shifts actifs trouvés`
    )

    // Pour chaque shift actif, le marquer comme incomplet et calculer les heures
    for (const shift of activeShifts) {
      // Calculer les heures jusqu'à minuit (23:59:59)
      const endOfDay = new Date(shift.clockIn)
      endOfDay.setHours(23, 59, 59, 999)

      const clockInTime = new Date(shift.clockIn)
      const hoursWorked =
        (endOfDay.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)

      // Mettre à jour le shift
      shift.clockOut = endOfDay
      shift.totalHours = Math.max(0, hoursWorked)
      shift.status = 'completed'
      shift.hasError = true // Marquer comme ayant une erreur
      shift.errorType = 'MISSING_CLOCK_OUT'
      shift.errorMessage =
        "Employé n'a pas pointé la sortie - Réinitialisé automatiquement à minuit"

      await shift.save()

      console.log(
        `✅ Shift réinitialisé pour employé ${shift.employeeId}: ${hoursWorked.toFixed(2)}h`
      )
    }

    console.log(
      `🎯 Réinitialisation terminée: ${activeShifts.length} shifts traités`
    )

    return {
      success: true,
      processedShifts: activeShifts.length,
      message: `${activeShifts.length} shifts actifs réinitialisés`,
    }
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation des shifts:', error)
    throw error
  }
}

/**
 * Fonction pour vérifier et marquer les shifts avec des erreurs
 */
export async function checkShiftErrors() {
  try {
    await connectToDatabase()

    // Trouver les shifts sans clockOut qui sont d'hier ou plus anciens
    const yesterday = new Date()
    yesterday.setHours(0, 0, 0, 0)

    const shiftsWithErrors = await TimeEntry.find({
      status: 'active',
      clockIn: { $lt: yesterday },
      isActive: true,
      hasError: { $ne: true },
    })

    for (const shift of shiftsWithErrors) {
      shift.hasError = true
      shift.errorType = 'MISSING_CLOCK_OUT'
      shift.errorMessage = 'Shift actif détecté sur une date antérieure'
      await shift.save()
    }

    return shiftsWithErrors.length
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des erreurs:', error)
    throw error
  }
}
