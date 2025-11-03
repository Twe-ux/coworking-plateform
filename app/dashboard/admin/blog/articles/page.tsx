'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  Archive,
  Calendar,
  ChevronDown,
  Edit3,
  Eye,
  Filter,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  status: 'draft' | 'published' | 'archived'
  contentType: 'article' | 'news' | 'tutorial' | 'announcement'
  featured: boolean
  authorName: string
  category: {
    id: string
    name: string
    color: string
  }
  tags: string[]
  viewsCount: number
  commentsCount: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  color: string
}

interface ArticlesResponse {
  success: boolean
  data: Article[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'published', label: 'Publié' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'archived', label: 'Archivé' },
]

const contentTypeOptions = [
  { value: 'all', label: 'Tous les types' },
  { value: 'article', label: 'Article' },
  { value: 'news', label: 'Actualité' },
  { value: 'tutorial', label: 'Tutoriel' },
  { value: 'announcement', label: 'Annonce' },
]

export default function ArticlesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Filters state
  const [filters, setFilters] = useState({
    search: searchParams?.get('search') || '',
    status: searchParams?.get('status') || 'all',
    contentType: searchParams?.get('contentType') || 'all',
    categoryId: searchParams?.get('categoryId') || 'all',
    featured: searchParams?.get('featured') || 'all',
  })

  const [isProcessing, setIsProcessing] = useState(false)

  const fetchArticles = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      })

      // Add filters to params
      if (filters.search) params.set('search', filters.search)
      if (filters.status !== 'all') params.set('status', filters.status)
      if (filters.contentType !== 'all') params.set('contentType', filters.contentType)
      if (filters.categoryId !== 'all') params.set('categoryId', filters.categoryId)
      if (filters.featured !== 'all') params.set('featured', filters.featured)

      const response = await fetch(`/api/articles?${params.toString()}`)
      const data: ArticlesResponse = await response.json()

      if (data.success) {
        // Transformer les articles pour avoir un champ id
       const transformedArticles = (data.data || []).map((article: any) => ({
       ...article,
       id: article.id || article._id,
       }))
       setArticles(transformedArticles)
        setTotal((data as any).meta?.total || 0)
        setTotalPages((data as any).meta?.totalPages || 1)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des articles:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les articles',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories?isActive=true')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error)
    }
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [page, limit, filters.search, filters.status, filters.contentType, filters.categoryId, filters.featured])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const updateURL = (newFilters: typeof filters) => {
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value)
      }
    })
    router.push(`/dashboard/admin/blog/articles?${params.toString()}`, { scroll: false })
  }

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setPage(1)
    updateURL(newFilters)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchArticles()
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedArticles(checked ? articles.map(article => article.id) : [])
  }

  const handleSelectArticle = (articleId: string, checked: boolean) => {
    setSelectedArticles(prev =>
      checked
        ? [...prev, articleId]
        : prev.filter(id => id !== articleId)
    )
  }

  const handleBulkAction = async (action: 'publish' | 'archive' | 'delete') => {
    if (selectedArticles.length === 0) return

    setIsProcessing(true)
    try {
      const promises = selectedArticles.map(async (articleId) => {
        let endpoint = ''
        let method = 'PATCH'
        let body: any = {}

        switch (action) {
          case 'publish':
            endpoint = `/api/articles/${articleId}/publish`
            body = { action: 'publish' }
            break
          case 'archive':
            endpoint = `/api/articles/${articleId}`
            body = { status: 'archived' }
            break
          case 'delete':
            endpoint = `/api/articles/${articleId}`
            method = 'DELETE'
            break
        }

        const response = await fetch(endpoint, {
          method,
          headers: method === 'DELETE' ? {} : { 'Content-Type': 'application/json' },
          ...(method !== 'DELETE' && { body: JSON.stringify(body) }),
        })

        return response.ok
      })

      const results = await Promise.all(promises)
      const successCount = results.filter(Boolean).length

      if (successCount === selectedArticles.length) {
        toast({
          title: 'Succès',
          description: `${successCount} article(s) ${
            action === 'publish' ? 'publié(s)' :
            action === 'archive' ? 'archivé(s)' : 'supprimé(s)'
          }`,
        })
        setSelectedArticles([])
        fetchArticles()
      } else {
        toast({
          title: 'Partiellement réussi',
          description: `${successCount}/${selectedArticles.length} articles traités`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erreur lors de l\'action groupée:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'effectuer l\'action groupée',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'default'
      case 'draft':
        return 'secondary'
      case 'archived':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Publié'
      case 'draft':
        return 'Brouillon'
      case 'archived':
        return 'Archivé'
      default:
        return status
    }
  }

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'article':
        return 'Article'
      case 'news':
        return 'Actualité'
      case 'tutorial':
        return 'Tutoriel'
      case 'announcement':
        return 'Annonce'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">
            Gérez tous vos articles et contenus
          </p>
        </div>
        <Link href="/dashboard/admin/blog/articles/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel article
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recherche</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Titre, contenu..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                  <Button type="submit" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={filters.contentType}
                  onValueChange={(value) => handleFilterChange('contentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Catégorie</label>
                <Select
                  value={filters.categoryId}
                  onValueChange={(value) => handleFilterChange('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">À la une</label>
                <Select
                  value={filters.featured}
                  onValueChange={(value) => handleFilterChange('featured', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="true">À la une</SelectItem>
                    <SelectItem value="false">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedArticles.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedArticles.length} article(s) sélectionné(s)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('publish')}
                  disabled={isProcessing}
                >
                  Publier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('archive')}
                  disabled={isProcessing}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archiver
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  disabled={isProcessing}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedArticles.length === articles.length && articles.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Search className="h-8 w-8 mb-2" />
                        <p>Aucun article trouvé</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  articles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedArticles.includes(article.id)}
                          onCheckedChange={(checked) =>
                            handleSelectArticle(article.id, checked === true)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/admin/blog/articles/${article.id}`}
                              className="font-medium hover:underline truncate"
                            >
                              {article.title}
                            </Link>
                            {article.featured && (
                              <Badge variant="outline" className="text-xs">
                                À la une
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {article.authorName}
                            </span>
                            {article.tags.length > 0 && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <div className="flex gap-1">
                                  {article.tags.slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs px-1">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {article.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs px-1">
                                      +{article.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {article.category ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: article.category.color }}
                            />
                            <span className="text-sm">{article.category.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getContentTypeLabel(article.contentType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(article.status)}>
                          {getStatusLabel(article.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{article.viewsCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{article.commentsCount}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(
                                article.publishedAt || article.createdAt
                              ).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/admin/blog/articles/${article.id}`}>
                                <Edit3 className="mr-2 h-4 w-4" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/blog/${article.slug}`} target="_blank">
                                <Eye className="mr-2 h-4 w-4" />
                                Voir
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleBulkAction('archive')}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archiver
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleBulkAction('delete')}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Affichage {((page - 1) * limit) + 1} à {Math.min(page * limit, total)} sur {total} articles
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              Précédent
            </Button>
            <span className="text-sm">
              Page {page} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
