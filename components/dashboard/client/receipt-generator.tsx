'use client'

import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import jsPDF from 'jspdf'

interface BookingData {
  id: string
  space: {
    name: string
    location: string
  }
  date: string
  startTime: string
  endTime: string
  duration: number
  durationType: 'hour' | 'day'
  guests: number
  totalPrice: number
  status: string
  paymentMethod: 'onsite' | 'stripe_card' | 'stripe_paypal'
  createdAt: string
}

interface UserData {
  name: string
  email: string
}

export const generateReceiptPDF = (booking: BookingData, user: UserData) => {
  const doc = new jsPDF()

  // Company header
  doc.setFontSize(20)
  doc.setTextColor(200, 100, 0) // Orange color
  doc.text('Cow or King Café', 20, 30)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Coworking & Coffee Space', 20, 40)
  doc.text('123 Rue de la République, 75001 Paris', 20, 45)
  doc.text('contact@coworking-cafe.fr | 01 23 45 67 89', 20, 50)

  // Title
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('REÇU DE RÉSERVATION', 20, 70)

  // Booking ID and date
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Réservation #${booking.id.slice(-8).toUpperCase()}`, 20, 80)
  doc.text(
    `Émis le ${format(parseISO(booking.createdAt), 'd MMMM yyyy à HH:mm', { locale: fr })}`,
    20,
    85
  )

  // Customer info
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('INFORMATIONS CLIENT', 20, 100)

  doc.setFontSize(10)
  doc.text(`Nom: ${user.name}`, 20, 110)
  doc.text(`Email: ${user.email}`, 20, 115)

  // Booking details
  doc.setFontSize(12)
  doc.text('DÉTAILS DE LA RÉSERVATION', 20, 135)

  doc.setFontSize(10)
  doc.text(`Espace: ${booking.space.name}`, 20, 145)
  doc.text(`Lieu: ${booking.space.location}`, 20, 150)
  doc.text(
    `Date: ${format(parseISO(booking.date), 'EEEE d MMMM yyyy', { locale: fr })}`,
    20,
    155
  )
  doc.text(`Horaires: ${booking.startTime} - ${booking.endTime}`, 20, 160)
  doc.text(
    `Durée: ${booking.duration} ${booking.durationType === 'hour' ? 'heure(s)' : 'jour(s)'}`,
    20,
    165
  )
  doc.text(`Nombre de personnes: ${booking.guests}`, 20, 170)

  // Payment info
  doc.setFontSize(12)
  doc.text('INFORMATIONS DE PAIEMENT', 20, 190)

  doc.setFontSize(10)
  const paymentMethodText =
    booking.paymentMethod === 'onsite'
      ? 'Paiement sur place'
      : booking.paymentMethod === 'stripe_card'
        ? 'Carte bancaire (Stripe)'
        : 'PayPal (Stripe)'
  doc.text(`Méthode de paiement: ${paymentMethodText}`, 20, 200)

  const statusText =
    booking.status === 'confirmed'
      ? 'Confirmée'
      : booking.status === 'pending'
        ? 'En attente'
        : booking.status === 'cancelled'
          ? 'Annulée'
          : 'Terminée'
  doc.text(`Statut: ${statusText}`, 20, 205)

  // Price breakdown
  doc.setFontSize(12)
  doc.text('TARIFICATION', 20, 225)

  // Table-like structure for pricing
  doc.setFontSize(10)
  doc.text('Description', 20, 235)
  doc.text('Quantité', 100, 235)
  doc.text('Prix unitaire', 130, 235)
  doc.text('Total', 170, 235)

  // Line
  doc.line(20, 238, 190, 238)

  const unitPrice = booking.totalPrice / booking.duration
  doc.text(
    `${booking.space.name} (${booking.durationType === 'hour' ? 'heure' : 'jour'})`,
    20,
    248
  )
  doc.text(`${booking.duration}`, 100, 248)
  doc.text(`${unitPrice.toFixed(2)} €`, 130, 248)
  doc.text(`${booking.totalPrice.toFixed(2)} €`, 170, 248)

  // Total
  doc.line(20, 252, 190, 252)
  doc.setFontSize(12)
  doc.text('TOTAL TTC', 130, 262)
  doc.setFontSize(14)
  doc.setTextColor(200, 100, 0)
  doc.text(`${booking.totalPrice.toFixed(2)} €`, 170, 262)

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('Merci de votre confiance !', 20, 280)
  doc.text(
    'Pour toute question, contactez-nous à contact@coworking-cafe.fr',
    20,
    285
  )

  // Save the PDF
  const filename = `recuCowOrKing-${booking.id.slice(-8).toUpperCase()}-${format(parseISO(booking.date), 'yyyy-MM-dd')}.pdf`
  doc.save(filename)
}

export const generateReceiptHTML = (
  booking: BookingData,
  user: UserData
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reçu - ${booking.id.slice(-8).toUpperCase()}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { color: #f97316; font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .subtitle { color: #666; font-size: 14px; }
        .section { margin: 20px 0; }
        .section-title { font-size: 16px; font-weight: bold; color: #f97316; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 200px 1fr; gap: 5px; }
        .total { font-size: 18px; font-weight: bold; color: #f97316; text-align: right; margin-top: 20px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Cow or King Café</div>
        <div class="subtitle">Coworking & Coffee Space</div>
        <div class="subtitle">123 Rue de la République, 75001 Paris</div>
      </div>
      
      <div class="section">
        <div class="section-title">Reçu de Réservation #${booking.id.slice(-8).toUpperCase()}</div>
        <div>Émis le ${format(parseISO(booking.createdAt), 'd MMMM yyyy à HH:mm', { locale: fr })}</div>
      </div>
      
      <div class="section">
        <div class="section-title">Informations Client</div>
        <div class="info-grid">
          <div>Nom:</div><div>${user.name}</div>
          <div>Email:</div><div>${user.email}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Détails de la Réservation</div>
        <div class="info-grid">
          <div>Espace:</div><div>${booking.space.name}</div>
          <div>Lieu:</div><div>${booking.space.location}</div>
          <div>Date:</div><div>${format(parseISO(booking.date), 'EEEE d MMMM yyyy', { locale: fr })}</div>
          <div>Horaires:</div><div>${booking.startTime} - ${booking.endTime}</div>
          <div>Durée:</div><div>${booking.duration} ${booking.durationType === 'hour' ? 'heure(s)' : 'jour(s)'}</div>
          <div>Personnes:</div><div>${booking.guests}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Paiement</div>
        <div class="info-grid">
          <div>Méthode:</div><div>${
            booking.paymentMethod === 'onsite'
              ? 'Paiement sur place'
              : booking.paymentMethod === 'stripe_card'
                ? 'Carte bancaire'
                : 'PayPal'
          }</div>
          <div>Statut:</div><div>${
            booking.status === 'confirmed'
              ? 'Confirmée'
              : booking.status === 'pending'
                ? 'En attente'
                : booking.status === 'cancelled'
                  ? 'Annulée'
                  : 'Terminée'
          }</div>
        </div>
      </div>
      
      <div class="total">
        TOTAL TTC: ${booking.totalPrice.toFixed(2)} €
      </div>
      
      <div class="footer">
        <p>Merci de votre confiance !</p>
        <p>Pour toute question, contactez-nous à contact@coworking-cafe.fr</p>
      </div>
    </body>
    </html>
  `
}
