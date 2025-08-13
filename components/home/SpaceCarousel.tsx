'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Star, MapPin, Calendar, Users } from 'lucide-react'
import { useSpaces } from '@/hooks/useSpaces'

interface Space {
  id: string
  name: string
  location: string
  capacity: number
  pricePerHour: number
  pricePerDay: number
  features: string[]
  amenities: string[]
  image: string
  rating: number
  specialty: string
  isPopular: boolean
  description: string
  color?: string
}

export default function SpaceCarousel() {
  const { spaces, isLoading, error } = useSpaces()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)

  // Fonction pour passer au slide suivant
  const nextSlide = useCallback(() => {
    if (spaces.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % Math.ceil(spaces.length / 3))
    }
  }, [spaces.length])

  // Fonction pour passer au slide précédent
  const prevSlide = useCallback(() => {
    if (spaces.length > 0) {
      setCurrentIndex(
        (prevIndex) => (prevIndex - 1 + Math.ceil(spaces.length / 3)) % Math.ceil(spaces.length / 3)
      )
    }
  }, [spaces.length])

  // Fonction pour aller à un slide spécifique et réinitialiser l'auto-scroll
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
    // Réinitialiser l'auto-scroll
    setAutoScrollEnabled(false)
    setTimeout(() => setAutoScrollEnabled(true), 100)
  }, [])

  // Auto-scroll toutes les 10 secondes (seulement si activé)
  useEffect(() => {
    if (spaces.length > 3 && autoScrollEnabled) {
      const interval = setInterval(nextSlide, 10000)
      return () => clearInterval(interval)
    }
  }, [spaces.length, autoScrollEnabled, nextSlide])

  // Gestion du drag
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const threshold = 50 // Seuil minimum de drag en pixels
    
    if (Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0) {
        // Drag vers la droite -> slide précédent
        prevSlide()
      } else {
        // Drag vers la gauche -> slide suivant
        nextSlide()
      }
      // Réinitialiser l'auto-scroll après un drag
      setAutoScrollEnabled(false)
      setTimeout(() => setAutoScrollEnabled(true), 100)
    }
  }, [nextSlide, prevSlide])

  // Obtenir les 3 espaces à afficher
  const getDisplayedSpaces = () => {
    if (spaces.length <= 3) {
      return spaces
    }
    const startIndex = currentIndex * 3
    return spaces.slice(startIndex, startIndex + 3)
  }

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-64 bg-gray-300 rounded-2xl mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error || spaces.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">
          {error || 'Aucun espace disponible pour le moment.'}
        </p>
      </div>
    )
  }

  const displayedSpaces = getDisplayedSpaces()
  const totalSlides = Math.ceil(spaces.length / 3)

  return (
    <div className="relative">
      {/* Carousel container */}
      <div className="overflow-hidden select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3 cursor-grab active:cursor-grabbing"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            drag={spaces.length > 3 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 0.98 }}
          >
            {displayedSpaces.map((space, index) => (
              <motion.div
                key={space.id}
                className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
              >
                {/* Image Background */}
                <div className={`relative h-64 bg-gradient-to-br ${space.color || 'from-coffee-primary to-coffee-accent'}`}>
                  {/* Image réelle si disponible, sinon gradient */}
                  {space.image && space.image !== '/images/spaces/default.jpg' && (
                    <img 
                      src={space.image} 
                      alt={space.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        // En cas d'erreur de chargement, garder le gradient
                        console.log('Erreur de chargement image:', space.image)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-black/20" />
                  
                  {/* Badge rating */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 backdrop-blur-sm">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span className="text-sm font-semibold">{space.rating}</span>
                  </div>

                  {/* Badge populaire */}
                  {space.isPopular && (
                    <div className="absolute top-4 left-4 rounded-full bg-coffee-accent px-3 py-1 text-xs font-semibold text-white">
                      Populaire
                    </div>
                  )}
                  
                  {/* Informations principales */}
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="mb-1 text-2xl font-bold">{space.name}</h3>
                    <p className="flex items-center gap-1 text-white/90 mb-2">
                      <MapPin className="h-4 w-4" />
                      {space.location}
                    </p>
                    <p className="flex items-center gap-1 text-white/90">
                      <Users className="h-4 w-4" />
                      {space.capacity} places
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-coffee-primary">
                      <span className="text-2xl font-bold">{space.pricePerHour}€</span>
                      <span className="text-sm text-gray-600">/heure</span>
                    </div>
                    <span className="text-sm text-coffee-accent font-medium bg-coffee-accent/10 px-3 py-1 rounded-full">
                      {space.specialty}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {space.description}
                  </p>

                  {/* Features (max 3 pour l'affichage) */}
                  <div className="space-y-2 mb-4">
                    {space.features.slice(0, 3).map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <div className="bg-coffee-primary h-1.5 w-1.5 rounded-full" />
                        {feature}
                      </div>
                    ))}
                    {space.features.length > 3 && (
                      <div className="text-xs text-coffee-accent">
                        +{space.features.length - 3} autres équipements
                      </div>
                    )}
                  </div>

                  {/* Button de réservation */}
                  <Link href={`/reservation/${space.id}`}>
                    <motion.button
                      className="from-coffee-primary to-coffee-accent flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r py-3 font-semibold text-white opacity-0 transition-all duration-300 group-hover:opacity-100"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label={`Réserver l'espace ${space.name}`}
                    >
                      <Calendar className="h-4 w-4" />
                      Réserver cet espace
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicators - seulement si plus de 3 espaces */}
      {totalSlides > 1 && (
        <div className="mt-8 flex justify-center space-x-2">
          {[...Array(totalSlides)].map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-3 w-10 rounded-full transition-all duration-300 hover:scale-110 ${
                index === currentIndex
                  ? 'bg-coffee-primary shadow-lg'
                  : 'bg-gray-300 hover:bg-coffee-primary/60'
              }`}
              aria-label={`Aller au groupe d'espaces ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Compteur d'espaces */}
      <div className="mt-6 text-center text-sm text-gray-500">
        {spaces.length > 3 ? (
          <>Espaces {currentIndex * 3 + 1}-{Math.min((currentIndex + 1) * 3, spaces.length)} sur {spaces.length}</>
        ) : (
          <>{spaces.length} espace{spaces.length > 1 ? 's' : ''} disponible{spaces.length > 1 ? 's' : ''}</>
        )}
      </div>
    </div>
  )
}