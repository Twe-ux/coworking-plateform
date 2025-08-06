/**
 * Middleware de protection CSRF pour les API routes
 * Vérifie les tokens CSRF pour les requêtes de mutation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { validateCSRFToken } from './auth-utils'

/**
 * Vérifie le token CSRF pour les requêtes qui modifient des données
 */
export async function withCSRFProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const method = request.method.toLowerCase()

  // Les méthodes de lecture n'ont pas besoin de protection CSRF
  if (method === 'get' || method === 'head' || method === 'options') {
    return handler(request)
  }

  try {
    // Vérifier la session pour récupérer le token CSRF attendu
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Session requise' }, { status: 401 })
    }

    // Récupérer le token CSRF depuis les headers ou le body
    const csrfTokenFromHeader = request.headers.get('X-CSRF-Token')
    const contentType = request.headers.get('content-type')
    let csrfTokenFromBody = null

    if (contentType?.includes('application/json')) {
      try {
        const body = await request.json()
        csrfTokenFromBody = body.csrfToken
        // Recréer la requête avec le body lu
        const newRequest = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(body),
        })
        request = newRequest
      } catch {
        // Ignorer les erreurs de parsing JSON
      }
    }

    const providedToken = csrfTokenFromHeader || csrfTokenFromBody
    const expectedToken = session.csrfToken

    // Valider le token CSRF
    if (
      !providedToken ||
      !expectedToken ||
      !validateCSRFToken(providedToken, expectedToken)
    ) {
      return NextResponse.json(
        { error: 'Token CSRF invalide ou manquant' },
        { status: 403 }
      )
    }

    return handler(request)
  } catch (error) {
    console.error('Erreur middleware CSRF:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

/**
 * HOC pour wrapper les handlers d'API avec la protection CSRF
 */
export function withCSRF(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return (request: NextRequest) => withCSRFProtection(request, handler)
}

/**
 * Endpoint pour récupérer un nouveau token CSRF
 */
export async function csrfTokenHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Session requise' }, { status: 401 })
    }

    return NextResponse.json({
      csrfToken: session.csrfToken,
      expires: session.expires,
    })
  } catch (error) {
    console.error('Erreur récupération token CSRF:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
