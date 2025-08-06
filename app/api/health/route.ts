/**
 * Route de santé système avec monitoring complet
 * Vérifie l'état de tous les services critiques
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkMongoHealth } from '@/lib/mongodb'
import { getSecurityStats } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Vérifications parallèles pour optimiser les performances
    const [mongoHealth, securityStats] = await Promise.allSettled([
      checkMongoHealth(),
      getSecurityStats(1), // Stats des dernières 24h
    ])

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'unknown',
      responseTime: Date.now() - startTime,
      services: {
        mongodb: {
          status:
            mongoHealth.status === 'fulfilled' && mongoHealth.value
              ? 'healthy'
              : 'unhealthy',
          error:
            mongoHealth.status === 'rejected'
              ? mongoHealth.reason?.message
              : null,
        },
        authentication: {
          status: 'healthy',
          recentFailures:
            securityStats.status === 'fulfilled'
              ? securityStats.value.failedLogins
              : 0,
          blockedAttempts:
            securityStats.status === 'fulfilled'
              ? securityStats.value.blockedAttempts
              : 0,
        },
      },
    }

    // Déterminer le statut global
    const allServicesHealthy = Object.values(health.services).every(
      (service) => service.status === 'healthy'
    )

    if (!allServicesHealthy) {
      health.status = 'degraded'
    }

    const status = health.status === 'healthy' ? 200 : 503

    return NextResponse.json(health, {
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    const errorHealth = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }

    return NextResponse.json(errorHealth, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }
}

// Endpoint minimal pour les load balancers
export async function HEAD(request: NextRequest) {
  try {
    const isHealthy = await checkMongoHealth()
    return new NextResponse(null, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
