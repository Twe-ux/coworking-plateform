'use client'

import { useSpaces } from '@/hooks/useSpaces'
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  CreditCard,
  Info,
  MapPin,
  Star,
  Users,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

// Types for booking flow
interface Space {
  id: string
  name: string
  location: string
  capacity: number
  pricePerHour: number
  pricePerDay: number
  pricePerWeek: number
  pricePerMonth: number
  features: string[]
  image: string
  available: boolean
  rating: number
  specialty: string
  isPopular?: boolean
  color?: string
  openingHours?: {
    monday: { open: string; close: string; closed?: boolean } | { closed: true }
    tuesday:
      | { open: string; close: string; closed?: boolean }
      | { closed: true }
    wednesday:
      | { open: string; close: string; closed?: boolean }
      | { closed: true }
    thursday:
      | { open: string; close: string; closed?: boolean }
      | { closed: true }
    friday: { open: string; close: string; closed?: boolean } | { closed: true }
    saturday:
      | { open: string; close: string; closed?: boolean }
      | { closed: true }
    sunday: { open: string; close: string; closed?: boolean } | { closed: true }
  }
}

interface TimeSlot {
  time: string
  available: boolean
  isPopular?: boolean
}

interface BookingData {
  space: Space | null
  date: Date | null
  startTime: string
  endTime: string
  duration: number
  durationType: 'hour' | 'day' | 'week' | 'month'
  guests: number
  totalPrice: number
  paymentMethod: string | null
}

interface PaymentMethod {
  id: string
  name: string
  icon: any
  description: string
  popular?: boolean
  available: boolean
}

// SPACES are now loaded dynamically from the database

const TIME_SLOTS: TimeSlot[] = [
  { time: '09:00', available: true, isPopular: true },
  { time: '09:30', available: true, isPopular: true },
  { time: '10:00', available: true, isPopular: true },
  { time: '10:30', available: true },
  { time: '11:00', available: true },
  { time: '11:30', available: true },
  { time: '12:00', available: true },
  { time: '12:30', available: true },
  { time: '13:00', available: true, isPopular: true },
  { time: '13:30', available: true, isPopular: true },
  { time: '14:00', available: true, isPopular: true },
  { time: '14:30', available: true },
  { time: '15:00', available: true },
  { time: '15:30', available: true },
  { time: '16:00', available: true },
  { time: '16:30', available: true },
  { time: '17:00', available: true },
  { time: '17:30', available: true },
  { time: '18:00', available: true },
  { time: '18:30', available: true },
]

interface BookingFlowProps {
  preSelectedSpace?: Space
}

// Date Selector Component - Adapted from space-time-selection.tsx
interface DateSelectorProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateSelect,
}) => {
  const today = startOfDay(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(today)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const dateRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  // Calculer les dates du mois actuel à partir d'aujourd'hui (jamais les jours passés)
  const getDatesForCurrentMonth = () => {
    // Si c'est le mois actuel (même mois et année), commence à aujourd'hui
    const isCurrentMonth =
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()

    const startDate = isCurrentMonth ? today : startOfMonth(currentMonth)
    const endDate = endOfMonth(currentMonth)
    const dates = []

    let current = startDate
    while (current <= endDate) {
      dates.push(current)
      current = addDays(current, 1)
    }

    return dates
  }

  const dates = getDatesForCurrentMonth()
  const nextMonth = addMonths(currentMonth, 1)
  const prevMonth = subMonths(currentMonth, 1)
  const isCurrentMonth =
    currentMonth.getMonth() === today.getMonth() &&
    currentMonth.getFullYear() === today.getFullYear()
  const canGoPrevious = !isCurrentMonth // Ne peut pas revenir avant le mois actuel

  const handleNextMonth = () => {
    setCurrentMonth(nextMonth)
  }

  const handlePrevMonth = () => {
    if (canGoPrevious) {
      setCurrentMonth(prevMonth)
    }
  }

  const handleDateSelect = (date: Date) => {
    // Ne pas sélectionner si on est en train de faire un drag
    if (isDragging) return

    // 🔍 LOGS de diagnostic pour la sélection de date
    console.log('🗓️ [DateSelector] Date sélectionnée:', {
      dateOriginal: date,
      dateISO: date.toISOString(),
      dateLocal: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Europe/Paris',
      }),
      timestamp: date.getTime(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      utcOffset: date.getTimezoneOffset(),
    })

    onDateSelect(date)

    // Scroll jusqu'à la date sélectionnée
    const dateKey = date.toISOString()
    const dateElement = dateRefs.current[dateKey]
    const container = scrollContainerRef.current

    if (dateElement && container) {
      const containerRect = container.getBoundingClientRect()
      const elementRect = dateElement.getBoundingClientRect()

      // Calculer la position de scroll pour centrer l'élément
      const scrollLeftPos =
        elementRect.left -
        containerRect.left +
        container.scrollLeft -
        containerRect.width / 2 +
        elementRect.width / 2

      container.scrollTo({
        left: scrollLeftPos,
        behavior: 'smooth',
      })
    }
  }

  // Gestion du drag/swipe
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollContainerRef.current
    if (!container) return

    setIsDragging(true)
    setStartX(e.pageX - container.offsetLeft)
    setScrollLeft(container.scrollLeft)
    container.style.cursor = 'grabbing'
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()

    const container = scrollContainerRef.current
    if (!container) return

    const x = e.pageX - container.offsetLeft
    const walk = (x - startX) * 2 // Facteur de vitesse
    container.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    const container = scrollContainerRef.current
    if (container) {
      container.style.cursor = 'grab'
    }
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    const container = scrollContainerRef.current
    if (container) {
      container.style.cursor = 'grab'
    }
  }

  // Gestion tactile pour mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const container = scrollContainerRef.current
    if (!container) return

    setIsDragging(true)
    setStartX(e.touches[0].pageX - container.offsetLeft)
    setScrollLeft(container.scrollLeft)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    const container = scrollContainerRef.current
    if (!container) return

    const x = e.touches[0].pageX - container.offsetLeft
    const walk = (x - startX) * 2 // Facteur de vitesse plus élevé pour le tactile
    container.scrollLeft = scrollLeft - walk
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  return (
    <div className="space-y-4">
      {/* Month Header */}
      <div className="text-center">
        {/* <h3 className="text-coffee-primary text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h3> */}
      </div>

      {/* Date Cards */}
      <div
        ref={scrollContainerRef}
        className="flex cursor-grab gap-3 overflow-x-auto scroll-smooth px-2 py-4 select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Previous Month Button */}
        {canGoPrevious && (
          <motion.button
            onClick={handlePrevMonth}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="border-coffee-primary/50 bg-coffee-primary/10 hover:border-coffee-primary hover:bg-coffee-primary/20 min-w-[100px] shrink-0 rounded-xl border-2 p-4 text-center backdrop-blur-sm transition-all duration-200"
          >
            <div className="flex flex-col items-center">
              <ChevronLeft className="text-coffee-accent mb-1 h-6 w-6" />
              <div className="text-coffee-primary text-sm font-medium">
                {format(prevMonth, 'MMM', { locale: fr })}
              </div>
              <div className="text-coffee-primary/70 text-xs">
                {format(prevMonth, 'yyyy')}
              </div>
            </div>
          </motion.button>
        )}

        {dates.map((date) => {
          const isSelected = isSameDay(date, selectedDate)
          const isToday = isSameDay(date, today)

          return (
            <motion.button
              key={date.toISOString()}
              ref={(el: HTMLButtonElement | null) => {
                dateRefs.current[date.toISOString()] = el
              }}
              onClick={() => handleDateSelect(date)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`min-w-[80px] shrink-0 rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                isSelected
                  ? 'border-coffee-primary bg-coffee-primary/20 text-coffee-primary shadow-lg'
                  : 'hover:border-coffee-primary/50 hover:bg-coffee-primary/10 text-coffee-primary/80 border-white/30 bg-white/20 backdrop-blur-sm'
              }`}
            >
              <div className="text-sm font-medium">
                {format(date, 'EEE', { locale: fr })}
              </div>
              <div className="mt-1 text-lg font-bold">{format(date, 'd')}</div>
              {isToday && (
                <div className="text-coffee-accent mt-1 text-xs">
                  Aujourd&apos;hui
                </div>
              )}
            </motion.button>
          )
        })}

        {/* Next Month Button */}
        <motion.button
          onClick={handleNextMonth}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="border-coffee-primary/50 bg-coffee-primary/10 hover:border-coffee-primary hover:bg-coffee-primary/20 min-w-[100px] shrink-0 rounded-xl border-2 p-4 text-center backdrop-blur-sm transition-all duration-200"
        >
          <div className="flex flex-col items-center">
            <ChevronRight className="text-coffee-accent mb-1 h-6 w-6" />
            <div className="text-coffee-primary text-sm font-medium">
              {format(nextMonth, 'MMM', { locale: fr })}
            </div>
            <div className="text-coffee-primary/70 text-xs">
              {format(nextMonth, 'yyyy')}
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  )
}

export default function BookingFlow({ preSelectedSpace }: BookingFlowProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { spaces, isLoading: spacesLoading, error: spacesError } = useSpaces()
  const [step, setStep] = useState(preSelectedSpace ? 2 : 1) // Étape 1 si pas d'espace présélectionné

  const [bookingData, setBookingData] = useState<BookingData>({
    space: preSelectedSpace || null, // Pas d'espace par défaut, laisser le choix à l'utilisateur
    date: new Date(), // Date d'aujourd'hui par défaut
    startTime: '',
    endTime: '',
    duration: 1,
    durationType: 'hour',
    guests: 1,
    totalPrice: 0,
    paymentMethod: 'onsite', // Pré-sélectionner la seule méthode disponible
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [availabilityData, setAvailabilityData] = useState<{
    [key: string]: boolean
  }>({})
  const [showConfetti, setShowConfetti] = useState(false)

  // Définition des méthodes de paiement
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'onsite',
      name: 'Paiement sur place',
      icon: Coffee,
      description: 'Réglez directement au café',
      available: true,
      popular: true,
    },
    {
      id: 'card',
      name: 'Carte bancaire',
      icon: CreditCard,
      description: 'Paiement sécurisé par Stripe',
      available: true,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: CreditCard,
      description: 'Paiement via PayPal (temporairement indisponible)',
      available: false,
    },
  ]

  // Fonction pour sélectionner une méthode de paiement
  const selectPaymentMethod = (methodId: string) => {
    const method = paymentMethods.find((m) => m.id === methodId)
    if (method && method.available) {
      updateBookingData({ paymentMethod: methodId })
    }
  }

  // Fonction pour confirmer la réservation
  const handleConfirmBooking = async () => {
    if (!session?.user) {
      router.push('/login')
      return
    }

    // Si les heures manquent, essayer de les définir automatiquement
    if (
      bookingData.space &&
      bookingData.date &&
      (!bookingData.startTime || !bookingData.endTime)
    ) {
      const firstAvailableTime = getFirstAvailableTime(bookingData.date)

      if (firstAvailableTime) {
        const [hours, minutes] = firstAvailableTime.split(':').map(Number)
        let endHours = hours + 2

        // S'assurer que l'heure de fin ne dépasse pas les créneaux disponibles
        const availableSlots = getAvailableTimeSlots(
          bookingData.date,
          bookingData.space
        )
        const maxEndTime =
          availableSlots[availableSlots.length - 1]?.time || '18:00'
        const [maxHours] = maxEndTime.split(':').map(Number)

        if (endHours > maxHours) {
          endHours = maxHours
        }

        const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

        updateBookingData({
          startTime: bookingData.startTime || firstAvailableTime,
          endTime: bookingData.endTime || endTime,
        })

        // Relancer la validation après la mise à jour
        setTimeout(() => handleConfirmBooking(), 100)
        return
      }
    }

    if (
      !bookingData.space ||
      !bookingData.date ||
      !bookingData.startTime ||
      !bookingData.endTime ||
      !bookingData.paymentMethod
    ) {
      setErrors({
        general:
          'Données de réservation incomplètes. Veuillez sélectionner une méthode de paiement.',
      })
      return
    }

    setIsLoading(true)
    setErrors({})

    // 🔍 LOGS de diagnostic avant envoi API
    const apiPayload = {
      spaceId: bookingData.space.id,
      date: bookingData.date.toISOString().split('T')[0], // YYYY-MM-DD
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      duration:
        bookingData.durationType === 'hour' &&
        bookingData.startTime &&
        bookingData.endTime
          ? calculateDurationFromTimes(
              bookingData.startTime,
              bookingData.endTime
            )
          : bookingData.duration,
      durationType: bookingData.durationType,
      guests: bookingData.guests,
      paymentMethod: bookingData.paymentMethod,
    }

    console.log("🚀 [HandleConfirmBooking] Envoi à l'API:", {
      originalDate: bookingData.date,
      originalDateISO: bookingData.date.toISOString(),
      originalDateLocal: bookingData.date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Europe/Paris',
      }),
      apiDateString: apiPayload.date,
      // Vérifier quel jour de la semaine l'API va recevoir
      apiDateParsed: new Date(apiPayload.date),
      apiDateWeekday: new Date(apiPayload.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        timeZone: 'Europe/Paris',
      }),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      fullPayload: apiPayload,
    })

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin', // Inclure les cookies de session
        body: JSON.stringify(apiPayload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error || 'Erreur lors de la création de la réservation'
        )
      }

      // Gérer la réponse selon le type de paiement
      if (result.paymentUrl) {
        // Paiement externe (PayPal) : rediriger vers Stripe Checkout
        console.log('Redirection vers Stripe:', result.paymentUrl)
        window.location.href = result.paymentUrl
      } else if (result.booking && bookingData.paymentMethod === 'card') {
        // Paiement par carte : rediriger vers le formulaire Stripe Elements intégré
        const paymentParams = new URLSearchParams({
          booking_id: result.booking.id,
          amount: result.booking.totalPrice.toString(),
          space_name: bookingData.space?.name || 'Espace',
          date:
            bookingData.date?.toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }) || '',
          start_time: bookingData.startTime || '',
          end_time: bookingData.endTime || '',
        })
        router.push(`/payment/form?${paymentParams.toString()}`)
      } else {
        // Paiement sur place : afficher les confettis puis rediriger vers la page de confirmation
        setShowConfetti(true)
        setTimeout(() => {
          router.push(
            `/payment/success?booking_id=${result.booking.id}&payment_method=onsite`
          )
        }, 2000)
      }
    } catch (error) {
      console.error('Erreur confirmation:', error)
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'Une erreur est survenue lors de la confirmation',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Initialiser la première heure disponible quand un espace est sélectionné et qu'on arrive à l'étape 2
  useEffect(() => {
    if (bookingData.space && step === 2 && !bookingData.startTime) {
      const firstAvailableTime = getFirstAvailableTime(bookingData.date)

      if (firstAvailableTime) {
        // Calculer automatiquement l'heure de fin (2h après le début par défaut)
        const [hours, minutes] = firstAvailableTime.split(':').map(Number)
        let endHours = hours + 2

        // S'assurer que l'heure de fin ne dépasse pas les créneaux disponibles
        const availableSlots = getAvailableTimeSlots(
          bookingData.date,
          bookingData.space
        )
        const maxEndTime =
          availableSlots[availableSlots.length - 1]?.time || '18:00'
        const [maxHours] = maxEndTime.split(':').map(Number)

        if (endHours > maxHours) {
          endHours = maxHours
        }

        const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

        // Vérifier que l'heure de fin est dans les créneaux disponibles
        const isEndTimeValid = TIME_SLOTS.some(
          (slot) => slot.time === endTime && slot.available
        )

        setBookingData((prev) => ({
          ...prev,
          startTime: firstAvailableTime,
          endTime: isEndTimeValid ? endTime : '', // Ne définir endTime que si elle est valide
        }))
      }
    }
  }, [bookingData.space, step, bookingData.date]) // Quand l'espace, l'étape ou la date change

  const updateBookingData = (updates: Partial<BookingData>) => {
    // 🔍 LOGS de diagnostic pour les mises à jour
    if (updates.date) {
      console.log('📝 [UpdateBookingData] Date mise à jour:', {
        previousDate: bookingData.date,
        newDate: updates.date,
        newDateISO: updates.date.toISOString(),
        newDateLocal: updates.date.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'Europe/Paris',
        }),
        newDateForAPI: updates.date.toISOString().split('T')[0], // Format YYYY-MM-DD pour l'API
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    }

    setBookingData((prev) => {
      const newData = { ...prev, ...updates }

      // Si la date change, vérifier si les heures sélectionnées sont encore valides
      if (updates.date && (prev.startTime || prev.endTime)) {
        const isStartTimeStillValid = prev.startTime
          ? isTimeSlotAvailable(prev.startTime, updates.date)
          : true
        const isEndTimeStillValid = prev.endTime
          ? isTimeSlotAvailable(prev.endTime, updates.date)
          : true

        if (!isStartTimeStillValid) {
          newData.startTime = ''
        }
        if (!isEndTimeStillValid) {
          newData.endTime = ''
        }
      }

      return newData
    })
    // Clear errors when user makes changes
    if (Object.keys(errors).length > 0) {
      setErrors({})
    }
  }

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: { [key: string]: string } = {}

    switch (stepNumber) {
      case 1:
        if (!bookingData.space) {
          newErrors.space = 'Veuillez sélectionner un espace'
        }
        break
      case 2:
        if (!bookingData.date) {
          newErrors.date = 'Veuillez sélectionner une date'
        }
        if (bookingData.durationType === 'hour') {
          if (!bookingData.startTime) {
            newErrors.startTime = 'Veuillez sélectionner une heure de début'
          }
          if (!bookingData.endTime) {
            newErrors.endTime = 'Veuillez sélectionner une heure de fin'
          }
          // Vérifier la durée minimale d'1 heure
          if (bookingData.startTime && bookingData.endTime) {
            const duration = calculateDurationFromTimes(
              bookingData.startTime,
              bookingData.endTime
            )
            if (duration < 1) {
              newErrors.duration = "La durée minimale est d'1 heure"
            }
          }
        }
        if (bookingData.durationType !== 'hour' && bookingData.duration < 1) {
          newErrors.duration = "La durée doit être d'au moins 1"
        }
        break
      case 3:
        if (bookingData.guests < 1) {
          newErrors.guests = 'Au moins une personne est requise'
        }
        if (
          bookingData.space &&
          bookingData.guests > bookingData.space.capacity
        ) {
          newErrors.guests = `Maximum ${bookingData.space.capacity} personnes pour cet espace`
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkAvailability = async (
    spaceId: string,
    date: Date,
    time?: string
  ) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))
      // Mock availability check - in real app, this would be an API call
      const isAvailable = Math.random() > 0.1 // 90% availability rate
      setAvailabilityData((prev) => ({
        ...prev,
        [`${spaceId}-${date.toISOString()}-${time || 'day'}`]: isAvailable,
      }))
      return isAvailable
    } catch (error) {
      console.error('Availability check failed:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Générer les créneaux horaires basés sur les horaires d'ouverture
  const getAvailableTimeSlots = (
    date: Date | null,
    space: Space | null
  ): TimeSlot[] => {
    if (!date || !space) {
      console.log("⏰ [GetAvailableTimeSlots] Pas de date ou d'espace:", {
        date,
        space,
      })
      return TIME_SLOTS // Fallback sur les créneaux par défaut
    }

    // Obtenir le nom du jour en anglais pour correspondre aux clés d'openingHours
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ]
    const dayName = dayNames[date.getDay()]

    console.log(
      '⏰ [GetAvailableTimeSlots] Jour:',
      dayName,
      'pour la date:',
      date,
      'dayOfWeek:',
      date.getDay()
    )

    // Si l'espace n'a pas d'horaires d'ouverture, utiliser les créneaux par défaut
    if (!space.openingHours || typeof space.openingHours !== 'object') {
      console.log(
        "⏰ [GetAvailableTimeSlots] Pas d'horaires d'ouverture définis, fallback"
      )
      return TIME_SLOTS
    }

    const daySchedule =
      space.openingHours[dayName as keyof typeof space.openingHours]

    if (!daySchedule || daySchedule.closed) {
      console.log('⏰ [GetAvailableTimeSlots] Fermé ce jour:', dayName)
      return [] // Fermé ce jour-là
    }

    // Vérifier que les heures d'ouverture/fermeture existent
    if (
      !('open' in daySchedule) ||
      !('close' in daySchedule) ||
      !daySchedule.open ||
      !daySchedule.close
    ) {
      console.log(
        '⏰ [GetAvailableTimeSlots] Horaires manquants pour:',
        dayName
      )
      return TIME_SLOTS // Fallback sur les créneaux par défaut
    }

    console.log("⏰ [GetAvailableTimeSlots] Horaires d'ouverture:", daySchedule)

    // Générer les créneaux entre l'heure d'ouverture et de fermeture
    const openTime = daySchedule.open
    const closeTime = daySchedule.close

    const [openHour, openMinute] = openTime.split(':').map(Number)
    const [closeHour, closeMinute] = closeTime.split(':').map(Number)

    const slots: TimeSlot[] = []
    let currentHour = openHour
    let currentMinute = openMinute

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMinute < closeMinute)
    ) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`

      // Marquer certains créneaux comme populaires
      const isPopular =
        timeString === '10:00' ||
        timeString === '14:00' ||
        timeString === '16:00'

      slots.push({
        time: timeString,
        available: true,
        isPopular,
      })

      // Avancer de 30 minutes
      currentMinute += 30
      if (currentMinute >= 60) {
        currentHour += 1
        currentMinute = 0
      }
    }

    console.log(
      '⏰ [GetAvailableTimeSlots] Créneaux générés:',
      slots,
      'Total:',
      slots.length
    )

    // Si aucun créneau généré, fallback sur les créneaux par défaut
    if (slots.length === 0) {
      console.log(
        '⏰ [GetAvailableTimeSlots] Aucun créneau généré, utilisation du fallback'
      )
      return TIME_SLOTS
    }

    return slots
  }

  // Trouver la première heure disponible avec marge d'1h
  const getFirstAvailableTime = (selectedDate: Date | null): string => {
    if (!selectedDate) return ''

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const selected = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    )

    // Si ce n'est pas le jour même, retourner le premier créneau
    if (selected.getTime() !== today.getTime()) {
      const availableSlots = getAvailableTimeSlots(
        selectedDate,
        bookingData.space
      )
      return availableSlots.find((slot) => slot.available)?.time || ''
    }

    // Pour le jour même, trouver le premier créneau avec marge d'1h
    const minimumTime = new Date(now.getTime() + 60 * 60 * 1000)

    const availableSlots = getAvailableTimeSlots(
      selectedDate,
      bookingData.space
    )
    for (const slot of availableSlots) {
      if (!slot.available) continue

      const [slotHours, slotMinutes] = slot.time.split(':').map(Number)
      const slotTime = new Date(now)
      slotTime.setHours(slotHours, slotMinutes, 0, 0)

      if (slotTime >= minimumTime) {
        return slot.time
      }
    }

    return '' // Aucun créneau disponible aujourd'hui
  }

  // Vérifier si un créneau est disponible selon l'heure actuelle
  const isTimeSlotAvailable = (
    timeSlot: string,
    selectedDate: Date | null
  ): boolean => {
    if (!selectedDate) return false

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const selected = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    )

    // Si ce n'est pas le jour même, tous les créneaux sont disponibles
    if (selected.getTime() !== today.getTime()) {
      return true
    }

    // Pour le jour même, vérifier que le créneau est au moins 1h après l'heure actuelle
    const [slotHours, slotMinutes] = timeSlot.split(':').map(Number)
    const slotTime = new Date(now)
    slotTime.setHours(slotHours, slotMinutes, 0, 0)

    // Ajouter 1 heure de marge à l'heure actuelle
    const minimumTime = new Date(now.getTime() + 60 * 60 * 1000)

    return slotTime >= minimumTime
  }

  // Calculer la durée entre deux heures
  const calculateDurationFromTimes = (
    startTime: string,
    endTime: string
  ): number => {
    if (!startTime || !endTime) return 0

    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute

    // Gérer le cas où l'heure de fin est le lendemain (ex: 22:00 -> 02:00)
    const durationMinutes =
      endTotalMinutes > startTotalMinutes
        ? endTotalMinutes - startTotalMinutes
        : 24 * 60 - startTotalMinutes + endTotalMinutes

    return Math.round((durationMinutes / 60) * 100) / 100 // Arrondir à 2 décimales
  }

  const calculatePrice = () => {
    if (!bookingData.space) return 0
    const space = bookingData.space

    switch (bookingData.durationType) {
      case 'hour':
        // Si on a des heures de début et fin, utiliser la durée calculée
        if (bookingData.startTime && bookingData.endTime) {
          const calculatedDuration = calculateDurationFromTimes(
            bookingData.startTime,
            bookingData.endTime
          )
          return space.pricePerHour * calculatedDuration
        }
        return space.pricePerHour * bookingData.duration
      case 'day':
        return space.pricePerDay * bookingData.duration
      case 'week':
        return space.pricePerWeek * bookingData.duration
      case 'month':
        return space.pricePerMonth * bookingData.duration
      default:
        return 0
    }
  }

  const nextStep = async () => {
    // Clear previous errors
    setErrors({})

    if (!validateStep(step)) {
      return
    }

    if (step < 4) {
      const price = calculatePrice()
      updateBookingData({ totalPrice: price })

      // Check availability for step 2 (date/time selection)
      if (step === 2 && bookingData.space && bookingData.date) {
        setIsLoading(true)

        try {
          const isAvailable = await checkAvailability(
            bookingData.space.id,
            bookingData.date,
            bookingData.startTime
          )
          if (!isAvailable) {
            setErrors({
              availability:
                "Cet horaire n'est plus disponible. Veuillez en choisir un autre.",
            })
            return
          }
        } catch (error) {
          console.error('Erreur vérification disponibilité:', error)
          setErrors({
            availability:
              'Erreur lors de la vérification de disponibilité. Veuillez réessayer.',
          })
          return
        } finally {
          setIsLoading(false)
        }
      }

      setStep(step + 1)

      // Scroll to top when moving to next step
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Show success animation on final step
      if (step === 3) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }
    }
  }

  const prevStep = () => {
    console.log('🔙 prevStep appelé, step actuel:', step)

    if (step > 1) {
      const newStep = step - 1
      console.log("➡️ Retour à l'étape:", newStep)

      // Réinitialiser les erreurs lors du retour en arrière
      setErrors({})
      setIsLoading(false) // Arrêter tout loading en cours
      setStep(newStep)

      // Scroll to top when moving to previous step
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    } else {
      console.log("⚠️ Ne peut pas revenir en arrière depuis l'étape 1")
    }
  }

  // Handler spécifique pour éviter les conflits d'événements
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🖱️ Back button clicked via handler')
    prevStep()
  }

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Choisir un espace'
      case 2:
        return 'Date et horaires'
      case 3:
        return 'Détails'
      case 4:
        return 'Confirmation'
      default:
        return ''
    }
  }

  return (
    <div className="from-coffee-secondary/20 to-coffee-secondary/10 relative min-h-screen overflow-hidden bg-linear-to-br via-white pt-24 sm:pt-24">
      {/* Navbar Transition Gradient */}
      <div className="absolute top-0 right-0 left-0 h-32 bg-linear-to-b from-white/60 via-white/30 to-transparent backdrop-blur-sm" />

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="bg-coffee-primary/10 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl" />
        <div className="bg-coffee-accent/10 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl" />
        <div className="from-coffee-primary/5 to-coffee-accent/5 absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-linear-to-r blur-3xl" />
      </div>

      {/* Enhanced Header with Better Spacing */}
      <div className="sticky z-40 border-b border-white/20 bg-white/40 shadow-lg backdrop-blur-xl">
        <div className="container mx-auto max-w-4xl px-4 py-2">
          {/* <div className="mb-2 flex items-center justify-between">
            <button
              onClick={handleBackClick}
              className="touch-target flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-3 shadow-sm transition-all duration-300 hover:bg-white/50 disabled:cursor-not-allowed disabled:opacity-50 relative z-50"
              disabled={step === 1}
              aria-label="Étape précédente"
              type="button"
              style={{ pointerEvents: step === 1 ? 'none' : 'auto' }}
            >
              <ArrowLeft
                className={`h-6 w-6 ${step === 1 ? 'text-gray-300' : 'text-coffee-primary'}`}
              />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-coffee-primary mb-1 text-2xl font-bold">
                Réservation Cow or King
              </h1>
              <p className="text-coffee-primary/70 font-medium">
                {getStepTitle()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="from-coffee-primary to-coffee-accent flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-r shadow-lg">
                <span className="text-sm font-bold text-white">{step}/4</span>
              </div>
            </div>
          </div> */}

          {/* Enhanced Progress Bar */}
          <div className="relative">
            <div className="h-4 overflow-hidden rounded-full bg-gray-200/50 backdrop-blur-sm">
              <motion.div
                className="from-coffee-primary to-coffee-accent relative h-full rounded-full bg-linear-to-r shadow-sm"
                initial={{ width: '25%' }}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              >
                <div className="absolute inset-0 animate-pulse rounded-full bg-white/30" />
              </motion.div>
            </div>
            {/* Enhanced Step indicators */}
            <div className="mt-4 flex justify-between">
              {[1, 2, 3, 4].map((stepNum) => (
                <motion.div
                  key={stepNum}
                  className={`flex flex-col items-center ${stepNum <= step ? 'text-coffee-accent' : 'text-gray-400'}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: stepNum <= step ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`h-3 w-3 rounded-full shadow-sm transition-all duration-300 ${
                      stepNum <= step
                        ? 'bg-coffee-primary shadow-coffee-primary/30'
                        : 'bg-gray-300'
                    }`}
                  />
                  <span className="mt-1 text-xs font-medium">
                    {stepNum === 1
                      ? 'Espace'
                      : stepNum === 2
                        ? 'Date'
                        : stepNum === 3
                          ? 'Détails'
                          : 'Paiement'}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Global Error Display */}
          {Object.keys(errors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-xl border border-red-200/50 bg-red-50/80 p-4 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 shrink-0 text-red-500" />
                <div className="text-sm font-medium text-red-700">
                  {Object.values(errors)[0]}
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-coffee-accent mt-6 flex items-center justify-center gap-3 rounded-xl bg-white/50 p-4 shadow-sm backdrop-blur-sm"
            >
              <div className="border-coffee-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
              <span className="font-medium">
                Vérification de la disponibilité...
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Content Area with Better Spacing */}
      <div className="relative z-10 container mx-auto min-h-[calc(100vh-300px)] max-w-4xl px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Space Selection - Enhanced with Glass Cards */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Glass Card Container */}
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl border border-white/20 bg-white/40 shadow-2xl backdrop-blur-xl" />
                <div className="relative z-10 p-8">
                  <div className="mb-8 text-center">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-coffee-accent mb-3 text-3xl font-bold"
                    >
                      Quel espace vous convient ?
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-coffee-primary/70 text-lg"
                    >
                      Choisissez l'ambiance parfaite pour votre travail
                    </motion.p>
                  </div>

                  {/* Responsive Grid: Stack on mobile, flex-row on larger screens */}
                  <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                    {spacesLoading ? (
                      // Skeleton loading pour les espaces
                      [...Array(3)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="mb-4 h-64 rounded-2xl bg-gray-200"></div>
                          <div className="mb-2 h-4 rounded bg-gray-200"></div>
                          <div className="h-4 w-2/3 rounded bg-gray-200"></div>
                        </div>
                      ))
                    ) : spacesError ? (
                      <div className="col-span-full py-8 text-center">
                        <p className="text-red-500">
                          Erreur lors du chargement des espaces: {spacesError}
                        </p>
                      </div>
                    ) : (
                      spaces.map((space, index) => (
                        <motion.div
                          key={space.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index + 0.4 }}
                          className={`group relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 ${
                            bookingData.space?.id === space.id
                              ? 'ring-coffee-primary scale-105 shadow-2xl ring-2'
                              : 'hover:scale-105 hover:shadow-xl'
                          }`}
                          whileHover={{ y: -5 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateBookingData({ space: space as any })}
                        >
                          {/* Background Color/Gradient (priorité au gradient) */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${space.color || 'from-coffee-primary to-coffee-accent'}`}
                          >
                            <div className="absolute inset-0 bg-linear-to-br from-black/20 via-transparent to-black/40" />
                          </div>

                          {/* Popular Star Badge */}
                          {space.isPopular && (
                            <div className="absolute top-3 right-3 z-10">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-yellow-400 to-yellow-500 shadow-lg">
                                <Star className="h-4 w-4 fill-current text-white" />
                              </div>
                            </div>
                          )}

                          {/* Glass Card Content */}
                          <div className="relative h-full border border-white/20 bg-white/70 p-6 backdrop-blur-md">
                            {/* Header */}
                            <div className="mb-4 flex items-start justify-between">
                              <div className="flex-1">
                                <div className="mb-2 flex items-center gap-2">
                                  <h3 className="text-coffee-primary text-xl font-bold">
                                    {space.name}
                                  </h3>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                                    <span className="text-sm font-medium text-yellow-600">
                                      {space.rating}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-coffee-accent/70 mb-1 text-sm">
                                  {space.location}
                                </p>
                                <p className="text-coffee-accent/60 text-xs font-medium">
                                  {space.capacity} places • {space.specialty}
                                </p>
                              </div>

                              {/* Selection Indicator */}
                              {bookingData.space?.id === space.id && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  className="from-coffee-primary to-coffee-accent flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r shadow-lg"
                                >
                                  <Check className="h-5 w-5 text-white" />
                                </motion.div>
                              )}
                            </div>

                            {/* Features */}
                            <div className="mb-4 flex flex-wrap gap-1">
                              {space.features
                                .slice(0, 3)
                                .map((feature, index) => (
                                  <span
                                    key={index}
                                    className="bg-coffee-primary/10 text-coffee-primary border-coffee-primary/20 rounded-full border px-2 py-1 text-xs"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              {space.features.length > 3 && (
                                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                  +{space.features.length - 3}
                                </span>
                              )}
                            </div>

                            {/* Pricing */}
                            <div className="border-coffee-primary/10 flex items-center justify-between border-t pt-4">
                              <div>
                                <span className="text-coffee-accent text-2xl font-bold">
                                  {space.pricePerHour}€
                                </span>
                                <span className="text-coffee-primary/60 text-sm">
                                  /heure
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-coffee-primary text-sm font-medium">
                                  {space.pricePerDay}€/jour
                                </div>
                                <div className="text-coffee-primary/60 text-xs">
                                  Dès {space.pricePerWeek}€/sem
                                </div>
                              </div>
                            </div>

                            {/* Hover Effect Overlay */}
                            <div className="from-coffee-primary/5 to-coffee-accent/5 absolute inset-0 rounded-2xl bg-linear-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Continue Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className={`flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl py-4 font-semibold text-white shadow-lg transition-all duration-300 ${
                      bookingData.space && !isLoading
                        ? 'from-coffee-primary via-coffee-primary to-coffee-accent bg-linear-to-r hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]'
                        : 'cursor-not-allowed bg-gray-300'
                    }`}
                    disabled={!bookingData.space || isLoading}
                    onClick={nextStep}
                    whileHover={
                      bookingData.space && !isLoading
                        ? {
                            boxShadow:
                              '0 25px 50px -12px rgba(255, 140, 0, 0.25)',
                          }
                        : {}
                    }
                    aria-label="Continuer vers l'étape suivante"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Vérification...
                      </>
                    ) : (
                      <>
                        Continuer vers la sélection de date
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Date & Time Selection - Enhanced with Glass Cards */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Glass Card Container */}
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl border border-white/20 bg-white/40 shadow-2xl backdrop-blur-xl" />
                <div className="relative z-10 p-8">
                  {/* Back Button - Top Left in Card */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={handleBackClick}
                    className="absolute top-6 left-6 z-50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/60 p-3 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/80"
                    aria-label="Étape précédente"
                    type="button"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <ArrowLeft className="text-coffee-primary h-5 w-5" />
                  </motion.button>

                  <div className="mb-8 text-center">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-coffee-primary mb-3 text-3xl font-bold"
                    >
                      Quand voulez-vous venir ?
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-coffee-primary/70 text-lg"
                    >
                      Sélectionnez votre durée et date de réservation
                    </motion.p>
                  </div>

                  {/* Date Selector - Horizontal Scrolling Cards */}

                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="text-coffee-primary mb-4 block text-lg font-semibold">
                      Type de réservation
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { type: 'hour', label: "À l'heure", icon: Clock },
                        {
                          type: 'day',
                          label: 'À la journée',
                          icon: Calendar,
                        },
                        {
                          type: 'week',
                          label: 'À la semaine',
                          icon: Calendar,
                        },
                        { type: 'month', label: 'Au mois', icon: Calendar },
                      ].map(({ type, label, icon: Icon }) => (
                        <motion.button
                          key={type}
                          className={`rounded-xl border-2 p-4 backdrop-blur-sm transition-all duration-300 ${
                            bookingData.durationType === type
                              ? 'border-coffee-primary bg-coffee-primary/20 shadow-lg'
                              : 'hover:border-coffee-primary/50 hover:bg-coffee-primary/10 border-white/30 bg-white/20'
                          }`}
                          onClick={() =>
                            updateBookingData({ durationType: type as any })
                          }
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Icon
                            className={`mx-auto mb-2 h-7 w-7 ${
                              bookingData.durationType === type
                                ? 'text-coffee-accent'
                                : 'text-coffee-primary/60'
                            }`}
                          />
                          <div
                            className={`text-sm font-medium ${
                              bookingData.durationType === type
                                ? 'text-coffee-primary'
                                : 'text-coffee-primary/70'
                            }`}
                          >
                            {label}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="mb-8"
                  >
                    <DateSelector
                      selectedDate={bookingData.date || new Date()}
                      onDateSelect={(date) => updateBookingData({ date })}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <label className="text-coffee-primary mb-4 block text-lg font-semibold">
                      {bookingData.durationType === 'hour'
                        ? null
                        : bookingData.durationType === 'day'
                          ? 'Nombre de jours'
                          : bookingData.durationType === 'week'
                            ? 'Nombre de semaines'
                            : 'Nombre de mois'}
                    </label>

                    {bookingData.durationType === 'hour' ? (
                      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Heure de début */}
                        <motion.div
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 }}
                        >
                          <label className="text-coffee-primary mb-4 block text-lg font-semibold">
                            Heure de début
                          </label>
                          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-white/20 bg-white/10 p-2 backdrop-blur-sm">
                            {getAvailableTimeSlots(
                              bookingData.date,
                              bookingData.space
                            )
                              .filter((slot) => {
                                return (
                                  slot.available &&
                                  isTimeSlotAvailable(
                                    slot.time,
                                    bookingData.date
                                  )
                                )
                              })
                              .map((slot, index) => (
                                <motion.button
                                  key={`start-${slot.time}`}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.8 + index * 0.02 }}
                                  className={`relative rounded-lg p-3 text-sm font-medium transition-all duration-300 ${
                                    bookingData.startTime === slot.time
                                      ? 'from-coffee-primary to-coffee-accent bg-linear-to-r text-white shadow-lg'
                                      : 'hover:border-coffee-primary/50 hover:bg-coffee-primary/10 text-coffee-primary border border-white/30 bg-white/40'
                                  }`}
                                  onClick={() => {
                                    updateBookingData({ startTime: slot.time })
                                    // Reset endTime si elle est avant la nouvelle startTime
                                    if (
                                      bookingData.endTime &&
                                      bookingData.endTime <= slot.time
                                    ) {
                                      updateBookingData({ endTime: '' })
                                    }
                                  }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {slot.time}
                                  {slot.isPopular && (
                                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-500 shadow-lg"></div>
                                  )}
                                </motion.button>
                              ))}
                          </div>
                        </motion.div>

                        {/* Heure de fin */}
                        <motion.div
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 }}
                        >
                          <label className="text-coffee-primary mb-4 block text-lg font-semibold">
                            Heure de fin
                            {bookingData.startTime && (
                              <span className="text-coffee-primary/60 ml-2 text-sm font-normal">
                                (minimum 1h après {bookingData.startTime})
                              </span>
                            )}
                          </label>
                          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-white/20 bg-white/10 p-2 backdrop-blur-sm">
                            {getAvailableTimeSlots(
                              bookingData.date,
                              bookingData.space
                            )
                              .filter((slot) => {
                                // Calculer l'heure minimale (startTime + 1 heure)
                                const getMinimumEndTime = (
                                  startTime: string
                                ) => {
                                  const [hours, minutes] = startTime
                                    .split(':')
                                    .map(Number)
                                  const minHours = hours + 1
                                  return `${minHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
                                }

                                const isSlotAvailable =
                                  slot.available &&
                                  isTimeSlotAvailable(
                                    slot.time,
                                    bookingData.date
                                  )

                                return (
                                  isSlotAvailable &&
                                  bookingData.startTime &&
                                  slot.time >=
                                    getMinimumEndTime(bookingData.startTime)
                                )
                              })
                              .map((slot, index) => (
                                <motion.button
                                  key={`end-${slot.time}`}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.9 + index * 0.02 }}
                                  className={`relative rounded-lg p-3 text-sm font-medium transition-all duration-300 ${
                                    bookingData.endTime === slot.time
                                      ? 'from-coffee-primary to-coffee-accent bg-linear-to-r text-white shadow-lg'
                                      : 'hover:border-coffee-primary/50 hover:bg-coffee-primary/10 text-coffee-primary border border-white/30 bg-white/40'
                                  }`}
                                  onClick={() =>
                                    updateBookingData({ endTime: slot.time })
                                  }
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {slot.time}
                                </motion.button>
                              ))}
                          </div>
                        </motion.div>

                        {/* Affichage de la durée calculée */}
                        {bookingData.startTime && bookingData.endTime && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0 }}
                            className="mt-6 text-center"
                          >
                            <div className="border-coffee-primary/30 bg-coffee-primary/10 inline-flex items-center gap-4 rounded-xl border px-6 py-3 backdrop-blur-sm">
                              <Clock className="text-coffee-accent h-5 w-5" />
                              <span className="text-coffee-primary font-semibold">
                                Durée:{' '}
                                {calculateDurationFromTimes(
                                  bookingData.startTime,
                                  bookingData.endTime
                                )}
                                h
                              </span>
                              <span className="text-coffee-primary/70 text-sm">
                                ({bookingData.startTime} → {bookingData.endTime}
                                )
                              </span>
                            </div>
                          </motion.div>
                        )}

                        <p className="text-coffee-primary/60 mt-4 text-center text-xs">
                          • Point orange = créneau populaire
                          <br />• Sélectionnez d'abord l'heure de début, puis
                          l'heure de fin
                          {bookingData.date &&
                            new Date(bookingData.date).toDateString() ===
                              new Date().toDateString() && (
                              <>
                                <br />• Réservation jour même : marge d'1h
                                minimum après l'heure actuelle
                              </>
                            )}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-6">
                        <motion.button
                          className="hover:bg-coffee-primary/10 hover:border-coffee-primary/50 text-coffee-primary flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white/30 bg-white/20 text-xl font-bold backdrop-blur-sm transition-all duration-300"
                          onClick={() =>
                            updateBookingData({
                              duration: Math.max(1, bookingData.duration - 1),
                            })
                          }
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          -
                        </motion.button>
                        <span className="text-coffee-primary min-w-16 text-center text-4xl font-bold">
                          {bookingData.duration}
                        </span>
                        <motion.button
                          className="hover:bg-coffee-primary/10 hover:border-coffee-primary/50 text-coffee-primary flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white/30 bg-white/20 text-xl font-bold backdrop-blur-sm transition-all duration-300"
                          onClick={() =>
                            updateBookingData({
                              duration: bookingData.duration + 1,
                            })
                          }
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          +
                        </motion.button>
                      </div>
                    )}
                  </motion.div>

                  {/* <div className="grid gap-8"> */}
                  {/* Left Column - Duration & Date */}
                  {/* <div className="space-y-6"> */}
                  {/* Duration Type Selection */}
                  {/* <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <label className="text-coffee-primary mb-4 block text-lg font-semibold">
                        Type de réservation
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { type: 'hour', label: "À l'heure", icon: Clock },
                          {
                            type: 'day',
                            label: 'À la journée',
                            icon: Calendar,
                          },
                          {
                            type: 'week',
                            label: 'À la semaine',
                            icon: Calendar,
                          },
                          { type: 'month', label: 'Au mois', icon: Calendar },
                        ].map(({ type, label, icon: Icon }) => (
                          <motion.button
                            key={type}
                            className={`rounded-xl border-2 p-4 backdrop-blur-sm transition-all duration-300 ${
                              bookingData.durationType === type
                                ? 'border-coffee-primary bg-coffee-primary/20 shadow-lg'
                                : 'hover:border-coffee-primary/50 hover:bg-coffee-primary/10 border-white/30 bg-white/20'
                            }`}
                            onClick={() =>
                              updateBookingData({ durationType: type as any })
                            }
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Icon
                              className={`mx-auto mb-2 h-7 w-7 ${
                                bookingData.durationType === type
                                  ? 'text-coffee-accent'
                                  : 'text-coffee-primary/60'
                              }`}
                            />
                            <div
                              className={`text-sm font-medium ${
                                bookingData.durationType === type
                                  ? 'text-coffee-primary'
                                  : 'text-coffee-primary/70'
                              }`}
                            >
                              {label}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div> */}

                  {/* Selected Date Display */}
                  {/* <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <label className="text-coffee-primary mb-4 block text-lg font-semibold">
                          Date sélectionnée
                        </label>
                        <div className="rounded-xl border border-white/30 bg-white/20 p-4 backdrop-blur-sm">
                          <span className="text-coffee-primary font-medium">
                            {bookingData.date
                              ? format(bookingData.date, 'EEEE d MMMM yyyy', {
                                  locale: fr,
                                })
                              : 'Sélectionnez une date ci-dessus'}
                          </span>
                        </div>
                      </motion.div> */}

                  {/* Duration/Quantity */}
                  {/* <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <label className="text-coffee-primary mb-4 block text-lg font-semibold">
                        {bookingData.durationType === 'hour'
                          ? null
                          : bookingData.durationType === 'day'
                            ? 'Nombre de jours'
                            : bookingData.durationType === 'week'
                              ? 'Nombre de semaines'
                              : 'Nombre de mois'}
                      </label>

                      {bookingData.durationType === 'hour' ? (
                        <motion.div
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 }}
                        >
                          <label className="text-coffee-primary mb-4 block text-lg font-semibold">
                            Heure de début
                          </label>
                          <div className="grid grid-cols-3 gap-2 overflow-y-auto rounded-xl border border-white/20 bg-white/10 p-2 backdrop-blur-sm">
                            {getAvailableTimeSlots(bookingData.date, bookingData.space).filter((slot) => {
                              return slot.available && isTimeSlotAvailable(slot.time, bookingData.date)
                            }).map((slot, index) => (
                              <motion.button
                                key={slot.time}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 + index * 0.02 }}
                                className={`relative rounded-lg p-3 text-sm font-medium transition-all duration-300 ${
                                  bookingData.startTime === slot.time
                                    ? 'from-coffee-primary to-coffee-accent bg-linear-to-r text-white shadow-lg'
                                    : 'hover:border-coffee-primary/50 hover:bg-coffee-primary/10 text-coffee-primary border border-white/30 bg-white/40'
                                }`}
                                onClick={() =>
                                  updateBookingData({ startTime: slot.time })
                                }
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {slot.time}
                                {slot.isPopular && slot.available && (
                                  <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-orange-500 shadow-lg"></div>
                                )}
                              </motion.button>
                            ))}
                          </div>
                          <p className="text-coffee-primary/60 mt-2 text-center text-xs">
                            • Point orange = créneau populaire
                          </p>
                        </motion.div>
                      ) : (
                        <div className="flex items-center justify-center gap-6">
                          <motion.button
                            className="hover:bg-coffee-primary/10 hover:border-coffee-primary/50 text-coffee-primary flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white/30 bg-white/20 text-xl font-bold backdrop-blur-sm transition-all duration-300"
                            onClick={() =>
                              updateBookingData({
                                duration: Math.max(1, bookingData.duration - 1),
                              })
                            }
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            -
                          </motion.button>
                          <span className="text-coffee-primary min-w-16 text-center text-4xl font-bold">
                            {bookingData.duration}
                          </span>
                          <motion.button
                            className="hover:bg-coffee-primary/10 hover:border-coffee-primary/50 text-coffee-primary flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white/30 bg-white/20 text-xl font-bold backdrop-blur-sm transition-all duration-300"
                            onClick={() =>
                              updateBookingData({
                                duration: bookingData.duration + 1,
                              })
                            }
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            +
                          </motion.button>
                        </div>
                      )}
                    </motion.div> */}
                  {/* </div> */}

                  {/* Right Column - Time Selection & Price */}
                  {/* <div className="flex items-center"> */}
                  {/* Time Selection for hourly bookings */}
                  {/* {bookingData.durationType === 'hour' && (
                        <motion.div
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 }}
                        >
                          <label className="text-coffee-primary mb-4 block text-lg font-semibold">
                            Heure de début
                          </label>
                          <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto rounded-xl border border-white/20 bg-white/10 p-2 backdrop-blur-sm">
                            {getAvailableTimeSlots(bookingData.date, bookingData.space).filter((slot) => {
                              return slot.available && isTimeSlotAvailable(slot.time, bookingData.date)
                            }).map((slot, index) => (
                              <motion.button
                                key={slot.time}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 + index * 0.02 }}
                                className={`relative rounded-lg p-3 text-sm font-medium transition-all duration-300 ${
                                  bookingData.startTime === slot.time
                                    ? 'from-coffee-primary to-coffee-accent bg-linear-to-r text-white shadow-lg'
                                    : 'hover:border-coffee-primary/50 hover:bg-coffee-primary/10 text-coffee-primary border border-white/30 bg-white/40'
                                }`}
                                onClick={() =>
                                  updateBookingData({ startTime: slot.time })
                                }
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {slot.time}
                                {slot.isPopular && slot.available && (
                                  <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-orange-500 shadow-lg"></div>
                                )}
                              </motion.button>
                            ))}
                          </div>
                          <p className="text-coffee-primary/60 mt-2 text-center text-xs">
                            • Point orange = créneau populaire
                          </p>
                        </motion.div>
                      )} */}

                  {/* Price Preview */}
                  {bookingData.space && (
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      className="from-coffee-primary/10 to-coffee-accent/10 border-coffee-primary/20 mt-10 w-full rounded-2xl border bg-linear-to-r p-6 backdrop-blur-sm"
                    >
                      <div className="text-center">
                        <p className="text-coffee-primary/70 mb-2 text-sm font-medium">
                          Prix estimé
                        </p>
                        <div className="text-coffee-accent mb-2 text-4xl font-bold">
                          {calculatePrice()}€
                        </div>
                        <p className="text-coffee-primary/60 text-sm">
                          {bookingData.space.name} •{' '}
                          {bookingData.durationType === 'hour' &&
                          bookingData.startTime &&
                          bookingData.endTime
                            ? `${calculateDurationFromTimes(bookingData.startTime, bookingData.endTime)}h`
                            : `${bookingData.duration} ${
                                bookingData.durationType === 'hour'
                                  ? 'heure(s)'
                                  : bookingData.durationType === 'day'
                                    ? 'jour(s)'
                                    : bookingData.durationType === 'week'
                                      ? 'semaine(s)'
                                      : 'mois'
                              }`}
                        </p>
                      </div>
                    </motion.div>
                  )}
                  {/* </div> */}
                  {/* </div> */}

                  {/* Continue Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className={`mt-8 flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl py-4 font-semibold text-white shadow-lg transition-all duration-300 ${
                      bookingData.date &&
                      (bookingData.durationType !== 'hour' ||
                        (bookingData.startTime && bookingData.endTime))
                        ? 'from-coffee-primary via-coffee-primary to-coffee-accent bg-linear-to-r hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]'
                        : 'cursor-not-allowed bg-gray-300'
                    }`}
                    disabled={
                      !bookingData.date ||
                      (bookingData.durationType === 'hour' &&
                        (!bookingData.startTime || !bookingData.endTime))
                    }
                    onClick={nextStep}
                    whileHover={
                      bookingData.date
                        ? {
                            boxShadow:
                              '0 25px 50px -12px rgba(255, 140, 0, 0.25)',
                          }
                        : {}
                    }
                  >
                    Continuer vers les détails
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Details - Enhanced with Glass Cards */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Glass Card Container */}
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl border border-white/20 bg-white/40 shadow-2xl backdrop-blur-xl" />
                <div className="relative z-10 p-8">
                  {/* Back Button - Top Left in Card */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={handleBackClick}
                    className="absolute top-6 left-6 z-50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/60 p-3 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/80"
                    aria-label="Étape précédente"
                    type="button"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <ArrowLeft className="text-coffee-primary h-5 w-5" />
                  </motion.button>

                  <div className="mb-8 text-center">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-coffee-primary mb-3 text-3xl font-bold"
                    >
                      Finaliser les détails
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-coffee-primary/70 text-lg"
                    >
                      Quelques informations supplémentaires
                    </motion.p>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-2">
                    {/* Left Column - Guest Count */}
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="text-coffee-primary mb-4 block text-lg font-semibold">
                          Nombre de personnes (vous inclus)
                        </label>
                        <div className="flex items-center justify-center gap-6">
                          <motion.button
                            className="hover:bg-coffee-primary/10 hover:border-coffee-primary/50 text-coffee-primary flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white/30 bg-white/20 text-xl font-bold backdrop-blur-sm transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() =>
                              updateBookingData({
                                guests: Math.max(1, bookingData.guests - 1),
                              })
                            }
                            disabled={bookingData.guests <= 1}
                            whileHover={{
                              scale: bookingData.guests > 1 ? 1.05 : 1,
                            }}
                            whileTap={{
                              scale: bookingData.guests > 1 ? 0.95 : 1,
                            }}
                          >
                            -
                          </motion.button>
                          <span className="text-coffee-primary min-w-16 text-center text-4xl font-bold">
                            {bookingData.guests}
                          </span>
                          <motion.button
                            className="hover:bg-coffee-primary/10 hover:border-coffee-primary/50 text-coffee-primary flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white/30 bg-white/20 text-xl font-bold backdrop-blur-sm transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() =>
                              updateBookingData({
                                guests: Math.min(
                                  bookingData.space?.capacity || 1,
                                  bookingData.guests + 1
                                ),
                              })
                            }
                            disabled={
                              bookingData.guests >=
                              (bookingData.space?.capacity || 1)
                            }
                            whileHover={{
                              scale:
                                bookingData.guests <
                                (bookingData.space?.capacity || 1)
                                  ? 1.05
                                  : 1,
                            }}
                            whileTap={{
                              scale:
                                bookingData.guests <
                                (bookingData.space?.capacity || 1)
                                  ? 0.95
                                  : 1,
                            }}
                          >
                            +
                          </motion.button>
                        </div>
                        <p className="text-coffee-primary/60 mt-2 text-center text-sm">
                          Capacité maximale: {bookingData.space?.capacity}{' '}
                          personnes
                        </p>
                      </div>

                      {/* Users Icon Display */}
                      <div className="flex justify-center">
                        <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 p-4 backdrop-blur-sm">
                          <Users className="text-coffee-accent h-6 w-6" />
                          <span className="text-coffee-primary font-medium">
                            {bookingData.guests}{' '}
                            {bookingData.guests === 1
                              ? 'personne'
                              : 'personnes'}
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Right Column - Contact Information */}
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-coffee-primary mb-4 text-lg font-semibold">
                          Informations de contact
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="text-coffee-primary/70 mb-2 block text-sm font-medium">
                              Nom complet
                            </label>
                            <input
                              type="text"
                              className="focus:ring-coffee-primary focus:border-coffee-primary text-coffee-primary placeholder:text-coffee-primary/50 w-full rounded-xl border border-white/30 bg-white/20 p-4 font-medium backdrop-blur-sm transition-all duration-300 focus:ring-2"
                              placeholder="Votre nom complet"
                            />
                          </div>

                          <div>
                            <label className="text-coffee-primary/70 mb-2 block text-sm font-medium">
                              Email
                            </label>
                            <input
                              type="email"
                              className="focus:ring-coffee-primary focus:border-coffee-primary text-coffee-primary placeholder:text-coffee-primary/50 w-full rounded-xl border border-white/30 bg-white/20 p-4 font-medium backdrop-blur-sm transition-all duration-300 focus:ring-2"
                              placeholder="votre@email.com"
                            />
                          </div>

                          <div>
                            <label className="text-coffee-primary/70 mb-2 block text-sm font-medium">
                              Téléphone
                            </label>
                            <input
                              type="tel"
                              className="focus:ring-coffee-primary focus:border-coffee-primary text-coffee-primary placeholder:text-coffee-primary/50 w-full rounded-xl border border-white/30 bg-white/20 p-4 font-medium backdrop-blur-sm transition-all duration-300 focus:ring-2"
                              placeholder="06 XX XX XX XX"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Special Requests - Full Width */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8"
                  >
                    <label className="text-coffee-primary mb-4 block text-lg font-semibold">
                      Demandes particulières (optionnel)
                    </label>
                    <textarea
                      className="focus:ring-coffee-primary focus:border-coffee-primary text-coffee-primary placeholder:text-coffee-primary/50 w-full resize-none rounded-xl border border-white/30 bg-white/20 p-4 font-medium backdrop-blur-sm transition-all duration-300 focus:ring-2"
                      rows={4}
                      placeholder="Équipements spéciaux, allergies alimentaires, préférences d'ambiance, etc."
                    />
                  </motion.div>

                  {/* Continue Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="from-coffee-primary via-coffee-primary to-coffee-accent mt-8 flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
                    onClick={nextStep}
                    whileHover={{
                      boxShadow: '0 25px 50px -12px rgba(255, 140, 0, 0.25)',
                    }}
                  >
                    Voir le récapitulatif
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Confirmation - Enhanced with Glass Cards */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Glass Card Container */}
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl border border-white/20 bg-white/40 shadow-2xl backdrop-blur-xl" />
                <div className="relative z-10 p-8">
                  {/* Back Button - Top Left in Card */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={handleBackClick}
                    className="absolute top-6 left-6 z-50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/60 p-3 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/80"
                    aria-label="Étape précédente"
                    type="button"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <ArrowLeft className="text-coffee-primary h-5 w-5" />
                  </motion.button>

                  <div className="mb-8 text-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.2,
                        type: 'spring',
                        stiffness: 200,
                      }}
                      className="from-coffee-primary to-coffee-accent mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-r shadow-lg"
                    >
                      <Check className="h-10 w-10 text-white" />
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-coffee-primary mb-3 text-3xl font-bold"
                    >
                      Récapitulatif
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-coffee-primary/70 text-lg"
                    >
                      Vérifiez vos informations avant de confirmer
                    </motion.p>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-2">
                    {/* Left Column - Booking Summary */}
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="rounded-2xl border border-white/30 bg-white/60 p-6 shadow-lg backdrop-blur-sm">
                        <h3 className="text-coffee-primary mb-6 flex items-center gap-3 text-xl font-bold">
                          <MapPin className="text-coffee-accent h-6 w-6" />
                          {bookingData.space?.name}
                        </h3>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-2">
                            <span className="text-coffee-primary/70 font-medium">
                              Lieu:
                            </span>
                            <span className="text-coffee-primary font-semibold">
                              {bookingData.space?.location}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <span className="text-coffee-primary/70 font-medium">
                              Date:
                            </span>
                            <span className="text-coffee-primary font-semibold">
                              {bookingData.date?.toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <span className="text-coffee-primary/70 font-medium">
                              Durée:
                            </span>
                            <span className="text-coffee-primary font-semibold">
                              {bookingData.duration}{' '}
                              {bookingData.durationType === 'hour'
                                ? 'heure(s)'
                                : bookingData.durationType === 'day'
                                  ? 'jour(s)'
                                  : bookingData.durationType === 'week'
                                    ? 'semaine(s)'
                                    : 'mois'}
                            </span>
                          </div>

                          {bookingData.startTime && (
                            <div className="flex items-center justify-between py-2">
                              <span className="text-coffee-primary/70 font-medium">
                                Heure de début:
                              </span>
                              <span className="text-coffee-primary font-semibold">
                                {bookingData.startTime}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between py-2">
                            <span className="text-coffee-primary/70 font-medium">
                              Personnes:
                            </span>
                            <span className="text-coffee-primary flex items-center gap-2 font-semibold">
                              <Users className="h-4 w-4" />
                              {bookingData.guests}
                            </span>
                          </div>

                          <div className="border-coffee-primary/20 mt-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                              <span className="text-coffee-primary text-xl font-bold">
                                Total:
                              </span>
                              <span className="text-coffee-accent text-3xl font-bold">
                                {bookingData.totalPrice}€
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Right Column - Payment Methods */}
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-coffee-primary mb-2 text-xl font-bold">
                          Méthode de paiement
                        </h3>
                        <p className="text-coffee-primary/70 mb-4 text-sm">
                          Sélectionnez votre méthode de paiement préférée
                        </p>
                        {bookingData.paymentMethod === 'onsite' && (
                          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              <p className="text-sm font-medium text-green-800">
                                Paiement sur place sélectionné - Vous pourrez
                                régler directement au café
                              </p>
                            </div>
                          </div>
                        )}
                        {!bookingData.paymentMethod && (
                          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <p className="text-sm font-medium text-amber-800">
                                Veuillez sélectionner une méthode de paiement
                                pour continuer
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          {paymentMethods.map((method, index) => {
                            const isSelected =
                              bookingData.paymentMethod === method.id
                            const isDisabled = !method.available

                            return (
                              <motion.div
                                key={method.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 + index * 0.1 }}
                                className={`group rounded-xl border-2 p-4 backdrop-blur-sm transition-all duration-300 ${
                                  isDisabled
                                    ? 'cursor-not-allowed border-gray-300 bg-gray-100/50 opacity-60'
                                    : isSelected
                                      ? 'border-coffee-primary bg-coffee-primary/20 shadow-lg'
                                      : 'hover:border-coffee-primary/50 hover:bg-coffee-primary/10 cursor-pointer border-white/30 bg-white/20'
                                }`}
                                whileHover={!isDisabled ? { scale: 1.02 } : {}}
                                whileTap={!isDisabled ? { scale: 0.98 } : {}}
                                onClick={() =>
                                  !isDisabled && selectPaymentMethod(method.id)
                                }
                              >
                                <div className="flex items-start gap-4">
                                  <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300 ${
                                      isSelected
                                        ? 'bg-coffee-primary text-white'
                                        : isDisabled
                                          ? 'bg-gray-200'
                                          : 'bg-coffee-primary/10 group-hover:bg-coffee-primary/20'
                                    }`}
                                  >
                                    <method.icon
                                      className={`h-6 w-6 ${
                                        isSelected
                                          ? 'text-white'
                                          : isDisabled
                                            ? 'text-gray-400'
                                            : 'text-coffee-accent'
                                      }`}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="mb-1 flex items-center gap-2">
                                      <span
                                        className={`font-semibold ${
                                          isDisabled
                                            ? 'text-gray-400'
                                            : 'text-coffee-primary'
                                        }`}
                                      >
                                        {method.name}
                                      </span>
                                      {method.popular && (
                                        <span className="bg-coffee-primary/20 text-coffee-accent rounded-full px-2 py-1 text-xs font-medium">
                                          Populaire
                                        </span>
                                      )}
                                      {!method.available && (
                                        <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-500">
                                          Prochainement
                                        </span>
                                      )}
                                      {isSelected && (
                                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                          Sélectionné
                                        </span>
                                      )}
                                    </div>
                                    <p
                                      className={`text-sm ${
                                        isDisabled
                                          ? 'text-gray-400'
                                          : 'text-coffee-primary/60'
                                      }`}
                                    >
                                      {method.description}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <div className="bg-coffee-primary flex h-6 w-6 items-center justify-center rounded-full">
                                      <Check className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Security Badge */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                        className="rounded-xl border border-green-200/50 bg-green-50/80 p-4 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                            <Check className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-800">
                              Paiement 100% sécurisé
                            </p>
                            <p className="text-xs text-green-600">
                              Vos données sont protégées par cryptage SSL
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Error Display */}
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">
                            {errors.general}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Confirm Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="from-coffee-primary via-coffee-primary to-coffee-accent mt-8 flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r py-5 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    whileHover={{
                      boxShadow: '0 25px 50px -12px rgba(255, 140, 0, 0.4)',
                    }}
                    onClick={handleConfirmBooking}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Confirmation en cours...
                        <div className="h-6 w-6" /> {/* Spacer */}
                      </>
                    ) : (
                      <>
                        <Coffee className="h-6 w-6" />
                        Confirmer ma réservation
                        <Check className="h-6 w-6" />
                      </>
                    )}
                  </motion.button>

                  {/* Terms */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="text-coffee-primary/60 mt-4 text-center text-xs leading-relaxed"
                  >
                    En confirmant, vous acceptez nos{' '}
                    <span className="text-coffee-accent cursor-pointer font-medium hover:underline">
                      conditions d'utilisation
                    </span>{' '}
                    et notre{' '}
                    <span className="text-coffee-accent cursor-pointer font-medium hover:underline">
                      politique de confidentialité
                    </span>
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
