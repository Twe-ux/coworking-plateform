import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db/mongoose'
import { User } from '@/lib/models/user'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Vérifier l'authentification
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    await connectToDatabase()

    // Récupérer tous les utilisateurs en ligne
    const onlineUsers = await User.find({ 
      isOnline: true,
      isActive: { $ne: false } // Exclure les utilisateurs désactivés
    })
    .select('_id name firstName lastName email image isOnline lastActive')
    .lean()

    console.log('📋 API: Found online users:', onlineUsers.length)

    // Formater les données
    const formattedUsers = onlineUsers.map((user: any) => ({
      _id: user._id?.toString() || user._id,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      image: user.image,
      isOnline: user.isOnline,
      lastActive: user.lastActive
    }))

    return res.status(200).json({
      success: true,
      users: formattedUsers,
      count: formattedUsers.length
    })

  } catch (error) {
    console.error('Erreur API online users:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}