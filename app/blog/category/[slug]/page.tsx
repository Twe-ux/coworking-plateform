/**
 * Page catégorie du blog
 * Affiche les articles d'une catégorie spécifique avec filtres
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { BlogHeader } from '@/components/blog/BlogHeader'
import { BlogFooter } from '@/components/blog/BlogFooter'
import { CategoryContent } from '@/components/blog/CategoryContent'
import { LoadingBlogContent } from '@/components/blog/LoadingBlogContent'
import type { Category } from '@/types/blog'

interface CategoryPageProps {
  params: { slug: string }
  searchParams: {
    page?: string
    search?: string
    tags?: string
    contentType?: string
    sortBy?: string
    sortOrder?: string
  }
}

// Fonction pour récupérer la catégorie côté serveur
async function getCategory(slug: string): Promise<Category | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/categories?search=${slug}`, {
      cache: 'no-store',
    })
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement de la catégorie')
    }
    
    const result = await response.json()
    if (!result.success || !result.data.length) {
      return null
    }
    
    // Trouver la catégorie par slug
    const category = result.data.find((cat: Category) => cat.slug === slug)
    return category || null
  } catch (error) {
    console.error('Erreur lors du chargement de la catégorie:', error)
    return null
  }
}

// Génération des métadonnées SEO
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await getCategory(params.slug)
  
  if (!category) {
    return {
      title: 'Catégorie non trouvée',
      description: 'La catégorie demandée n\'existe pas ou n\'est plus disponible.',
    }
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const categoryUrl = `${baseUrl}/blog/category/${category.slug}`
  
  // Utiliser les métadonnées SEO personnalisées ou générer des valeurs par défaut
  const seoTitle = category.seoMetadata?.title || `${category.name} - Blog CoWorking Platform`
  const seoDescription = category.seoMetadata?.description || 
    category.description || 
    `Découvrez tous les articles de la catégorie ${category.name}. ${category.stats?.articleCount || 0} articles disponibles.`
  
  const keywords = [
    ...(category.seoMetadata?.keywords || []),
    category.name,
    'blog',
    'coworking',
    'articles'
  ].filter((v, i, a) => a.indexOf(v) === i)
  
  return {
    title: seoTitle,
    description: seoDescription,
    keywords,
    authors: [{ name: 'CoWorking Platform' }],
    openGraph: {
      title: category.seoMetadata?.ogTitle || seoTitle,
      description: category.seoMetadata?.ogDescription || seoDescription,
      type: 'website',
      url: categoryUrl,
      siteName: 'CoWorking Platform Blog',
      locale: 'fr_FR',
      images: category.seoMetadata?.ogImage ? [{
        url: category.seoMetadata.ogImage,
        width: 1200,
        height: 630,
        alt: category.name,
      }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: category.seoMetadata?.twitterTitle || seoTitle,
      description: category.seoMetadata?.twitterDescription || seoDescription,
      images: category.seoMetadata?.twitterImage ? [category.seoMetadata.twitterImage] : undefined,
    },
    alternates: {
      canonical: category.seoMetadata?.canonicalUrl || categoryUrl,
    },
    other: {
      'article:section': category.name,
    },
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = await getCategory(params.slug)
  
  if (!category) {
    notFound()
  }
  
  // Données structurées JSON-LD pour le SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description,
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/blog/category/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      name: `Articles de la catégorie ${category.name}`,
      numberOfItems: category.stats?.articleCount || 0,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Blog',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/blog`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Catégories',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/blog/categories`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: category.name,
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/blog/category/${category.slug}`,
        },
      ],
    },
    publisher: {
      '@type': 'Organization',
      name: 'CoWorking Platform',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`,
      },
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
        <BlogHeader currentPage="category" currentCategory={category} />
        
        {/* Contenu principal */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense fallback={<LoadingBlogContent />}>
            <CategoryContent category={category} searchParams={searchParams} />
          </Suspense>
        </main>
        
        {/* Footer */}
        <BlogFooter />
      </div>
    </>
  )
}

// Génération des pages statiques pour les catégories populaires (optionnel)
export async function generateStaticParams() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/categories?stats=true`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return []
    }
    
    const result = await response.json()
    const categories = result.success ? result.data : []
    
    // Générer seulement pour les catégories qui ont des articles
    return categories
      .filter((cat: Category) => cat.stats?.articleCount && cat.stats.articleCount > 0)
      .map((category: Category) => ({
        slug: category.slug,
      }))
  } catch (error) {
    console.error('Erreur lors de la génération des paramètres statiques:', error)
    return []
  }
}