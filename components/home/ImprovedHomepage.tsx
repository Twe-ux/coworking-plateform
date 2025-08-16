'use client'

import { Suspense, lazy } from 'react'
import { usePerformanceMonitor, LazyWrapper } from './OptimizedAnimations'
import EnhancedHero from './EnhancedHero'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load heavy components
const TestimonialsSection = lazy(() => import('./TestimonialsSection'))
const EnhancedCTASection = lazy(() => import('./EnhancedCTA'))
const SocialProofSection = lazy(() => import('./SocialProofSection'))

// Existing components (keeping the good parts)
import SpaceCarousel from './SpaceCarousel'
import { motion } from 'framer-motion'
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

// Loading skeletons for lazy components
function TestimonialsSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <Skeleton className="mx-auto h-8 w-64" />
      <Skeleton className="mx-auto h-4 w-96" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  )
}

function CTASkeleton() {
  return (
    <div className="grid gap-8 p-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Skeleton className="h-96 w-full" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  )
}

function SocialProofSkeleton() {
  return (
    <div className="space-y-8 p-8">
      <Skeleton className="mx-auto h-6 w-80" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  )
}

export default function ImprovedHomepage() {
  // Monitor performance in development
  usePerformanceMonitor()

  return (
    <main className="relative min-h-screen overflow-hidden bg-coffee-light">
      {/* Enhanced Hero Section */}
      <EnhancedHero />

      {/* Features Preview Section (Optimized) */}
      <section className="relative px-4 py-20">
        <motion.div
          className="mx-auto max-w-6xl"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-coffee-primary md:text-5xl">
              Pourquoi choisir nos espaces ?
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-700">
              Une expérience de coworking réinventée dans l'atmosphère unique des cafés
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Wifi,
                title: 'Connexion Ultra-Rapide',
                description: 'Wifi fibre optique dans tous nos espaces pour une productivité maximale',
              },
              {
                icon: Coffee,
                title: 'Café & Restauration',
                description: 'Accès illimité aux boissons et snacks de qualité artisanale',
              },
              {
                icon: Clock,
                title: 'Flexibilité Totale',
                description: "Réservation à l'heure, à la journée ou abonnement mensuel",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="group cursor-pointer rounded-2xl bg-white/80 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: 'spring' as const, stiffness: 300 }}
              >
                <feature.icon className="mb-4 h-12 w-12 text-coffee-accent transition-transform group-hover:scale-110" />
                <h3 className="mb-2 text-xl font-semibold text-coffee-primary">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Social Proof Section (Lazy Loaded) */}
      <LazyWrapper fallback={<SocialProofSkeleton />}>
        <Suspense fallback={<SocialProofSkeleton />}>
          <SocialProofSection />
        </Suspense>
      </LazyWrapper>

      {/* Spaces Gallery Section (Existing, but optimized) */}
      <section
        id="espaces"
        className="relative bg-gradient-to-b from-coffee-light/20 to-coffee-light px-4 py-24"
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
              className="mb-6 text-5xl font-bold text-transparent bg-gradient-to-r from-coffee-accent via-coffee-primary to-coffee-accent bg-clip-text md:text-6xl"
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
              Choisissez l'espace qui correspond le mieux à votre façon de travailler.
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
                className="rounded-full border-2 border-coffee-accent bg-white px-8 py-4 font-semibold text-coffee-primary shadow-lg transition-all duration-300 hover:bg-coffee-accent hover:text-white"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Visiter nos espaces
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonials Section (Lazy Loaded) */}
      <LazyWrapper fallback={<TestimonialsSkeleton />}>
        <Suspense fallback={<TestimonialsSkeleton />}>
          <TestimonialsSection />
        </Suspense>
      </LazyWrapper>

      {/* Enhanced CTA Section (Lazy Loaded) */}
      <LazyWrapper fallback={<CTASkeleton />}>
        <Suspense fallback={<CTASkeleton />}>
          <EnhancedCTASection />
        </Suspense>
      </LazyWrapper>

      {/* Simplified Contact Section (Keep essential, optimize rest) */}
      <section
        id="contact"
        className="relative overflow-hidden bg-gradient-to-br from-coffee-accent to-black px-2 py-16 text-white sm:px-4 sm:py-24"
      >
        <motion.div
          className="relative z-10 mx-auto max-w-6xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="mb-12 text-center sm:mb-20">
            <motion.h2
              className="mb-4 px-2 text-3xl font-bold leading-tight sm:mb-6 sm:text-5xl md:text-6xl"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="bg-gradient-to-r from-coffee-secondary to-white bg-clip-text text-transparent">
                Prêt à commencer ?
              </span>
            </motion.h2>
            <motion.p
              className="mx-auto max-w-3xl px-4 text-lg text-gray-300 sm:text-xl"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Rejoignez Cow or King Café et découvrez une nouvelle façon de
              travailler à Strasbourg.
            </motion.p>
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Quick Contact Info */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="space-y-4">
                <motion.div
                  className="flex cursor-pointer items-center gap-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-coffee-primary to-coffee-secondary">
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-coffee-primary to-coffee-secondary">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-gray-300">hello@coworkingcafe.fr</p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex cursor-pointer items-center gap-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-coffee-primary to-coffee-secondary">
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
            </motion.div>

            {/* CTA Section */}
            <motion.div
              className="rounded-2xl bg-gradient-to-r from-coffee-primary to-coffee-secondary p-8"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h4 className="mb-4 text-2xl font-bold">Commencer dès maintenant</h4>
              <p className="mb-6 text-coffee-primary">
                Réservez votre premier espace en moins de 2 minutes
              </p>
              
              <div className="space-y-4">
                <Link href="/reservation">
                  <button className="w-full rounded-lg bg-white py-4 font-semibold text-coffee-primary transition-colors hover:bg-gray-100">
                    <Calendar className="mr-2 inline h-5 w-5" />
                    Réserver maintenant
                  </button>
                </Link>
                
                <button className="w-full rounded-lg border border-white/30 py-4 font-semibold transition-colors hover:bg-white/10">
                  <MessageCircle className="mr-2 inline h-5 w-5" />
                  Poser une question
                </button>
              </div>
              
              <div className="mt-6 flex items-center gap-2 text-sm text-coffee-primary">
                <CheckCircle className="h-4 w-4" />
                <span>Réponse garantie en moins de 2h</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </main>
  )
}