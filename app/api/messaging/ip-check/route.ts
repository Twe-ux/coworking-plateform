import { NextRequest, NextResponse } from 'next/server'
import IPRestrictionMiddleware from '@/lib/middleware/ipRestriction'

// GET /api/messaging/ip-check - Vérifier l'accès IP pour la messagerie
export async function GET(request: NextRequest) {
  try {
    // TEMPORAIRE: Autoriser tous les utilisateurs connectés pendant les tests
    const clientIP = IPRestrictionMiddleware.getClientIP(request)
    
    return NextResponse.json({
      success: true,
      data: {
        clientIP: clientIP,
        allowed: true,
        message: 'Accès autorisé (mode développement)'
      }
    })

  } catch (error) {
    console.error('Erreur lors de la vérification IP:', error)
    return NextResponse.json(
      { 
        error: 'Erreur serveur',
        message: 'Impossible de vérifier les restrictions IP'
      },
      { status: 500 }
    )
  }
}

// Force Node.js runtime for IP restriction middleware compatibility
export const runtime = 'nodejs'