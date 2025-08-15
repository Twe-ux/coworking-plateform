/**
 * Types TypeScript pour l'interface publique du blog
 */

import { ObjectId } from 'mongodb'

// Types de base pour le blog public
export interface Author {
  _id: string
  firstName: string
  lastName: string
  email: string
  image?: string
  bio?: string
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  color: string
  icon?: string
  parentCategory?: Category
  subCategoriesCount?: number
  hasSubCategories?: boolean
  stats?: {
    articleCount: number
    lastArticleAt?: Date
  }
}

export interface ArticleStats {
  views: number
  comments: number
  likes?: number
  shares?: number
  lastViewed?: Date
}

export interface SEOMetadata {
  title?: string
  description?: string
  keywords?: string[]
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  canonicalUrl?: string
  robots?: string
}

export interface Article {
  _id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  gallery?: string[]
  status: 'draft' | 'published' | 'archived'
  contentType: 'article' | 'news' | 'tutorial' | 'announcement'
  category: Category
  author: Author
  tags: string[]
  featured: boolean
  allowComments: boolean
  stats: ArticleStats
  seoMetadata?: SEOMetadata
  createdAt: Date
  publishedAt?: Date
  scheduledPublishAt?: Date
  expiresAt?: Date
  lastEditedBy?: Author
  updatedAt: Date
}

export interface Comment {
  _id: string
  content: string
  article: string | Article
  parentComment?: string | Comment
  author?: Author
  authorName: string
  authorEmail: string
  authorWebsite?: string
  authorAvatar?: string
  ipAddress?: string
  userAgent?: string
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  isVerified: boolean
  moderatedBy?: Author
  moderatedAt?: Date
  moderationNote?: string
  replies?: Comment[]
  repliesCount?: number
  createdAt: Date
  updatedAt: Date
}

// Types pour les réponses API
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface APIResponse<T> {
  success: boolean
  data: T
  message?: string
  meta?: PaginationMeta & Record<string, any>
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface ArticlesResponse {
  articles: Article[]
  meta: PaginationMeta & {
    filters?: ArticleFilters
  }
}

export interface CategoriesResponse {
  categories: Category[]
  meta: {
    type: 'simple' | 'detailed' | 'tree'
    total?: number
    filters?: CategoryFilters
  }
}

export interface CommentsResponse {
  comments: Comment[]
  meta: PaginationMeta & {
    stats: {
      approved: number
      pending: number
      rejected: number
      spam: number
      total: number
    }
    filters?: CommentFilters
  }
}

export interface SingleArticleResponse extends Article {
  relatedArticles: Array<{
    _id: string
    title: string
    slug: string
    excerpt: string
    coverImage?: string
    publishedAt: Date
    stats: { views: number }
    category: Category
    author: Author
    relationType: 'sameCategory' | 'sameAuthor' | 'sameTags'
  }>
  navigation: {
    prev?: {
      _id: string
      title: string
      slug: string
      coverImage?: string
    }
    next?: {
      _id: string
      title: string
      slug: string
      coverImage?: string
    }
  }
}

// Types pour les filtres et paramètres de recherche
export interface ArticleFilters {
  status?: 'draft' | 'published' | 'archived'
  contentType?: 'article' | 'news' | 'tutorial' | 'announcement'
  categoryId?: string
  authorId?: string
  featured?: boolean
  tags?: string[]
  search?: string
  startDate?: Date
  endDate?: Date
}

export interface CategoryFilters {
  isActive?: boolean
  parentCategoryId?: string
  search?: string
}

export interface CommentFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'spam'
  articleId?: string
  authorId?: string
  authorEmail?: string
  parentCommentId?: string
  search?: string
  startDate?: Date
  endDate?: Date
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder: 'asc' | 'desc'
}

// Types pour les formulaires
export interface CommentFormData {
  content: string
  authorName: string
  authorEmail: string
  authorWebsite?: string
  parentCommentId?: string
}

export interface SearchParams {
  query: string
  categories?: string[]
  contentTypes?: string[]
  sortBy?: 'relevance' | 'date' | 'popularity'
  dateRange?: 'day' | 'week' | 'month' | 'year' | 'all'
}

// Types pour la navigation et les widgets
export interface BlogNavigation {
  categories: Category[]
  featuredArticles: Article[]
  recentArticles: Article[]
  popularTags: Array<{
    name: string
    count: number
  }>
}

export interface BlogStats {
  totalArticles: number
  totalCategories: number
  totalComments: number
  totalViews: number
  publishedThisMonth: number
  averageViewsPerArticle: number
}

// Types pour les hooks et utilitaires
export interface UseArticlesOptions {
  filters?: Partial<ArticleFilters>
  pagination?: Partial<PaginationParams>
  enabled?: boolean
}

export interface UseCategoriesOptions {
  filters?: Partial<CategoryFilters>
  includeStats?: boolean
  tree?: boolean
  enabled?: boolean
}

export interface UseCommentsOptions {
  articleId: string
  filters?: Partial<CommentFilters>
  pagination?: Partial<PaginationParams>
  enabled?: boolean
}

// Types pour la recherche avancée
export interface SearchResult {
  type: 'article' | 'category'
  id: string
  title: string
  slug: string
  excerpt?: string
  category?: string
  tags?: string[]
  publishedAt?: Date
  score: number
}

export interface SearchResponse {
  results: SearchResult[]
  suggestions: string[]
  meta: {
    query: string
    total: number
    took: number
    maxScore: number
  }
}

// Types pour les breadcrumbs
export interface BreadcrumbItem {
  label: string
  href: string
  current?: boolean
}

// Types pour le MDX et le rendu de contenu
export interface MDXComponents {
  [key: string]: React.ComponentType<any>
}

export interface ContentRenderer {
  type: 'html' | 'markdown' | 'mdx'
  content: string
  components?: MDXComponents
}

// Types pour l'optimisation des images
export interface OptimizedImage {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

// Types pour les métriques et analytics
export interface ArticleMetrics {
  articleId: string
  views: number
  uniqueViews: number
  averageTimeOnPage: number
  bounceRate: number
  shareCount: number
  commentCount: number
  lastViewed: Date
}

export interface BlogMetrics {
  totalViews: number
  uniqueVisitors: number
  topArticles: Array<{
    articleId: string
    title: string
    views: number
  }>
  topCategories: Array<{
    categoryId: string
    name: string
    views: number
  }>
  topReferrers: Array<{
    domain: string
    count: number
  }>
  searchTerms: Array<{
    term: string
    count: number
  }>
}