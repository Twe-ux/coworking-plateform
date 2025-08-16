'use client'

import ClientOnly from '@/components/ClientOnly'
import DynamicStats from '@/components/home/DynamicStats'
import { EnhancedCTA } from '@/components/home/EnhancedCTA'
import SpaceCarousel from '@/components/home/SpaceCarousel'
import Logo from '@/components/Logo'
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
  MapPin,
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
        type: 'spring' as const,
        damping: 20,
        stiffness: 100,
      },
    },
  }

  return (
    <main className="bg-coffee-light md:from-coffee-light md:via-coffee-light/80 md:to-coffee-light/60 relative min-h-screen overflow-hidden p-4 sm:p-10 md:bg-gradient-to-br">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="bg-coffee-primary/10 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl"
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
      <section className="relative flex min-h-screen items-center justify-center px-2 sm:px-4">
        <motion.div
          className="z-10 mx-auto max-w-6xl text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo centré sur mobile uniquement */}
          <motion.div
            variants={itemVariants}
            className="mb-6 flex flex-col items-center justify-center md:hidden"
          >
            <div className="mt-4">
              <ClientOnly>
                <Logo
                  size="xl"
                  showText={false}
                  animated={true}
                  variant="auto"
                />
              </ClientOnly>
            </div>
            {/* <span className="bg-coffee-primary/10 text-coffee-primary inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
              ☕ Coworking à Strasbourg
            </span> */}
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="from-coffee-accent via-coffee-primary to-coffee-accent mb-4 bg-gradient-to-r bg-clip-text text-4xl leading-tight font-bold text-transparent sm:mb-6 sm:text-5xl md:text-7xl"
          >
            Cow or King
            <br />
            <span className="from-coffee-accent via-coffee-primary to-coffee-accent relative bg-gradient-to-r bg-clip-text pb-3 text-4xl leading-tight font-bold text-transparent sm:pb-4 sm:text-5xl md:text-7xl">
              Café
              <motion.div
                className="from-coffee-primary to-coffee-accent absolute right-0 -bottom-2 left-0 h-1 bg-gradient-to-r"
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
            className="mx-auto mt-8 mb-6 max-w-3xl px-2 text-lg leading-relaxed text-gray-700 sm:mt-16 sm:mb-8 sm:text-xl md:text-2xl"
          >
            Votre espace de coworking au cœur de Strasbourg. Travaillez dans
            notre café avec place, salle verrière et étage disponibles à la
            réservation.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mb-8 flex flex-col items-center justify-center gap-3 px-4 sm:mb-12 sm:flex-row sm:gap-4"
          >
            <Link href="/reservation">
              <motion.button
                className="from-coffee-primary to-coffee-accent group flex min-h-[48px] w-full max-w-xs items-center justify-center gap-2 rounded-full bg-gradient-to-r px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl sm:min-h-[56px] sm:w-auto sm:px-8 sm:py-4 sm:text-base"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Explorer les espaces
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
              </motion.button>
            </Link>

            <motion.button
              className="border-coffee-accent text-coffee-accent hover:bg-coffee-accent w-full max-w-xs rounded-full border-2 px-6 py-3 text-sm font-semibold transition-all duration-300 hover:text-white sm:w-auto sm:px-8 sm:py-4 sm:text-base"
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
            <DynamicStats />
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="text-coffee-primary absolute bottom-8 left-1/2 flex -translate-x-1/2 transform flex-col items-center"
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
            <h2 className="text-coffee-primary mb-4 text-4xl font-bold md:text-5xl">
              Pourquoi choisir nos espaces ?
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-700">
              Une expérience de coworking réinventée dans l&paos;atmosphère
              unique des cafés
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
                transition={{ type: 'spring' as const, stiffness: 300 }}
              >
                <feature.icon className="text-coffee-accent mb-4 h-12 w-12 transition-transform group-hover:scale-110" />
                <h3 className="text-coffee-primary mb-2 text-xl font-semibold">
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
        className="bg-coffee-light/20 md:from-coffee-light/30 md:to-coffee-light relative px-4 py-24 md:bg-gradient-to-b"
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
              Choisissez l&apos;espace qui correspond le mieux à votre façon de
              travailler.
            </motion.p>
          </div>

          <SpaceCarousel />

          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <Link href="#contact">
              <motion.button
                className="border-coffee-accent text-coffee-primary hover:bg-coffee-accent rounded-full border-2 bg-white px-8 py-4 font-semibold shadow-lg transition-all duration-300 hover:text-white"
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
        className="bg-coffee-light/30 md:from-coffee-light md:to-coffee-light/30 relative px-4 py-24 md:bg-gradient-to-b"
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
              Pas d&apos;engagement, maximum de flexibilité.
            </motion.p>
          </div>

          <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "À l'heure",
                price: '6€',
                period: '/heure',
                description: 'Parfait pour une session ponctuelle',
                icon: Clock,
                color: 'from-coffee-accent to-coffee-primary/80',
                features: [
                  "Accès à l'open-space",
                  'WiFi haute vitesse',
                  'Les boissons incluses parmis les classiques',
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
                icon: Zap,
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
                  <div className="from-coffee-primary to-coffee-accent absolute top-0 right-0 left-0 bg-gradient-to-r py-2 text-center text-sm font-semibold text-white">
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
                      <h3 className="text-coffee-primary text-2xl font-bold">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-coffee-primary text-4xl font-bold">
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
                          : 'border-coffee-accent text-coffee-primary hover:bg-coffee-accent border-2 hover:text-white'
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
            className="bg-coffee-light/40 md:from-coffee-muted/30 md:to-coffee-secondary/30 rounded-2xl p-4 sm:p-8 md:bg-gradient-to-r"
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
                    <service.icon className="text-coffee-accent mx-auto mb-3 h-8 w-8" />
                    <h4 className="text-coffee-primary mb-1 font-semibold">
                      {service.title}
                    </h4>
                    <p className="text-coffee-accent mb-2 font-bold">
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
        className="bg-coffee-light/10 md:to-coffee-light relative px-4 py-24 md:bg-gradient-to-b md:from-orange-50/20"
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
              Rejoignez notre communauté exclusive et profitez d&apos;avantages
              uniques. Plus vous venez, plus vous économisez et plus vous
              bénéficiez de privilèges.
            </motion.p>
          </div>

          <div className="mb-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Fidélité Café',
                icon: Crown,
                gradient: 'from-coffee-primary to-coffee-accent',
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
                  <div className="from-coffee-primary to-coffee-accent absolute top-0 right-0 left-0 bg-gradient-to-r py-2 text-center text-sm font-semibold text-white">
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
                      <h3 className="text-coffee-primary text-2xl font-bold">
                        {program.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {program.description}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-coffee-primary text-3xl font-bold">
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
                          : 'border-coffee-accent text-coffee-primary hover:bg-coffee-accent border-2 hover:text-white'
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
            className="bg-coffee-light/40 md:from-coffee-muted/30 md:to-coffee-secondary/30 rounded-2xl p-4 sm:p-8 md:bg-gradient-to-r"
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
                    <benefit.icon className="text-coffee-accent mx-auto mb-4 h-10 w-10" />
                    <h4 className="text-coffee-primary mb-2 font-semibold">
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
        className="bg-coffee-light/20 md:from-coffee-light md:to-coffee-light/30 relative px-4 py-24 md:bg-gradient-to-b"
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
              Des boissons d&apos;exception préparées avec passion. Chaque tasse
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
                <h3 className="text-coffee-primary text-3xl font-bold">
                  Cafés d&apos;Exception
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
                          <h4 className="text-coffee-primary text-lg font-semibold">
                            {drink.name}
                          </h4>
                          {drink.specialty && (
                            <div className="from-coffee-primary to-coffee-accent rounded-full bg-gradient-to-r px-2 py-1">
                              <Star className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {drink.description}
                        </p>
                      </div>
                      <div className="text-coffee-accent ml-4 text-xl font-bold">
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
                  <h3 className="text-coffee-primary text-2xl font-bold">
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
                          <h4 className="text-coffee-primary mb-1 font-semibold">
                            {drink.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {drink.description}
                          </p>
                        </div>
                        <div className="text-coffee-accent ml-4 font-bold">
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
                  <h3 className="text-coffee-primary text-2xl font-bold">
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
                          <h4 className="text-coffee-primary mb-1 font-semibold">
                            {drink.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {drink.description}
                          </p>
                        </div>
                        <div className="text-coffee-accent ml-4 font-bold">
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
                <Gift className="text-coffee-accent h-8 w-8" />
                <h3 className="text-coffee-primary text-2xl font-bold">
                  Happy Hour
                </h3>
              </div>
              <p className="mb-4 text-gray-700">
                De 15h à 17h, profitez de -20% sur toutes nos boissons chaudes.
              </p>
              <div className="text-coffee-accent text-sm font-semibold">
                Tous les jours de la semaine
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-green-400/10 to-emerald-600/10 p-8">
              <div className="mb-4 flex items-center gap-3">
                <Droplets className="h-8 w-8 text-green-600" />
                <h3 className="text-coffee-primary text-2xl font-bold">
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
            <Link href="/boissons">
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
      {/* Section Contact améliorée */}
      <section
        id="contact"
        className="relative bg-gray-900 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Informations */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-6 text-4xl font-bold text-white">
                Prêt à rejoindre notre{' '}
                <span className="from-coffee-accent to-coffee-primary bg-gradient-to-r bg-clip-text text-transparent">
                  communauté ?
                </span>
              </h2>
              <p className="mb-8 text-xl text-gray-300">
                Venez découvrir l&apos;espace de coworking qui va révolutionner
                votre façon de travailler.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4 text-gray-300">
                  <MapPin className="text-coffee-primary h-5 w-5" />
                  <span>1 Rue de la Division Leclerc, 67000 Strasbourg</span>
                </div>
                <div className="flex items-center gap-4 text-gray-300">
                  <Clock className="text-coffee-primary h-5 w-5" />
                  <span>Lun-Ven: 9h-20h | Sam-Dim & Jours fériés: 10h-20h</span>
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
              className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm"
            >
              <h3 className="mb-6 text-2xl font-bold text-white">
                Contactez-nous
              </h3>
              <form className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Votre nom"
                    className="focus:border-coffee-accent w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-300 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Votre email"
                    className="focus:border-coffee-accent w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-300 focus:outline-none"
                  />
                </div>
                <div>
                  <textarea
                    rows={4}
                    placeholder="Votre message"
                    className="focus:border-coffee-accent w-full resize-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-300 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="from-coffee-primary to-coffee-accent w-full rounded-xl bg-gradient-to-r px-6 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
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
        className="fixed right-8 bottom-8 z-50"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.button
          className="bg-coffee-primary rounded-full p-3 text-white shadow-lg"
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
