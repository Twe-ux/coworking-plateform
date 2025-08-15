/**
 * Sidebar du blog avec widgets de navigation et contenu associé
 * Responsive design avec masquage automatique sur mobile
 */

'use client'

import Link from 'next/link'
import { Search, TrendingUp, Tag, Calendar, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArticleCard } from './ArticleCard'
import { useArticles, useCategories } from '@/hooks/use-blog'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Category } from '@/types/blog'

interface BlogSidebarProps {
  currentCategory?: Category
  className?: string
}

export function BlogSidebar({ currentCategory, className = '' }: BlogSidebarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Récupérer les articles populaires
  const { articles: popularArticles } = useArticles({
    filters: { status: 'published' },
    pagination: { page: 1, limit: 5, sortBy: 'stats.views', sortOrder: 'desc' }
  })
  
  // Récupérer les articles récents
  const { articles: recentArticles } = useArticles({
    filters: { status: 'published' },
    pagination: { page: 1, limit: 5, sortBy: 'publishedAt', sortOrder: 'desc' }
  })
  
  // Récupérer les catégories avec statistiques
  const { categories } = useCategories({
    filters: { isActive: true },
    includeStats: true
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/blog?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  // Calculer les tags populaires (simulation - en réalité il faudrait une API dédiée)
  const popularTags = [
    { name: 'coworking', count: 24 },
    { name: 'productivité', count: 18 },
    { name: 'espaces', count: 15 },
    { name: 'communauté', count: 12 },
    { name: 'télétravail', count: 10 },
    { name: 'networking', count: 8 },
    { name: 'startup', count: 7 },
    { name: 'innovation', count: 6 },
  ]

  // Filtrer les catégories avec des articles
  const categoriesWithArticles = categories
    .filter(cat => cat.stats?.articleCount && cat.stats.articleCount > 0)
    .sort((a, b) => (b.stats?.articleCount || 0) - (a.stats?.articleCount || 0))
    .slice(0, 8)

  return (
    <aside className={`w-full lg:w-80 space-y-6 ${className}`}>
      {/* Widget de recherche */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Search className="h-5 w-5" />
            <span>Rechercher</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex space-x-2">
            <Input
              type="search"
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={!searchQuery.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Articles populaires */}
      {popularArticles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              <span>Articles populaires</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {popularArticles.map((article) => (
              <ArticleCard
                key={article._id}
                article={article}
                variant="compact"
                showAuthor={false}
                showExcerpt={false}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Articles récents */}
      {recentArticles.length > 0 && popularArticles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Calendar className="h-5 w-5" />
              <span>Articles récents</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentArticles.slice(0, 3).map((article) => (
              <ArticleCard
                key={article._id}
                article={article}
                variant="minimal"
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Catégories */}
      {categoriesWithArticles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Users className="h-5 w-5" />
              <span>Catégories</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categoriesWithArticles.map((category) => (
                <Link
                  key={category._id}
                  href={`/blog/category/${category.slug}`}
                  className={`flex items-center justify-between p-2 rounded-md transition-colors hover:bg-accent ${
                    currentCategory?._id === category._id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {category.icon && (
                      <span className="text-sm">{category.icon}</span>
                    )}
                    <span 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {category.stats?.articleCount}
                  </Badge>
                </Link>
              ))}
            </div>
            
            {categories.length > categoriesWithArticles.length && (
              <div className="mt-4 pt-4 border-t">
                <Link href="/blog/categories">
                  <Button variant="ghost" size="sm" className="w-full text-sm">
                    Voir toutes les catégories
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tags populaires */}
      {popularTags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Tag className="h-5 w-5" />
              <span>Tags populaires</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Link
                  key={tag.name}
                  href={`/blog?tags=${encodeURIComponent(tag.name)}`}
                >
                  <Badge 
                    variant="outline" 
                    className="hover:bg-accent transition-colors cursor-pointer"
                  >
                    #{tag.name} ({tag.count})
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Newsletter (optionnel) */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Newsletter</CardTitle>
          <p className="text-sm text-muted-foreground">
            Recevez les derniers articles directement dans votre boîte mail.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input 
            type="email" 
            placeholder="votre@email.com"
            className="bg-background"
          />
          <Button className="w-full" size="sm">
            S'abonner
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Pas de spam, seulement du contenu de qualité.
          </p>
        </CardContent>
      </Card>

      {/* Liens rapides */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Liens rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <Link 
              href="/blog?featured=true"
              className="block py-1 hover:text-primary transition-colors"
            >
              Articles à la une
            </Link>
            <Link 
              href="/blog?contentType=tutorial"
              className="block py-1 hover:text-primary transition-colors"
            >
              Tutoriels
            </Link>
            <Link 
              href="/blog?contentType=news"
              className="block py-1 hover:text-primary transition-colors"
            >
              Actualités
            </Link>
            <Link 
              href="/blog?contentType=announcement"
              className="block py-1 hover:text-primary transition-colors"
            >
              Annonces
            </Link>
            <Separator className="my-2" />
            <Link 
              href="/blog/categories"
              className="block py-1 hover:text-primary transition-colors"
            >
              Toutes les catégories
            </Link>
            <Link 
              href="/blog/sitemap"
              className="block py-1 hover:text-primary transition-colors"
            >
              Plan du site
            </Link>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}