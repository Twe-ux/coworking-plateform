import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { ExportOptions } from '@/types/admin'

// POST /api/admin/users/bulk-actions - Actions en lot sur les utilisateurs
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const { action, userIds, data } = await request.json()

    if (!action || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Action ou utilisateurs non spécifiés' },
        { status: 400 }
      )
    }

    // Convertir les IDs en ObjectId
    const objectIds = userIds.map(id => {
      if (!ObjectId.isValid(id)) {
        throw new Error(`ID invalide: ${id}`)
      }
      return new ObjectId(id)
    })

    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    let result
    let message = ''

    switch (action) {
      case 'activate':
        result = await usersCollection.updateMany(
          { _id: { $in: objectIds } },
          { 
            $set: { 
              status: 'active',
              updatedAt: new Date()
            }
          }
        )
        message = `${result.modifiedCount} utilisateur(s) activé(s)`
        break

      case 'deactivate':
        result = await usersCollection.updateMany(
          { _id: { $in: objectIds } },
          { 
            $set: { 
              status: 'inactive',
              updatedAt: new Date()
            }
          }
        )
        message = `${result.modifiedCount} utilisateur(s) désactivé(s)`
        break

      case 'suspend':
        result = await usersCollection.updateMany(
          { _id: { $in: objectIds } },
          { 
            $set: { 
              status: 'suspended',
              updatedAt: new Date()
            }
          }
        )
        message = `${result.modifiedCount} utilisateur(s) suspendu(s)`
        break

      case 'delete':
        // Empêcher la suppression de son propre compte
        if (objectIds.some(id => id.toString() === session.user.id)) {
          return NextResponse.json(
            { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte' },
            { status: 400 }
          )
        }
        
        result = await usersCollection.deleteMany(
          { _id: { $in: objectIds } }
        )
        message = `${result.deletedCount} utilisateur(s) supprimé(s)`
        break

      case 'changeRole':
        if (!data?.role) {
          return NextResponse.json(
            { success: false, error: 'Rôle non spécifié' },
            { status: 400 }
          )
        }
        
        result = await usersCollection.updateMany(
          { _id: { $in: objectIds } },
          { 
            $set: { 
              role: data.role,
              updatedAt: new Date()
            }
          }
        )
        message = `${result.modifiedCount} utilisateur(s) mis à jour avec le rôle ${data.role}`
        break

      case 'changeDepartment':
        if (!data?.department) {
          return NextResponse.json(
            { success: false, error: 'Département non spécifié' },
            { status: 400 }
          )
        }
        
        result = await usersCollection.updateMany(
          { _id: { $in: objectIds } },
          { 
            $set: { 
              department: data.department,
              updatedAt: new Date()
            }
          }
        )
        message = `${result.modifiedCount} utilisateur(s) transféré(s) au département ${data.department}`
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message,
      data: {
        affectedCount: ('modifiedCount' in result ? result.modifiedCount : result.deletedCount),
        action
      }
    })

  } catch (error) {
    console.error('Erreur lors de l\'action en lot:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// GET /api/admin/users/bulk-actions?action=export - Exporter les données utilisateurs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action !== 'export') {
      return NextResponse.json(
        { success: false, error: 'Action non supportée' },
        { status: 400 }
      )
    }

    const format = searchParams.get('format') || 'csv'
    const fieldsParam = searchParams.get('fields')
    const includeHistory = searchParams.get('includeHistory') === 'true'

    // Champs par défaut à exporter
    const defaultFields = ['_id', 'name', 'email', 'role', 'status', 'department', 'createdAt', 'lastLoginAt']
    const fields = fieldsParam ? fieldsParam.split(',') : defaultFields

    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    // Construire la projection
    const projection: any = { password: 0 } // Toujours exclure le mot de passe
    
    if (!includeHistory) {
      projection.loginHistory = 0
    }

    // Récupérer tous les utilisateurs
    const users = await usersCollection
      .find({}, { projection })
      .sort({ createdAt: -1 })
      .toArray()

    if (format === 'csv') {
      // Génération du CSV
      const csvHeaders = fields.join(',')
      const csvRows = users.map(user => {
        return fields.map(field => {
          let value = user[field]
          if (value instanceof Date) {
            value = value.toISOString()
          } else if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value)
          } else if (value === null || value === undefined) {
            value = ''
          }
          // Échapper les guillemets et virgules
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(',')
      })

      const csvContent = [csvHeaders, ...csvRows].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      // Format JSON par défaut
      return NextResponse.json({
        success: true,
        data: users.map(user => ({
          ...user,
          _id: user._id.toString()
        })),
        exportInfo: {
          format,
          totalRecords: users.length,
          fields,
          exportedAt: new Date().toISOString()
        }
      })
    }

  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}