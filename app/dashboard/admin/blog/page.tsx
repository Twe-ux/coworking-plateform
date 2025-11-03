'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BookOpen,
  Calendar,
  Edit3,
  Eye,
  FileText,
  MessageSquare,
  MoreVertical,
  Plus,
  Tag,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface BlogStats {
  totalArticles: number
  publishedArticles: number
  draftArticles: number
  totalComments: number
  pendingComments: number
  totalViews: number
  totalCategories: number
  monthlyGrowth: {
    articles: number
    comments: number
    views: number
  }
}

interface RecentArticle {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  contentType: string
  authorName: string
  publishedAt?: string
  createdAt: string
  viewsCount: number
  commentsCount: number
  category: {
    name: string
    color: string
  }
}

export default function AdminBlogPage() {
  const [stats, setStats] = useState<BlogStats | null>(null)
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBlogData()
  }, [])

  const fetchBlogData = async () => {
    try {
      const [statsResponse, articlesResponse] = await Promise.all([
        fetch('/api/articles?stats=true'),
        fetch('/api/articles?limit=5&sortBy=createdAt&sortOrder=desc'),
      ])

      if (statsResponse.ok && articlesResponse.ok) {
        const statsData = await statsResponse.json()
        const articlesData = await articlesResponse.json()

        if (statsData.success && articlesData.success) {
          setStats(statsData.stats)
          setRecentArticles(articlesData.data)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error)
    } finally {
      setIsLoading(false)
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="mt-2 h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog & CMS</h1>
          <p className="text-muted-foreground">
            Gérez vos articles, catégories et commentaires
          </p>
        </div>
        <Link href="/dashboard/admin/blog/articles/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel article
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Articles</CardTitle>
              <FileText className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalArticles}</div>
              <p className="text-muted-foreground text-xs">
                {stats.publishedArticles} publiés, {stats.draftArticles}{' '}
                brouillons
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Commentaires
              </CardTitle>
              <MessageSquare className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComments}</div>
              <p className="text-muted-foreground text-xs">
                {stats.pendingComments} en attente de modération
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vues totales
              </CardTitle>
              <Eye className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalViews.toLocaleString()}
              </div>
              <p className="text-muted-foreground text-xs">
                {stats.monthlyGrowth.views > 0 ? '+' : ''}
                {stats.monthlyGrowth.views}% ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catégories</CardTitle>
              <Tag className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCategories}</div>
              <p className="text-muted-foreground text-xs">
                Organisées hiérarchiquement
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/admin/blog/articles">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <BookOpen className="text-primary mr-3 h-5 w-5" />
              <CardTitle className="text-base">Gérer les articles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Créer, modifier et organiser vos articles
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/blog/categories">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Tag className="text-primary mr-3 h-5 w-5" />
              <CardTitle className="text-base">Gérer les catégories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Organiser vos contenus par catégories
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/blog/comments">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <MessageSquare className="text-primary mr-3 h-5 w-5" />
              <CardTitle className="text-base">
                Modérer les commentaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Approuver et modérer les commentaires
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Articles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Articles récents</CardTitle>
          <Link href="/dashboard/admin/blog/articles">
            <Button variant="outline" size="sm">
              Voir tout
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">Aucun article</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Commencez par créer votre premier article
              </p>
              <Link href="/dashboard/admin/blog/articles/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un article
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentArticles.map((article) => (
                <div
                  key={article.id}
                  className="hover:bg-muted/50 flex items-center gap-4 rounded-lg border p-4 transition-colors"
                >
                  {article.category && (
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: article.category.color }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-medium">{article.title}</h4>
                    <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                      {article.category && (
                        <>
                          <span>{article.category.name}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{article.authorName}</span>
                      <span>•</span>
                      <span>
                        {new Date(
                          article.publishedAt || article.createdAt
                        ).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{article.viewsCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{article.commentsCount}</span>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(article.status)}>
                    {getStatusLabel(article.status)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/admin/blog/articles/${article.id}`}
                        >
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
