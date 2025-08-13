import { NextRequest, NextResponse } from 'next/server'
import { logSecurityEvent, getRealIP } from '@/lib/auth-utils'

/**
 * API route pour nettoyer complètement les cookies et sessions
 * Utile pour résoudre les problèmes de port et de configuration
 */
export async function POST(request: NextRequest) {
  const ip = getRealIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    // Log de l'action de nettoyage
    await logSecurityEvent({
      userId: undefined,
      action: 'SESSION_CLEANUP_REQUEST',
      resource: 'auth_cleanup',
      ip,
      userAgent,
      success: true,
      details: { reason: 'manual_cleanup' },
    })

    const response = NextResponse.json({
      success: true,
      message: 'Session et cookies nettoyés',
      timestamp: Date.now(),
    })

    // Liste des cookies NextAuth à nettoyer
    const cookiesToClear = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'csrf-token',
    ]

    // Nettoyer tous les cookies NextAuth
    cookiesToClear.forEach((cookieName) => {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(0), // Expire immédiatement
      })
    })

    // Ajouter des headers pour forcer le rafraîchissement
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Erreur lors du nettoyage de session:', error)

    await logSecurityEvent({
      userId: undefined,
      action: 'SESSION_CLEANUP_ERROR',
      resource: 'auth_cleanup',
      ip,
      userAgent,
      success: false,
      details: {
        error: error instanceof Error ? error.message : 'unknown_error',
      },
    })

    return NextResponse.json(
      { error: 'Erreur lors du nettoyage de la session' },
      { status: 500 }
    )
  }
}
