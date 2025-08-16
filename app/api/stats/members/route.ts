import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { User } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // Compter le nombre d'utilisateurs avec le rôle "client"
    const clientCount = await User.countDocuments({ 
      role: 'client',
      isActive: true // Seulement les comptes actifs
    })

    // Compter aussi les autres rôles pour des statistiques additionnelles
    const [totalUsers, managers, staff] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'manager', isActive: true }),
      User.countDocuments({ role: 'staff', isActive: true })
    ])

    // Calculer les statistiques
    const stats = {
      clients: clientCount,
      totalActiveUsers: totalUsers,
      managers,
      staff,
      displayText: clientCount > 0 ? `${clientCount}+` : '50+', // Fallback si pas de clients
      lastUpdated: new Date().toISOString()
    }

    return Response.json({
      success: true,
      data: stats,
      message: 'Statistiques membres récupérées avec succès'
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques membres:', error)
    
    // En cas d'erreur, retourner les données par défaut
    return Response.json({
      success: false,
      data: {
        clients: 50,
        totalActiveUsers: 50,
        managers: 0,
        staff: 0,
        displayText: '50+',
        lastUpdated: new Date().toISOString(),
        error: 'Fallback data used'
      },
      message: 'Erreur lors de la récupération, utilisation des données par défaut'
    }, { status: 500 })
  }
}