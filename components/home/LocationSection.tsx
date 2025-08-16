'use client'

import { motion } from 'framer-motion'
import {
  Accessibility,
  Bike,
  Bus,
  Car,
  Mail,
  MapPin,
  Phone,
  Shield,
  Train,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { BusinessHours } from './BusinessHours'
import { GoogleMap } from './GoogleMap'

export function LocationSection() {
  const [selectedTransport, setSelectedTransport] = useState<string | null>(
    null
  )

  const transportOptions = [
    {
      id: 'tram',
      icon: Train,
      name: 'Tram',
      lines: ['A', 'D'],
      station: 'Homme de Fer',
      distance: '2 min à pied',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      id: 'bus',
      icon: Bus,
      name: 'Bus',
      lines: ['10', '20', '30'],
      station: 'Place Kléber',
      distance: '5 min à pied',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      id: 'parking',
      icon: Car,
      name: 'Parking',
      lines: ['Austerlitz', 'Gutenberg'],
      station: 'Parking public',
      distance: '3 min à pied',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      id: 'bike',
      icon: Bike,
      name: 'Vélo',
      lines: ['Vélhop'],
      station: 'Station Place Kléber',
      distance: '1 min à pied',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  const amenities = [
    {
      icon: Zap,
      name: 'Fibre optique',
      description: '1 Gb/s symétrique',
      color: 'text-yellow-600',
    },
    {
      icon: Shield,
      name: 'Sécurisé 24/7',
      description: 'Accès contrôlé',
      color: 'text-green-600',
    },
    {
      icon: Accessibility,
      name: 'Accessible PMR',
      description: 'Accès handicapés',
      color: 'text-blue-600',
    },
  ]

  return (
    <section className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="bg-coffee-primary/10 text-coffee-primary mb-4 inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
            📍 Nous trouver
          </span>
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            Au cœur de{' '}
            <span className="from-coffee-accent to-coffee-primary bg-gradient-to-r bg-clip-text text-transparent">
              Strasbourg
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            Idéalement situé dans le centre historique, facilement accessible en
            transport en commun.
          </p>
        </motion.div>

        <div className="mb-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Carte interactive */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Google Maps Interactive */}
            <GoogleMap height="320px" />

            {/* Informations de contact */}
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Informations pratiques
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="text-coffee-accent h-5 w-5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      1 rue de la Division Leclerc
                    </p>
                    <p className="text-sm text-gray-600">
                      67000 Strasbourg, France
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="text-coffee-accent h-5 w-5" />
                  <div>
                    <p className="font-medium text-gray-900">03 88 XX XX XX</p>
                    <p className="text-sm text-gray-600">Lun - Dim 8h - 20h</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="text-coffee-accent h-5 w-5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      hello@coworkingcafe.fr
                    </p>
                    <p className="text-sm text-gray-600">Réponse sous 24h</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Horaires et accessibilité */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Horaires */}
            <BusinessHours variant="detailed" />

            {/* Services et équipements */}
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Services inclus
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {amenities.map((amenity, index) => (
                  <motion.div
                    key={amenity.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                  >
                    <amenity.icon className={`h-5 w-5 ${amenity.color}`} />
                    <div>
                      <p className="font-medium text-gray-900">
                        {amenity.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {amenity.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Section transport */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="rounded-2xl bg-white p-8 shadow-lg"
        >
          <div className="mb-8 text-center">
            <h3 className="mb-2 text-2xl font-bold text-gray-900">
              Comment venir ?
            </h3>
            <p className="text-gray-600">
              Facilement accessible par tous les moyens de transport
            </p>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {transportOptions.map((transport, index) => (
              <motion.button
                key={transport.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setSelectedTransport(
                    selectedTransport === transport.id ? null : transport.id
                  )
                }
                className={`rounded-xl border p-4 transition-all duration-200 ${
                  selectedTransport === transport.id
                    ? `${transport.bgColor} border-current ${transport.color}`
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <transport.icon
                  className={`mx-auto mb-2 h-8 w-8 ${
                    selectedTransport === transport.id
                      ? transport.color
                      : 'text-gray-600'
                  }`}
                />
                <h4 className="mb-1 font-medium text-gray-900">
                  {transport.name}
                </h4>
                <p className="text-sm text-gray-600">{transport.distance}</p>
              </motion.button>
            ))}
          </div>

          {/* Détails du transport sélectionné */}
          {selectedTransport && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl bg-gray-50 p-6"
            >
              {(() => {
                const transport = transportOptions.find(
                  (t) => t.id === selectedTransport
                )
                if (!transport) return null

                return (
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-3 ${transport.bgColor}`}>
                      <transport.icon
                        className={`h-6 w-6 ${transport.color}`}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-2 font-bold text-gray-900">
                        {transport.name} - {transport.station}
                      </h4>
                      <div className="mb-3 flex flex-wrap gap-2">
                        {transport.lines.map((line) => (
                          <span
                            key={line}
                            className={`rounded px-2 py-1 text-xs font-medium ${transport.bgColor} ${transport.color}`}
                          >
                            Ligne {line}
                          </span>
                        ))}
                      </div>
                      <p className="mb-3 text-sm text-gray-600">
                        <strong>{transport.distance}</strong> du café
                      </p>

                      {transport.id === 'parking' && (
                        <div className="text-sm text-gray-600">
                          <p>• Tarif : 2€/heure, 15€/jour</p>
                          <p>• Places handicapés disponibles</p>
                          <p>• Accès 24h/24</p>
                        </div>
                      )}

                      {transport.id === 'tram' && (
                        <div className="text-sm text-gray-600">
                          <p>• Fréquence : toutes les 5-10 min</p>
                          <p>• Derniers trams : 00h30</p>
                          <p>• Accessibilité PMR</p>
                        </div>
                      )}

                      {transport.id === 'bus' && (
                        <div className="text-sm text-gray-600">
                          <p>• Fréquence : toutes les 10-15 min</p>
                          <p>• Service jusqu'à 21h</p>
                          <p>• Connexions multiples</p>
                        </div>
                      )}

                      {transport.id === 'bike' && (
                        <div className="text-sm text-gray-600">
                          <p>• 15 vélos disponibles en moyenne</p>
                          <p>• Abonnement Vélhop : 31€/an</p>
                          <p>• Stationnement vélos sécurisé au café</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </motion.div>
          )}

          <div className="mt-6 text-center">
            <p className="mb-4 text-sm text-gray-600">
              Besoin d'aide pour organiser votre venue ?
            </p>
            <button className="bg-coffee-primary hover:bg-coffee-primary/90 inline-flex items-center gap-2 rounded-full px-6 py-3 text-white transition-colors">
              <Phone className="h-4 w-4" />
              Nous contacter
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
