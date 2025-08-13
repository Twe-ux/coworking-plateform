import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import {
  verifyPassword,
  logSecurityEvent,
  checkBruteForce,
  recordFailedLogin,
  resetLoginAttempts,
  getRealIP,
} from '@/lib/auth-utils'
import { UserRole } from '@/types/auth'

/**
 * API d'authentification pour validation des identifiants
 * Utilisé par NextAuth et d'autres systèmes d'authentification
 */
export async function POST(request: NextRequest) {
  const ip = getRealIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    // Vérifier les tentatives de brute force
    const bruteForceCheck = checkBruteForce(ip)
    if (bruteForceCheck.isBlocked) {
      await logSecurityEvent({
        userId: undefined,
        action: 'AUTH_API_BLOCKED',
        resource: 'auth_api',
        ip,
        userAgent,
        success: false,
        details: {
          reason: 'brute_force_protection',
          remainingTime: bruteForceCheck.remainingTime,
        },
      })

      return NextResponse.json(
        {
          error:
            'Trop de tentatives de connexion. Réessayez dans quelques minutes.',
          remainingTime: bruteForceCheck.remainingTime,
        },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => null)

    if (!body || !body.email || !body.password) {
      await logSecurityEvent({
        userId: undefined,
        action: 'AUTH_API_INVALID_REQUEST',
        resource: 'auth_api',
        ip,
        userAgent,
        success: false,
        details: { reason: 'missing_credentials' },
      })

      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    const { email, password } = body

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      await logSecurityEvent({
        userId: undefined,
        action: 'AUTH_API_INVALID_EMAIL',
        resource: 'auth_api',
        ip,
        userAgent,
        success: false,
        details: { email },
      })

      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      )
    }

    // Connexion à la base de données
    const { db } = await connectToDatabase()

    // Rechercher l'utilisateur
    const user = await db.collection('users').findOne({
      email: email.toLowerCase().trim(),
    })

    if (!user) {
      recordFailedLogin(ip)
      await logSecurityEvent({
        userId: undefined,
        action: 'AUTH_API_USER_NOT_FOUND',
        resource: 'auth_api',
        ip,
        userAgent,
        success: false,
        details: { email },
      })

      // Réponse générique pour éviter l'énumération des utilisateurs
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      )
    }

    // Vérifier le mot de passe
    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      recordFailedLogin(ip)
      await logSecurityEvent({
        userId: user._id.toString(),
        action: 'AUTH_API_INVALID_PASSWORD',
        resource: 'auth_api',
        ip,
        userAgent,
        success: false,
        details: { email },
      })

      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      )
    }

    // Vérifier que le compte est actif
    if (!user.isActive || user.status !== 'active') {
      await logSecurityEvent({
        userId: user._id.toString(),
        action: 'AUTH_API_ACCOUNT_DISABLED',
        resource: 'auth_api',
        ip,
        userAgent,
        success: false,
        details: {
          email,
          status: user.status,
          isActive: user.isActive,
        },
      })

      return NextResponse.json(
        { error: 'Compte désactivé ou suspendu' },
        { status: 403 }
      )
    }

    // Réinitialiser les tentatives de connexion
    resetLoginAttempts(ip)

    // Mettre à jour les informations de connexion
    const updateResult = await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          lastLoginAt: new Date(),
          lastLoginIP: ip,
          lastLoginUserAgent: userAgent,
        },
        $push: {
          loginHistory: {
            timestamp: new Date(),
            ip,
            userAgent,
            success: true,
            method: 'api_auth',
          },
        } as any,
      }
    )

    if (updateResult.matchedCount === 0) {
      console.warn(
        `Impossible de mettre à jour les informations de connexion pour l'utilisateur ${user._id}`
      )
    }

    // Log de succès
    await logSecurityEvent({
      userId: user._id.toString(),
      action: 'AUTH_API_SUCCESS',
      resource: 'auth_api',
      ip,
      userAgent,
      success: true,
      details: {
        email,
        role: user.role,
      },
    })

    // Retourner les informations utilisateur (sans le mot de passe)
    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName || user.name?.split(' ')[0] || '',
      lastName: user.lastName || user.name?.split(' ')[1] || '',
      role: user.role as UserRole,
      permissions: user.permissions || [],
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    }

    return NextResponse.json(userResponse, { status: 200 })
  } catch (error) {
    console.error("Erreur dans l'API d'authentification:", error)

    await logSecurityEvent({
      userId: undefined,
      action: 'AUTH_API_ERROR',
      resource: 'auth_api',
      ip,
      userAgent,
      success: false,
      details: {
        error: error instanceof Error ? error.message : 'unknown_error',
      },
    })

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

/**
 * Endpoint de vérification de santé pour l'API d'authentification
 */
export async function GET() {
  try {
    const { db } = await connectToDatabase()

    // Test simple de connectivité à la base de données
    await db.admin().ping()

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'auth-api',
    })
  } catch (error) {
    console.error("Erreur de santé de l'API d'authentification:", error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'auth-api',
        error: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 503 }
    )
  }
}
