import { Resend } from 'resend'

// Configuration Resend (optionnelle)
let resend: Resend | null = null
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY)
}
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@coworking-cafe.fr'
const APP_NAME = 'Cow or King Café'
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

/**
 * Interface pour les paramètres d'email de réinitialisation de mot de passe
 */
interface PasswordResetEmailParams {
  email: string
  resetToken: string
  firstName?: string
}

/**
 * Interface pour les paramètres d'email de bienvenue
 */
interface WelcomeEmailParams {
  email: string
  firstName: string
  lastName: string
}

/**
 * Interface pour les paramètres d'email de confirmation de réservation
 */
interface BookingConfirmationEmailParams {
  email: string
  firstName: string
  lastName: string
  bookingId: string
  spaceName: string
  date: string
  startTime: string
  endTime: string
  duration: number
  durationType: string
  guests: number
  totalPrice: number
  paymentMethod: string
}

/**
 * Interface pour les paramètres d'email de rappel de réservation
 */
interface BookingReminderEmailParams {
  email: string
  firstName: string
  lastName: string
  bookingId: string
  spaceName: string
  date: string
  startTime: string
  endTime: string
  hoursUntilBooking: number
}

/**
 * Interface pour les paramètres d'email d'annulation de réservation
 */
interface BookingCancellationEmailParams {
  email: string
  firstName: string
  lastName: string
  bookingId: string
  spaceName: string
  date: string
  startTime: string
  endTime: string
  refundAmount?: number
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail({
  email,
  resetToken,
  firstName = 'Utilisateur',
}: PasswordResetEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    if (!resend) {
      console.warn('⚠️  Resend non configuré - email non envoyé')
      return { success: false, error: 'Service email non configuré' }
    }
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de votre mot de passe</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 2rem; }
          .button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 1rem 0; }
          .footer { background: #f8f9fa; padding: 1rem; text-align: center; color: #666; font-size: 0.9em; border-radius: 0 0 10px 10px; }
          .warning { background: #fef3cd; border: 1px solid #ffeaa7; padding: 1rem; border-radius: 5px; margin: 1rem 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ ${APP_NAME}</h1>
            <h2>Réinitialisation de mot de passe</h2>
          </div>
          
          <div class="content">
            <p>Bonjour ${firstName},</p>
            
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte ${APP_NAME}.</p>
            
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </p>
            
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul>
                <li>Ce lien est valide pendant 24 heures seulement</li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                <li>Ne partagez jamais ce lien avec qui que ce soit</li>
              </ul>
            </div>
            
            <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
              ${resetUrl}
            </p>
            
            <p>Cordialement,<br>L'équipe ${APP_NAME}</p>
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé depuis ${APP_NAME}<br>
            Si vous avez des questions, contactez-nous à <a href="mailto:support@coworking-cafe.fr">support@coworking-cafe.fr</a></p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
Bonjour ${firstName},

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte ${APP_NAME}.

Cliquez sur ce lien pour créer un nouveau mot de passe :
${resetUrl}

IMPORTANT :
- Ce lien est valide pendant 24 heures seulement
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
- Ne partagez jamais ce lien avec qui que ce soit

Cordialement,
L'équipe ${APP_NAME}
    `

    const { data, error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Réinitialisation de votre mot de passe - ${APP_NAME}`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Erreur Resend:', error)
      return { success: false, error: error.message }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Email de réinitialisation envoyé:', data?.id)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Envoie un email de bienvenue après inscription
 */
export async function sendWelcomeEmail({
  email,
  firstName,
  lastName,
}: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    if (!resend) {
      console.warn('⚠️  Resend non configuré - email non envoyé')
      return { success: false, error: 'Service email non configuré' }
    }
    const loginUrl = `${APP_URL}/login`

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue chez ${APP_NAME}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 2rem; }
          .button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 1rem 0; }
          .footer { background: #f8f9fa; padding: 1rem; text-align: center; color: #666; font-size: 0.9em; border-radius: 0 0 10px 10px; }
          .features { background: #f8f9fa; padding: 1rem; border-radius: 5px; margin: 1rem 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ ${APP_NAME}</h1>
            <h2>Bienvenue dans notre communauté !</h2>
          </div>
          
          <div class="content">
            <p>Bonjour ${firstName} ${lastName},</p>
            
            <p>🎉 Félicitations ! Votre compte a été créé avec succès.</p>
            
            <p>Vous rejoignez une communauté dynamique de professionnels, entrepreneurs et créatifs dans notre espace de coworking chaleureux.</p>
            
            <div class="features">
              <h3>🚀 Que pouvez-vous faire maintenant ?</h3>
              <ul>
                <li>📅 Réserver vos espaces de travail favoris</li>
                <li>☕ Commander vos boissons et encas directement depuis l'app</li>
                <li>💬 Échanger avec la communauté</li>
                <li>📊 Suivre vos réservations et consommations</li>
              </ul>
            </div>
            
            <p style="text-align: center;">
              <a href="${loginUrl}" class="button">Se connecter maintenant</a>
            </p>
            
            <p>Notre équipe est là pour vous accompagner. N'hésitez pas à nous contacter si vous avez des questions !</p>
            
            <p>À très bientôt dans nos espaces,<br>L'équipe ${APP_NAME}</p>
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé depuis ${APP_NAME}<br>
            Questions ? Contactez-nous à <a href="mailto:support@coworking-cafe.fr">support@coworking-cafe.fr</a></p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
Bienvenue chez ${APP_NAME} !

Bonjour ${firstName} ${lastName},

Félicitations ! Votre compte a été créé avec succès.

Vous rejoignez une communauté dynamique de professionnels, entrepreneurs et créatifs dans notre espace de coworking chaleureux.

Que pouvez-vous faire maintenant ?
- Réserver vos espaces de travail favoris
- Commander vos boissons et encas directement depuis l'app
- Échanger avec la communauté
- Suivre vos réservations et consommations

Connectez-vous maintenant : ${loginUrl}

Notre équipe est là pour vous accompagner. N'hésitez pas à nous contacter si vous avez des questions !

À très bientôt dans nos espaces,
L'équipe ${APP_NAME}
    `

    const { data, error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Bienvenue chez ${APP_NAME} ! 🎉`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Erreur Resend:', error)
      return { success: false, error: error.message }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Email de bienvenue envoyé:', data?.id)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Envoie un email de confirmation de réservation
 */
export async function sendBookingConfirmationEmail({
  email,
  firstName,
  lastName,
  bookingId,
  spaceName,
  date,
  startTime,
  endTime,
  duration,
  durationType,
  guests,
  totalPrice,
  paymentMethod,
}: BookingConfirmationEmailParams): Promise<{
  success: boolean
  error?: string
}> {
  try {
    if (!resend) {
      console.warn('⚠️  Resend non configuré - email non envoyé')
      return { success: false, error: 'Service email non configuré' }
    }

    const dashboardUrl = `${APP_URL}/dashboard/client/bookings`
    const durationText = getDurationText(duration, durationType)
    const paymentText = getPaymentMethodText(paymentMethod)

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de réservation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 2rem; }
          .booking-details { background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #f59e0b; }
          .detail-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e9ecef; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: bold; color: #495057; }
          .detail-value { color: #212529; }
          .button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 1rem 0; }
          .footer { background: #f8f9fa; padding: 1rem; text-align: center; color: #666; font-size: 0.9em; border-radius: 0 0 10px 10px; }
          .success-badge { background: #d4edda; color: #155724; padding: 0.5rem 1rem; border-radius: 20px; display: inline-block; margin: 1rem 0; font-weight: bold; }
          .price-highlight { font-size: 1.5em; color: #f59e0b; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ ${APP_NAME}</h1>
            <h2>Réservation confirmée !</h2>
            <div class="success-badge">✅ Réservation #${bookingId.slice(-8)}</div>
          </div>
          
          <div class="content">
            <p>Bonjour ${firstName} ${lastName},</p>
            
            <p>🎉 Excellente nouvelle ! Votre réservation a été confirmée avec succès.</p>
            
            <div class="booking-details">
              <h3 style="margin-top: 0; color: #f59e0b;">📋 Détails de votre réservation</h3>
              
              <div class="detail-row">
                <span class="detail-label">🏢 Espace :</span>
                <span class="detail-value">${spaceName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">📅 Date :</span>
                <span class="detail-value">${date}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">🕐 Horaires :</span>
                <span class="detail-value">${startTime} - ${endTime}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">⏰ Durée :</span>
                <span class="detail-value">${durationText}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">👥 Invités :</span>
                <span class="detail-value">${guests} personne${guests > 1 ? 's' : ''}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">💳 Paiement :</span>
                <span class="detail-value">${paymentText}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">💰 Prix total :</span>
                <span class="detail-value price-highlight">${totalPrice.toFixed(2)}€</span>
              </div>
            </div>
            
            <p><strong>🔔 Que faire maintenant ?</strong></p>
            <ul>
              <li>📱 Ajoutez cet événement à votre agenda</li>
              <li>🗺️ Vérifiez l'adresse et les informations d'accès</li>
              <li>📧 Vous recevrez un rappel 24h avant votre réservation</li>
              <li>❓ Consultez vos réservations dans votre espace personnel</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="${dashboardUrl}" class="button">Voir mes réservations</a>
            </p>
            
            <p><strong>💡 Besoin de modifier ou annuler ?</strong><br>
            Vous pouvez gérer vos réservations depuis votre tableau de bord. Les annulations sont possibles jusqu'à 1h avant le début de votre créneau.</p>
            
            <p>Merci de votre confiance et à très bientôt dans nos espaces !<br>
            L'équipe ${APP_NAME}</p>
          </div>
          
          <div class="footer">
            <p>Réservation confirmée depuis ${APP_NAME}<br>
            Questions ? Contactez-nous à <a href="mailto:support@coworking-cafe.fr">support@coworking-cafe.fr</a></p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
Réservation confirmée ! - ${APP_NAME}

Bonjour ${firstName} ${lastName},

Excellente nouvelle ! Votre réservation a été confirmée avec succès.

DÉTAILS DE VOTRE RÉSERVATION
Réservation #${bookingId.slice(-8)}

Espace : ${spaceName}
Date : ${date}
Horaires : ${startTime} - ${endTime}
Durée : ${durationText}
Invités : ${guests} personne${guests > 1 ? 's' : ''}
Paiement : ${paymentText}
Prix total : ${totalPrice.toFixed(2)}€

QUE FAIRE MAINTENANT ?
- Ajoutez cet événement à votre agenda
- Vérifiez l'adresse et les informations d'accès
- Vous recevrez un rappel 24h avant votre réservation
- Consultez vos réservations : ${dashboardUrl}

BESOIN DE MODIFIER OU ANNULER ?
Vous pouvez gérer vos réservations depuis votre tableau de bord. Les annulations sont possibles jusqu'à 1h avant le début de votre créneau.

Merci de votre confiance et à très bientôt dans nos espaces !
L'équipe ${APP_NAME}
    `

    const { data, error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `✅ Réservation confirmée - ${spaceName} le ${date}`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Erreur Resend:', error)
      return { success: false, error: error.message }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Email de confirmation réservation envoyé:', data?.id)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Envoie un email de rappel de réservation
 */
export async function sendBookingReminderEmail({
  email,
  firstName,
  lastName,
  bookingId,
  spaceName,
  date,
  startTime,
  endTime,
  hoursUntilBooking,
}: BookingReminderEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    if (!resend) {
      console.warn('⚠️  Resend non configuré - email non envoyé')
      return { success: false, error: 'Service email non configuré' }
    }

    const dashboardUrl = `${APP_URL}/dashboard/client/bookings`
    const timeUntilText =
      hoursUntilBooking === 24 ? 'demain' : `dans ${hoursUntilBooking}h`

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rappel de réservation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 2rem; }
          .reminder-box { background: #fff3cd; border: 2px solid #ffc107; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; text-align: center; }
          .booking-summary { background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #f59e0b; }
          .button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 1rem 0; }
          .footer { background: #f8f9fa; padding: 1rem; text-align: center; color: #666; font-size: 0.9em; border-radius: 0 0 10px 10px; }
          .checklist { background: #d1ecf1; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #0dcaf0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ ${APP_NAME}</h1>
            <h2>🔔 Rappel de réservation</h2>
          </div>
          
          <div class="content">
            <p>Bonjour ${firstName} ${lastName},</p>
            
            <div class="reminder-box">
              <h3 style="margin-top: 0; color: #856404;">⏰ Votre réservation approche !</h3>
              <p style="font-size: 1.2em; margin: 0;"><strong>Rendez-vous ${timeUntilText}</strong></p>
            </div>
            
            <div class="booking-summary">
              <h3 style="margin-top: 0; color: #f59e0b;">📋 Récapitulatif</h3>
              <p><strong>🏢 Espace :</strong> ${spaceName}</p>
              <p><strong>📅 Date :</strong> ${date}</p>
              <p><strong>🕐 Horaires :</strong> ${startTime} - ${endTime}</p>
              <p><strong>📍 Réservation :</strong> #${bookingId.slice(-8)}</p>
            </div>
            
            <div class="checklist">
              <h3 style="margin-top: 0; color: #0a58ca;">✅ Check-list avant votre venue</h3>
              <ul style="margin: 0; padding-left: 1.5rem;">
                <li>📱 Confirmez votre présence si demandé</li>
                <li>🗺️ Vérifiez l'itinéraire et les horaires d'accès</li>
                <li>💻 Préparez votre matériel de travail</li>
                <li>🆔 Munissez-vous d'une pièce d'identité si nécessaire</li>
                <li>📧 Gardez cet email pour référence</li>
              </ul>
            </div>
            
            <p><strong>📍 Adresse et accès :</strong><br>
            Retrouvez tous les détails d'accès dans votre tableau de bord.</p>
            
            <p style="text-align: center;">
              <a href="${dashboardUrl}" class="button">Voir ma réservation</a>
            </p>
            
            <p><strong>❓ Besoin d'annuler ou modifier ?</strong><br>
            Vous pouvez encore annuler jusqu'à 1h avant le début de votre créneau depuis votre tableau de bord.</p>
            
            <p>Nous avons hâte de vous accueillir !<br>
            L'équipe ${APP_NAME}</p>
          </div>
          
          <div class="footer">
            <p>Rappel automatique de ${APP_NAME}<br>
            Questions ? Contactez-nous à <a href="mailto:support@coworking-cafe.fr">support@coworking-cafe.fr</a></p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
Rappel de réservation - ${APP_NAME}

Bonjour ${firstName} ${lastName},

⏰ VOTRE RÉSERVATION APPROCHE !
Rendez-vous ${timeUntilText}

RÉCAPITULATIF
Espace : ${spaceName}
Date : ${date}
Horaires : ${startTime} - ${endTime}
Réservation : #${bookingId.slice(-8)}

CHECK-LIST AVANT VOTRE VENUE
- Confirmez votre présence si demandé
- Vérifiez l'itinéraire et les horaires d'accès
- Préparez votre matériel de travail
- Munissez-vous d'une pièce d'identité si nécessaire
- Gardez cet email pour référence

ADRESSE ET ACCÈS
Retrouvez tous les détails dans votre tableau de bord : ${dashboardUrl}

BESOIN D'ANNULER OU MODIFIER ?
Vous pouvez encore annuler jusqu'à 1h avant le début de votre créneau depuis votre tableau de bord.

Nous avons hâte de vous accueillir !
L'équipe ${APP_NAME}
    `

    const { data, error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `🔔 Rappel : RDV ${timeUntilText} - ${spaceName}`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Erreur Resend:', error)
      return { success: false, error: error.message }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Email de rappel réservation envoyé:', data?.id)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Envoie un email d'annulation de réservation
 */
export async function sendBookingCancellationEmail({
  email,
  firstName,
  lastName,
  bookingId,
  spaceName,
  date,
  startTime,
  endTime,
  refundAmount,
}: BookingCancellationEmailParams): Promise<{
  success: boolean
  error?: string
}> {
  try {
    if (!resend) {
      console.warn('⚠️  Resend non configuré - email non envoyé')
      return { success: false, error: 'Service email non configuré' }
    }

    const dashboardUrl = `${APP_URL}/dashboard/client/bookings`
    const bookUrl = `${APP_URL}/reservation`

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Annulation de réservation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 2rem; }
          .cancellation-box { background: #f8d7da; border: 2px solid #dc3545; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; text-align: center; }
          .booking-summary { background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #dc3545; }
          .refund-info { background: #d4edda; border: 2px solid #28a745; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
          .button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 1rem 0; }
          .footer { background: #f8f9fa; padding: 1rem; text-align: center; color: #666; font-size: 0.9em; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ ${APP_NAME}</h1>
            <h2>❌ Réservation annulée</h2>
          </div>
          
          <div class="content">
            <p>Bonjour ${firstName} ${lastName},</p>
            
            <div class="cancellation-box">
              <h3 style="margin-top: 0; color: #721c24;">📋 Annulation confirmée</h3>
              <p style="margin: 0;">Votre réservation a été annulée avec succès</p>
            </div>
            
            <div class="booking-summary">
              <h3 style="margin-top: 0; color: #dc3545;">📋 Réservation annulée</h3>
              <p><strong>🏢 Espace :</strong> ${spaceName}</p>
              <p><strong>📅 Date :</strong> ${date}</p>
              <p><strong>🕐 Horaires :</strong> ${startTime} - ${endTime}</p>
              <p><strong>📍 Réservation :</strong> #${bookingId.slice(-8)}</p>
            </div>
            
            ${
              refundAmount
                ? `
            <div class="refund-info">
              <h3 style="margin-top: 0; color: #155724;">💰 Informations de remboursement</h3>
              <p><strong>Montant remboursé :</strong> ${refundAmount.toFixed(2)}€</p>
              <p>Le remboursement sera traité sous 3-5 jours ouvrés et apparaîtra sur votre méthode de paiement originale.</p>
            </div>
            `
                : ''
            }
            
            <p><strong>😊 Pas de souci !</strong><br>
            Nous comprenons que les plans peuvent changer. Votre place est maintenant disponible pour d'autres membres de notre communauté.</p>
            
            <p><strong>🔄 Envie de réserver à nouveau ?</strong><br>
            Vous pouvez consulter nos disponibilités et faire une nouvelle réservation à tout moment.</p>
            
            <p style="text-align: center;">
              <a href="${bookUrl}" class="button">Voir les disponibilités</a>
              <a href="${dashboardUrl}" class="button" style="background: #6c757d;">Mes réservations</a>
            </p>
            
            <p>Nous espérons vous revoir bientôt dans nos espaces !<br>
            L'équipe ${APP_NAME}</p>
          </div>
          
          <div class="footer">
            <p>Confirmation d'annulation de ${APP_NAME}<br>
            Questions ? Contactez-nous à <a href="mailto:support@coworking-cafe.fr">support@coworking-cafe.fr</a></p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
Réservation annulée - ${APP_NAME}

Bonjour ${firstName} ${lastName},

ANNULATION CONFIRMÉE
Votre réservation a été annulée avec succès.

RÉSERVATION ANNULÉE
Espace : ${spaceName}
Date : ${date}
Horaires : ${startTime} - ${endTime}
Réservation : #${bookingId.slice(-8)}

${
  refundAmount
    ? `
INFORMATIONS DE REMBOURSEMENT
Montant remboursé : ${refundAmount.toFixed(2)}€
Le remboursement sera traité sous 3-5 jours ouvrés et apparaîtra sur votre méthode de paiement originale.
`
    : ''
}

PAS DE SOUCI !
Nous comprenons que les plans peuvent changer. Votre place est maintenant disponible pour d'autres membres de notre communauté.

ENVIE DE RÉSERVER À NOUVEAU ?
Vous pouvez consulter nos disponibilités : ${bookUrl}
Vos réservations : ${dashboardUrl}

Nous espérons vous revoir bientôt dans nos espaces !
L'équipe ${APP_NAME}
    `

    const { data, error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `❌ Réservation annulée - ${spaceName} le ${date}`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Erreur Resend:', error)
      return { success: false, error: error.message }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log("✅ Email d'annulation réservation envoyé:", data?.id)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Fonctions utilitaires pour les emails de réservation
 */
function getDurationText(duration: number, durationType: string): string {
  const typeMap = {
    hour: duration === 1 ? 'heure' : 'heures',
    day: duration === 1 ? 'jour' : 'jours',
    week: duration === 1 ? 'semaine' : 'semaines',
    month: duration === 1 ? 'mois' : 'mois',
  }

  return `${duration} ${typeMap[durationType as keyof typeof typeMap] || durationType}`
}

function getPaymentMethodText(paymentMethod: string): string {
  const methodMap = {
    onsite: 'Sur place',
    card: 'Carte bancaire',
    paypal: 'PayPal',
  }

  return methodMap[paymentMethod as keyof typeof methodMap] || paymentMethod
}

/**
 * Vérifie la configuration email
 */
export function checkEmailConfiguration(): boolean {
  const hasApiKey = !!process.env.RESEND_API_KEY
  const hasFromEmail = !!process.env.FROM_EMAIL

  if (!hasApiKey || !hasFromEmail) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Configuration email incomplète (développement):', {
        RESEND_API_KEY: hasApiKey ? '✅' : '❌ (optionnel en dev)',
        FROM_EMAIL: hasFromEmail ? '✅' : '❌ (optionnel en dev)',
      })
    }
    return false
  }

  return true
}
