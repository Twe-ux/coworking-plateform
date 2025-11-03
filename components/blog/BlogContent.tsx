/**
 * Composant principal de contenu du blog
 * Gère l'affichage des articles avec filtres, recherche et pagination
 */

'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Filter, Grid, List, SortDesc, SortAsc } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArticleCard } from './ArticleCard'
import { BlogPagination } from './BlogPagination'
import { BlogFilters } from './BlogFilters'
import { useArticles, useCategories } from '@/hooks/use-blog'
import type { ArticleFilters, PaginationParams } from '@/types/blog'

interface BlogContentProps {
  searchParams: {
    page?: string
    search?: string
    category?: string
    tags?: string
    contentType?: string
    featured?: string
    author?: string
    sortBy?: string
    sortOrder?: string
  }
}

export function BlogContent({ searchParams }: BlogContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  
  // Parse des paramètres de recherche
  const filters: ArticleFilters = useMemo(() => ({
    status: 'published', // Toujours publié pour l'interface publique
    search: searchParams.search,
    categoryId: searchParams.category,
    tags: searchParams.tags?.split(',').filter(Boolean),
    contentType: searchParams.contentType as any,
    featured: searchParams.featured === 'true' ? true : undefined,
    authorId: searchParams.author,
  }), [searchParams])
  
  const pagination: PaginationParams = useMemo(() => ({
    page: parseInt(searchParams.page || '1', 10),
    limit: 12,
    sortBy: searchParams.sortBy || 'publishedAt',
    sortOrder: (searchParams.sortOrder as 'asc' | 'desc') || 'desc',
  }), [searchParams])
  
  // Récupération des données
  const { articles, meta, isLoading, error } = useArticles({
    filters,
    pagination,
  })

  const { categories } = useCategories({
    filters: { isActive: true },
    includeStats: true,
  })

  // Debug: vérifier les données reçues
  console.log('📰 Articles reçus:', articles)
  console.log('📊 Meta:', meta)
  
  // Articles à la une pour la première page
  const featuredArticles = useMemo(() => {
    if (pagination.page === 1 && !filters.search && !filters.categoryId && !filters.featured) {
      return articles.filter((article: any) => article.featured).slice(0, 2)
    }
    return []
  }, [articles, pagination.page, filters])
  
  const regularArticles = useMemo(() => {
    if (featuredArticles.length > 0) {
      return articles.filter((article: any) => !featuredArticles.some((featured: any) => (featured.id || featured._id) === (article.id || article._id)))
    }
    return articles
  }, [articles, featuredArticles])
  
  // Gestion des erreurs
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <p className="text-lg font-semibold">Erreur de chargement</p>
          <p className="text-sm">{error.message}</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    )
  }
  
  // Nombre total de résultats
  const totalResults = meta?.total || 0
  const hasResults = totalResults > 0
  const isFiltered = !!(filters.search || filters.categoryId || filters.tags?.length || filters.contentType || filters.featured || filters.authorId)
  
  return (
    <div className="space-y-6">
      {/* En-tête avec titre et compteur */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {filters.search ? `Recherche : "${filters.search}"` : 
             filters.categoryId ? 'Articles par catégorie' :
             filters.featured ? 'Articles à la une' :
             'Tous les articles'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? 'Chargement...' : 
             hasResults ? `${totalResults} article${totalResults > 1 ? 's' : ''} trouvé${totalResults > 1 ? 's' : ''}` :
             'Aucun article trouvé'}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Bouton filtres */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          
          {/* Sélecteur de tri */}
          <Select
            value={`${pagination.sortBy}-${pagination.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-')
              const params = new URLSearchParams(window.location.search)
              params.set('sortBy', sortBy)
              params.set('sortOrder', sortOrder)
              window.history.pushState({}, '', `${window.location.pathname}?${params}`)
              window.location.reload()
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publishedAt-desc">Plus récent</SelectItem>
              <SelectItem value="publishedAt-asc">Plus ancien</SelectItem>
              <SelectItem value="stats.views-desc">Plus populaire</SelectItem>
              <SelectItem value="title-asc">Titre A-Z</SelectItem>
              <SelectItem value="title-desc">Titre Z-A</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Boutons de vue */}
          <div className="hidden sm:flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Filtres actifs */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Filtres actifs:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Recherche: "{filters.search}"
              <button
                onClick={() => {
                  const params = new URLSearchParams(window.location.search)
                  params.delete('search')
                  window.history.pushState({}, '', `${window.location.pathname}?${params}`)
                  window.location.reload()
                }}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
          
          {filters.categoryId && (
            <Badge variant="secondary" className="gap-1">
              Catégorie
              <button
                onClick={() => {
                  const params = new URLSearchParams(window.location.search)
                  params.delete('category')
                  window.history.pushState({}, '', `${window.location.pathname}?${params}`)
                  window.location.reload()
                }}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
          
          {filters.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              #{tag}
              <button
                onClick={() => {
                  const params = new URLSearchParams(window.location.search)
                  const currentTags = params.get('tags')?.split(',').filter(t => t !== tag) || []
                  if (currentTags.length > 0) {
                    params.set('tags', currentTags.join(','))
                  } else {
                    params.delete('tags')
                  }
                  window.history.pushState({}, '', `${window.location.pathname}?${params}`)
                  window.location.reload()
                }}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
          
          {filters.featured && (
            <Badge variant="secondary" className="gap-1">
              À la une
              <button
                onClick={() => {
                  const params = new URLSearchParams(window.location.search)
                  params.delete('featured')
                  window.history.pushState({}, '', `${window.location.pathname}?${params}`)
                  window.location.reload()
                }}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
          
          <Separator orientation="vertical" className="h-4" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.history.pushState({}, '', '/blog')
              window.location.reload()
            }}
          >
            Effacer tout
          </Button>
        </div>
      )}
      
      {/* Filtres détaillés (mobile) */}
      {showFilters && (
        <div className="sm:hidden">
          <BlogFilters categories={categories} />
        </div>
      )}
      
      {/* Contenu */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="bg-muted h-48 rounded-lg mb-4" />
                <div className="bg-muted h-4 rounded w-3/4 mb-2" />
                <div className="bg-muted h-4 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ) : !hasResults ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground mb-4">
            {isFiltered ? 'Aucun article ne correspond à vos critères' : 'Aucun article publié'}
          </p>
          {isFiltered && (
            <Button
              variant="outline"
              onClick={() => {
                window.history.pushState({}, '', '/blog')
                window.location.reload()
              }}
            >
              Voir tous les articles
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Articles à la une */}
          {featuredArticles.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-semibold">À la une</h2>
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                  Éditeur
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {featuredArticles.map((article: any) => (
                  <ArticleCard
                    key={article.id || article._id}
                    article={article}
                    variant="featured"
                    showAuthor={true}
                    showStats={true}
                    showExcerpt={true}
                  />
                ))}
              </div>
              
              {regularArticles.length > 0 && <Separator className="my-8" />}
            </section>
          )}
          
          {/* Articles réguliers */}
          {regularArticles.length > 0 && (
            <section>
              {featuredArticles.length > 0 && (
                <h2 className="text-xl font-semibold mb-6">Derniers articles</h2>
              )}
              
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-6'
              }>
                {regularArticles.map((article: any) => (
                  <ArticleCard
                    key={article.id || article._id}
                    article={article}
                    variant={viewMode === 'list' ? 'featured' : 'default'}
                    showAuthor={true}
                    showStats={true}
                    showExcerpt={true}
                  />
                ))}
              </div>
            </section>
          )}
          
          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center mt-12">
              <BlogPagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                hasNext={meta.hasNext}
                hasPrev={meta.hasPrev}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
