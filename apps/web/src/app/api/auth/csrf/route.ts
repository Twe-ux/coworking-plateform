/**
 * API Route pour fournir le token CSRF
 * Sécurise les requêtes contre les attaques CSRF
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateCSRFToken, logSecurityEvent, getRealIP } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const ip = getRealIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Vérifier l'authentification
    if (!session?.user) {
      await logSecurityEvent({
        userId: undefined,
        action: 'CSRF_TOKEN_REQUEST_UNAUTHORIZED',
        resource: '/api/auth/csrf',
        ip,
        userAgent,
        success: false,
        details: { reason: 'no_session' }
      })

      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Générer un nouveau token CSRF
    const csrfToken = generateCSRFToken()

    // Log de la génération du token (échantillonnage)
    if (Math.random() < 0.1) { // 10% des requêtes
      await logSecurityEvent({
        userId: session.user.id,
        action: 'CSRF_TOKEN_GENERATED',
        resource: '/api/auth/csrf',
        ip,
        userAgent,
        success: true,
        details: { token_length: csrfToken.length }
      })
    }

    // Retourner le token avec des headers de sécurité
    const response = NextResponse.json({ csrfToken })
    
    // Headers de sécurité
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    return response

  } catch (error) {
    const ip = getRealIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logSecurityEvent({
      userId: undefined,
      action: 'CSRF_TOKEN_REQUEST_ERROR',
      resource: '/api/auth/csrf',
      ip,
      userAgent,
      success: false,
      details: { 
        error: error instanceof Error ? error.message : 'unknown_error' 
      }
    })

    console.error('[CSRF API ERROR]', error)

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// Désactiver les autres méthodes HTTP
export async function POST() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 })
}