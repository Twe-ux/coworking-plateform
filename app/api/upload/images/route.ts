import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * POST /api/upload/images - Upload d'images vers Cloudinary
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

    // Vérifier la configuration Cloudinary
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('⚠️  Configuration Cloudinary manquante - upload simulé')
      return simulateUpload(request)
    }

    const formData = await request.formData()
    const files = formData.getAll('images') as File[]

    if (!files.length) {
      return NextResponse.json(
        { success: false, error: 'Aucune image fournie' },
        { status: 400 }
      )
    }

    const uploadPromises = files.map(async (file) => {
      // Convertir le File en Buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Upload vers Cloudinary
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'coworking-spaces', // Organiser dans un dossier
            transformation: [
              { width: 800, height: 600, crop: 'fill', quality: 'auto' },
              { format: 'webp' } // Format optimisé
            ]
          },
          (error, result) => {
            if (error) {
              console.error('Erreur upload Cloudinary:', error)
              reject(error)
            } else {
              resolve({
                url: result?.secure_url,
                publicId: result?.public_id,
                width: result?.width,
                height: result?.height,
                format: result?.format,
                bytes: result?.bytes
              })
            }
          }
        ).end(buffer)
      })
    })

    const uploadResults = await Promise.all(uploadPromises)

    return NextResponse.json({
      success: true,
      images: uploadResults,
      message: `${uploadResults.length} image(s) uploadée(s) avec succès`
    })

  } catch (error) {
    console.error('Erreur API upload images:', error)
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
 * Fonction de fallback - upload simulé si pas de config Cloudinary
 */
async function simulateUpload(request: NextRequest) {
  const formData = await request.formData()
  const files = formData.getAll('images') as File[]

  const simulatedResults = await Promise.all(
    files.map(async (file, index) => {
      // Convertir en data URL pour simulation
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')
      const mimeType = file.type
      
      return {
        url: `data:${mimeType};base64,${base64}`,
        publicId: `simulated_${Date.now()}_${index}`,
        width: 800,
        height: 600,
        format: file.type.split('/')[1],
        bytes: file.size,
        simulated: true
      }
    })
  )

  return NextResponse.json({
    success: true,
    images: simulatedResults,
    message: `${simulatedResults.length} image(s) uploadée(s) (mode simulation)`,
    simulated: true
  })
}