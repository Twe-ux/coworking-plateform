import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectMongoose from '@/lib/mongoose'
import { Booking } from '@/lib/models/booking'
import { Space } from '@/lib/models/space'
import { User } from '@/lib/models/user'
import * as XLSX from 'xlsx'
import { format, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * POST /api/dashboard/admin/analytics/export - Export des données analytics en Excel/PDF
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les permissions admin
    const user = session.user as any
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé - Admin requis' },
        { status: 403 }
      )
    }

    await connectMongoose()

    const body = await request.json()
    const {
      period = '30d',
      type = 'revenue',
      format: exportFormat = 'excel',
    } = body

    // Calculer les dates
    const endDate = new Date()
    let startDate: Date

    switch (period) {
      case '7d':
        startDate = subDays(endDate, 7)
        break
      case '30d':
        startDate = subDays(endDate, 30)
        break
      case '90d':
        startDate = subDays(endDate, 90)
        break
      case '1y':
        startDate = subDays(endDate, 365)
        break
      default:
        startDate = subDays(endDate, 30)
    }

    // Récupérer les données selon le type d'export
    let data: any[] = []
    let fileName = ''
    let sheetName = ''

    if (type === 'revenue') {
      // Export des revenus
      const revenueData = await Booking.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $lookup: {
            from: 'spaces',
            localField: 'spaceId',
            foreignField: '_id',
            as: 'space',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $unwind: '$space',
        },
        {
          $project: {
            date: { $dateToString: { format: '%d/%m/%Y', date: '$date' } },
            'Heure début': '$startTime',
            'Heure fin': '$endTime',
            Client: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
            Email: '$user.email',
            Espace: '$space.name',
            Invités: '$guests',
            Statut: '$status',
            'Prix (€)': '$totalPrice',
            'Mode paiement': '$paymentMethod',
            'Créé le': {
              $dateToString: { format: '%d/%m/%Y %H:%M', date: '$createdAt' },
            },
          },
        },
        {
          $sort: { date: -1 },
        },
      ])

      data = revenueData
      fileName = `rapport-revenus-${period}`
      sheetName = 'Rapport Revenus'
    } else if (type === 'occupancy') {
      // Export de l'occupation
      const occupancyData = await Booking.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            status: { $in: ['confirmed', 'completed'] },
          },
        },
        {
          $lookup: {
            from: 'spaces',
            localField: 'spaceId',
            foreignField: '_id',
            as: 'space',
          },
        },
        {
          $unwind: '$space',
        },
        {
          $group: {
            _id: {
              spaceId: '$spaceId',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            },
            spaceName: { $first: '$space.name' },
            capacity: { $first: '$space.capacity' },
            totalBookings: { $sum: 1 },
            totalGuests: { $sum: '$guests' },
            totalHours: {
              $sum: {
                $divide: [
                  {
                    $subtract: [
                      {
                        $dateFromString: {
                          dateString: {
                            $concat: ['$_id.date', 'T', '$endTime', ':00'],
                          },
                        },
                      },
                      {
                        $dateFromString: {
                          dateString: {
                            $concat: ['$_id.date', 'T', '$startTime', ':00'],
                          },
                        },
                      },
                    ],
                  },
                  3600000, // convertir en heures
                ],
              },
            },
          },
        },
        {
          $addFields: {
            date: '$_id.date',
            occupancyRate: {
              $multiply: [
                { $divide: ['$totalHours', 12] }, // 12h d'ouverture par jour
                100,
              ],
            },
            capacityUtilization: {
              $multiply: [
                {
                  $divide: [
                    '$totalGuests',
                    { $multiply: ['$capacity', '$totalBookings'] },
                  ],
                },
                100,
              ],
            },
          },
        },
        {
          $project: {
            Date: {
              $dateToString: {
                format: '%d/%m/%Y',
                date: { $dateFromString: { dateString: '$date' } },
              },
            },
            Espace: '$spaceName',
            'Capacité max': '$capacity',
            Réservations: '$totalBookings',
            'Total invités': '$totalGuests',
            'Heures réservées': { $round: ['$totalHours', 2] },
            'Taux occupation (%)': { $round: ['$occupancyRate', 1] },
            'Utilisation capacité (%)': { $round: ['$capacityUtilization', 1] },
          },
        },
        {
          $sort: { Date: -1, Espace: 1 },
        },
      ])

      data = occupancyData
      fileName = `rapport-occupation-${period}`
      sheetName = 'Rapport Occupation'
    } else if (type === 'complete') {
      // Export complet - plusieurs feuilles
      const [revenueData, occupancyData, usersData, spacesData] =
        await Promise.all([
          // Revenus
          Booking.aggregate([
            {
              $match: {
                date: { $gte: startDate, $lte: endDate },
              },
            },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                totalRevenue: {
                  $sum: {
                    $cond: [
                      { $ne: ['$status', 'cancelled'] },
                      '$totalPrice',
                      0,
                    ],
                  },
                },
                totalBookings: { $sum: 1 },
                confirmedBookings: {
                  $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
                },
              },
            },
            {
              $project: {
                Date: {
                  $dateToString: {
                    format: '%d/%m/%Y',
                    date: { $dateFromString: { dateString: '$_id' } },
                  },
                },
                'Revenus (€)': '$totalRevenue',
                'Réservations totales': '$totalBookings',
                'Réservations confirmées': '$confirmedBookings',
              },
            },
            { $sort: { Date: -1 } },
          ]),

          // Occupation par espace
          Booking.aggregate([
            {
              $match: {
                date: { $gte: startDate, $lte: endDate },
                status: { $in: ['confirmed', 'completed'] },
              },
            },
            {
              $lookup: {
                from: 'spaces',
                localField: 'spaceId',
                foreignField: '_id',
                as: 'space',
              },
            },
            {
              $unwind: '$space',
            },
            {
              $group: {
                _id: '$spaceId',
                spaceName: { $first: '$space.name' },
                totalBookings: { $sum: 1 },
                totalRevenue: { $sum: '$totalPrice' },
              },
            },
            {
              $project: {
                Espace: '$spaceName',
                Réservations: '$totalBookings',
                'Revenus (€)': '$totalRevenue',
              },
            },
            { $sort: { 'Revenus (€)': -1 } },
          ]),

          // Utilisateurs actifs
          User.find({
            createdAt: { $gte: startDate, $lte: endDate },
          })
            .select('firstName lastName email role createdAt')
            .lean(),

          // Espaces
          Space.find({}).select('name capacity pricePerHour').lean(),
        ])

      // Créer un workbook avec plusieurs feuilles
      const workbook = XLSX.utils.book_new()

      // Feuille Revenus
      if (revenueData.length > 0) {
        const revenueSheet = XLSX.utils.json_to_sheet(revenueData)
        XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenus')
      }

      // Feuille Occupation
      if (occupancyData.length > 0) {
        const occupancySheet = XLSX.utils.json_to_sheet(occupancyData)
        XLSX.utils.book_append_sheet(workbook, occupancySheet, 'Occupation')
      }

      // Feuille Nouveaux utilisateurs
      if (usersData.length > 0) {
        const formattedUsers = usersData.map((user) => ({
          Prénom: user.firstName || '',
          Nom: user.lastName || '',
          Email: user.email,
          Rôle: user.role,
          'Date inscription': format(new Date(user.createdAt), 'dd/MM/yyyy', {
            locale: fr,
          }),
        }))
        const usersSheet = XLSX.utils.json_to_sheet(formattedUsers)
        XLSX.utils.book_append_sheet(
          workbook,
          usersSheet,
          'Nouveaux utilisateurs'
        )
      }

      // Feuille Espaces
      if (spacesData.length > 0) {
        const formattedSpaces = spacesData.map((space) => ({
          Nom: space.name,
          Capacité: space.capacity || 4,
          'Prix/heure (€)': space.pricePerHour || 0,
        }))
        const spacesSheet = XLSX.utils.json_to_sheet(formattedSpaces)
        XLSX.utils.book_append_sheet(workbook, spacesSheet, 'Espaces')
      }

      // Générer le buffer Excel
      const excelBuffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      })

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="rapport-complet-${period}.xlsx"`,
        },
      })
    }

    // Export simple (une seule feuille)
    if (data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aucune donnée à exporter pour cette période',
        },
        { status: 400 }
      )
    }

    if (exportFormat === 'excel') {
      // Créer le workbook Excel
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(data)

      // Ajuster la largeur des colonnes
      const columnWidths = Object.keys(data[0]).map((key) => ({
        wch: Math.max(key.length, 15),
      }))
      worksheet['!cols'] = columnWidths

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

      // Générer le buffer
      const excelBuffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      })

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}.xlsx"`,
        },
      })
    }

    // Si d'autres formats sont demandés, retourner une erreur pour le moment
    return NextResponse.json(
      { success: false, error: "Format d'export non supporté" },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erreur export analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erreur serveur interne',
      },
      { status: 500 }
    )
  }
}
