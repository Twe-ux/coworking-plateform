'use client'

import { motion } from 'framer-motion'
import { Clock, MapPin, Phone, ExternalLink, Wifi, Car, Coffee } from 'lucide-react'
import { useEffect, useState } from 'react'

interface BusinessDay {
  day: string
  dayShort: string
  open: string
  close: string
  isOpen: boolean
  isClosed?: boolean
}

interface BusinessHoursProps {
  className?: string
  variant?: 'compact' | 'detailed' | 'hero'
}

export function BusinessHours({ className = '', variant = 'detailed' }: BusinessHoursProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isOpen, setIsOpen] = useState(false)
  const [nextOpenTime, setNextOpenTime] = useState<string>('')
  const [currentDay, setCurrentDay] = useState<string>('')

  // Horaires d'ouverture (modifiable via admin dans le futur)
  const businessHours: BusinessDay[] = [
    { day: 'Lundi', dayShort: 'Lun', open: '08:00', close: '20:00', isOpen: true },
    { day: 'Mardi', dayShort: 'Mar', open: '08:00', close: '20:00', isOpen: true },
    { day: 'Mercredi', dayShort: 'Mer', open: '08:00', close: '20:00', isOpen: true },
    { day: 'Jeudi', dayShort: 'Jeu', open: '08:00', close: '20:00', isOpen: true },
    { day: 'Vendredi', dayShort: 'Ven', open: '08:00', close: '20:00', isOpen: true },
    { day: 'Samedi', dayShort: 'Sam', open: '09:00', close: '18:00', isOpen: true },
    { day: 'Dimanche', dayShort: 'Dim', open: '10:00', close: '17:00', isOpen: true }
  ]

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date()
      setCurrentTime(now)
      
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTimeMinutes = currentHour * 60 + currentMinute
      const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
      
      // Conversion pour correspondre à notre array (0 = Lundi)
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const todayHours = businessHours[dayIndex]
      
      setCurrentDay(todayHours.day)
      
      if (todayHours.isOpen) {
        const [openHour, openMinute] = todayHours.open.split(':').map(Number)
        const [closeHour, closeMinute] = todayHours.close.split(':').map(Number)
        const openTimeMinutes = openHour * 60 + openMinute
        const closeTimeMinutes = closeHour * 60 + closeMinute
        
        setIsOpen(currentTimeMinutes >= openTimeMinutes && currentTimeMinutes < closeTimeMinutes)
        
        // Calculer la prochaine ouverture si fermé
        if (currentTimeMinutes < openTimeMinutes) {
          setNextOpenTime(`Ouvre à ${todayHours.open}`)
        } else if (currentTimeMinutes >= closeTimeMinutes) {
          // Chercher le prochain jour d'ouverture
          let nextDayIndex = (dayIndex + 1) % 7
          let nextDay = businessHours[nextDayIndex]
          while (!nextDay.isOpen && nextDayIndex !== dayIndex) {
            nextDayIndex = (nextDayIndex + 1) % 7
            nextDay = businessHours[nextDayIndex]
          }
          setNextOpenTime(`Ouvre ${nextDay.day} à ${nextDay.open}`)
        }
      } else {
        setIsOpen(false)
        // Chercher le prochain jour d'ouverture
        let nextDayIndex = (dayIndex + 1) % 7
        let nextDay = businessHours[nextDayIndex]
        while (!nextDay.isOpen && nextDayIndex !== dayIndex) {
          nextDayIndex = (nextDayIndex + 1) % 7
          nextDay = businessHours[nextDayIndex]
        }
        setNextOpenTime(`Ouvre ${nextDay.day} à ${nextDay.open}`)
      }
    }

    updateStatus()
    const timer = setInterval(updateStatus, 60000) // Mise à jour chaque minute

    return () => clearInterval(timer)
  }, [])

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
          isOpen 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        } ${className}`}
      >
        <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        <Clock className="h-3 w-3" />
        <span>{isOpen ? 'Ouvert' : 'Fermé'}</span>
        <span className="text-xs opacity-75">
          {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </motion.div>
    )
  }

  if (variant === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-center space-y-3 ${className}`}
      >
        <div className={`inline-flex items-center gap-3 rounded-full px-6 py-3 text-base font-medium ${
          isOpen 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <Clock className="h-4 w-4" />
          <span>{isOpen ? 'Ouvert maintenant' : 'Fermé'}</span>
          <span className="font-normal">
            {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        {!isOpen && nextOpenTime && (
          <p className="text-sm text-gray-600">{nextOpenTime}</p>
        )}
        
        {isOpen && (
          <p className="text-sm text-gray-600">
            Ferme à {businessHours.find(h => h.day === currentDay)?.close}
          </p>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}
    >
      {/* En-tête avec statut actuel */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium mb-3 ${
          isOpen 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <Clock className="h-4 w-4" />
          <span>{isOpen ? 'Ouvert maintenant' : 'Fermé'}</span>
          <span className="font-normal">
            {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">Horaires d'ouverture</h3>
        
        {!isOpen && nextOpenTime && (
          <p className="text-coffee-primary font-medium">{nextOpenTime}</p>
        )}
      </div>

      {/* Grille des horaires */}
      <div className="space-y-3 mb-6">
        {businessHours.map((day, index) => {
          const isToday = day.day === currentDay
          return (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                isToday 
                  ? 'bg-coffee-primary/10 border border-coffee-primary/20' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {isToday && (
                  <div className="w-2 h-2 bg-coffee-primary rounded-full animate-pulse" />
                )}
                <span className={`font-medium ${isToday ? 'text-coffee-primary' : 'text-gray-700'}`}>
                  {day.day}
                </span>
                {isToday && (
                  <span className="text-xs bg-coffee-primary text-white px-2 py-1 rounded-full">
                    Aujourd'hui
                  </span>
                )}
              </div>
              
              <span className={`font-medium ${isToday ? 'text-coffee-primary' : 'text-gray-600'}`}>
                {day.isClosed ? 'Fermé' : `${day.open} - ${day.close}`}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Informations supplémentaires */}
      <div className="border-t pt-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-coffee-accent" />
            <span>Strasbourg Centre</span>
            <ExternalLink className="h-3 w-3 opacity-50" />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 text-coffee-accent" />
            <span>03 88 XX XX XX</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-6 pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Wifi className="h-3 w-3 text-green-500" />
            <span>WiFi gratuit</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Coffee className="h-3 w-3 text-coffee-accent" />
            <span>Café inclus</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Car className="h-3 w-3 text-blue-500" />
            <span>Parking proche</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}