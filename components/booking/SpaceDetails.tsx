'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Heart,
  Info,
  MapPin,
  Monitor,
  Share2,
  Shield,
  Star,
  Users,
  VolumeX,
  Wifi,
  X,
} from 'lucide-react'
import { useState } from 'react'

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
  description:
    "Notre salle verrière offre un environnement de travail exceptionnel baigné de lumière naturelle. Parfaite pour les sessions de travail concentré ou les petites réunions, elle combine le confort moderne avec l'atmosphère chaleureuse d'un café artisanal.",
  images: [
    'bg-linear-to-br from-blue-400 to-indigo-600',
    'bg-linear-to-br from-cyan-400 to-blue-600',
    'bg-linear-to-br from-indigo-400 to-purple-600',
    'bg-linear-to-br from-purple-400 to-pink-600',
  ],
  features: [
    {
      icon: Wifi,
      name: 'WiFi Fibre Optique',
      description: 'Connexion ultra-rapide 1 Gb/s',
      included: true,
    },
    {
      icon: Monitor,
      name: 'Écran 4K',
      description: 'Écran externe 32" disponible',
      included: true,
    },
    {
      icon: VolumeX,
      name: 'Zone Silencieuse',
      description: 'Environnement calme et concentré',
      included: true,
    },
    {
      icon: Coffee,
      name: 'Boissons Illimitées',
      description: 'Café, thé, et boissons fraîches',
      included: true,
    },
    {
      icon: Shield,
      name: 'Casier Sécurisé',
      description: 'Rangement personnel verrouillable',
      included: true,
    },
    {
      icon: Car,
      name: 'Parking',
      description: 'Places de parking à proximité',
      included: false,
    },
  ],
  amenities: [
    'Climatisation réglable',
    'Éclairage LED ajustable',
    'Prises électriques multiples',
    'Tableau blanc effaçable',
    'Plantes vertes dépolluantes',
    'Vue panoramique sur la ville',
    'Accès 24h/24 (membres premium)',
    'Service de nettoyage quotidien',
  ],
  rules: [
    'Pas de nourriture forte odeur',
    'Silence demandé après 18h',
    'Maximum 8 personnes simultanément',
    'Réservation requise',
    'Nettoyage après usage obligatoire',
  ],
  availability: {
    today: true,
    nextAvailable: new Date('2024-08-05T09:00:00'),
  },
  reviews: [
    {
      id: 'rev-1',
      user: 'Sophie M.',
      rating: 5,
      comment:
        'Espace magnifique avec une lumière naturelle exceptionnelle. Parfait pour se concentrer. Le café est délicieux !',
      date: new Date('2024-07-28'),
      verified: true,
    },
    {
      id: 'rev-2',
      user: 'Thomas L.',
      rating: 5,
      comment:
        "J'y travaille régulièrement, l'ambiance est parfaite et le WiFi ultra-rapide. Très recommandé.",
      date: new Date('2024-07-25'),
      verified: true,
    },
    {
      id: 'rev-3',
      user: 'Marie D.',
      rating: 4,
      comment:
        'Très bel espace, seul bémol le prix un peu élevé, mais la qualité est au rendez-vous.',
      date: new Date('2024-07-20'),
      verified: false,
    },
  ],
  coordinates: {
    lat: 48.5734,
    lng: 7.7521,
  },
}

export default function SpaceDetails({
  onBack,
  onBook,
}: {
  onBack: () => void
  onBook: () => void
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showAllAmenities, setShowAllAmenities] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedPricing, setSelectedPricing] = useState<
    'hour' | 'day' | 'week' | 'month'
  >('hour')

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % SPACE_DETAILS.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) =>
        (prev - 1 + SPACE_DETAILS.images.length) % SPACE_DETAILS.images.length
    )
  }

  const getPriceForType = (type: string) => {
    switch (type) {
      case 'hour':
        return SPACE_DETAILS.pricePerHour
      case 'day':
        return SPACE_DETAILS.pricePerDay
      case 'week':
        return SPACE_DETAILS.pricePerWeek
      case 'month':
        return SPACE_DETAILS.pricePerMonth
      default:
        return SPACE_DETAILS.pricePerHour
    }
  }

  const getPriceLabel = (type: string) => {
    switch (type) {
      case 'hour':
        return '/heure'
      case 'day':
        return '/jour'
      case 'week':
        return '/semaine'
      case 'month':
        return '/mois'
      default:
        return '/heure'
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
        <div className="absolute top-4 right-4 left-4 z-20 flex items-center justify-between">
          <motion.button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm"
            onClick={onBack}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="text-coffee-primary h-5 w-5" />
          </motion.button>

          <div className="flex gap-3">
            <motion.button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm"
              onClick={() => setIsFavorite(!isFavorite)}
              whileTap={{ scale: 0.95 }}
            >
              <Heart
                className={`h-5 w-5 ${isFavorite ? 'fill-current text-red-500' : 'text-gray-600'}`}
              />
            </motion.button>

            <motion.button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm"
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="h-5 w-5 text-gray-600" />
            </motion.button>
          </div>
        </div>

        {/* Image Navigation */}
        {SPACE_DETAILS.images.length > 1 && (
          <>
            <button
              className="absolute top-1/2 left-4 z-20 flex h-10 w-10 -translate-y-1/2 transform items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm"
              onClick={prevImage}
            >
              <ChevronLeft className="text-coffee-primary h-5 w-5" />
            </button>

            <button
              className="absolute top-1/2 right-4 z-20 flex h-10 w-10 -translate-y-1/2 transform items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm"
              onClick={nextImage}
            >
              <ChevronRight className="text-coffee-primary h-5 w-5" />
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 transform gap-2">
              {SPACE_DETAILS.images.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          </>
        )}

        {/* Availability Badge */}
        <div className="absolute right-4 bottom-4 z-20">
          <div
            className={`rounded-full px-3 py-2 text-sm font-medium backdrop-blur-sm ${
              SPACE_DETAILS.availability.today
                ? 'bg-green-500/90 text-white'
                : 'bg-orange-500/90 text-white'
            }`}
          >
            {SPACE_DETAILS.availability.today
              ? "✓ Disponible aujourd'hui"
              : 'Prochaine disponibilité'}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pb-24">
        {/* Basic Info */}
        <motion.div
          className="border-b border-gray-100 py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-coffee-primary mb-1 text-2xl font-bold">
                {SPACE_DETAILS.name}
              </h1>
              <div className="mb-2 flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{SPACE_DETAILS.location}</span>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-current text-yellow-500" />
              <span className="font-semibold">{SPACE_DETAILS.rating}</span>
              <span className="text-sm text-gray-600">
                ({SPACE_DETAILS.reviewCount} avis)
              </span>
            </div>

            <div className="flex items-center gap-1 text-gray-600">
              <Users className="h-4 w-4" />
              <span className="text-sm">
                Jusqu\'à {SPACE_DETAILS.capacity} personnes
              </span>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-gray-700">
            {SPACE_DETAILS.description}
          </p>
        </motion.div>

        {/* Pricing Options */}
        <motion.div
          className="border-b border-gray-100 py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h2 className="text-coffee-primary mb-4 text-lg font-bold">Tarifs</h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                type: 'hour',
                label: 'Heure',
                price: SPACE_DETAILS.pricePerHour,
              },
              {
                type: 'day',
                label: 'Journée',
                price: SPACE_DETAILS.pricePerDay,
              },
              {
                type: 'week',
                label: 'Semaine',
                price: SPACE_DETAILS.pricePerWeek,
              },
              {
                type: 'month',
                label: 'Mois',
                price: SPACE_DETAILS.pricePerMonth,
              },
            ].map((option) => (
              <motion.button
                key={option.type}
                className={`rounded-xl border-2 p-4 transition-all duration-300 ${
                  selectedPricing === option.type
                    ? 'border-coffee-primary bg-coffee-primary/10'
                    : 'hover:border-coffee-primary/50 border-gray-200'
                }`}
                onClick={() => setSelectedPricing(option.type as any)}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${
                      selectedPricing === option.type
                        ? 'text-coffee-accent'
                        : 'text-coffee-primary'
                    }`}
                  >
                    {option.price}€
                  </div>
                  <div
                    className={`text-sm ${
                      selectedPricing === option.type
                        ? 'text-coffee-primary'
                        : 'text-gray-600'
                    }`}
                  >
                    {option.label}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          className="border-b border-gray-100 py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="text-coffee-primary mb-4 text-lg font-bold">
            Équipements inclus
          </h2>

          <div className="space-y-3">
            {SPACE_DETAILS.features.map((feature, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 rounded-xl p-3 ${
                  feature.included
                    ? 'border border-green-200 bg-green-50'
                    : 'border border-gray-200 bg-gray-50'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    feature.included
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {feature.included ? (
                    <feature.icon className="h-5 w-5" />
                  ) : (
                    <X className="h-5 w-5" />
                  )}
                </div>

                <div className="flex-1">
                  <h3
                    className={`font-semibold ${
                      feature.included ? 'text-coffee-primary' : 'text-gray-500'
                    }`}
                  >
                    {feature.name}
                  </h3>
                  <p
                    className={`text-sm ${
                      feature.included ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {feature.description}
                  </p>
                </div>

                {feature.included && (
                  <Check className="h-5 w-5 text-green-600" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Amenities */}
        <motion.div
          className="border-b border-gray-100 py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h2 className="text-coffee-primary mb-4 text-lg font-bold">
            Services disponibles
          </h2>

          <div className="space-y-2">
            {SPACE_DETAILS.amenities
              .slice(0, showAllAmenities ? undefined : 4)
              .map((amenity, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="bg-coffee-primary h-2 w-2 rounded-full" />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </div>
              ))}
          </div>

          {SPACE_DETAILS.amenities.length > 4 && (
            <motion.button
              className="text-coffee-accent mt-3 text-sm font-medium"
              onClick={() => setShowAllAmenities(!showAllAmenities)}
              whileTap={{ scale: 0.98 }}
            >
              {showAllAmenities
                ? 'Voir moins'
                : `Voir ${SPACE_DETAILS.amenities.length - 4} de plus`}
            </motion.button>
          )}
        </motion.div>

        {/* Rules */}
        <motion.div
          className="border-b border-gray-100 py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h2 className="text-coffee-primary mb-4 text-lg font-bold">
            Règlement intérieur
          </h2>

          <div className="space-y-2">
            {SPACE_DETAILS.rules.map((rule, index) => (
              <div key={index} className="flex items-start gap-3">
                <Info className="text-coffee-accent mt-0.5 h-4 w-4 shrink-0" />
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-coffee-primary text-lg font-bold">
              Avis ({SPACE_DETAILS.reviewCount})
            </h2>
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-current text-yellow-500" />
              <span className="font-semibold">{SPACE_DETAILS.rating}</span>
            </div>
          </div>

          <div className="space-y-4">
            {SPACE_DETAILS.reviews
              .slice(0, showAllReviews ? undefined : 2)
              .map((review) => (
                <div key={review.id} className="rounded-xl bg-gray-50 p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-coffee-primary flex h-8 w-8 items-center justify-center rounded-full">
                        <span className="text-sm font-semibold text-white">
                          {review.user.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-coffee-primary font-medium">
                            {review.user}
                          </span>
                          {review.verified && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
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
              className="text-coffee-accent mt-4 text-sm font-medium"
              onClick={() => setShowAllReviews(!showAllReviews)}
              whileTap={{ scale: 0.98 }}
            >
              {showAllReviews
                ? 'Voir moins'
                : `Voir ${SPACE_DETAILS.reviews.length - 2} avis de plus`}
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed right-0 bottom-0 left-0 mx-auto max-w-md border-t border-gray-200 bg-white p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-coffee-accent text-2xl font-bold">
              {getPriceForType(selectedPricing)}€
            </div>
            <div className="text-sm text-gray-600">
              {getPriceLabel(selectedPricing)}
            </div>
          </div>

          <motion.button
            className="from-coffee-primary to-coffee-accent flex-2 rounded-xl bg-linear-to-r px-8 py-4 font-semibold text-white shadow-lg"
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
