/**
 * Composant Header du blog avec navigation et recherche
 * Design mobile-first avec navigation responsive
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Menu, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { useCategories } from '@/hooks/use-blog'
import type { Category } from '@/types/blog'

interface BlogHeaderProps {
  currentPage?: 'home' | 'article' | 'category'
  currentCategory?: Category
}

export function BlogHeader({ currentPage = 'home', currentCategory }: BlogHeaderProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const { categories, isLoading } = useCategories({
    filters: { isActive: true },
    includeStats: true,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/blog?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setIsSearchOpen(false)
    }
  }

  const featuredCategories = categories.filter(cat => cat.stats?.articleCount && cat.stats.articleCount > 0).slice(0, 6)
  const mainCategories = categories.filter(cat => !cat.parentCategory && cat.stats?.articleCount && cat.stats.articleCount > 0)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center space-x-4">
            <Link href="/blog" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">B</span>
              </div>
              <span className="hidden font-bold text-xl sm:block">Blog</span>
            </Link>

            {/* Breadcrumb pour mobile */}
            {currentPage !== 'home' && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground sm:hidden">
                <span>/</span>
                <span className="capitalize">
                  {currentPage === 'category' ? currentCategory?.name : currentPage}
                </span>
              </div>
            )}
          </div>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/blog"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                currentPage === 'home' ? 'text-primary' : 'text-foreground/60'
              }`}
            >
              Accueil
            </Link>

            {mainCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-1 text-sm font-medium text-foreground/60 hover:text-primary transition-colors">
                  <span>Catégories</span>
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {mainCategories.map((category) => (
                    <DropdownMenuItem key={category._id} asChild>
                      <Link
                        href={`/blog/category/${category.slug}`}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          {category.icon && (
                            <span className="text-xs">{category.icon}</span>
                          )}
                          <span>{category.name}</span>
                        </div>
                        {category.stats?.articleCount && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {category.stats.articleCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Link 
              href="/blog?featured=true"
              className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors"
            >
              À la une
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Recherche desktop */}
            <div className="hidden md:block">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center space-x-2">
                  <Input
                    type="search"
                    placeholder="Rechercher un article..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                    autoFocus
                  />
                  <Button type="submit" size="sm" disabled={!searchQuery.trim()}>
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsSearchOpen(false)
                      setSearchQuery('')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden lg:ml-2 lg:inline">Rechercher</span>
                </Button>
              )}
            </div>

            {/* Recherche mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Menu mobile */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col space-y-4">
                  <h2 className="text-lg font-semibold">Navigation</h2>
                  
                  <nav className="flex flex-col space-y-2">
                    <Link
                      href="/blog"
                      className={`flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        currentPage === 'home' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Accueil
                    </Link>

                    <Link
                      href="/blog?featured=true"
                      className="flex items-center py-2 px-3 rounded-md text-sm font-medium hover:bg-accent transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      À la une
                    </Link>
                  </nav>

                  {mainCategories.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                        Catégories
                      </h3>
                      <div className="flex flex-col space-y-1">
                        {mainCategories.map((category) => (
                          <Link
                            key={category._id}
                            href={`/blog/category/${category.slug}`}
                            className={`flex items-center justify-between py-2 px-3 rounded-md text-sm hover:bg-accent transition-colors ${
                              currentCategory?._id === category._id ? 'bg-accent' : ''
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <div className="flex items-center space-x-2">
                              {category.icon && (
                                <span className="text-xs">{category.icon}</span>
                              )}
                              <span>{category.name}</span>
                            </div>
                            {category.stats?.articleCount && (
                              <Badge variant="secondary" className="text-xs">
                                {category.stats.articleCount}
                              </Badge>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Barre de recherche mobile */}
        {isSearchOpen && (
          <div className="pb-4 md:hidden">
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <Input
                type="search"
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" size="sm" disabled={!searchQuery.trim()}>
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Sous-navigation avec catégories (desktop seulement) */}
      {featuredCategories.length > 0 && (
        <div className="hidden lg:block border-t">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-6 py-3 overflow-x-auto">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                CATÉGORIES POPULAIRES
              </span>
              {featuredCategories.map((category) => (
                <Link
                  key={category._id}
                  href={`/blog/category/${category.slug}`}
                  className={`flex items-center space-x-1 whitespace-nowrap text-xs font-medium transition-colors hover:text-primary ${
                    currentCategory?._id === category._id ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {category.icon && (
                    <span className="text-xs">{category.icon}</span>
                  )}
                  <span>{category.name}</span>
                  {category.stats?.articleCount && (
                    <span className="text-xs opacity-60">({category.stats.articleCount})</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}