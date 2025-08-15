/**
 * Page article individuelle du blog
 * Support MDX, SEO optimisé, navigation et commentaires
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { BlogHeader } from '@/components/blog/BlogHeader'
import { BlogFooter } from '@/components/blog/BlogFooter'
import { ArticleContent } from '@/components/blog/ArticleContent'
import { LoadingArticleDetail } from '@/components/blog/LoadingBlogContent'
import type { SingleArticleResponse } from '@/types/blog'

interface ArticlePageProps {
  params: { slug: string }
}

// Fonction pour récupérer l'article côté serveur
async function getArticle(slug: string): Promise<SingleArticleResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/articles/${slug}`, {
      cache: 'no-store', // Toujours récupérer la version la plus récente
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Erreur lors du chargement de l\'article')
    }
    
    const result = await response.json()
    return result.success ? result.data : null
  } catch (error) {
    console.error('Erreur lors du chargement de l\'article:', error)
    return null
  }
}

// Génération des métadonnées SEO
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await getArticle(params.slug)
  
  if (!article) {
    return {
      title: 'Article non trouvé',
      description: 'L\'article demandé n\'existe pas ou n\'est plus disponible.',
    }
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const articleUrl = `${baseUrl}/blog/${article.slug}`
  
  // Utiliser les métadonnées SEO personnalisées ou générer des valeurs par défaut
  const seoTitle = article.seoMetadata?.title || article.title
  const seoDescription = article.seoMetadata?.description || article.excerpt
  const ogTitle = article.seoMetadata?.ogTitle || seoTitle
  const ogDescription = article.seoMetadata?.ogDescription || seoDescription
  const ogImage = article.seoMetadata?.ogImage || article.coverImage
  const twitterTitle = article.seoMetadata?.twitterTitle || ogTitle
  const twitterDescription = article.seoMetadata?.twitterDescription || ogDescription
  const twitterImage = article.seoMetadata?.twitterImage || ogImage
  const canonicalUrl = article.seoMetadata?.canonicalUrl || articleUrl
  const robots = article.seoMetadata?.robots || 'index,follow'
  
  // Mots-clés combinés
  const keywords = [
    ...(article.seoMetadata?.keywords || []),
    ...article.tags,
    article.category.name,
    'blog',
    'coworking'
  ].filter((v, i, a) => a.indexOf(v) === i) // Dédupliquer
  
  return {
    title: seoTitle,
    description: seoDescription,
    keywords,
    authors: [{ 
      name: `${article.author.firstName} ${article.author.lastName}`,
      url: article.author.bio ? `${baseUrl}/blog?author=${article.author._id}` : undefined
    }],
    robots,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'article',
      url: articleUrl,
      siteName: 'CoWorking Platform Blog',
      locale: 'fr_FR',
      publishedTime: article.publishedAt?.toString(),
      modifiedTime: article.updatedAt.toString(),
      authors: [`${article.author.firstName} ${article.author.lastName}`],
      section: article.category.name,
      tags: article.tags,
      images: ogImage ? [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: article.title,
      }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle,
      description: twitterDescription,
      images: twitterImage ? [twitterImage] : undefined,
      creator: `@${article.author.firstName.toLowerCase()}${article.author.lastName.toLowerCase()}`,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      'article:published_time': article.publishedAt?.toString() || article.createdAt.toString(),
      'article:modified_time': article.updatedAt.toString(),
      'article:author': `${article.author.firstName} ${article.author.lastName}`,
      'article:section': article.category.name,
      'article:tag': article.tags.join(','),
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticle(params.slug)
  
  if (!article) {
    notFound()
  }
  
  // Données structurées JSON-LD pour le SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage ? [article.coverImage] : undefined,
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: `${article.author.firstName} ${article.author.lastName}`,
      image: article.author.image,
      description: article.author.bio,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CoWorking Platform',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_BASE_URL}/blog/${article.slug}`,
    },
    articleSection: article.category.name,
    keywords: article.tags.join(', '),
    wordCount: article.content.length,
    commentCount: article.stats.comments,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/ReadAction',
      userInteractionCount: article.stats.views,
    },
  }
  
  return (
    <>
      {/* Données structurées */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <BlogHeader currentPage="article" />
        
        {/* Contenu principal */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense fallback={<LoadingArticleDetail />}>
            <ArticleContent article={article} />
          </Suspense>
        </main>
        
        {/* Footer */}
        <BlogFooter />
      </div>
    </>
  )
}

// Génération des pages statiques pour les articles populaires (optionnel)
export async function generateStaticParams() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/articles?limit=50&sortBy=stats.views&sortOrder=desc`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return []
    }
    
    const result = await response.json()
    const articles = result.success ? result.data : []
    
    return articles.map((article: any) => ({
      slug: article.slug,
    }))
  } catch (error) {
    console.error('Erreur lors de la génération des paramètres statiques:', error)
    return []
  }
}