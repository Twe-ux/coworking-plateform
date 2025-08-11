import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectMongoose from '@/lib/mongoose'
import { User } from '@/lib/models/user'

/**
 * PATCH /api/user/preferences - Met à jour les préférences utilisateur
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    await connectMongoose()

    const body = await request.json()
    const { notifications, emailSettings, language, timezone } = body

    // Valider les données
    if (notifications && typeof notifications !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Format de notifications invalide' },
        { status: 400 }
      )
    }

    if (emailSettings && typeof emailSettings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Format d\'email settings invalide' },
        { status: 400 }
      )
    }

    // Construire l'objet de préférences à mettre à jour
    const preferencesUpdate: any = {}

    if (notifications) {
      preferencesUpdate['preferences.notifications'] = {
        email: Boolean(notifications.email),
        sms: Boolean(notifications.sms),
        push: Boolean(notifications.push)
      }
    }

    if (emailSettings) {
      preferencesUpdate['preferences.emailSettings'] = {
        bookingConfirmation: Boolean(emailSettings.bookingConfirmation),
        bookingReminder24h: Boolean(emailSettings.bookingReminder24h),
        bookingReminder2h: Boolean(emailSettings.bookingReminder2h),
        bookingCancellation: Boolean(emailSettings.bookingCancellation),
        promotions: Boolean(emailSettings.promotions)
      }
    }

    if (language) {
      preferencesUpdate['preferences.language'] = language
    }

    if (timezone) {
      preferencesUpdate['preferences.timezone'] = timezone
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: preferencesUpdate },
      { new: true, runValidators: true }
    ).select('preferences email firstName lastName')

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Préférences mises à jour avec succès',
      data: {
        preferences: updatedUser.preferences
      }
    })

  } catch (error) {
    console.error('Erreur mise à jour préférences:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur interne' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/user/preferences - Récupère les préférences utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    await connectMongoose()

    const user = await User.findById(session.user.id)
      .select('preferences email firstName lastName')

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Préférences par défaut si pas définies
    const defaultPreferences = {
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      emailSettings: {
        bookingConfirmation: true,
        bookingReminder24h: true,
        bookingReminder2h: true,
        bookingCancellation: true,
        promotions: false
      },
      language: 'fr',
      timezone: 'Europe/Paris'
    }

    const preferences = {
      ...defaultPreferences,
      ...user.preferences
    }

    return NextResponse.json({
      success: true,
      data: { preferences }
    })

  } catch (error) {
    console.error('Erreur récupération préférences:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur interne' 
      },
      { status: 500 }
    )
  }
}