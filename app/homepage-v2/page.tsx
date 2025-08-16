'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { 
  ArrowRight, 
  Clock, 
  Users, 
  Wifi, 
  Coffee, 
  Shield,
  Star,
  MapPin,
  Heart,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import ClientOnly from '@/components/ClientOnly'
import Logo from '@/components/Logo'

// Import des nouveaux composants améliorés
import { EnhancedHero } from '@/components/home/EnhancedHero'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { EnhancedCTA } from '@/components/home/EnhancedCTA'
import { SocialProofSection } from '@/components/home/SocialProofSection'
import { OptimizedAnimations } from '@/components/home/OptimizedAnimations'

export default function HomepageV2() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', updateMousePosition)
    return () => window.removeEventListener('mousemove', updateMousePosition)
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-coffee-light via-coffee-light/80 to-coffee-light/60">
      {/* Animated Background Elements - Optimisé */}
      <OptimizedAnimations.BackgroundElements mousePosition={mousePosition} />

      {/* Hero Section Amélioré */}
      <EnhancedHero />

      {/* Section Social Proof */}
      <SocialProofSection />

      {/* Section Espaces avec design amélioré */}
      <section id="espaces" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* En-tête section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center rounded-full bg-coffee-primary/10 px-4 py-2 text-sm font-medium text-coffee-primary mb-4">
              <MapPin className="mr-2 h-4 w-4" />
              Nos Espaces Disponibles
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trouvez l'espace parfait pour{' '}
              <span className="bg-gradient-to-r from-coffee-accent to-coffee-primary bg-clip-text text-transparent">
                votre productivité
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Du bureau individuel à la salle de réunion, découvrez nos espaces conçus pour stimuler votre créativité et votre efficacité.
            </p>
          </motion.div>

          {/* Grille d'espaces */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Open Space Principal",
                image: "/api/placeholder/400/300",
                capacity: "20 personnes",
                price: "15€/jour",
                features: ["WiFi fibré", "Café illimité", "Écrans disponibles"],
                popular: true
              },
              {
                name: "Salle Verrière",
                image: "/api/placeholder/400/300", 
                capacity: "8 personnes",
                price: "45€/demi-journée",
                features: ["Lumière naturelle", "Vidéoprojecteur", "Insonorisée"]
              },
              {
                name: "Bureau Privé",
                image: "/api/placeholder/400/300",
                capacity: "2-4 personnes", 
                price: "25€/heure",
                features: ["Totalement privé", "Mobilier ergonomique", "Prise RJ45"]
              }
            ].map((space, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`group relative overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  space.popular ? 'ring-2 ring-coffee-primary/20' : ''
                }`}
              >
                {space.popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-gradient-to-r from-coffee-primary to-coffee-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ⭐ Populaire
                    </span>
                  </div>
                )}
                
                {/* Image */}
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={space.image} 
                    alt={space.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                {/* Contenu */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{space.name}</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      {space.capacity}
                    </span>
                    <span className="text-coffee-primary font-bold">{space.price}</span>
                  </div>
                  
                  <ul className="space-y-2 mb-6">
                    {space.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-coffee-accent rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link href="/reservation">
                    <button className="w-full bg-gradient-to-r from-coffee-primary to-coffee-accent text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105">
                      Réserver maintenant
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Tarifs avec design amélioré */}
      <section id="tarifs" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="mx-auto max-w-7xl">
          {/* En-tête section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center rounded-full bg-coffee-primary/10 px-4 py-2 text-sm font-medium text-coffee-primary mb-4">
              💰 Tarifs Transparents
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Des prix{' '}
              <span className="bg-gradient-to-r from-coffee-accent to-coffee-primary bg-clip-text text-transparent">
                adaptés à vos besoins
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Que vous soyez freelance, entrepreneur ou équipe, trouvez la formule qui vous correspond.
            </p>
          </motion.div>

          {/* Grille de tarifs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Heure',
                price: '8€',
                period: '/heure',
                description: 'Parfait pour une session ponctuelle',
                icon: Clock,
                color: 'from-coffee-accent to-coffee-primary/80',
                features: [
                  "Accès à l'open-space",
                  'WiFi haute vitesse',
                  'Boissons classiques incluses',
                  'Réservation en temps réel',
                  'Support client',
                ],
                popular: false,
              },
              {
                name: 'Journée',
                price: '29€',
                period: '/jour',
                description: "L'idéal pour une journée productive",
                icon: Coffee,
                color: 'from-coffee-primary to-coffee-accent',
                features: [
                  'Accès illimité 9h-20h',
                  'Boissons à volonté',
                  'Snacks inclus',
                  'Casier personnel',
                  'Support prioritaire',
                ],
                popular: true,
              },
              {
                name: 'Hebdomadaire',
                price: '99€',
                period: '/semaine',
                description: 'Une semaine de productivité',
                icon: Shield,
                color: 'from-green-400 to-emerald-600',
                features: [
                  'Accès illimité 7j/7',
                  'Tous services inclus',
                  'Casier dédié',
                  'Réservation prioritaire',
                  'Café premium',
                ],
                popular: false,
              },
              {
                name: 'Mensuel',
                price: '290€',
                period: '/mois',
                description: 'Pour les nomades réguliers',
                icon: Heart,
                color: 'from-purple-400 to-pink-600',
                features: [
                  'Accès illimité 24h/24',
                  'Tous services inclus',
                  "Invitations d'amis (5/mois)",
                  'Événements networking',
                  'Domiciliation possible',
                  'Support dédié',
                ],
                popular: false,
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  plan.popular ? 'ring-2 ring-coffee-primary/20 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-coffee-primary to-coffee-accent py-2 text-center text-sm font-semibold text-white">
                    ⭐ Le plus populaire
                  </div>
                )}

                <div className={`h-2 bg-gradient-to-r ${plan.color}`} />

                <div className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`rounded-xl bg-gradient-to-br p-3 ${plan.color} text-white`}>
                      <plan.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-coffee-primary">{plan.name}</h3>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="mb-6 space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/reservation">
                    <button className={`w-full rounded-xl py-3 px-4 font-semibold text-white transition-all duration-300 hover:scale-105 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-coffee-primary to-coffee-accent shadow-lg' 
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}>
                      {plan.popular ? 'Commencer maintenant' : 'Choisir ce plan'}
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Testimonials Améliorée */}
      <TestimonialsSection />

      {/* CTA Principal Amélioré */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <EnhancedCTA variant="primary" />
        </div>
      </section>

      {/* Section Contact améliorée */}
      <section id="contact" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Informations */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Prêt à rejoindre notre{' '}
                <span className="bg-gradient-to-r from-coffee-accent to-coffee-primary bg-clip-text text-transparent">
                  communauté ?
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Venez découvrir l'espace de coworking qui va révolutionner votre façon de travailler.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-gray-300">
                  <MapPin className="h-5 w-5 text-coffee-accent" />
                  <span>123 Rue de la République, 67000 Strasbourg</span>
                </div>
                <div className="flex items-center gap-4 text-gray-300">
                  <Clock className="h-5 w-5 text-coffee-accent" />
                  <span>Lun-Ven: 8h-20h | Sam-Dim: 9h-18h</span>
                </div>
              </div>

              <div className="mt-8">
                <EnhancedCTA variant="secondary" />
              </div>
            </motion.div>

            {/* Formulaire de contact */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Contactez-nous</h3>
              <form className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Votre nom"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:border-coffee-accent"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Votre email"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:border-coffee-accent"
                  />
                </div>
                <div>
                  <textarea
                    rows={4}
                    placeholder="Votre message"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:border-coffee-accent resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-coffee-primary to-coffee-accent text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  Envoyer le message
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scroll indicator */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.button
          className="bg-coffee-primary text-white p-3 rounded-full shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ChevronDown className="h-6 w-6 rotate-180" />
        </motion.button>
      </motion.div>
    </main>
  )
}