/**
 * Utilitaires pour le système de suivi du temps de travail
 */

import type { TimeEntry, TimeEntryStatus, ShiftNumber } from '@/types/timeEntry'

/**
 * Formate une durée en heures en format lisible
 * @param hours - Nombre d'heures (peut être décimal)
 * @returns Format "Xh Ym" ou "Xh" si pas de minutes
 */
export function formatDuration(hours: number): string {
  if (!hours || hours < 0) return '0h'
  
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  
  if (minutes === 0) {
    return `${wholeHours}h`
  }
  
  return `${wholeHours}h ${minutes}m`
}

/**
 * Calcule la différence en heures entre deux dates
 * @param start - Date de début
 * @param end - Date de fin
 * @returns Nombre d'heures (décimal)
 */
export function calculateHoursDifference(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime()
  return Math.max(0, diffMs / (1000 * 60 * 60))
}

/**
 * Vérifie si une date est aujourd'hui
 * @param date - Date à vérifier
 * @returns true si la date est aujourd'hui
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Obtient le début de la journée pour une date donnée
 * @param date - Date source
 * @returns Nouvelle date au début de la journée (00:00:00)
 */
export function getStartOfDay(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Obtient la fin de la journée pour une date donnée
 * @param date - Date source
 * @returns Nouvelle date à la fin de la journée (23:59:59)
 */
export function getEndOfDay(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

/**
 * Valide qu'un PIN est au bon format
 * @param pin - PIN à valider
 * @returns true si le PIN est valide
 */
export function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}

/**
 * Détermine le statut d'affichage d'un shift
 * @param timeEntry - Entrée de temps
 * @returns Objet avec statut et couleur pour l'affichage
 */
export function getShiftDisplayStatus(timeEntry: TimeEntry): {
  status: string
  color: string
  badge: string
} {
  if (timeEntry.status === 'active') {
    return {
      status: 'En cours',
      color: 'text-green-600 bg-green-100',
      badge: 'green'
    }
  }
  
  if (timeEntry.status === 'completed') {
    return {
      status: 'Terminé',
      color: 'text-gray-600 bg-gray-100',
      badge: 'gray'
    }
  }
  
  return {
    status: 'Inconnu',
    color: 'text-gray-400 bg-gray-50',
    badge: 'gray'
  }
}

/**
 * Calcule les statistiques pour une liste de time entries
 * @param timeEntries - Liste des entrées de temps
 * @returns Statistiques calculées
 */
export function calculateTimeEntryStats(timeEntries: TimeEntry[]): {
  totalHours: number
  totalShifts: number
  activeShifts: number
  completedShifts: number
  averageHoursPerShift: number
} {
  const totalShifts = timeEntries.length
  const activeShifts = timeEntries.filter(entry => entry.status === 'active').length
  const completedShifts = timeEntries.filter(entry => entry.status === 'completed').length
  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0)
  const averageHoursPerShift = completedShifts > 0 ? totalHours / completedShifts : 0

  return {
    totalHours,
    totalShifts,
    activeShifts,
    completedShifts,
    averageHoursPerShift,
  }
}

/**
 * Groupe les time entries par date
 * @param timeEntries - Liste des entrées de temps
 * @returns Map groupée par date (string YYYY-MM-DD)
 */
export function groupTimeEntriesByDate(timeEntries: TimeEntry[]): Map<string, TimeEntry[]> {
  const grouped = new Map<string, TimeEntry[]>()
  
  timeEntries.forEach(entry => {
    const dateKey = entry.date.toISOString().split('T')[0]
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(entry)
  })
  
  return grouped
}

/**
 * Groupe les time entries par employé
 * @param timeEntries - Liste des entrées de temps
 * @returns Map groupée par employé ID
 */
export function groupTimeEntriesByEmployee(timeEntries: TimeEntry[]): Map<string, TimeEntry[]> {
  const grouped = new Map<string, TimeEntry[]>()
  
  timeEntries.forEach(entry => {
    const employeeId = entry.employeeId
    if (!grouped.has(employeeId)) {
      grouped.set(employeeId, [])
    }
    grouped.get(employeeId)!.push(entry)
  })
  
  return grouped
}

/**
 * Valide qu'une plage horaire est logique
 * @param clockIn - Heure d'arrivée
 * @param clockOut - Heure de départ
 * @returns true si la plage est valide
 */
export function validateTimeRange(clockIn: Date, clockOut: Date | null): boolean {
  if (!clockOut) return true // clockOut peut être null pour un shift actif
  return clockOut.getTime() > clockIn.getTime()
}

/**
 * Calcule le temps de travail restant pour atteindre un objectif
 * @param currentHours - Heures actuellement travaillées
 * @param targetHours - Heures cibles
 * @returns Heures restantes (peut être négatif si objectif dépassé)
 */
export function calculateRemainingHours(currentHours: number, targetHours: number): number {
  return targetHours - currentHours
}

/**
 * Formate une date au format français
 * @param date - Date à formater
 * @returns Date formatée (ex: "15/03/2024")
 */
export function formatDateFR(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR').format(date)
}

/**
 * Formate une heure au format français
 * @param date - Date contenant l'heure à formater
 * @returns Heure formatée (ex: "14:30")
 */
export function formatTimeFR(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Formate une date et heure complète
 * @param date - Date à formater
 * @returns Date et heure formatées (ex: "15/03/2024 à 14:30")
 */
export function formatDateTimeFR(date: Date): string {
  return `${formatDateFR(date)} à ${formatTimeFR(date)}`
}

/**
 * Détermine si un shift est considéré comme long
 * @param hours - Nombre d'heures du shift
 * @returns true si le shift est long (> 8h)
 */
export function isLongShift(hours: number): boolean {
  return hours > 8
}

/**
 * Détermine si un shift est considéré comme court
 * @param hours - Nombre d'heures du shift
 * @returns true si le shift est court (< 4h)
 */
export function isShortShift(hours: number): boolean {
  return hours < 4
}

/**
 * Génère un ID de shift unique pour l'affichage
 * @param employeeId - ID de l'employé
 * @param date - Date du shift
 * @param shiftNumber - Numéro du shift
 * @returns ID unique du shift
 */
export function generateShiftId(employeeId: string, date: Date, shiftNumber: ShiftNumber): string {
  const dateStr = date.toISOString().split('T')[0]
  return `${employeeId}-${dateStr}-${shiftNumber}`
}

/**
 * Extrait les informations d'un ID de shift
 * @param shiftId - ID du shift généré par generateShiftId
 * @returns Objet avec les informations extraites ou null si invalide
 */
export function parseShiftId(shiftId: string): {
  employeeId: string
  date: Date
  shiftNumber: ShiftNumber
} | null {
  const parts = shiftId.split('-')
  if (parts.length < 4) return null
  
  const employeeId = parts.slice(0, -2).join('-')
  const dateStr = parts[parts.length - 2]
  const shiftNumber = parseInt(parts[parts.length - 1]) as ShiftNumber
  
  if (!validatePin(employeeId) && employeeId.length < 10) return null
  if (![1, 2].includes(shiftNumber)) return null
  
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null
  
  return { employeeId, date, shiftNumber }
}