'use client'

import { motion } from 'framer-motion'
import { Users, TrendingUp, Shield, Award } from 'lucide-react'
import { useEffect, useState } from 'react'

export function SocialProofSection() {
  const [liveStats, setLiveStats] = useState({
    activeMembers: 23,
    todayBookings: 12,
    satisfaction: 98
  })

  useEffect(() => {
    // Simulation d'activité en temps réel
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        ...prev,
        activeMembers: prev.activeMembers + (Math.random() > 0.5 ? 1 : -1),
        todayBookings: prev.todayBookings + (Math.random() > 0.8 ? 1 : 0)
      }))
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-7xl">
        {/* Stats en temps réel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          <div className="text-center">
            <div className="bg-coffee-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Users className="h-8 w-8 text-coffee-primary" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{liveStats.activeMembers}</div>
            <div className="text-sm text-gray-600">Personnes présentes</div>
            <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1 animate-pulse" />
          </div>

          <div className="text-center">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{liveStats.todayBookings}</div>
            <div className="text-sm text-gray-600">Réservations aujourd'hui</div>
          </div>

          <div className="text-center">
            <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{liveStats.satisfaction}%</div>
            <div className="text-sm text-gray-600">Satisfaction client</div>
          </div>

          <div className="text-center">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">150+</div>
            <div className="text-sm text-gray-600">Membres actifs</div>
          </div>
        </motion.div>

        {/* Feed d'activité */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-gray-50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Activité en temps réel
          </h3>
          <div className="space-y-3">
            {[
              { name: "Sophie M.", action: "a réservé l'open space", time: "Il y a 2 min" },
              { name: "Thomas D.", action: "a rejoint la communauté", time: "Il y a 5 min" },
              { name: "Marie L.", action: "a réservé la salle verrière", time: "Il y a 8 min" },
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 bg-white p-3 rounded-lg"
              >
                <div className="w-2 h-2 bg-coffee-accent rounded-full animate-pulse" />
                <span className="text-sm text-gray-700">
                  <strong>{activity.name}</strong> {activity.action}
                </span>
                <span className="text-xs text-gray-500 ml-auto">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default SocialProofSection