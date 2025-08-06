'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Star,
  MapPin,
  Users,
  Wifi,
  Coffee,
  Monitor,
  Volume2,
  VolumeX,
  Car,
  Utensils,
  Shield,
  Camera,
  Clock,
  Calendar,
  CreditCard,
  Heart,
  Share2,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ZoomIn,
  Check,
  X,
  Info,
  Navigation
} from 'lucide-react'

interface SpaceDetail {
  id: string
  name: string
  location: string
  capacity: number
  area: number
  pricePerHour: number
  pricePerDay: number
  pricePerWeek: number
  pricePerMonth: number
  rating: number
  reviewCount: number
  description: string
  images: string[]
  features: {
    icon: any
    name: string
    description: string
    included: boolean
  }[]
  amenities: string[]
  rules: string[]
  availability: {
    today: boolean
    nextAvailable: Date
  }
  reviews: {
    id: string
    user: string
    rating: number
    comment: string
    date: Date
    verified: boolean
  }[]
  coordinates: {
    lat: number
    lng: number
  }
}

const SPACE_DETAILS: SpaceDetail = {
  id: 'verriere',
  name: 'Salle Verrière',
  location: 'Niveau intermédiaire - Cow or King Café',
  capacity: 8,
  area: 25,
  pricePerHour: 12,
  pricePerDay: 45,
  pricePerWeek: 189,
  pricePerMonth: 499,
  rating: 4.9,
  reviewCount: 47,
  description: 'Notre salle verrière offre un environnement de travail exceptionnel baigné de lumière naturelle. Parfaite pour les sessions de travail concentré ou les petites réunions, elle combine le confort moderne avec l\'atmosphère chaleureuse d\'un café artisanal.',
  images: [
    'bg-gradient-to-br from-blue-400 to-indigo-600',
    'bg-gradient-to-br from-cyan-400 to-blue-600',
    'bg-gradient-to-br from-indigo-400 to-purple-600',
    'bg-gradient-to-br from-purple-400 to-pink-600'
  ],
  features: [
    {
      icon: Wifi,
      name: 'WiFi Fibre Optique',
      description: 'Connexion ultra-rapide 1 Gb/s',
      included: true
    },
    {
      icon: Monitor,
      name: 'Écran 4K',
      description: 'Écran externe 32" disponible',
      included: true
    },
    {
      icon: VolumeX,
      name: 'Zone Silencieuse',
      description: 'Environnement calme et concentré',
      included: true
    },
    {
      icon: Coffee,
      name: 'Boissons Illimitées',
      description: 'Café, thé, et boissons fraîches',
      included: true
    },
    {
      icon: Shield,
      name: 'Casier Sécurisé',
      description: 'Rangement personnel verrouillable',
      included: true
    },
    {
      icon: Car,
      name: 'Parking',
      description: 'Places de parking à proximité',
      included: false
    }
  ],
  amenities: [
    'Climatisation réglable',
    'Éclairage LED ajustable',
    'Prises électriques multiples',
    'Tableau blanc effaçable',
    'Plantes vertes dépolluantes',
    'Vue panoramique sur la ville',
    'Accès 24h/24 (membres premium)',
    'Service de nettoyage quotidien'
  ],
  rules: [
    'Pas de nourriture forte odeur',
    'Silence demandé après 18h',
    'Maximum 8 personnes simultanément',
    'Réservation requise',
    'Nettoyage après usage obligatoire'
  ],
  availability: {
    today: true,
    nextAvailable: new Date('2024-08-05T09:00:00')
  },
  reviews: [
    {
      id: 'rev-1',
      user: 'Sophie M.',
      rating: 5,
      comment: 'Espace magnifique avec une lumière naturelle exceptionnelle. Parfait pour se concentrer. Le café est délicieux !',
      date: new Date('2024-07-28'),
      verified: true
    },
    {
      id: 'rev-2',
      user: 'Thomas L.',
      rating: 5,
      comment: 'J\'y travaille régulièrement, l\'ambiance est parfaite et le WiFi ultra-rapide. Très recommandé.',
      date: new Date('2024-07-25'),
      verified: true
    },
    {
      id: 'rev-3',
      user: 'Marie D.',
      rating: 4,
      comment: 'Très bel espace, seul bémol le prix un peu élevé, mais la qualité est au rendez-vous.',
      date: new Date('2024-07-20'),
      verified: false
    }
  ],
  coordinates: {
    lat: 48.5734,
    lng: 7.7521
  }
}

export default function SpaceDetails({ onBack, onBook }: { 
  onBack: () => void
  onBook: () => void 
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showAllAmenities, setShowAllAmenities] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedPricing, setSelectedPricing] = useState<'hour' | 'day' | 'week' | 'month'>('hour')

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % SPACE_DETAILS.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + SPACE_DETAILS.images.length) % SPACE_DETAILS.images.length)
  }

  const getPriceForType = (type: string) => {
    switch (type) {
      case 'hour': return SPACE_DETAILS.pricePerHour
      case 'day': return SPACE_DETAILS.pricePerDay
      case 'week': return SPACE_DETAILS.pricePerWeek
      case 'month': return SPACE_DETAILS.pricePerMonth
      default: return SPACE_DETAILS.pricePerHour
    }
  }

  const getPriceLabel = (type: string) => {
    switch (type) {
      case 'hour': return '/heure'
      case 'day': return '/jour'
      case 'week': return '/semaine'
      case 'month': return '/mois'
      default: return '/heure'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Image Gallery Header */}
      <div className="relative h-80 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            className={`absolute inset-0 ${SPACE_DETAILS.images[currentImageIndex]}`}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
          <motion.button
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
            onClick={onBack}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-coffee-accent" />
          </motion.button>
          
          <div className="flex gap-3">
            <motion.button
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
              onClick={() => setIsFavorite(!isFavorite)}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
            </motion.button>
            
            <motion.button
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>
        </div>

        {/* Image Navigation */}
        {SPACE_DETAILS.images.length > 1 && (
          <>
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg z-20"
              onClick={prevImage}
            >
              <ChevronLeft className="w-5 h-5 text-coffee-accent" />
            </button>
            
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg z-20"
              onClick={nextImage}
            >
              <ChevronRight className="w-5 h-5 text-coffee-accent" />
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {SPACE_DETAILS.images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          </>
        )}

        {/* Availability Badge */}
        <div className="absolute bottom-4 right-4 z-20">
          <div className={`px-3 py-2 rounded-full text-sm font-medium backdrop-blur-sm ${
            SPACE_DETAILS.availability.today
              ? 'bg-green-500/90 text-white'
              : 'bg-orange-500/90 text-white'
          }`}>
            {SPACE_DETAILS.availability.today ? '✓ Disponible aujourd\'hui' : 'Prochaine disponibilité'}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pb-24">
        {/* Basic Info */}
        <motion.div
          className="py-6 border-b border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-coffee-accent mb-1">
                {SPACE_DETAILS.name}
              </h1>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{SPACE_DETAILS.location}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-current text-yellow-500" />
              <span className="font-semibold">{SPACE_DETAILS.rating}</span>
              <span className="text-gray-600 text-sm">({SPACE_DETAILS.reviewCount} avis)</span>
            </div>
            
            <div className="flex items-center gap-1 text-gray-600">
              <Users className="w-4 h-4" />
              <span className="text-sm">Jusqu\'à {SPACE_DETAILS.capacity} personnes</span>
            </div>
          </div>

          <p className="text-gray-700 text-sm leading-relaxed">
            {SPACE_DETAILS.description}
          </p>
        </motion.div>

        {/* Pricing Options */}
        <motion.div
          className="py-6 border-b border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h2 className="text-lg font-bold text-coffee-accent mb-4">Tarifs</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { type: 'hour', label: 'Heure', price: SPACE_DETAILS.pricePerHour },
              { type: 'day', label: 'Journée', price: SPACE_DETAILS.pricePerDay },
              { type: 'week', label: 'Semaine', price: SPACE_DETAILS.pricePerWeek },
              { type: 'month', label: 'Mois', price: SPACE_DETAILS.pricePerMonth }
            ].map((option) => (
              <motion.button
                key={option.type}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  selectedPricing === option.type
                    ? 'border-coffee-primary bg-coffee-primary/10'
                    : 'border-gray-200 hover:border-coffee-primary/50'
                }`}
                onClick={() => setSelectedPricing(option.type as any)}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    selectedPricing === option.type ? 'text-coffee-primary' : 'text-coffee-accent'
                  }`}>
                    {option.price}€
                  </div>
                  <div className={`text-sm ${
                    selectedPricing === option.type ? 'text-coffee-accent' : 'text-gray-600'
                  }`}>
                    {option.label}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          className="py-6 border-b border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-coffee-accent mb-4">Équipements inclus</h2>
          
          <div className="space-y-3">
            {SPACE_DETAILS.features.map((feature, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  feature.included 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  feature.included 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {feature.included ? (
                    <feature.icon className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    feature.included ? 'text-coffee-accent' : 'text-gray-500'
                  }`}>
                    {feature.name}
                  </h3>
                  <p className={`text-sm ${
                    feature.included ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {feature.description}
                  </p>
                </div>
                
                {feature.included && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Amenities */}
        <motion.div
          className="py-6 border-b border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h2 className="text-lg font-bold text-coffee-accent mb-4">Services disponibles</h2>
          
          <div className="space-y-2">
            {SPACE_DETAILS.amenities.slice(0, showAllAmenities ? undefined : 4).map((amenity, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-coffee-primary rounded-full" />
                <span className="text-sm text-gray-700">{amenity}</span>
              </div>
            ))}
          </div>
          
          {SPACE_DETAILS.amenities.length > 4 && (
            <motion.button
              className="mt-3 text-coffee-primary text-sm font-medium"
              onClick={() => setShowAllAmenities(!showAllAmenities)}
              whileTap={{ scale: 0.98 }}
            >
              {showAllAmenities ? 'Voir moins' : `Voir ${SPACE_DETAILS.amenities.length - 4} de plus`}
            </motion.button>
          )}
        </motion.div>

        {/* Rules */}
        <motion.div
          className="py-6 border-b border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h2 className="text-lg font-bold text-coffee-accent mb-4">Règlement intérieur</h2>
          
          <div className="space-y-2">
            {SPACE_DETAILS.rules.map((rule, index) => (
              <div key={index} className="flex items-start gap-3">
                <Info className="w-4 h-4 text-coffee-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{rule}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Reviews */}
        <motion.div
          className="py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-coffee-accent">
              Avis ({SPACE_DETAILS.reviewCount})
            </h2>
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-current text-yellow-500" />
              <span className="font-semibold">{SPACE_DETAILS.rating}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {SPACE_DETAILS.reviews.slice(0, showAllReviews ? undefined : 2).map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-coffee-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {review.user.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-coffee-accent">{review.user}</span>
                        {review.verified && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating
                                ? 'fill-current text-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {review.date.toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
          
          {SPACE_DETAILS.reviews.length > 2 && (
            <motion.button
              className="mt-4 text-coffee-primary text-sm font-medium"
              onClick={() => setShowAllReviews(!showAllReviews)}
              whileTap={{ scale: 0.98 }}
            >
              {showAllReviews ? 'Voir moins' : `Voir ${SPACE_DETAILS.reviews.length - 2} avis de plus`}
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-2xl font-bold text-coffee-primary">
              {getPriceForType(selectedPricing)}€
            </div>
            <div className="text-sm text-gray-600">
              {getPriceLabel(selectedPricing)}
            </div>
          </div>
          
          <motion.button
            className="flex-2 bg-gradient-to-r from-coffee-primary to-coffee-accent text-white py-4 px-8 rounded-xl font-semibold shadow-lg"
            onClick={onBook}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Réserver maintenant
          </motion.button>
        </div>
      </div>
    </div>
  )
}