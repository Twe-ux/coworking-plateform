import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return Response.json({
        success: false,
        message: 'Aucun fichier fourni'
      }, { status: 400 })
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return Response.json({
        success: false,
        message: 'Le fichier doit être une image'
      }, { status: 400 })
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({
        success: false,
        message: 'Le fichier est trop volumineux (max 5MB)'
      }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Créer le dossier uploads s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${sanitizedName}`
    const filePath = path.join(uploadDir, fileName)

    // Écrire le fichier
    await writeFile(filePath, buffer)

    // Retourner l'URL de l'image
    const imageUrl = `/uploads/products/${fileName}`

    return Response.json({
      success: true,
      data: {
        url: imageUrl,
        filename: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type
      },
      message: 'Image uploadée avec succès'
    })

  } catch (error: any) {
    console.error('Erreur lors de l\'upload:', error)
    return Response.json({
      success: false,
      message: 'Erreur lors de l\'upload du fichier',
      error: error.message
    }, { status: 500 })
  }
}