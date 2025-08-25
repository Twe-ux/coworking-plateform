/**
 * Composant pour afficher le contenu complet d'un article
 * Support MDX, navigation, partage social et commentaires
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Calendar, 
  Eye, 
  MessageCircle, 
  Share2, 
  Heart, 
  Bookmark,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Copy,
  Twitter,
  Facebook,
  Linkedin,
  Clock,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { ArticleCard } from './ArticleCard'
import { CommentsSection } from './CommentsSection'
import { MDXRenderer } from './MDXRenderer'
import { BlogSidebar } from './BlogSidebar'
import { useFavoriteArticles } from '@/hooks/use-blog'
import type { SingleArticleResponse } from '@/types/blog'

interface ArticleContentProps {
  article: SingleArticleResponse
}

export function ArticleContent({ article }: ArticleContentProps) {
  const { isFavorite, toggleFavorite } = useFavoriteArticles()
  const [isSharing, setIsSharing] = useState(false)
  const isArticleFavorite = isFavorite(article._id)
  
  const publishedDate = article.publishedAt || article.createdAt
  const timeAgo = formatDistanceToNow(new Date(publishedDate), { 
    addSuffix: true, 
    locale: fr 
  })
  
  // Estimation du temps de lecture (250 mots par minute)
  const wordCount = article.content.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 250)
  
  // URL de l'article pour le partage
  const articleUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/blog/${article.slug}`
    : `${process.env.NEXT_PUBLIC_BASE_URL}/blog/${article.slug}`
  
  // Fonctions de partage
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`,
  }
  
  const handleCopyUrl = async () => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(articleUrl)
        // Ici vous pourriez ajouter une notification toast
        console.log('URL copiée')
      } catch (error) {
        console.error('Erreur lors de la copie:', error)
      }
    }
  }
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: articleUrl,
        })
      } catch (error) {
        console.error('Erreur lors du partage natif:', error)
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Contenu principal */}
        <article className="flex-1 max-w-4xl">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/blog/category/${article.category.slug}`}>
                  {article.category.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbPage className="line-clamp-1">{article.title}</BreadcrumbPage>
            </BreadcrumbList>
          </Breadcrumb>
          
          {/* En-tête de l'article */}
          <header className="mb-8 space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge 
                variant="secondary"
                style={{ backgroundColor: `${article.category.color}20`, color: article.category.color }}
              >
                {article.category.name}
              </Badge>
              
              {article.featured && (
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                  À la une
                </Badge>
              )}
              
              <Badge variant="outline" className="capitalize">
                {article.contentType}
              </Badge>
            </div>
            
            {/* Titre */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-foreground">
              {article.title}
            </h1>
            
            {/* Extrait */}
            <p className="text-xl text-muted-foreground leading-relaxed">
              {article.excerpt}
            </p>
            
            {/* Métadonnées et actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Métadonnées */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Auteur */}
                <Link 
                  href={`/blog?author=${article.author._id}`}
                  className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={article.author.image} 
                      alt={`${article.author.firstName} ${article.author.lastName}`}
                    />
                    <AvatarFallback>
                      {article.author.firstName[0]}{article.author.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {article.author.firstName} {article.author.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">Auteur</p>
                  </div>
                </Link>
                
                <Separator orientation="vertical" className="hidden sm:block h-8" />
                
                {/* Date et statistiques */}
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={publishedDate.toString()}>
                      {timeAgo}
                    </time>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{readingTime} min de lecture</span>
                  </div>
                  
                  {article.stats.views > 0 && (
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{article.stats.views}</span>
                    </div>
                  )}
                  
                  {article.allowComments && article.stats.comments > 0 && (
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{article.stats.comments}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorite(article._id)}
                  className="space-x-1"
                >
                  <Heart 
                    className={`h-4 w-4 ${
                      isArticleFavorite 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-muted-foreground'
                    }`} 
                  />
                  <span className="hidden sm:inline">
                    {isArticleFavorite ? 'Retiré' : 'Ajouter'}
                  </span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4" />
                      <span className="hidden sm:ml-1 sm:inline">Partager</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {typeof navigator !== 'undefined' && (navigator as any).share && (
                      <DropdownMenuItem onClick={handleNativeShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Partager
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleCopyUrl}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier le lien
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={shareUrls.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4 mr-2" />
                        Twitter
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={shareUrls.facebook} target="_blank" rel="noopener noreferrer">
                        <Facebook className="h-4 w-4 mr-2" />
                        Facebook
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={shareUrls.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          
          {/* Image de couverture */}
          {article.coverImage && (
            <div className="mb-8">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 75vw, 60vw"
                />
              </div>
            </div>
          )}
          
          {/* Contenu de l'article */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <MDXRenderer content={article.content} />
          </div>
          
          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link key={tag} href={`/blog?tags=${encodeURIComponent(tag)}`}>
                    <Badge variant="outline" className="hover:bg-accent transition-colors">
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Navigation entre articles */}
          {(article.navigation.prev || article.navigation.next) && (
            <nav className="mt-8 pt-8 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {article.navigation.prev && (
                  <Link 
                    href={`/blog/${article.navigation.prev.slug}`}
                    className="group p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                      <ArrowLeft className="h-4 w-4" />
                      <span>Article précédent</span>
                    </div>
                    <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {article.navigation.prev.title}
                    </h4>
                  </Link>
                )}
                
                {article.navigation.next && (
                  <Link 
                    href={`/blog/${article.navigation.next.slug}`}
                    className="group p-4 border rounded-lg hover:bg-accent transition-colors md:text-right"
                  >
                    <div className="flex items-center justify-end space-x-2 text-sm text-muted-foreground mb-1">
                      <span>Article suivant</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {article.navigation.next.title}
                    </h4>
                  </Link>
                )}
              </div>
            </nav>
          )}
          
          {/* Commentaires */}
          {article.allowComments && (
            <div className="mt-12">
              <CommentsSection articleId={article._id} />
            </div>
          )}
        </article>
        
        {/* Sidebar */}
        <aside className="lg:w-80">
          <div className="sticky top-24 space-y-6">
            {/* Informations sur l'auteur */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>À propos de l'auteur</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={article.author.image} 
                      alt={`${article.author.firstName} ${article.author.lastName}`}
                    />
                    <AvatarFallback>
                      {article.author.firstName[0]}{article.author.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {article.author.firstName} {article.author.lastName}
                    </h4>
                    {article.author.bio && (
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {article.author.bio}
                      </p>
                    )}
                    <Link 
                      href={`/blog?author=${article.author._id}`}
                      className="inline-flex items-center text-sm text-primary hover:underline mt-2"
                    >
                      Voir tous les articles
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Articles liés */}
            {article.relatedArticles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Articles similaires</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {article.relatedArticles.slice(0, 3).map((relatedArticle) => (
                    <ArticleCard
                      key={relatedArticle._id}
                      article={relatedArticle as any}
                      variant="compact"
                      showAuthor={false}
                      showExcerpt={false}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
            
            {/* Sidebar standard */}
            <BlogSidebar currentCategory={article.category} />
          </div>
        </aside>
      </div>
    </div>
  )
}