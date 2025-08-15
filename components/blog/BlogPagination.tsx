/**
 * Composant de pagination pour le blog
 * Navigation responsive avec numéros de pages et navigation rapide
 */

'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'

interface BlogPaginationProps {
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  maxVisible?: number
}

export function BlogPagination({ 
  currentPage, 
  totalPages, 
  hasNext, 
  hasPrev,
  maxVisible = 7 
}: BlogPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    return `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      router.push(createPageUrl(page))
    }
  }

  // Générer les numéros de page à afficher
  const getVisiblePages = () => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const visiblePages = getVisiblePages()
  const showStartEllipsis = visiblePages[0] > 2
  const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1

  return (
    <nav className="flex items-center justify-center space-x-1" aria-label="Pagination">
      {/* Bouton précédent */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={!hasPrev}
        className="hidden sm:flex"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Précédent
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={!hasPrev}
        className="sm:hidden"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Première page */}
      {showStartEllipsis && (
        <>
          <Button
            variant={currentPage === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => goToPage(1)}
            className="hidden sm:flex"
          >
            1
          </Button>
          <div className="hidden sm:flex items-center px-2">
            <MoreHorizontal className="h-4 w-4" />
          </div>
        </>
      )}

      {/* Pages visibles */}
      <div className="flex items-center space-x-1">
        {visiblePages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => goToPage(page)}
            className="min-w-[40px]"
          >
            {page}
          </Button>
        ))}
      </div>

      {/* Dernière page */}
      {showEndEllipsis && (
        <>
          <div className="hidden sm:flex items-center px-2">
            <MoreHorizontal className="h-4 w-4" />
          </div>
          <Button
            variant={currentPage === totalPages ? "default" : "outline"}
            size="sm"
            onClick={() => goToPage(totalPages)}
            className="hidden sm:flex"
          >
            {totalPages}
          </Button>
        </>
      )}

      {/* Bouton suivant */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={!hasNext}
        className="hidden sm:flex"
      >
        Suivant
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={!hasNext}
        className="sm:hidden"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Informations sur mobile */}
      <div className="sm:hidden ml-4 text-sm text-muted-foreground">
        Page {currentPage} / {totalPages}
      </div>
    </nav>
  )
}