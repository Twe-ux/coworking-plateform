/**
 * Page d'accueil du blog public
 * Liste des articles avec filtres, pagination et navigation
 */

import { Metadata } from 'next'
import { Suspense } from 'react'
import { BlogHeader } from '@/components/blog/BlogHeader'
import { BlogSidebar } from '@/components/blog/BlogSidebar'
import { BlogContent } from '@/components/blog/BlogContent'
import { BlogFooter } from '@/components/blog/BlogFooter'
import { LoadingBlogContent } from '@/components/blog/LoadingBlogContent'

interface BlogPageProps {
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

// Métadonnées SEO pour la page d'accueil du blog
export const metadata: Metadata = {
  title: 'Blog - CoWorking Platform',
  description:
    "Découvrez nos derniers articles, conseils et actualités sur le coworking, la productivité et l'innovation. Restez informé des dernières tendances.",
  keywords: [
    'blog',
    'coworking',
    'espaces de travail',
    'productivité',
    'communauté',
    'télétravail',
    'innovation',
  ],
  authors: [{ name: 'CoWorking Platform' }],
  openGraph: {
    title: 'Blog - CoWorking Platform',
    description:
      "Découvrez nos derniers articles sur le coworking et l'innovation",
    type: 'website',
    locale: 'fr_FR',
    siteName: 'CoWorking Platform Blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - CoWorking Platform',
    description:
      "Découvrez nos derniers articles sur le coworking et l'innovation",
  },
  alternates: {
    canonical: '/blog',
    types: {
      'application/rss+xml': [
        { title: 'Blog RSS Feed', url: '/blog/feed.xml' },
      ],
    },
  },
}

export default function BlogPage({ searchParams }: BlogPageProps) {
  return (
    <div className="bg-background min-h-screen">
      {/* Header avec navigation */}
      <BlogHeader currentPage="home" />

      {/* Contenu principal */}
      <main className="container mx-auto mt-[55px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Contenu principal */}
          <div className="flex-1">
            <Suspense fallback={<LoadingBlogContent />}>
              <BlogContent searchParams={searchParams} />
            </Suspense>
          </div>

          {/* Sidebar - masquée sur mobile, visible sur desktop */}
          <div className="hidden lg:block">
            <BlogSidebar />
          </div>
        </div>
      </main>

      {/* Footer */}
      <BlogFooter />
    </div>
  )
}
