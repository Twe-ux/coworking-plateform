import { NextRequest, NextResponse } from 'next/server'
import { sendBookingConfirmationEmail, sendBookingReminderEmail } from '@/lib/email'

/**
 * API de test pour les emails
 * Disponible uniquement en développement
 */
export async function POST(request: NextRequest) {
  // Vérifier que nous sommes en développement
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'API de test non disponible en production' },
      { status: 403 }
    )
  }

  try {
    const { type, data } = await request.json()

    let result
    
    switch (type) {
      case 'booking_confirmation':
        console.log('📧 Test email confirmation avec:', data)
        result = await sendBookingConfirmationEmail(data)
        break
        
      case 'booking_reminder':
        console.log('🔔 Test email rappel avec:', data)
        result = await sendBookingReminderEmail(data)
        break
        
      default:
        return NextResponse.json(
          { success: false, error: `Type d'email non supporté: ${type}` },
          { status: 400 }
        )
    }

    console.log('📤 Résultat envoi email:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Email ${type} envoyé avec succès à ${data.email}` 
        : `Échec envoi email: ${result.error}`,
      details: result,
      timestamp: new Date().toISOString(),
      type,
      recipient: data.email
    })

  } catch (error) {
    console.error('❌ Erreur API test email:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint pour afficher les informations de configuration
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'API de test non disponible en production' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    available: true,
    environment: process.env.NODE_ENV,
    resend_configured: !!process.env.RESEND_API_KEY,
    from_email: process.env.RESEND_FROM_EMAIL || 'noreply@coworking-cafe.fr',
    supported_types: [
      'booking_confirmation',
      'booking_reminder'
    ],
    usage: {
      endpoint: '/api/test-email',
      method: 'POST',
      body: {
        type: 'booking_confirmation | booking_reminder',
        data: 'object with email data'
      }
    }
  })
}