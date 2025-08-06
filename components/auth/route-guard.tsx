'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import { UserRole } from '@/types/auth'

interface RouteGuardProps {
  children: ReactNode
  requiredRoles?: UserRole[]
  redirectTo?: string
}

export function RouteGuard({ 
  children, 
  requiredRoles = [], 
  redirectTo = '/auth/login' 
}: RouteGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Chargement en cours

    if (!session) {
      router.push(redirectTo)
      return
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(session.user.role)) {
      router.push('/unauthorized')
      return
    }

    if (!session.user.isActive) {
      router.push('/account-suspended')
      return
    }
  }, [session, status, requiredRoles, redirectTo, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(session.user.role)) {
    return null
  }

  if (!session.user.isActive) {
    return null
  }

  return <>{children}</>
}

// Composants de protection spécifiques par rôle
export function AdminGuard({ children }: { children: ReactNode }) {
  return (
    <RouteGuard requiredRoles={[UserRole.ADMIN]}>
      {children}
    </RouteGuard>
  )
}

export function ManagerGuard({ children }: { children: ReactNode }) {
  return (
    <RouteGuard requiredRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
      {children}
    </RouteGuard>
  )
}

export function StaffGuard({ children }: { children: ReactNode }) {
  return (
    <RouteGuard requiredRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]}>
      {children}
    </RouteGuard>
  )
}

export function ClientGuard({ children }: { children: ReactNode }) {
  return (
    <RouteGuard requiredRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.CLIENT]}>
      {children}
    </RouteGuard>
  )
}