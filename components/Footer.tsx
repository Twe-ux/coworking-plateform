'use client'

import { motion } from 'framer-motion'
import {
  ExternalLink,
  Facebook,
  Heart,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from 'lucide-react'
import Logo from './Logo'

export default function Footer() {
  const footerLinks = {
    Espaces: ['Places', 'Salle Verrière', 'Étage', 'Réserver'],
    Services: ['Tarifs', 'Abonnements', 'Événements', 'Support'],
    Entreprise: ['À propos', 'Équipe', 'Presse', 'Partenaires'],
    Aide: ['FAQ', 'Contact', 'CGU', 'Confidentialité'],
  }

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <footer className="from-coffee-accent via-coffee-accent relative overflow-hidden bg-gradient-to-br to-black text-white">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="bg-coffee-primary absolute left-10 top-10 h-32 w-32 rounded-full blur-3xl" />
        <div className="bg-coffee-primary absolute bottom-20 right-20 h-40 w-40 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Main Footer Content */}
        <motion.div
          className="mx-auto max-w-7xl px-4 py-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="grid gap-8 lg:grid-cols-6">
            {/* Company Info */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="mb-6">
                <Logo size="lg" animated={false} variant="white" />
              </div>

              <p className="mb-6 leading-relaxed text-gray-300">
                Votre espace de coworking au cœur de Strasbourg. Trois ambiances
                uniques dans un cadre exceptionnel pour allier productivité et
                convivialité.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300">
                  <MapPin className="text-coffee-primary h-5 w-5" />
                  <span>1 rue de la Division Leclerc, 67000 Strasbourg</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Phone className="text-coffee-primary h-5 w-5" />
                  <span>03 88 XX XX XX</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail className="text-coffee-primary h-5 w-5" />
                  <span>strasbourg@coworkingcafe.fr</span>
                </div>
              </div>
            </motion.div>

            {/* Links Sections */}
            {Object.entries(footerLinks).map(
              ([category, links], categoryIndex) => (
                <motion.div
                  key={category}
                  variants={itemVariants}
                  className="space-y-4"
                >
                  <h3 className="text-coffee-secondary text-lg font-semibold">
                    {category}
                  </h3>
                  <ul className="space-y-2">
                    {links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <motion.a
                          href="#"
                          className="hover:text-coffee-primary group flex items-center gap-1 text-gray-300 transition-colors duration-200"
                          whileHover={{ x: 5 }}
                        >
                          {link}
                          <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </motion.a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )
            )}
          </div>

          {/* Newsletter Section */}
          <motion.div
            variants={itemVariants}
            className="from-coffee-primary/20 to-coffee-secondary/20 border-coffee-primary/30 mt-12 rounded-2xl border bg-gradient-to-r p-8 backdrop-blur-sm"
          >
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="mb-4 text-2xl font-bold">Restez informé</h3>
              <p className="mb-6 text-gray-300">
                Recevez nos dernières actualités, nouveaux espaces et offres
                exclusives
              </p>
              <div className="mx-auto flex max-w-md flex-col gap-4 sm:flex-row">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="focus:ring-coffee-primary flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-300 backdrop-blur-sm focus:outline-none focus:ring-2"
                />
                <motion.button
                  className="from-coffee-primary to-coffee-secondary whitespace-nowrap rounded-xl bg-gradient-to-r px-6 py-3 font-semibold text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  S'abonner
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          className="border-coffee-primary/30 border-t bg-black/30 backdrop-blur-sm"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-2 text-gray-300">
                <span>© 2024 Cow or King Café. Fait avec</span>
                <Heart className="text-coffee-primary h-4 w-4 fill-current" />
                <span>à Strasbourg</span>
              </div>

              <div className="flex items-center gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    className="bg-coffee-primary/20 text-coffee-primary hover:bg-coffee-primary flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-300 hover:text-white"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}