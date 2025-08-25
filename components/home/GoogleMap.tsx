'use client'

import { Loader } from '@googlemaps/js-api-loader'
import { ExternalLink, MapPin, Navigation } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface GoogleMapProps {
  className?: string
  height?: string
}

export function GoogleMap({
  className = '',
  height = '400px',
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Coordonnées approximatives de Place Kléber, Strasbourg
  const LOCATION = {
    lat: 48.58086395263672,
    lng: 7.7466301918029785,
    address: '1 rue de la Division Leclerc, 67000 Strasbourg, France',
    name: 'Cow or King Café',
  }

  useEffect(() => {
    const initMap = async () => {
      try {
        // Utiliser une clé API d'environnement (à configurer)
        const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

        if (!GOOGLE_MAPS_API_KEY) {
          console.warn('Google Maps API key not found. Using fallback map.')
          setError('Carte non disponible - Clé API manquante')
          return
        }

        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places'],
        })

        const google = await loader.load()

        if (!mapRef.current) return

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: LOCATION,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }],
            },
            {
              featureType: 'transit',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }],
            },
          ],
        })

        // Marker standard Google Maps
        const marker = new google.maps.Marker({
          position: LOCATION,
          map: mapInstance,
          title: LOCATION.name,
          animation: google.maps.Animation.DROP,
        })

        // InfoWindow avec informations détaillées
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-family: system-ui, sans-serif;">
              <h3 style="margin: 0 0 8px 0; color: #8B4513; font-size: 16px; font-weight: bold;">
                ${LOCATION.name}
              </h3>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
                ${LOCATION.address}
              </p>
              <div style="display: flex; gap: 8px; margin-top: 8px;">
                <a href="https://maps.google.com/maps?daddr=${LOCATION.lat},${LOCATION.lng}" 
                   target="_blank" 
                   style="background: #8B4513; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px;">
                  Itinéraire
                </a>
                <a href="tel:0388000000" 
                   style="background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px;">
                  Appeler
                </a>
              </div>
            </div>
          `,
        })

        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker)
        })

        setMap(mapInstance)
        setIsLoaded(true)
      } catch (err) {
        console.error('Error loading Google Maps:', err)
        setError('Impossible de charger la carte')
      }
    }

    initMap()
  }, [])

  const openInGoogleMaps = () => {
    const url = `https://maps.google.com/maps?daddr=${LOCATION.lat},${LOCATION.lng}`
    window.open(url, '_blank')
  }

  const startNavigation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const origin = `${position.coords.latitude},${position.coords.longitude}`
          const destination = `${LOCATION.lat},${LOCATION.lng}`
          const url = `https://maps.google.com/maps?saddr=${origin}&daddr=${destination}&dirflg=w`
          window.open(url, '_blank')
        },
        () => {
          // Fallback si géolocalisation refusée
          openInGoogleMaps()
        }
      )
    } else {
      openInGoogleMaps()
    }
  }

  if (error) {
    return (
      <div
        className={`from-coffee-primary/20 to-coffee-accent/20 relative overflow-hidden rounded-2xl bg-gradient-to-br ${className}`}
        style={{ height }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-6 text-center">
            <MapPin className="text-coffee-primary mx-auto mb-4 h-16 w-16" />
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              {LOCATION.name}
            </h3>
            <p className="mb-4 text-gray-600">{LOCATION.address}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={openInGoogleMaps}
                className="bg-coffee-primary hover:bg-coffee-primary/90 inline-flex items-center gap-2 rounded-full px-4 py-2 text-white transition-colors"
              >
                <Navigation className="h-4 w-4" />
                Ouvrir dans Maps
                <ExternalLink className="h-3 w-3" />
              </button>
              <button
                onClick={startNavigation}
                className="text-coffee-primary border-coffee-primary hover:bg-coffee-primary inline-flex items-center gap-2 rounded-full border-2 bg-white px-4 py-2 transition-colors hover:text-white"
              >
                <Navigation className="h-4 w-4" />
                Itinéraire
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white shadow-lg ${className}`}
      style={{ height }}
    >
      <div
        ref={mapRef}
        className="h-full w-full"
        style={{ minHeight: height }}
      />

      {!isLoaded && (
        <div className="from-coffee-primary/20 to-coffee-accent/20 absolute inset-0 flex items-center justify-center bg-gradient-to-br">
          <div className="text-center">
            <div className="border-coffee-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"></div>
            <p className="text-coffee-primary font-medium">
              Chargement de la carte...
            </p>
          </div>
        </div>
      )}

      {/* Boutons flottants */}
      {isLoaded && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={openInGoogleMaps}
            className="rounded-lg bg-white p-2 shadow-lg transition-colors hover:bg-gray-50"
            title="Ouvrir dans Google Maps"
          >
            <ExternalLink className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={startNavigation}
            className="bg-coffee-primary hover:bg-coffee-primary/90 rounded-lg p-2 text-white shadow-lg transition-colors"
            title="Démarrer la navigation"
          >
            <Navigation className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
