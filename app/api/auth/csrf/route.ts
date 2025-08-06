import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import crypto from 'crypto'
import { authOptions } from '@/lib/auth'
import { logSecurityEvent, getRealIP } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const ip = getRealIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      await logSecurityEvent({
        userId: undefined,
        action: 'CSRF_TOKEN_REQUEST_UNAUTHORIZED',
        resource: 'csrf_api',
        ip,
        userAgent,
        success: false,
        details: { reason: 'no_session' }
      })
      
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Générer un token CSRF sécurisé
    const csrfToken = crypto.randomBytes(32).toString('hex')
    
    const response = NextResponse.json({
      csrfToken,
      timestamp: Date.now(),
    })

    // Définir le cookie CSRF avec sécurité renforcée
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 heure
      path: '/',
    })

    // Log de succès
    await logSecurityEvent({
      userId: session.user.id,
      action: 'CSRF_TOKEN_GENERATED',
      resource: 'csrf_api',
      ip,
      userAgent,
      success: true,
      details: { tokenLength: csrfToken.length }
    })

    return response
  } catch (error) {
    console.error('Erreur CSRF:', error)
    
    await logSecurityEvent({
      userId: undefined,
      action: 'CSRF_TOKEN_ERROR',
      resource: 'csrf_api',
      ip,
      userAgent,
      success: false,
      details: { error: error instanceof Error ? error.message : 'unknown_error' }
    })
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const ip = getRealIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      await logSecurityEvent({
        userId: undefined,
        action: 'CSRF_VALIDATION_UNAUTHORIZED',
        resource: 'csrf_api',
        ip,
        userAgent,
        success: false,
        details: { reason: 'no_session' }
      })
      
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => null)
    const csrfToken = body?.csrfToken
    const cookieToken = request.cookies.get('csrf-token')?.value

    if (!csrfToken || !cookieToken) {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'CSRF_VALIDATION_MISSING_TOKEN',
        resource: 'csrf_api',
        ip,
        userAgent,
        success: false,
        details: { 
          hasBodyToken: !!csrfToken,
          hasCookieToken: !!cookieToken
        }
      })
      
      return NextResponse.json(
        { error: 'Token CSRF manquant' },
        { status: 400 }
      )
    }

    // Validation temporellement sécurisée
    let tokensMatch = false
    try {
      tokensMatch = crypto.timingSafeEqual(
        Buffer.from(csrfToken, 'hex'),
        Buffer.from(cookieToken, 'hex')
      )
    } catch {
      tokensMatch = false
    }

    if (!tokensMatch) {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'CSRF_VALIDATION_INVALID_TOKEN',
        resource: 'csrf_api',
        ip,
        userAgent,
        success: false,
        details: { 
          tokenLength: csrfToken.length,
          cookieLength: cookieToken.length
        }
      })
      
      return NextResponse.json(
        { error: 'Token CSRF invalide' },
        { status: 403 }
      )
    }

    // Log de validation réussie
    await logSecurityEvent({
      userId: session.user.id,
      action: 'CSRF_VALIDATION_SUCCESS',
      resource: 'csrf_api',
      ip,
      userAgent,
      success: true,
      details: {}
    })

    return NextResponse.json({ 
      success: true,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Erreur validation CSRF:', error)
    
    await logSecurityEvent({
      userId: undefined,
      action: 'CSRF_VALIDATION_ERROR',
      resource: 'csrf_api',
      ip,
      userAgent,
      success: false,
      details: { error: error instanceof Error ? error.message : 'unknown_error' }
    })
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}