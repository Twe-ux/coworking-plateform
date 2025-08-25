'use client'

import { motion } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, Badge } from 'lucide-react'
import { useState, useEffect } from 'react'

const testimonials = [
  {
    id: 1,
    name: "Sophie Martin",
    role: "Designer UX/UI",
    company: "Freelance",
    image: "/api/placeholder/60/60",
    rating: 5,
    text: "L'ambiance café-coworking est parfaite ! Je viens tous les jours depuis 6 mois et j'ai trouvé ma routine idéale. WiFi excellent et café délicieux.",
    date: "Il y a 2 jours",
    verified: true,
    memberSince: "6 mois"
  },
  {
    id: 2,
    name: "Thomas Dubois",
    role: "Développeur",
    company: "TechStart",
    image: "/api/placeholder/60/60",
    rating: 5,
    text: "Espace de travail moderne et bien équipé. Les salles de réunion sont parfaites pour les calls clients. Je recommande vivement !",
    date: "Il y a 1 semaine",
    verified: true,
    memberSince: "3 mois"
  },
  {
    id: 3,
    name: "Marie Leroy",
    role: "Consultante Marketing",
    company: "Indépendante",
    image: "/api/placeholder/60/60",
    rating: 5,
    text: "La communauté est incroyable ! J'ai rencontré mes futurs partenaires commerciaux ici. L'équipe est aux petits soins.",
    date: "Il y a 3 jours",
    verified: true,
    memberSince: "1 an"
  },
  {
    id: 4,
    name: "Alexandre Chen",
    role: "Product Manager",
    company: "DigitalCorp",
    image: "/api/placeholder/60/60",
    rating: 5,
    text: "Flexibilité parfaite entre bureau à domicile et espace collaboratif. Les tarifs sont très raisonnables pour la qualité proposée.",
    date: "Il y a 5 jours",
    verified: true,
    memberSince: "8 mois"
  }
]

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    setIsAutoPlaying(false)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    setIsAutoPlaying(false)
  }

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center rounded-full bg-coffee-primary/10 px-4 py-2 text-sm font-medium text-coffee-primary mb-4">
            ⭐ Témoignages Clients
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ce que disent nos{' '}
            <span className="bg-gradient-to-r from-coffee-accent to-coffee-primary bg-clip-text text-transparent">
              membres
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez les retours de notre communauté de professionnels passionnés.
          </p>
        </motion.div>

        {/* Carrousel de témoignages */}
        <div className="relative">
          <div className="overflow-hidden rounded-2xl">
            <motion.div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-2xl shadow-xl p-8 mx-auto max-w-4xl"
                  >
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                      {/* Photo et infos */}
                      <div className="flex-shrink-0 text-center md:text-left">
                        <div className="relative">
                          <img
                            src={testimonial.image}
                            alt={testimonial.name}
                            className="w-16 h-16 rounded-full mx-auto md:mx-0 object-cover"
                          />
                          {testimonial.verified && (
                            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1">
                              <Badge className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-900 mt-3">{testimonial.name}</h4>
                        <p className="text-coffee-primary font-medium">{testimonial.role}</p>
                        <p className="text-gray-600 text-sm">{testimonial.company}</p>
                        <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Membre depuis {testimonial.memberSince}
                        </p>
                      </div>

                      {/* Témoignage */}
                      <div className="flex-1">
                        <div className="text-4xl text-coffee-accent/20 font-serif mb-2">"</div>
                        <p className="text-gray-700 text-lg leading-relaxed mb-4">
                          {testimonial.text}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">{testimonial.date}</span>
                          {testimonial.verified && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                              ✓ Membre vérifié
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevTestimonial}
              className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>

            {/* Indicateurs */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? 'bg-coffee-primary scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Stats de satisfaction */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-coffee-primary mb-2">4.9/5</div>
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-600">Note moyenne</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-coffee-primary mb-2">150+</div>
            <p className="text-gray-600">Membres actifs</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-coffee-primary mb-2">95%</div>
            <p className="text-gray-600">Taux de satisfaction</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default TestimonialsSection