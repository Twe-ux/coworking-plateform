'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RevenueAnalytics } from '@/components/dashboard/admin/advanced/revenue-analytics'
import { OccupancyAnalytics } from '@/components/dashboard/admin/advanced/occupancy-analytics'
import { BarChart3, TrendingUp, Building, Clock } from 'lucide-react'

type AnalyticsView = 'revenue' | 'occupancy' | 'performance'

export default function AdminAnalyticsPage() {
  const [currentView, setCurrentView] = useState<AnalyticsView>('revenue')

  const views = [
    {
      id: 'revenue' as const,
      title: 'Revenus',
      description: 'Analytics financières et tendances',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      id: 'occupancy' as const, 
      title: 'Occupation',
      description: 'Taux d&apos;utilisation des espaces',
      icon: Building,
      color: 'bg-blue-500'
    },
    {
      id: 'performance' as const,
      title: 'Performance',
      description: 'KPIs et métriques globales',
      icon: BarChart3,
      color: 'bg-purple-500'
    }
  ]

  const renderCurrentView = () => {
    switch (currentView) {
      case 'revenue':
        return <RevenueAnalytics />
      case 'occupancy':
        return <OccupancyAnalytics />
      case 'performance':
        return (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Analytics de performance</h3>
                <p>Cette section sera bientôt disponible</p>
              </div>
            </CardContent>
          </Card>
        )
      default:
        return <RevenueAnalytics />
    }
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Tableaux de bord et analyses de performance
        </p>
      </div>

      {/* Navigation des vues */}
      <Card>
        <CardHeader>
          <CardTitle>Tableaux de bord</CardTitle>
          <CardDescription>
            Sélectionnez le type d&apos;analyse que vous souhaitez consulter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {views.map((view) => {
              const Icon = view.icon
              const isActive = currentView === view.id
              
              return (
                <Button
                  key={view.id}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setCurrentView(view.id)}
                  className={`h-auto p-4 justify-start ${
                    isActive ? 'bg-blue-600 hover:bg-blue-700' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isActive ? 'bg-white/20' : view.color
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isActive ? 'text-white' : 'text-white'
                      }`} />
                    </div>
                    <div className="text-left">
                      <div className={`font-medium ${
                        isActive ? 'text-white' : 'text-gray-900'
                      }`}>
                        {view.title}
                      </div>
                      <div className={`text-sm ${
                        isActive ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {view.description}
                      </div>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Vue actuelle */}
      {renderCurrentView()}
    </div>
  )
}