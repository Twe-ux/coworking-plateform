/**
 * Utilitaires d'authentification et d'autorisation pour les API Blog
 * Gestion des rôles et permissions pour le système CMS
 */

import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types/auth'
import dbConnect from '@/lib/mongodb'
import { logSecurityEvent, getRealIP } from '@/lib/auth-utils'
import { checkRateLimit } from '@/lib/validation'

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  permissions: string[]
  isActive: boolean
  image?: string
}

export interface RequestContext {
  user: AuthenticatedUser
  ip: string
  userAgent: string
  isOwner?: boolean // Pour les ressources spécifiques
}

/**
 * Middleware d'authentification pour les API routes
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ success: true; context: RequestContext } | { success: false; error: string; status: number }> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentification requise',
        status: 401
      }
    }

    // Vérifier que l'utilisateur est actif
    if (!session.user.isActive) {
      return {
        success: false,
        error: 'Compte utilisateur désactivé',
        status: 403
      }
    }

    // Extraire les informations de la requête
    const ip = getRealIP(request) || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Rate limiting basique par utilisateur
    if (!checkRateLimit(`blog_user_${session.user.id}`, 200, 30)) {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'RATE_LIMIT_BLOG_API',
        resource: 'blog',
        ip,
        userAgent,
        success: false,
        details: { reason: 'too_many_requests' },
      })
      
      return {
        success: false,
        error: 'Trop de requêtes, veuillez patienter',
        status: 429
      }
    }

    const context: RequestContext = {
      user: session.user as AuthenticatedUser,
      ip,
      userAgent,
    }

    return { success: true, context }
    
  } catch (error) {
    console.error('Erreur d\'authentification:', error)
    return {
      success: false,
      error: 'Erreur d\'authentification interne',
      status: 500
    }
  }
}

/**
 * Vérifie si l'utilisateur a les permissions pour créer du contenu
 */
export function canCreateContent(role: UserRole): boolean {
  return [UserRole.ADMIN, UserRole.MANAGER].includes(role)
}

/**
 * Vérifie si l'utilisateur peut modifier du contenu
 */
export function canEditContent(role: UserRole, authorId?: string, userId?: string): boolean {
  // Admin et Manager peuvent toujours modifier
  if ([UserRole.ADMIN, UserRole.MANAGER].includes(role)) {
    return true
  }
  
  // Staff peut modifier ses propres articles
  if (role === UserRole.STAFF && authorId && userId && authorId === userId) {
    return true
  }
  
  return false
}

/**
 * Vérifie si l'utilisateur peut supprimer du contenu
 */
export function canDeleteContent(role: UserRole, authorId?: string, userId?: string): boolean {
  // Seul l'admin peut supprimer
  if (role === UserRole.ADMIN) {
    return true
  }
  
  // Manager peut supprimer ses propres contenus
  if (role === UserRole.MANAGER && authorId && userId && authorId === userId) {
    return true
  }
  
  return false
}

/**
 * Vérifie si l'utilisateur peut publier du contenu
 */
export function canPublishContent(role: UserRole): boolean {
  return [UserRole.ADMIN, UserRole.MANAGER].includes(role)
}

/**
 * Vérifie si l'utilisateur peut gérer les catégories
 */
export function canManageCategories(role: UserRole): boolean {
  return [UserRole.ADMIN, UserRole.MANAGER].includes(role)
}

/**
 * Vérifie si l'utilisateur peut modérer les commentaires
 */
export function canModerateComments(role: UserRole): boolean {
  return [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF].includes(role)
}

/**
 * Vérifie si l'utilisateur peut voir du contenu non publié
 */
export function canViewDrafts(role: UserRole, authorId?: string, userId?: string): boolean {
  // Admin et Manager peuvent voir tous les brouillons
  if ([UserRole.ADMIN, UserRole.MANAGER].includes(role)) {
    return true
  }
  
  // Staff peut voir ses propres brouillons
  if (role === UserRole.STAFF && authorId && userId && authorId === userId) {
    return true
  }
  
  return false
}

/**
 * Middleware d'autorisation pour les opérations sur les articles
 */
export async function requireArticlePermission(
  request: NextRequest,
  action: 'create' | 'edit' | 'delete' | 'publish' | 'view_draft',
  articleAuthorId?: string
): Promise<{ success: true; context: RequestContext } | { success: false; error: string; status: number }> {
  const authResult = await requireAuth(request)
  
  if (!authResult.success) {
    return authResult
  }

  const { context } = authResult
  const { user } = context
  
  // Vérifier les permissions selon l'action
  let hasPermission = false
  
  switch (action) {
    case 'create':
      hasPermission = canCreateContent(user.role)
      break
      
    case 'edit':
      hasPermission = canEditContent(user.role, articleAuthorId, user.id)
      break
      
    case 'delete':
      hasPermission = canDeleteContent(user.role, articleAuthorId, user.id)
      break
      
    case 'publish':
      hasPermission = canPublishContent(user.role)
      break
      
    case 'view_draft':
      hasPermission = canViewDrafts(user.role, articleAuthorId, user.id)
      break
  }

  if (!hasPermission) {
    await logSecurityEvent({
      userId: user.id,
      action: 'UNAUTHORIZED_BLOG_ACTION',
      resource: 'article',
      ip: context.ip,
      userAgent: context.userAgent,
      success: false,
      details: { 
        action,
        role: user.role,
        articleAuthorId 
      },
    })
    
    return {
      success: false,
      error: 'Permissions insuffisantes pour cette action',
      status: 403
    }
  }

  // Marquer si l'utilisateur est propriétaire de la ressource
  context.isOwner = articleAuthorId === user.id

  return { success: true, context }
}

/**
 * Middleware d'autorisation pour les opérations sur les catégories
 */
export async function requireCategoryPermission(
  request: NextRequest,
  action: 'create' | 'edit' | 'delete'
): Promise<{ success: true; context: RequestContext } | { success: false; error: string; status: number }> {
  const authResult = await requireAuth(request)
  
  if (!authResult.success) {
    return authResult
  }

  const { context } = authResult
  const { user } = context
  
  if (!canManageCategories(user.role)) {
    await logSecurityEvent({
      userId: user.id,
      action: 'UNAUTHORIZED_CATEGORY_ACTION',
      resource: 'category',
      ip: context.ip,
      userAgent: context.userAgent,
      success: false,
      details: { 
        action,
        role: user.role 
      },
    })
    
    return {
      success: false,
      error: 'Permissions insuffisantes pour gérer les catégories',
      status: 403
    }
  }

  return { success: true, context }
}

/**
 * Middleware d'autorisation pour les opérations sur les commentaires
 */
export async function requireCommentPermission(
  request: NextRequest,
  action: 'create' | 'edit' | 'delete' | 'moderate',
  commentAuthorId?: string
): Promise<{ success: true; context: RequestContext } | { success: false; error: string; status: number }> {
  const authResult = await requireAuth(request)
  
  if (!authResult.success) {
    return authResult
  }

  const { context } = authResult
  const { user } = context
  
  let hasPermission = false
  
  switch (action) {
    case 'create':
      // Tous les utilisateurs authentifiés peuvent commenter
      hasPermission = true
      break
      
    case 'edit':
    case 'delete':
      // Seul l'auteur ou les modérateurs peuvent éditer/supprimer
      hasPermission = commentAuthorId === user.id || canModerateComments(user.role)
      break
      
    case 'moderate':
      hasPermission = canModerateComments(user.role)
      break
  }

  if (!hasPermission) {
    await logSecurityEvent({
      userId: user.id,
      action: 'UNAUTHORIZED_COMMENT_ACTION',
      resource: 'comment',
      ip: context.ip,
      userAgent: context.userAgent,
      success: false,
      details: { 
        action,
        role: user.role,
        commentAuthorId 
      },
    })
    
    return {
      success: false,
      error: 'Permissions insuffisantes pour cette action sur le commentaire',
      status: 403
    }
  }

  // Marquer si l'utilisateur est propriétaire de la ressource
  context.isOwner = commentAuthorId === user.id

  return { success: true, context }
}

/**
 * Utilitaire pour vérifier la propriété d'une ressource
 */
export async function checkResourceOwnership(
  resourceType: 'article' | 'comment',
  resourceId: string,
  userId: string
): Promise<boolean> {
  try {
    await dbConnect()
    
    switch (resourceType) {
      case 'article': {
        const Article = (await import('@/lib/models/Article')).default
        const article = await Article.findById(resourceId, 'author')
        return article?.author?.toString() === userId
      }
      case 'comment': {
        // Uncomment when Comment model is available
        // const Comment = (await import('@/lib/models/Comment')).default
        // const comment = await Comment.findById(resourceId, 'author')
        // return comment?.author?.toString() === userId
        return false
      }
      default:
        return false
    }
    
  } catch (error) {
    console.error('Erreur lors de la vérification de propriété:', error)
    return false
  }
}

/**
 * Utilitaire pour log des actions sur le blog
 */
export async function logBlogAction(
  context: RequestContext,
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    userId: context.user.id,
    action: `BLOG_${action.toUpperCase()}`,
    resource,
    ip: context.ip,
    userAgent: context.userAgent,
    success: true,
    details: {
      resourceId,
      role: context.user.role,
      ...details,
    },
  })
}

/**
 * Utilitaire pour créer une réponse d'erreur standardisée
 */
export function createErrorResponse(
  message: string,
  status: number,
  code?: string,
  details?: any
) {
  return Response.json(
    {
      success: false,
      error: message,
      code,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Utilitaire pour créer une réponse de succès standardisée
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: any
) {
  return Response.json({
    success: true,
    data,
    message,
    meta,
    timestamp: new Date().toISOString(),
  })
}