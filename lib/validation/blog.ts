/**
 * Schémas de validation Zod pour les API Blog
 * Validation des entrées pour Articles, Categories et Comments
 */

import { z } from 'zod'

// Types de base
export const ArticleStatusSchema = z.enum(['draft', 'published', 'archived'])
export const ContentTypeSchema = z.enum(['article', 'news', 'tutorial', 'announcement'])
export const CommentStatusSchema = z.enum(['pending', 'approved', 'rejected', 'spam'])
export const CommentTypeSchema = z.enum(['comment', 'reply'])

// Schémas de métadonnées SEO
export const SEOMetadataSchema = z.object({
  title: z.string().max(60, 'Le titre SEO ne peut dépasser 60 caractères').optional(),
  description: z.string().max(160, 'La description SEO ne peut dépasser 160 caractères').optional(),
  keywords: z.array(z.string().max(50, 'Un mot-clé ne peut dépasser 50 caractères')).optional(),
  ogTitle: z.string().max(60, 'Le titre Open Graph ne peut dépasser 60 caractères').optional(),
  ogDescription: z.string().max(160, 'La description Open Graph ne peut dépasser 160 caractères').optional(),
  ogImage: z.string().url('Format d\'image Open Graph invalide').optional(),
  twitterTitle: z.string().max(70, 'Le titre Twitter ne peut dépasser 70 caractères').optional(),
  twitterDescription: z.string().max(200, 'La description Twitter ne peut dépasser 200 caractères').optional(),
  twitterImage: z.string().url('Format d\'image Twitter invalide').optional(),
  canonicalUrl: z.string().url('Format d\'URL canonique invalide').optional(),
  robots: z.string().default('index,follow').optional(),
})

// Schémas pour Articles
export const CreateArticleSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(200, 'Le titre ne peut dépasser 200 caractères')
    .trim(),
  slug: z
    .union([
      z.string()
        .min(3, 'Le slug doit contenir au moins 3 caractères')
        .max(100, 'Le slug ne peut dépasser 100 caractères')
        .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'),
      z.string().length(0), // Allow empty string for auto-generation
      z.undefined(),
    ])
    .optional(),
  excerpt: z
    .string()
    .min(10, 'L\'extrait doit contenir au moins 10 caractères')
    .max(500, 'L\'extrait ne peut dépasser 500 caractères')
    .trim(),
  content: z
    .string()
    .min(50, 'Le contenu doit contenir au moins 50 caractères'),
  coverImage: z
    .union([
      z.string().url('Format d\'image de couverture invalide'),
      z.string().length(0), // Allow empty string
      z.undefined(),
    ])
    .optional(),
  gallery: z
    .array(z.string().url('Format d\'image invalide'))
    .max(10, 'Maximum 10 images dans la galerie')
    .optional(),
  status: ArticleStatusSchema.default('draft'),
  contentType: ContentTypeSchema.default('article'),
  categoryId: z
    .string()
    .min(1, 'Une catégorie est requise')
    .regex(/^[a-f\d]{24}$/i, 'ID de catégorie invalide'),
  tags: z
    .array(
      z.string()
        .min(2, 'Un tag doit contenir au moins 2 caractères')
        .max(50, 'Un tag ne peut dépasser 50 caractères')
        .regex(/^[a-zA-Z0-9\s\-àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ]+$/, 'Format de tag invalide')
        .transform(tag => tag.toLowerCase().trim())
    )
    .max(20, 'Maximum 20 tags par article')
    .default([])
    .optional(),
  featured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  seoMetadata: SEOMetadataSchema.optional(),
  scheduledPublishAt: z
    .union([
      z.string().datetime('Format de date invalide').transform(date => new Date(date)),
      z.string().length(0).transform(() => undefined),
      z.undefined(),
    ])
    .optional(),
  expiresAt: z
    .union([
      z.string().datetime('Format de date invalide').transform(date => new Date(date)),
      z.string().length(0).transform(() => undefined),
      z.undefined(),
    ])
    .optional()
})

export const UpdateArticleSchema = CreateArticleSchema.partial().omit({
  categoryId: true
}).extend({
  categoryId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'ID de catégorie invalide')
    .optional(),
})

export const PublishArticleSchema = z.object({
  action: z.enum(['publish', 'unpublish']),
  scheduledPublishAt: z
    .string()
    .datetime('Format de date invalide')
    .transform(date => new Date(date))
    .optional(),
})

// Schémas pour Categories
export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut dépasser 100 caractères')
    .trim(),
  slug: z
    .string()
    .min(2, 'Le slug doit contenir au moins 2 caractères')
    .max(50, 'Le slug ne peut dépasser 50 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets')
    .optional(), // Auto-généré si non fourni
  description: z
    .string()
    .max(500, 'La description ne peut dépasser 500 caractères')
    .trim()
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'La couleur doit être au format hexadécimal (#RRGGBB)')
    .default('#3B82F6'),
  icon: z
    .string()
    .max(50, 'Le nom de l\'icône ne peut dépasser 50 caractères')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Le nom de l\'icône ne peut contenir que des lettres, chiffres, tirets et underscores')
    .optional(),
  parentCategoryId: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().min(0, 'L\'ordre de tri ne peut être négatif').default(0),
  seoMetadata: SEOMetadataSchema.optional(),
})

export const UpdateCategorySchema = CreateCategorySchema.partial()

// Schémas pour Comments
export const CreateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Le commentaire ne peut être vide')
    .max(2000, 'Le commentaire ne peut dépasser 2000 caractères')
    .trim(),
  articleId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'ID d\'article invalide'),
  parentCommentId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'ID de commentaire parent invalide')
    .optional(),
  authorName: z
    .string()
    .min(1, 'Le nom de l\'auteur ne peut être vide')
    .max(100, 'Le nom ne peut dépasser 100 caractères')
    .trim(),
  authorEmail: z
    .string()
    .email('Format d\'adresse email invalide')
    .max(254, 'L\'email ne peut dépasser 254 caractères')
    .transform(email => email.toLowerCase().trim()),
  authorWebsite: z
    .string()
    .url('Format d\'URL invalide')
    .optional(),
})

export const UpdateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Le commentaire ne peut être vide')
    .max(2000, 'Le commentaire ne peut dépasser 2000 caractères')
    .trim(),
})

export const ModerateCommentSchema = z.object({
  action: z.enum(['approve', 'reject', 'spam']),
  note: z
    .string()
    .max(500, 'La note de modération ne peut dépasser 500 caractères')
    .trim()
    .optional(),
})

export const ReportCommentSchema = z.object({
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'fake', 'other']),
  details: z
    .string()
    .max(500, 'Les détails ne peuvent dépasser 500 caractères')
    .trim()
    .optional(),
})

// Schémas pour les paramètres de requête
export const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(page => Math.max(1, parseInt(page || '1', 10))),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform(limit => Math.min(100, Math.max(1, parseInt(limit || '20', 10)))),
  sortBy: z
    .string()
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Champ de tri invalide')
    .optional(),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
})

export const ArticleFiltersSchema = z.object({
  status: ArticleStatusSchema.optional(),
  contentType: ContentTypeSchema.optional(),
  categoryId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'ID de catégorie invalide')
    .optional(),
  authorId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'ID d\'auteur invalide')
    .optional(),
  featured: z
    .string()
    .regex(/^(true|false)$/, 'Valeur featured invalide')
    .transform(featured => featured === 'true')
    .optional(),
  tags: z
    .string()
    .transform(tags => tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean))
    .optional(),
  search: z
    .string()
    .min(2, 'Le terme de recherche doit contenir au moins 2 caractères')
    .max(100, 'Le terme de recherche ne peut dépasser 100 caractères')
    .trim()
    .optional(),
  startDate: z
    .string()
    .datetime('Format de date invalide')
    .transform(date => new Date(date))
    .optional(),
  endDate: z
    .string()
    .datetime('Format de date invalide')
    .transform(date => new Date(date))
    .optional(),
})

export const CategoryFiltersSchema = z.object({
  isActive: z
    .string()
    .regex(/^(true|false)$/, 'Valeur isActive invalide')
    .transform(active => active === 'true')
    .optional(),
  parentCategoryId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'ID de catégorie parent invalide')
    .optional(),
  search: z
    .string()
    .min(2, 'Le terme de recherche doit contenir au moins 2 caractères')
    .max(100, 'Le terme de recherche ne peut dépasser 100 caractères')
    .trim()
    .optional(),
})

export const CommentFiltersSchema = z.object({
  status: CommentStatusSchema.optional(),
  articleId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'ID d\'article invalide')
    .optional(),
  authorId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'ID d\'auteur invalide')
    .optional(),
  authorEmail: z
    .string()
    .email('Format d\'adresse email invalide')
    .transform(email => email.toLowerCase().trim())
    .optional(),
  parentCommentId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'ID de commentaire parent invalide')
    .optional(),
  search: z
    .string()
    .min(2, 'Le terme de recherche doit contenir au moins 2 caractères')
    .max(100, 'Le terme de recherche ne peut dépasser 100 caractères')
    .trim()
    .optional(),
  startDate: z
    .string()
    .datetime('Format de date invalide')
    .transform(date => new Date(date))
    .optional(),
  endDate: z
    .string()
    .datetime('Format de date invalide')
    .transform(date => new Date(date))
    .optional(),
})

// Types dérivés des schémas
export type CreateArticleInput = z.infer<typeof CreateArticleSchema>
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>
export type PublishArticleInput = z.infer<typeof PublishArticleSchema>
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>
export type ModerateCommentInput = z.infer<typeof ModerateCommentSchema>
export type ReportCommentInput = z.infer<typeof ReportCommentSchema>
export type PaginationParams = z.infer<typeof PaginationSchema>
export type ArticleFilters = z.infer<typeof ArticleFiltersSchema>
export type CategoryFilters = z.infer<typeof CategoryFiltersSchema>
export type CommentFilters = z.infer<typeof CommentFiltersSchema>

/**
 * Valide et parse les paramètres de requête avec gestion d'erreur
 */
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  params: Record<string, string | string[] | undefined>
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    // Convertir les paramètres en format string simple
    const cleanParams: Record<string, string> = {}
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          cleanParams[key] = value[0] || ''
        } else {
          cleanParams[key] = value
        }
      }
    }

    const result = schema.parse(cleanParams)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      )
      return { success: false, errors }
    }
    return { success: false, errors: ['Erreur de validation inconnue'] }
  }
}

/**
 * Valide les données du body avec gestion d'erreur
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(body)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      )
      return { success: false, errors }
    }
    return { success: false, errors: ['Erreur de validation inconnue'] }
  }
}

/**
 * Génère automatiquement un slug à partir du titre
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garde seulement lettres, chiffres, espaces et tirets
    .replace(/\s+/g, '-') // Remplace espaces par tirets
    .replace(/-+/g, '-') // Évite tirets multiples
    .trim()
    .substring(0, 100) // Limite la longueur
}

/**
 * Valide un ObjectId MongoDB
 */
export function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id)
}