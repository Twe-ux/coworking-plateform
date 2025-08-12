'use client'

import { SectionCards } from '@/components/dashboard/admin/advanced/section-cards'
import { useEffect, useState } from 'react'
import { DataTable } from './data-table'

interface DashboardData {
  totalBookings: number
  totalRevenue: number
  totalUsers: number
  occupancyRate: number
  todayBookings: number
  weeklyGrowth: number
  bookingsByStatus: {
    confirmed: number
    pending: number
    cancelled: number
    total: number
  }
  usersByRole: {
    client: number
    staff: number
    manager: number
    admin: number
  }
  recentBookings: Array<{
    id: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
    spaceName: string
    spaceLocation: string
    date: string
    startTime: string
    endTime: string
    totalPrice: number
    status: 'pending' | 'confirmed' | 'cancelled'
    createdAt: string
  }>
}

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const [statsResponse, bookingsResponse] = await Promise.all([
        fetch('/api/dashboard/admin'),
        fetch('/api/dashboard/admin/bookings?limit=10'),
      ])

      const stats = await statsResponse.json()
      const bookings = await bookingsResponse.json()

      if (stats.success && bookings.success) {
        setDashboardData({
          ...stats.data,
          recentBookings: bookings.data || [],
        })
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-coffee-primary h-32 w-32 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            Erreur de chargement
          </h2>
          <p className="text-gray-600">
            Impossible de charger les données du dashboard
          </p>
          <button
            onClick={fetchDashboardData}
            className="bg-coffee-primary hover:bg-coffee-primary/90 mt-4 rounded-lg px-4 py-2 text-white"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="space-y-6">
        <SectionCards data={dashboardData} />
        {/* <ChartAreaInteractive data={dashboardData} /> */}
        <DataTable data={dashboardData.recentBookings} columns={[]} />
      </div>
    </div>
  )
}
