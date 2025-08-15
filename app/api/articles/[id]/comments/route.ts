/**
 * API endpoint pour les commentaires d'un article
 * GET /api/articles/[id]/comments - Commentaires d'un article
 */

import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Article from '@/lib/models/Article'
import Comment from '@/lib/models/Comment'
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api/blog-auth'
import {
  validateQueryParams,
  PaginationSchema,
  isValidObjectId,
  type PaginationParams,
} from '@/lib/validation/blog'
import { z } from 'zod'

/**
 * GET /api/articles/[id]/comments - Récupérer les commentaires d'un article
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validation de l'ID
    if (!isValidObjectId(id)) {
      return createErrorResponse(
        'ID d\'article invalide',
        400,
        'INVALID_ID'
      )
    }

    await connectToDatabase()

    // Vérifier que l'article existe
    const article = await Article.findById(id).select('title allowComments status')
    if (!article) {
      return createErrorResponse(
        'Article non trouvé',
        404,
        'ARTICLE_NOT_FOUND'
      )
    }

    // Vérifier si les commentaires sont autorisés
    if (!article.allowComments) {
      return createErrorResponse(
        'Les commentaires sont désactivés pour cet article',
        403,
        'COMMENTS_DISABLED'
      )
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validation des paramètres de pagination  
    const paginationResult = PaginationSchema.safeParse({
      page: queryParams.page || '1',
      limit: queryParams.limit || '20',
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder || 'desc'
    })
    if (!paginationResult.success) {
      return createErrorResponse(
        'Paramètres de pagination invalides',
        400,
        'INVALID_PAGINATION',
        paginationResult.error
      )
    }

    const pagination: PaginationParams = paginationResult.data

    // Calculs pour la pagination
    const page = pagination.page
    const limit = pagination.limit
    const skip = (page - 1) * limit

    // Récupérer les commentaires principaux (non-réponses) avec leurs réponses
    const comments = await Comment.find({
      article: id,
      status: 'approved',
      parentComment: { $exists: false }, // Seulement les commentaires de niveau supérieur
    })
      .populate('author', 'firstName lastName image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Récupérer les réponses pour chaque commentaire
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          parentComment: comment._id,
          status: 'approved',
        })
          .populate('author', 'firstName lastName image')
          .sort({ createdAt: 1 })
          .lean()

        return {
          ...comment,
          replies: replies || [],
          replyCount: replies?.length || 0,
        }
      })
    )

    // Compter le total de commentaires approuvés pour cet article
    const totalComments = await Comment.countDocuments({
      article: id,
      status: 'approved',
      parentComment: { $exists: false },
    })

    // Compter le total de réponses
    const totalReplies = await Comment.countDocuments({
      article: id,
      status: 'approved',
      parentComment: { $exists: true },
    })

    // Métadonnées de pagination
    const totalPages = Math.ceil(totalComments / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    // Statistiques générales des commentaires
    const commentStats = await Comment.aggregate([
      {
        $match: {
          article: { $eq: id },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ])

    const statsMap = commentStats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count
      return acc
    }, {})

    const meta = {
      page,
      limit,
      total: totalComments,
      totalPages,
      hasNext,
      hasPrev,
      totalReplies,
      totalWithReplies: totalComments + totalReplies,
      stats: {
        approved: statsMap.approved || 0,
        pending: statsMap.pending || 0,
        rejected: statsMap.rejected || 0,
        spam: statsMap.spam || 0,
      },
      article: {
        id: article._id,
        title: article.title,
        allowComments: article.allowComments,
      },
    }

    return createSuccessResponse(
      commentsWithReplies,
      'Commentaires récupérés avec succès',
      meta
    )

  } catch (error: any) {
    console.error('Erreur lors de la récupération des commentaires:', error)
    return createErrorResponse(
      'Erreur lors de la récupération des commentaires',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}