import { Resend } from 'resend'

// Configuration Resend (optionnelle)
let resend: Resend | null = null
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY)
}
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@coworking-cafe.fr'
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
 * Envoie un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail({
  email,
  resetToken,
  firstName = 'Utilisateur'
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
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Envoie un email de bienvenue après inscription
 */
export async function sendWelcomeEmail({
  email,
  firstName,
  lastName
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
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
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