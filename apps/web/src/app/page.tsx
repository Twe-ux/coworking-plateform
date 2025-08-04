'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  Award,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Coffee,
  Crown,
  Droplets,
  Flame,
  Gift,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Shield,
  Snowflake,
  Star,
  Users,
  Wifi,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 100,
      },
    },
  }

  return (
    <main className="from-coffee-secondary to-coffee-muted relative min-h-screen overflow-hidden bg-gradient-to-br via-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="bg-coffee-primary/10 absolute -right-40 -top-40 h-80 w-80 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 0.01,
            y: mousePosition.y * 0.01,
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="bg-coffee-accent/10 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * -0.01,
            y: mousePosition.y * -0.01,
            scale: [1.1, 1, 1.1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center px-4">
        <motion.div
          className="z-10 mx-auto max-w-6xl text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* <motion.div
            variants={itemVariants}
            className="mb-8 flex flex-col items-center"
          >
            <div className="mb-4">
              <ClientOnly>
                <Logo
                  size="xl"
                  showText={false}
                  animated={true}
                  variant="auto"
                />
              </ClientOnly>
            </div>
            <span className="bg-coffee-primary/10 text-coffee-accent inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
              ☕ Coworking à Strasbourg
            </span>
          </motion.div> */}

          <motion.h1
            variants={itemVariants}
            className="from-coffee-accent via-coffee-primary to-coffee-accent mb-6 bg-gradient-to-r bg-clip-text text-5xl font-bold leading-tight text-transparent md:text-7xl"
          >
            Cow or King
            <br />
            <span className="from-coffee-accent via-coffee-primary to-coffee-accent relative bg-gradient-to-r bg-clip-text pb-4 text-5xl font-bold leading-tight text-transparent md:text-7xl">
              Café
              <motion.div
                className="from-coffee-primary to-coffee-accent absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
              />
            </span>
            <br />
            {/* Coworking à Strasbourg */}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mb-8 mt-16 max-w-3xl text-xl leading-relaxed text-gray-700 md:text-2xl"
          >
            Votre espace de coworking au cœur de Strasbourg. Travaillez dans
            notre café avec place, salle verrière et étage disponibles à la
            réservation.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/reservation">
              <motion.button
                className="from-coffee-primary to-coffee-accent group flex min-h-[56px] items-center gap-2 rounded-full bg-gradient-to-r px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Explorer les espaces
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </Link>

            <motion.button
              className="border-coffee-accent text-coffee-accent hover:bg-coffee-accent rounded-full border-2 px-8 py-4 font-semibold transition-all duration-300 hover:text-white"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Comment ça marche
            </motion.button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mx-auto grid max-w-2xl grid-cols-2 gap-8 md:grid-cols-4"
          >
            {[
              { icon: Coffee, label: '3 espaces', value: 'disponibles' },
              { icon: Users, label: '50+', value: 'membres' },
              { icon: MapPin, label: 'Strasbourg', value: 'centre-ville' },
              { icon: Star, label: '4.8/5', value: 'satisfaction' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <stat.icon className="text-coffee-primary mx-auto mb-2 h-8 w-8" />
                <div className="text-coffee-accent text-2xl font-bold">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-600">{stat.value}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="text-coffee-accent absolute bottom-8 left-1/2 flex -translate-x-1/2 transform flex-col items-center"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="mb-2 text-sm">Découvrir</span>
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </section>

      {/* Features Preview Section */}
      <section className="relative px-4 py-20">
        <motion.div
          className="mx-auto max-w-6xl"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="mb-16 text-center">
            <h2 className="text-coffee-accent mb-4 text-4xl font-bold md:text-5xl">
              Pourquoi choisir nos espaces ?
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-700">
              Une expérience de coworking réinventée dans l'atmosphère unique
              des cafés
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Wifi,
                title: 'Connexion Ultra-Rapide',
                description:
                  'Wifi fibre optique dans tous nos espaces pour une productivité maximale',
              },
              {
                icon: Coffee,
                title: 'Café & Restauration',
                description:
                  'Accès illimité aux boissons et snacks de qualité artisanale',
              },
              {
                icon: Clock,
                title: 'Flexibilité Totale',
                description:
                  "Réservation à l'heure, à la journée ou abonnement mensuel",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="space-card group cursor-pointer"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <feature.icon className="text-coffee-primary mb-4 h-12 w-12 transition-transform group-hover:scale-110" />
                <h3 className="text-coffee-accent mb-2 text-xl font-semibold">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Spaces Gallery Section */}
      <section
        id="espaces"
        className="from-coffee-muted/20 relative bg-gradient-to-b to-white px-4 py-24"
      >
        <motion.div
          className="mx-auto max-w-7xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="mb-20 text-center">
            <motion.h2
              className="gradient-text mb-6 text-5xl font-bold md:text-6xl"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Nos Espaces
            </motion.h2>
            <motion.p
              className="mx-auto max-w-3xl text-xl text-gray-700"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Trois ambiances uniques dans notre établissement de Strasbourg.
              Choisissez l'espace qui correspond le mieux à votre façon de
              travailler.
            </motion.p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {[
              {
                id: 'places',
                name: 'Places',
                location: 'Rez-de-chaussée',
                image: 'bg-gradient-to-br from-amber-400 to-orange-600',
                capacity: '12 places',
                specialty: 'Ambiance café conviviale',
                rating: 4.8,
                features: [
                  'WiFi Fibre',
                  'Prises à chaque place',
                  'Vue sur rue',
                  'Accès boissons',
                ],
              },
              {
                id: 'verriere',
                name: 'Salle Verrière',
                location: 'Niveau intermédiaire',
                image: 'bg-gradient-to-br from-coffee-primary to-coffee-accent',
                capacity: '8 places',
                specialty: 'Luminosité naturelle',
                rating: 4.9,
                features: [
                  'Lumière naturelle',
                  'Espace privé',
                  'Tableau blanc',
                  'Climatisation',
                ],
              },
              {
                id: 'etage',
                name: 'Étage',
                location: 'Premier étage',
                image: 'bg-gradient-to-br from-yellow-400 to-amber-700',
                capacity: '15 places',
                specialty: 'Calme et concentration',
                rating: 4.7,
                features: [
                  'Zone silencieuse',
                  'Écrans partagés',
                  'Salon détente',
                  'Vue dégagée',
                ],
              },
            ].map((space, index) => (
              <motion.div
                key={index}
                className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
                viewport={{ once: true }}
              >
                {/* Image Background */}
                <div className={`${space.image} relative h-64`}>
                  <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-black/20" />
                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 backdrop-blur-sm">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span className="text-sm font-semibold">
                      {space.rating}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="mb-1 text-2xl font-bold">{space.name}</h3>
                    <p className="flex items-center gap-1 text-white/90">
                      <MapPin className="h-4 w-4" />
                      {space.location}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-coffee-primary font-semibold">
                      {space.capacity}
                    </span>
                    <span className="text-sm text-gray-600">
                      {space.specialty}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {space.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <div className="bg-coffee-primary h-1.5 w-1.5 rounded-full" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Link href={`/reservation/${space.id}`}>
                    <motion.button
                      className="from-coffee-primary to-coffee-accent mt-4 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r py-4 font-semibold text-white opacity-0 transition-all duration-300 group-hover:opacity-100"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label={`Réserver l'espace ${space.name}`}
                    >
                      <Calendar className="h-5 w-5" />
                      Réserver cet espace
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <Link href="#contact">
              <motion.button
                className="border-coffee-accent text-coffee-accent hover:bg-coffee-accent rounded-full border-2 bg-white px-8 py-4 font-semibold shadow-lg transition-all duration-300 hover:text-white"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Nous rendre visite
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section
        id="tarifs"
        className="to-coffee-secondary/30 relative bg-gradient-to-b from-white px-4 py-24"
      >
        <motion.div
          className="mx-auto max-w-6xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="mb-20 text-center">
            <motion.h2
              className="gradient-text mb-6 text-5xl font-bold md:text-6xl"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              Tarifs Flexibles
            </motion.h2>
            <motion.p
              className="mx-auto max-w-3xl text-xl text-gray-700"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Choisissez la formule qui correspond à votre rythme de travail.
              Pas d'engagement, maximum de flexibilité.
            </motion.p>
          </div>

          <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: 'À la carte',
                price: '8€',
                period: '/heure',
                description: 'Parfait pour une session ponctuelle',
                icon: Clock,
                color: 'from-blue-400 to-blue-600',
                features: [
                  'Accès à tous les espaces',
                  'WiFi haute vitesse',
                  '1 boisson incluse',
                  'Réservation en temps réel',
                  'Support client',
                ],
                popular: false,
              },
              {
                name: 'Journée',
                price: '35€',
                period: '/jour',
                description: "L'idéal pour une journée productive",
                icon: Zap,
                color: 'from-coffee-primary to-coffee-accent',
                features: [
                  'Accès illimité 9h-19h',
                  'Boissons à volonté',
                  'Snacks inclus',
                  'Casier personnel',
                  'Support prioritaire',
                ],
                popular: true,
              },
              {
                name: 'Hebdomadaire',
                price: '149€',
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
                price: '399€',
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
                className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-xl ${
                  plan.popular ? 'ring-coffee-primary/20 scale-105 ring-4' : ''
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: plan.popular ? 1.05 : 1.03, y: -5 }}
                viewport={{ once: true }}
              >
                {plan.popular && (
                  <div className="from-coffee-primary to-coffee-accent absolute left-0 right-0 top-0 bg-gradient-to-r py-2 text-center text-sm font-semibold text-white">
                    ⭐ Le plus populaire
                  </div>
                )}

                <div className={`h-2 bg-gradient-to-r ${plan.color}`} />

                <div className="p-8 pt-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`rounded-xl bg-gradient-to-br p-3 ${plan.color} text-white`}
                    >
                      <plan.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-coffee-accent text-2xl font-bold">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-coffee-accent text-4xl font-bold">
                        {plan.price}
                      </span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                  </div>

                  <div className="mb-8 space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center gap-3"
                      >
                        <div
                          className={`rounded-full bg-gradient-to-br p-1 ${plan.color}`}
                        >
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/reservation">
                    <motion.button
                      className={`w-full rounded-xl py-4 font-semibold transition-all duration-300 ${
                        plan.popular
                          ? 'from-coffee-primary to-coffee-accent bg-gradient-to-r text-white shadow-lg'
                          : 'border-coffee-accent text-coffee-accent hover:bg-coffee-accent border-2 hover:text-white'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {plan.popular
                        ? 'Commencer maintenant'
                        : 'Choisir cette formule'}
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Services */}
          <motion.div
            className="from-coffee-muted/30 to-coffee-secondary/30 rounded-2xl bg-gradient-to-r p-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3 className="text-coffee-accent mb-6 text-center text-2xl font-bold">
              Services Additionnels
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Shield,
                  title: 'Assurance Laptop',
                  price: '5€/mois',
                  description: 'Protection complète de vos équipements',
                },
                {
                  icon: Users,
                  title: 'Salle de Réunion',
                  price: '25€/h',
                  description: 'Espaces privés pour vos meetings',
                },
                {
                  icon: Coffee,
                  title: 'Café Premium',
                  price: '15€/mois',
                  description: 'Accès aux cafés de spécialité',
                },
                {
                  icon: MapPin,
                  title: 'Multi-Villes',
                  price: '20€/mois',
                  description: 'Accès à tous nos espaces en France',
                },
              ].map((service, index) => (
                <motion.div
                  key={index}
                  className="hover-lift text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="rounded-xl bg-white p-4 shadow-md">
                    <service.icon className="text-coffee-primary mx-auto mb-3 h-8 w-8" />
                    <h4 className="text-coffee-accent mb-1 font-semibold">
                      {service.title}
                    </h4>
                    <p className="text-coffee-primary mb-2 font-bold">
                      {service.price}
                    </p>
                    <p className="text-sm text-gray-600">
                      {service.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Member Program Section */}
      <section
        id="membres"
        className="from-coffee-secondary/20 relative bg-gradient-to-b to-white px-4 py-24"
      >
        <motion.div
          className="mx-auto max-w-6xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="mb-20 text-center">
            <motion.h2
              className="gradient-text mb-6 text-5xl font-bold md:text-6xl"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              Programme Membre
            </motion.h2>
            <motion.p
              className="mx-auto max-w-3xl text-xl text-gray-700"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Rejoignez notre communauté exclusive et profitez d'avantages
              uniques. Plus vous venez, plus vous économisez et plus vous
              bénéficiez de privilèges.
            </motion.p>
          </div>

          <div className="mb-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Fidélité Café',
                icon: Crown,
                gradient: 'from-amber-400 to-yellow-600',
                benefits: [
                  '10ème café offert',
                  'Accès aux blends premium',
                  'Réservation prioritaire',
                  'Réductions partenaires 15%',
                ],
                price: 'Gratuit',
                description: 'Cumulez des points à chaque visite',
              },
              {
                title: 'Club Elite',
                icon: Award,
                gradient: 'from-coffee-primary to-coffee-accent',
                benefits: [
                  'Café illimité premium',
                  'Accès salle VIP 24h/24',
                  'Invitations événements exclusifs',
                  'Concierge personnel',
                  'Parking réservé',
                ],
                price: '89€',
                period: '/mois',
                description: "Le summum de l'expérience coworking",
                popular: true,
              },
              {
                title: 'Programme Entreprise',
                icon: Users,
                gradient: 'from-emerald-400 to-teal-600',
                benefits: [
                  "Forfait équipe (jusqu'à 20)",
                  'Salle de réunion dédiée',
                  'Service traiteur premium',
                  'Factures groupées',
                  'Support dédié 24h/7j',
                ],
                price: 'Sur devis',
                description: 'Solutions sur mesure pour entreprises',
              },
            ].map((program, index) => (
              <motion.div
                key={index}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-xl ${
                  program.popular
                    ? 'ring-coffee-primary/20 scale-105 ring-4'
                    : ''
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: program.popular ? 1.05 : 1.03, y: -5 }}
                viewport={{ once: true }}
              >
                {program.popular && (
                  <div className="from-coffee-primary to-coffee-accent absolute left-0 right-0 top-0 bg-gradient-to-r py-2 text-center text-sm font-semibold text-white">
                    👑 Programme Populaire
                  </div>
                )}

                <div className={`h-2 bg-gradient-to-r ${program.gradient}`} />

                <div className="p-8 pt-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div
                      className={`rounded-xl bg-gradient-to-br p-3 ${program.gradient} text-white`}
                    >
                      <program.icon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-coffee-accent text-2xl font-bold">
                        {program.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {program.description}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-coffee-accent text-3xl font-bold">
                        {program.price}
                      </span>
                      {program.period && (
                        <span className="text-gray-600">{program.period}</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-8 space-y-3">
                    {program.benefits.map((benefit, benefitIndex) => (
                      <div
                        key={benefitIndex}
                        className="flex items-center gap-3"
                      >
                        <div
                          className={`rounded-full bg-gradient-to-br p-1 ${program.gradient}`}
                        >
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Link href={program.popular ? '/reservation' : '#contact'}>
                    <motion.button
                      className={`w-full rounded-xl py-4 font-semibold transition-all duration-300 ${
                        program.popular
                          ? 'from-coffee-primary to-coffee-accent bg-gradient-to-r text-white shadow-lg'
                          : 'border-coffee-accent text-coffee-accent hover:bg-coffee-accent border-2 hover:text-white'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {program.popular
                        ? 'Rejoindre maintenant'
                        : 'En savoir plus'}
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Member Benefits Grid */}
          <motion.div
            className="from-coffee-muted/30 to-coffee-secondary/30 rounded-2xl bg-gradient-to-r p-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3 className="text-coffee-accent mb-8 text-center text-2xl font-bold">
              Avantages Membres Exclusifs
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Gift,
                  title: 'Cadeaux Mensuels',
                  description: 'Surprises et produits exclusifs chaque mois',
                },
                {
                  icon: Calendar,
                  title: 'Événements VIP',
                  description: 'Accès prioritaire aux ateliers et networking',
                },
                {
                  icon: Shield,
                  title: 'Garantie Satisfaction',
                  description: 'Remboursement 30 jours sans condition',
                },
                {
                  icon: Heart,
                  title: 'Communauté',
                  description: 'Réseau de professionnels passionnés',
                },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  className="hover-lift text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="rounded-xl bg-white p-6 shadow-md">
                    <benefit.icon className="text-coffee-primary mx-auto mb-4 h-10 w-10" />
                    <h4 className="text-coffee-accent mb-2 font-semibold">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Drinks Menu Section */}
      <section
        id="boissons"
        className="to-coffee-secondary/30 relative bg-gradient-to-b from-white px-4 py-24"
      >
        <motion.div
          className="mx-auto max-w-7xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="mb-20 text-center">
            <motion.h2
              className="gradient-text mb-6 text-5xl font-bold md:text-6xl"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              Notre Carte
            </motion.h2>
            <motion.p
              className="mx-auto max-w-3xl text-xl text-gray-700"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Des boissons d'exception préparées avec passion. Chaque tasse
              raconte une histoire, chaque gorgée est une expérience unique.
            </motion.p>
          </div>

          {/* Drinks Categories */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Coffee Section */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="from-coffee-primary to-coffee-accent rounded-xl bg-gradient-to-br p-3 text-white">
                  <Coffee className="h-8 w-8" />
                </div>
                <h3 className="text-coffee-accent text-3xl font-bold">
                  Cafés d'Exception
                </h3>
              </div>

              <div className="space-y-4">
                {[
                  {
                    name: 'Espresso Artisanal',
                    description:
                      'Pur arabica du Guatemala, torréfaction maison',
                    price: '3.50€',
                    specialty: true,
                  },
                  {
                    name: 'Cappuccino Royal',
                    description: 'Mousse de lait onctueuse, cacao équitable',
                    price: '4.80€',
                    specialty: false,
                  },
                  {
                    name: 'Flat White Signature',
                    description: 'Blend exclusif, lait micro-moussé',
                    price: '5.20€',
                    specialty: true,
                  },
                  {
                    name: 'Cold Brew Vanilla',
                    description: 'Infusion à froid 12h, vanille Madagascar',
                    price: '5.90€',
                    specialty: true,
                  },
                ].map((drink, index) => (
                  <motion.div
                    key={index}
                    className="group cursor-pointer overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <h4 className="text-coffee-accent text-lg font-semibold">
                            {drink.name}
                          </h4>
                          {drink.specialty && (
                            <div className="rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 px-2 py-1">
                              <Star className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {drink.description}
                        </p>
                      </div>
                      <div className="text-coffee-primary ml-4 text-xl font-bold">
                        {drink.price}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Other Beverages Section */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              {/* Hot Beverages */}
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-red-400 to-orange-600 p-3 text-white">
                    <Flame className="h-8 w-8" />
                  </div>
                  <h3 className="text-coffee-accent text-2xl font-bold">
                    Boissons Chaudes
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      name: 'Thé Earl Grey Premium',
                      description: 'Bergamote naturelle, feuilles entières',
                      price: '4.20€',
                    },
                    {
                      name: 'Chocolat Chaud Belge',
                      description: 'Chocolat noir 70%, chantilly maison',
                      price: '5.50€',
                    },
                    {
                      name: 'Chaï Latte Épicé',
                      description: "Mélange d'épices indiennes, lait d'avoine",
                      price: '4.90€',
                    },
                  ].map((drink, index) => (
                    <motion.div
                      key={index}
                      className="group cursor-pointer overflow-hidden rounded-xl bg-white p-4 shadow-lg transition-all duration-300 hover:shadow-xl"
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-coffee-accent mb-1 font-semibold">
                            {drink.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {drink.description}
                          </p>
                        </div>
                        <div className="text-coffee-primary ml-4 font-bold">
                          {drink.price}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Cold Beverages */}
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-blue-400 to-cyan-600 p-3 text-white">
                    <Snowflake className="h-8 w-8" />
                  </div>
                  <h3 className="text-coffee-accent text-2xl font-bold">
                    Boissons Fraîches
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      name: 'Limonade Artisanale',
                      description: 'Citrons bio pressés, menthe fraîche',
                      price: '4.50€',
                    },
                    {
                      name: 'Smoothie Énergisant',
                      description: 'Mangue, passion, spiruline, gingembre',
                      price: '6.80€',
                    },
                    {
                      name: 'Thé Glacé Hibiscus',
                      description: 'Infusion florale, fruits rouges',
                      price: '4.90€',
                    },
                  ].map((drink, index) => (
                    <motion.div
                      key={index}
                      className="group cursor-pointer overflow-hidden rounded-xl bg-white p-4 shadow-lg transition-all duration-300 hover:shadow-xl"
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-coffee-accent mb-1 font-semibold">
                            {drink.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {drink.description}
                          </p>
                        </div>
                        <div className="text-coffee-primary ml-4 font-bold">
                          {drink.price}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Special Offers */}
          <motion.div
            className="mt-16 grid gap-6 md:grid-cols-2"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="from-coffee-primary/10 to-coffee-accent/10 rounded-2xl bg-gradient-to-br p-8">
              <div className="mb-4 flex items-center gap-3">
                <Gift className="text-coffee-primary h-8 w-8" />
                <h3 className="text-coffee-accent text-2xl font-bold">
                  Happy Hour
                </h3>
              </div>
              <p className="mb-4 text-gray-700">
                De 15h à 17h, profitez de -20% sur toutes nos boissons chaudes.
              </p>
              <div className="text-coffee-primary text-sm font-semibold">
                Tous les jours de la semaine
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-green-400/10 to-emerald-600/10 p-8">
              <div className="mb-4 flex items-center gap-3">
                <Droplets className="h-8 w-8 text-green-600" />
                <h3 className="text-coffee-accent text-2xl font-bold">
                  Formule Détox
                </h3>
              </div>
              <p className="mb-4 text-gray-700">
                Smoothie + infusion bio + encas healthy pour seulement 12€.
              </p>
              <div className="text-sm font-semibold text-green-600">
                Disponible toute la journée
              </div>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <Link href="#contact">
              <motion.button
                className="from-coffee-primary to-coffee-accent rounded-full bg-gradient-to-r px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Découvrir notre carte complète
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="from-coffee-accent relative overflow-hidden bg-gradient-to-br to-black px-4 py-24 text-white"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="bg-coffee-primary absolute left-20 top-20 h-64 w-64 animate-pulse rounded-full blur-3xl" />
          <div
            className="bg-coffee-secondary absolute bottom-20 right-20 h-80 w-80 animate-pulse rounded-full blur-3xl"
            style={{ animationDelay: '1s' }}
          />
        </div>

        <motion.div
          className="relative z-10 mx-auto max-w-6xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="mb-20 text-center">
            <motion.h2
              className="mb-6 text-5xl font-bold md:text-6xl"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="from-coffee-secondary bg-gradient-to-r to-white bg-clip-text text-transparent">
                Prêt à commencer ?
              </span>
            </motion.h2>
            <motion.p
              className="mx-auto max-w-3xl text-xl text-gray-300"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Rejoignez Cow or King Café et découvrez une nouvelle façon de
              travailler à Strasbourg. Notre équipe est là pour vous
              accompagner.
            </motion.p>
          </div>

          <div className="grid items-start gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <motion.div
              className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="mb-6 flex items-center gap-3 text-2xl font-bold">
                <MessageCircle className="text-coffee-secondary h-8 w-8" />
                Envoyez-nous un message
              </h3>

              <form className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Prénom
                    </label>
                    <input
                      type="text"
                      className="focus:ring-coffee-secondary w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Nom
                    </label>
                    <input
                      type="text"
                      className="focus:ring-coffee-secondary w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    className="focus:ring-coffee-secondary w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Sujet
                  </label>
                  <div className="relative">
                    <select className="focus:ring-coffee-secondary w-full appearance-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-12 text-white backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2">
                      <option value="" className="bg-coffee-accent">
                        Choisir un sujet
                      </option>
                      <option value="info" className="bg-coffee-accent">
                        Informations générales
                      </option>
                      <option value="booking" className="bg-coffee-accent">
                        Réservation
                      </option>
                      <option value="partnership" className="bg-coffee-accent">
                        Partenariat café
                      </option>
                      <option value="support" className="bg-coffee-accent">
                        Support technique
                      </option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                      <ChevronDown className="h-5 w-5 text-white/70" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="focus:ring-coffee-secondary w-full resize-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2"
                    placeholder="Décrivez votre projet ou vos besoins..."
                  />
                </div>

                <motion.button
                  type="submit"
                  className="from-coffee-primary to-coffee-secondary flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r py-4 font-semibold text-white transition-all duration-300 hover:shadow-xl"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Envoyer le message
                  <Send className="h-5 w-5" />
                </motion.button>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div>
                {/* <h3 className="mb-6 text-2xl font-bold">
                  Contactez-nous directement
                </h3> */}

                <div className="space-y-6">
                  <motion.div
                    className="flex cursor-pointer items-center gap-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <div className="from-coffee-primary to-coffee-secondary flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Téléphone</p>
                      <p className="text-gray-300">03 88 XX XX XX</p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex cursor-pointer items-center gap-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <div className="from-coffee-primary to-coffee-secondary flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-gray-300">
                        strasbourg@coworkingcafe.fr
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex cursor-pointer items-center gap-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <div className="from-coffee-primary to-coffee-secondary flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Adresse</p>
                      <p className="text-gray-300">
                        1 rue de la Division Leclerc
                        <br />
                        67000 Strasbourg
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  className="from-coffee-primary/20 to-coffee-secondary/20 border-coffee-primary/30 rounded-xl border bg-gradient-to-br p-6 text-center backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-coffee-secondary mb-1 text-3xl font-bold">
                    24h
                  </div>
                  <div className="text-sm text-gray-300">Réponse moyenne</div>
                </motion.div>
                <motion.div
                  className="from-coffee-primary/20 to-coffee-secondary/20 border-coffee-primary/30 rounded-xl border bg-gradient-to-br p-6 text-center backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-coffee-secondary mb-1 text-3xl font-bold">
                    98%
                  </div>
                  <div className="text-sm text-gray-300">
                    Satisfaction client
                  </div>
                </motion.div>
              </div>

              {/* Call to Action */}
              <motion.div
                className="from-coffee-primary to-coffee-secondary rounded-xl bg-gradient-to-r p-6"
                whileHover={{ scale: 1.02 }}
              >
                <h4 className="mb-2 text-lg font-bold">
                  Besoin d'aide immédiate ?
                </h4>
                <p className="text-coffee-accent mb-4 text-sm">
                  Notre équipe est disponible pour vous aider
                </p>
                <button className="text-coffee-accent w-full rounded-lg bg-white py-3 font-semibold transition-colors hover:bg-gray-100">
                  Chat en direct
                </button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
