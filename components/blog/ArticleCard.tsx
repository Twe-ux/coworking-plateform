/**
 * Composant carte d'article pour l'affichage en liste
 * Design mobile-first avec support des images et métadonnées
 */

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, Eye, MessageCircle, User, Clock, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useFavoriteArticles } from '@/hooks/use-blog'
import type { Article } from '@/types/blog'

interface ArticleCardProps {
  article: Article
  variant?: 'default' | 'featured' | 'compact' | 'minimal'
  showAuthor?: boolean
  showStats?: boolean
  showExcerpt?: boolean
  className?: string
}

export function ArticleCard({ 
  article, 
  variant = 'default',
  showAuthor = true,
  showStats = true,
  showExcerpt = true,
  className = ''
}: ArticleCardProps) {
  const { isFavorite, toggleFavorite } = useFavoriteArticles()
  const isArticleFavorite = isFavorite(article._id)
  
  const publishedDate = article.publishedAt || article.createdAt
  const timeAgo = formatDistanceToNow(new Date(publishedDate), { 
    addSuffix: true, 
    locale: fr 
  })

  // Couleur de la catégorie
  const categoryColor = article.category.color || '#3B82F6'

  // Variante compacte pour les sidebars
  if (variant === 'compact') {
    return (
      <Card className={`group hover:shadow-md transition-all duration-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex space-x-3">
            {article.coverImage && (
              <div className="flex-shrink-0">
                <Link href={`/blog/${article.slug}`}>
                  <div className="relative w-16 h-16 rounded-md overflow-hidden">
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                      sizes="64px"
                    />
                  </div>
                </Link>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <Link href={`/blog/${article.slug}`}>
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
              </Link>
              
              <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <time dateTime={publishedDate.toString()}>
                  {timeAgo}
                </time>
                
                {showStats && article.stats.views > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-3" />
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{article.stats.views}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Variante minimale pour les listes compactes
  if (variant === 'minimal') {
    return (
      <div className={`group ${className}`}>
        <Link href={`/blog/${article.slug}`} className="block">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
            {article.title}
          </h3>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </Link>
      </div>
    )
  }

  // Variante principale (default et featured)
  const isFeatured = variant === 'featured'
  
  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 overflow-hidden ${
      isFeatured ? 'md:flex md:flex-row' : ''
    } ${className}`}>
      {/* Image de couverture */}
      {article.coverImage && (
        <div className={`relative overflow-hidden ${
          isFeatured 
            ? 'md:w-1/2 h-48 md:h-auto' 
            : 'h-48 sm:h-56'
        }`}>
          <Link href={`/blog/${article.slug}`}>
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes={isFeatured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
              priority={isFeatured}
            />
          </Link>
          
          {/* Badges sur l'image */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {article.featured && (
              <Badge className="text-xs font-medium bg-yellow-500 hover:bg-yellow-600">
                À la une
              </Badge>
            )}
            <Badge 
              variant="secondary" 
              className="text-xs font-medium"
              style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
            >
              {article.category.name}
            </Badge>
          </div>
          
          {/* Bouton favoris */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 hover:bg-background transition-colors"
            onClick={(e) => {
              e.preventDefault()
              toggleFavorite(article._id)
            }}
          >
            <Heart 
              className={`h-4 w-4 transition-colors ${
                isArticleFavorite 
                  ? 'fill-red-500 text-red-500' 
                  : 'text-muted-foreground'
              }`} 
            />
          </Button>
        </div>
      )}

      {/* Contenu */}
      <div className={`flex-1 ${isFeatured ? 'md:w-1/2' : ''}`}>
        <CardHeader className="pb-3">
          {/* Métadonnées */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3" />
              <time dateTime={publishedDate.toString()}>
                {timeAgo}
              </time>
              <Separator orientation="vertical" className="h-3" />
              <Clock className="h-3 w-3" />
              <span>5 min de lecture</span>
            </div>
            
            {!article.coverImage && (
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
              >
                {article.category.name}
              </Badge>
            )}
          </div>

          {/* Titre */}
          <Link href={`/blog/${article.slug}`}>
            <h2 className={`font-bold group-hover:text-primary transition-colors line-clamp-2 ${
              isFeatured ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
            }`}>
              {article.title}
            </h2>
          </Link>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Extrait */}
          {showExcerpt && (
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4">
              {article.excerpt}
            </p>
          )}

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {article.tags.slice(0, 3).map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tags=${encodeURIComponent(tag)}`}
                  className="inline-block"
                >
                  <Badge variant="outline" className="text-xs hover:bg-accent transition-colors">
                    #{tag}
                  </Badge>
                </Link>
              ))}
              {article.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{article.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex items-center justify-between w-full">
            {/* Auteur */}
            {showAuthor && (
              <Link 
                href={`/blog?author=${article.author._id}`}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage 
                    src={article.author.image} 
                    alt={`${article.author.firstName} ${article.author.lastName}`}
                  />
                  <AvatarFallback className="text-xs">
                    {article.author.firstName[0]}{article.author.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {article.author.firstName} {article.author.lastName}
                </span>
              </Link>
            )}

            {/* Statistiques */}
            {showStats && (
              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                {article.stats.views > 0 && (
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{article.stats.views}</span>
                  </div>
                )}
                
                {article.allowComments && article.stats.comments > 0 && (
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-3 w-3" />
                    <span>{article.stats.comments}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardFooter>
      </div>
    </Card>
  )
}