/**
 * Composant de contenu pour une catégorie spécifique
 * Affiche les articles d'une catégorie avec filtres et sous-catégories
 */

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Filter, Grid, List, Users, Calendar, TrendingUp, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { ArticleCard } from './ArticleCard'
import { BlogPagination } from './BlogPagination'
import { BlogFilters } from './BlogFilters'
import { BlogSidebar } from './BlogSidebar'
import { useArticles, useCategories } from '@/hooks/use-blog'
import type { Category, ArticleFilters, PaginationParams } from '@/types/blog'

interface CategoryContentProps {
  category: Category
  searchParams: {
    page?: string
    search?: string
    tags?: string
    contentType?: string
    sortBy?: string
    sortOrder?: string
  }
}

export function CategoryContent({ category, searchParams }: CategoryContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  
  // Parse des paramètres de recherche pour cette catégorie
  const filters: ArticleFilters = useMemo(() => ({
    status: 'published',
    categoryId: category._id, // Filtrer par cette catégorie
    search: searchParams.search,
    tags: searchParams.tags?.split(',').filter(Boolean),
    contentType: searchParams.contentType as any,
  }), [category._id, searchParams])
  
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
  
  // Récupérer les sous-catégories
  const { categories: subCategories } = useCategories({
    filters: { 
      isActive: true,
      parentCategoryId: category._id 
    },
    includeStats: true,
  })
  
  // Récupérer toutes les catégories pour les filtres
  const { categories: allCategories } = useCategories({
    filters: { isActive: true },
    includeStats: true,
  })
  
  // Statistiques de la catégorie
  const categoryStats = {
    totalArticles: meta?.total || 0,
    articlesThisMonth: 0, // À calculer via API
    lastUpdate: category.stats?.lastArticleAt,
  }
  
  // Articles à la une dans cette catégorie
  const featuredArticles = useMemo(() => {
    return articles.filter((article: any) => article.featured).slice(0, 2)
  }, [articles])
  
  const regularArticles = useMemo(() => {
    return articles.filter((article: any) => !featuredArticles.some((featured: any) => featured._id === article._id))
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
  
  const hasResults = articles.length > 0
  const isFiltered = !!(filters.search || filters.tags?.length || filters.contentType)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Contenu principal */}
        <div className="flex-1">
          <div className="space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/blog/categories">Catégories</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbPage>{category.name}</BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>
            
            {/* En-tête de la catégorie */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {category.icon && (
                      <span className="text-2xl">{category.icon}</span>
                    )}
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                      {category.name}
                    </h1>
                  </div>
                  
                  {category.description && (
                    <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                      {category.description}
                    </p>
                  )}
                  
                  {/* Statistiques de la catégorie */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{categoryStats.totalArticles} article{categoryStats.totalArticles > 1 ? 's' : ''}</span>
                    </div>
                    
                    {categoryStats.lastUpdate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Mis à jour {new Date(categoryStats.lastUpdate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    
                    {category.hasSubCategories && (
                      <div className="flex items-center space-x-1">
                        <Tag className="h-4 w-4" />
                        <span>{category.subCategoriesCount} sous-catégorie{category.subCategoriesCount && category.subCategoriesCount > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="sm:hidden"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres
                  </Button>
                  
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
                    </SelectContent>
                  </Select>
                  
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
              
              {/* Sous-catégories */}
              {subCategories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Tag className="h-5 w-5" />
                      <span>Sous-catégories</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {subCategories.map((subCategory: any) => (
                        <Link
                          key={subCategory._id}
                          href={`/blog/category/${subCategory.slug}`}
                          className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: subCategory.color }}
                          />
                          <span className="text-sm font-medium truncate">{subCategory.name}</span>
                          {subCategory.stats?.articleCount && (
                            <Badge variant="secondary" className="text-xs ml-auto">
                              {subCategory.stats.articleCount}
                            </Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Filtres détaillés (mobile) */}
            {showFilters && (
              <div className="sm:hidden">
                <BlogFilters categories={allCategories} />
              </div>
            )}
            
            {/* Résultats */}
            <div className="space-y-6">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                      <div className="bg-muted h-48 rounded-lg mb-4" />
                      <div className="bg-muted h-4 rounded w-3/4 mb-2" />
                      <div className="bg-muted h-4 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : !hasResults ? (
                <div className="text-center py-12">
                  <p className="text-xl text-muted-foreground mb-4">
                    {isFiltered 
                      ? 'Aucun article ne correspond à vos critères dans cette catégorie'
                      : `Aucun article publié dans la catégorie "${category.name}"`
                    }
                  </p>
                  {isFiltered && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const params = new URLSearchParams()
                        params.set('category', category._id)
                        window.history.pushState({}, '', `${window.location.pathname}?${params}`)
                        window.location.reload()
                      }}
                    >
                      Voir tous les articles de cette catégorie
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Articles à la une dans la catégorie */}
                  {featuredArticles.length > 0 && (
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="h-5 w-5" />
                        <h2 className="text-xl font-semibold">À la une dans {category.name}</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {featuredArticles.map((article: any) => (
                          <ArticleCard
                            key={article._id}
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
                        <h2 className="text-xl font-semibold mb-6">Tous les articles</h2>
                      )}
                      
                      <div className={
                        viewMode === 'grid' 
                          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                          : 'space-y-6'
                      }>
                        {regularArticles.map((article: any) => (
                          <ArticleCard
                            key={article._id}
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
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="hidden lg:block lg:w-80">
          <BlogSidebar currentCategory={category} />
        </div>
      </div>
    </div>
  )
}