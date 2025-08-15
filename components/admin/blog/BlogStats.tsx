'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BookOpen,
  Eye,
  FileText,
  MessageSquare,
  Tag,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

interface BlogStatsData {
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

interface BlogStatsProps {
  stats?: BlogStatsData
  isLoading?: boolean
  className?: string
}

interface StatCardProps {
  title: string
  value: number | string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive?: boolean
    label?: string
  }
  className?: string
}

function StatCard({ title, value, description, icon: Icon, trend, className = '' }: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.isPositive !== false ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={`text-xs ${trend.isPositive !== false ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            {trend.label && (
              <span className="text-xs text-muted-foreground">
                {trend.label}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function BlogStats({ stats, isLoading = false, className = '' }: BlogStatsProps) {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Articles"
          value="0"
          description="Aucun article publié"
          icon={FileText}
        />
        <StatCard
          title="Commentaires"
          value="0"
          description="Aucun commentaire"
          icon={MessageSquare}
        />
        <StatCard
          title="Vues totales"
          value="0"
          description="Aucune vue enregistrée"
          icon={Eye}
        />
        <StatCard
          title="Catégories"
          value="0"
          description="Aucune catégorie créée"
          icon={Tag}
        />
      </div>
    )
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      <StatCard
        title="Articles"
        value={stats.totalArticles}
        description={`${stats.publishedArticles} publiés, ${stats.draftArticles} brouillons`}
        icon={FileText}
        trend={stats.monthlyGrowth.articles !== 0 ? {
          value: stats.monthlyGrowth.articles,
          isPositive: stats.monthlyGrowth.articles > 0,
          label: 'ce mois'
        } : undefined}
      />

      <StatCard
        title="Commentaires"
        value={stats.totalComments}
        description={
          stats.pendingComments > 0 
            ? `${stats.pendingComments} en attente de modération`
            : 'Tous les commentaires sont modérés'
        }
        icon={MessageSquare}
        trend={stats.monthlyGrowth.comments !== 0 ? {
          value: stats.monthlyGrowth.comments,
          isPositive: stats.monthlyGrowth.comments > 0,
          label: 'ce mois'
        } : undefined}
      />

      <StatCard
        title="Vues totales"
        value={stats.totalViews}
        description="Vues sur tous les articles"
        icon={Eye}
        trend={stats.monthlyGrowth.views !== 0 ? {
          value: stats.monthlyGrowth.views,
          isPositive: stats.monthlyGrowth.views > 0,
          label: 'ce mois'
        } : undefined}
      />

      <StatCard
        title="Catégories"
        value={stats.totalCategories}
        description="Organisées hiérarchiquement"
        icon={Tag}
      />
    </div>
  )
}

// Additional component for more detailed stats
interface DetailedBlogStatsProps {
  stats?: BlogStatsData & {
    topArticles?: Array<{
      id: string
      title: string
      viewsCount: number
      commentsCount: number
    }>
    recentActivity?: Array<{
      type: 'article' | 'comment'
      title: string
      date: string
    }>
  }
  isLoading?: boolean
}

export function DetailedBlogStats({ stats, isLoading }: DetailedBlogStatsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BlogStats stats={stats} />
      
      {stats && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Articles */}
          {stats.topArticles && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Articles les plus populaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topArticles.map((article, index) => (
                    <div key={article.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {article.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{article.commentsCount} commentaires</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Eye className="h-3 w-3" />
                        <span>{article.viewsCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          {stats.recentActivity && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        {activity.type === 'article' ? (
                          <FileText className="h-3 w-3" />
                        ) : (
                          <MessageSquare className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.type === 'article' ? 'Nouvel article' : 'Nouveau commentaire'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.title}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}