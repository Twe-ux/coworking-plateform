/**
 * Hooks pour l'interface publique du blog
 * Gestion des requêtes API avec SWR pour le cache et l'optimisation
 */

'use client'

import useSWR from 'swr'
import { useState, useCallback, useMemo } from 'react'
import type {
  Article,
  Category,
  Comment,
  SingleArticleResponse,
  ArticlesResponse,
  CategoriesResponse,
  CommentsResponse,
  SearchResponse,
  BlogNavigation,
  UseArticlesOptions,
  UseCategoriesOptions,
  UseCommentsOptions,
  ArticleFilters,
  CategoryFilters,
  CommentFilters,
  PaginationParams,
  SearchParams,
  CommentFormData,
} from '@/types/blog'

// Configuration SWR par défaut
const defaultConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 30000, // 30 secondes
}

// Fetcher générique pour les API calls
const fetcher = async (url: string) => {
  const response = await fetch(url)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erreur de requête' }))
    throw new Error(error.message || 'Erreur de requête')
  }
  
  return response.json()
}

/**
 * Hook pour récupérer la liste des articles avec filtres et pagination
 */
export function useArticles(options: UseArticlesOptions = {}) {
  const { filters = {}, pagination = {}, enabled = true } = options
  
  // Construction des paramètres URL
  const searchParams = useMemo(() => {
    const params = new URLSearchParams()
    
    // Pagination
    if (pagination.page) params.set('page', String(pagination.page))
    if (pagination.limit) params.set('limit', String(pagination.limit))
    if (pagination.sortBy) params.set('sortBy', pagination.sortBy)
    if (pagination.sortOrder) params.set('sortOrder', pagination.sortOrder)
    
    // Filtres
    if (filters.status) params.set('status', filters.status)
    if (filters.contentType) params.set('contentType', filters.contentType)
    if (filters.categoryId) params.set('categoryId', filters.categoryId)
    if (filters.authorId) params.set('authorId', filters.authorId)
    if (filters.featured !== undefined) params.set('featured', String(filters.featured))
    if (filters.tags?.length) params.set('tags', filters.tags.join(','))
    if (filters.search) params.set('search', filters.search)
    if (filters.startDate) params.set('startDate', filters.startDate.toISOString())
    if (filters.endDate) params.set('endDate', filters.endDate.toISOString())
    
    return params.toString()
  }, [filters, pagination])
  
  const url = `/api/articles${searchParams ? `?${searchParams}` : ''}`
  
  const { data, error, isLoading, mutate } = useSWR<ArticlesResponse>(
    enabled ? url : null,
    fetcher,
    defaultConfig
  )
  
  return {
    articles: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Hook pour récupérer un article spécifique par slug
 */
export function useArticle(slug: string, enabled = true) {
  const url = `/api/articles/${slug}`
  
  const { data, error, isLoading, mutate } = useSWR<SingleArticleResponse>(
    enabled && slug ? url : null,
    fetcher,
    {
      ...defaultConfig,
      revalidateOnFocus: true, // Revalider quand on revient sur la page
    }
  )
  
  return {
    article: data?.data,
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Hook pour récupérer la liste des catégories
 */
export function useCategories(options: UseCategoriesOptions = {}) {
  const { filters = {}, includeStats = false, tree = false, enabled = true } = options
  
  const searchParams = useMemo(() => {
    const params = new URLSearchParams()
    
    if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive))
    if (filters.parentCategoryId) params.set('parentCategoryId', filters.parentCategoryId)
    if (filters.search) params.set('search', filters.search)
    if (includeStats) params.set('stats', 'true')
    if (tree) params.set('tree', 'true')
    
    return params.toString()
  }, [filters, includeStats, tree])
  
  const url = `/api/categories${searchParams ? `?${searchParams}` : ''}`
  
  const { data, error, isLoading, mutate } = useSWR<CategoriesResponse>(
    enabled ? url : null,
    fetcher,
    defaultConfig
  )
  
  return {
    categories: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Hook pour récupérer les commentaires d'un article
 */
export function useComments(options: UseCommentsOptions) {
  const { articleId, filters = {}, pagination = {}, enabled = true } = options
  
  const searchParams = useMemo(() => {
    const params = new URLSearchParams()
    
    // Pagination
    if (pagination.page) params.set('page', String(pagination.page))
    if (pagination.limit) params.set('limit', String(pagination.limit))
    if (pagination.sortBy) params.set('sortBy', pagination.sortBy)
    if (pagination.sortOrder) params.set('sortOrder', pagination.sortOrder)
    
    // Filtres spécifiques aux commentaires publics
    params.set('articleId', articleId)
    params.set('status', 'approved') // Seulement les commentaires approuvés
    if (filters.parentCommentId) params.set('parentCommentId', filters.parentCommentId)
    if (filters.search) params.set('search', filters.search)
    
    return params.toString()
  }, [articleId, filters, pagination])
  
  const url = `/api/comments${searchParams ? `?${searchParams}` : ''}`
  
  const { data, error, isLoading, mutate } = useSWR<CommentsResponse>(
    enabled && articleId ? url : null,
    fetcher,
    defaultConfig
  )
  
  return {
    comments: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Hook pour la recherche dans le blog
 */
export function useSearch(searchParams: SearchParams, enabled = true) {
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    
    if (searchParams.query) params.set('query', searchParams.query)
    if (searchParams.categories?.length) params.set('categories', searchParams.categories.join(','))
    if (searchParams.contentTypes?.length) params.set('contentTypes', searchParams.contentTypes.join(','))
    if (searchParams.sortBy) params.set('sortBy', searchParams.sortBy)
    if (searchParams.dateRange) params.set('dateRange', searchParams.dateRange)
    
    return params.toString()
  }, [searchParams])
  
  const url = `/api/search${queryParams ? `?${queryParams}` : ''}`
  
  const { data, error, isLoading } = useSWR<SearchResponse>(
    enabled && searchParams.query ? url : null,
    fetcher,
    {
      ...defaultConfig,
      dedupingInterval: 5000, // 5 secondes pour la recherche
    }
  )
  
  return {
    results: data?.data?.results || [],
    suggestions: data?.data?.suggestions || [],
    meta: data?.data?.meta,
    isLoading,
    error,
  }
}

/**
 * Hook pour récupérer les données de navigation du blog
 */
export function useBlogNavigation() {
  const { data, error, isLoading } = useSWR<BlogNavigation>(
    '/api/blog/navigation',
    fetcher,
    {
      ...defaultConfig,
      revalidateOnMount: true,
      refreshInterval: 300000, // 5 minutes
    }
  )
  
  return {
    navigation: data?.data,
    isLoading,
    error,
  }
}

/**
 * Hook pour poster un commentaire
 */
export function useCreateComment() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const createComment = useCallback(async (
    articleId: string,
    commentData: CommentFormData
  ) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          ...commentData,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de la création du commentaire')
      }
      
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [])
  
  return {
    createComment,
    isSubmitting,
    error,
  }
}

/**
 * Hook pour la pagination
 */
export function usePagination(totalPages: number, currentPage = 1) {
  const [page, setPage] = useState(currentPage)
  
  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }, [totalPages])
  
  const goToPrevious = useCallback(() => {
    goToPage(page - 1)
  }, [page, goToPage])
  
  const goToNext = useCallback(() => {
    goToPage(page + 1)
  }, [page, goToPage])
  
  const goToFirst = useCallback(() => {
    goToPage(1)
  }, [goToPage])
  
  const goToLast = useCallback(() => {
    goToPage(totalPages)
  }, [totalPages, goToPage])
  
  // Générer les numéros de page à afficher
  const getVisiblePages = useCallback((maxVisible = 7) => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, page - half)
    let end = Math.min(totalPages, start + maxVisible - 1)
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [page, totalPages])
  
  return {
    currentPage: page,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
    goToPage,
    goToPrevious,
    goToNext,
    goToFirst,
    goToLast,
    visiblePages: getVisiblePages(),
  }
}

/**
 * Hook pour la recherche avec debouncing
 */
export function useSearchDebounced(query: string, delay = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  
  useState(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, delay)
    
    return () => clearTimeout(timer)
  })
  
  return debouncedQuery
}

/**
 * Hook pour suivre les articles favoris (localStorage)
 */
export function useFavoriteArticles() {
  const [favorites, setFavorites] = useState<string[]>([])
  
  // Charger les favoris depuis localStorage
  useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('blog-favorites')
      if (stored) {
        try {
          setFavorites(JSON.parse(stored))
        } catch (error) {
          console.error('Erreur lors du chargement des favoris:', error)
        }
      }
    }
  })
  
  const addFavorite = useCallback((articleId: string) => {
    setFavorites(prev => {
      if (!prev.includes(articleId)) {
        const newFavorites = [...prev, articleId]
        localStorage.setItem('blog-favorites', JSON.stringify(newFavorites))
        return newFavorites
      }
      return prev
    })
  }, [])
  
  const removeFavorite = useCallback((articleId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.filter(id => id !== articleId)
      localStorage.setItem('blog-favorites', JSON.stringify(newFavorites))
      return newFavorites
    })
  }, [])
  
  const isFavorite = useCallback((articleId: string) => {
    return favorites.includes(articleId)
  }, [favorites])
  
  const toggleFavorite = useCallback((articleId: string) => {
    if (isFavorite(articleId)) {
      removeFavorite(articleId)
    } else {
      addFavorite(articleId)
    }
  }, [isFavorite, addFavorite, removeFavorite])
  
  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  }
}