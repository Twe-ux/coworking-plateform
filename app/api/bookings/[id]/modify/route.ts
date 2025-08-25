import { authOptions } from '@/lib/auth'
import { Booking, Space } from '@/lib/models'
import { connectMongoose } from '@/lib/mongoose'
import { isValidObjectId } from 'mongoose'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const bookingId = params.id

    if (!isValidObjectId(bookingId)) {
      return NextResponse.json(
        { error: 'ID de réservation invalide' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { date, startTime, endTime } = body

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Date, heure de début et heure de fin sont requises' },
        { status: 400 }
      )
    }

    await connectMongoose()

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('space')

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      )
    }

    // Check if user owns this booking
    if (booking.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Check if booking can be modified
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Seules les réservations confirmées peuvent être modifiées' },
        { status: 400 }
      )
    }

    // Check if it's too late to modify (same day or past)
    const bookingDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    bookingDate.setHours(0, 0, 0, 0)

    if (bookingDate.getTime() <= today.getTime()) {
      return NextResponse.json(
        {
          error: 'Impossible de modifier pour une date passée ou le jour même',
        },
        { status: 400 }
      )
    }

    // Check for conflicts (excluding current booking)
    const startDateTime = new Date(`${date}T${startTime}`)
    const endDateTime = new Date(`${date}T${endTime}`)

    const conflictingBookings = await Booking.find({
      space: booking.spaceId,
      date: date,
      status: { $in: ['confirmed', 'pending'] },
      _id: { $ne: bookingId }, // Exclude current booking
      $or: [
        {
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gt: startTime } },
          ],
        },
      ],
    })

    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: "Ce créneau n'est pas disponible" },
        { status: 409 }
      )
    }

    // Calculate new duration and pricing
    const startHour = parseInt(startTime.split(':')[0])
    const startMinute = parseInt(startTime.split(':')[1])
    const endHour = parseInt(endTime.split(':')[0])
    const endMinute = parseInt(endTime.split(':')[1])

    const startTimeInMinutes = startHour * 60 + startMinute
    const endTimeInMinutes = endHour * 60 + endMinute
    const durationInMinutes = endTimeInMinutes - startTimeInMinutes

    if (durationInMinutes <= 0) {
      return NextResponse.json(
        { error: "L'heure de fin doit être après l'heure de début" },
        { status: 400 }
      )
    }

    const durationInHours = durationInMinutes / 60
    const space = await Space.findById(booking.spaceId)

    if (!space) {
      return NextResponse.json({ error: 'Espace non trouvé' }, { status: 404 })
    }

    // Calculate new price based on duration
    let newTotalPrice = booking.totalPrice // Keep same price for now, but could recalculate

    // If duration changed significantly, recalculate
    const oldDurationInHours = booking.duration
    if (Math.abs(durationInHours - oldDurationInHours) > 0.5) {
      // Recalculate price based on space rates
      if (durationInHours >= 24) {
        newTotalPrice = Math.ceil(durationInHours / 24) * space.pricePerDay
      } else {
        newTotalPrice = Math.ceil(durationInHours) * space.pricePerHour
      }
    }

    // Update booking
    booking.date = date
    booking.startTime = startTime
    booking.endTime = endTime
    booking.duration = Math.ceil(durationInHours)
    booking.durationType = durationInHours >= 24 ? 'day' : 'hour'
    booking.totalPrice = newTotalPrice
    booking.updatedAt = new Date()

    await booking.save()

    return NextResponse.json({
      message: 'Réservation modifiée avec succès',
      booking: {
        id: booking._id.toString(),
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: booking.duration,
        durationType: booking.durationType,
        totalPrice: booking.totalPrice,
        updatedAt: booking.updatedAt,
      },
    })
  } catch (error) {
    console.error('Erreur lors de la modification:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
