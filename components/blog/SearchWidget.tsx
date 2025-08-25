/**
 * Widget de recherche avancée pour le blog
 * Recherche en temps réel avec suggestions et filtres
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, TrendingUp, Filter, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useSearch, useCategories } from '@/hooks/use-blog'
import { useSearchDebounced } from '@/hooks/use-blog'
import type { SearchParams } from '@/types/blog'

interface SearchWidgetProps {
  compact?: boolean
  placeholder?: string
  onResultClick?: () => void
  className?: string
}

export function SearchWidget({ 
  compact = false, 
  placeholder = 'Rechercher dans le blog...',
  onResultClick,
  className = ''
}: SearchWidgetProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  // Paramètres de recherche
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: '',
    categories: [],
    contentTypes: [],
    sortBy: 'relevance',
    dateRange: 'all',
  })
  
  const debouncedQuery = useSearchDebounced(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Récupérer les résultats de recherche
  const { results, suggestions, isLoading } = useSearch(
    { ...searchParams, query: debouncedQuery },
    debouncedQuery.length >= 2
  )
  
  // Récupérer les catégories pour les filtres
  const { categories } = useCategories({
    filters: { isActive: true },
    includeStats: true,
  })
  
  // Charger les recherches récentes depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('blog-recent-searches')
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored))
        } catch (error) {
          console.error('Erreur lors du chargement des recherches récentes:', error)
        }
      }
    }
  }, [])
  
  // Fermer la dropdown quand on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleInputChange = (value: string) => {
    setQuery(value)
    setSearchParams(prev => ({ ...prev, query: value }))
    setIsOpen(value.length > 0)
  }
  
  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    // Sauvegarder la recherche récente
    const updatedRecent = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5)
    setRecentSearches(updatedRecent)
    localStorage.setItem('blog-recent-searches', JSON.stringify(updatedRecent))
    
    // Naviguer vers la page de recherche ou mettre à jour l'URL
    const params = new URLSearchParams()
    params.set('search', searchQuery)
    
    if (searchParams.categories && searchParams.categories.length > 0) {
      params.set('categories', searchParams.categories.join(','))
    }
    if (searchParams.contentTypes && searchParams.contentTypes.length > 0) {
      params.set('contentTypes', searchParams.contentTypes.join(','))
    }
    if (searchParams.sortBy && searchParams.sortBy !== 'relevance') {
      params.set('sortBy', searchParams.sortBy)
    }
    if (searchParams.dateRange && searchParams.dateRange !== 'all') {
      params.set('dateRange', searchParams.dateRange)
    }
    
    const url = `/blog?${params.toString()}`
    router.push(url)
    
    // Fermer la dropdown
    setIsOpen(false)
    setQuery('')
    
    if (onResultClick) {
      onResultClick()
    }
  }
  
  const handleResultClick = (slug: string) => {
    router.push(`/blog/${slug}`)
    setIsOpen(false)
    setQuery('')
    
    if (onResultClick) {
      onResultClick()
    }
  }
  
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }
  
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('blog-recent-searches')
  }
  
  const toggleCategory = (categoryId: string) => {
    setSearchParams(prev => ({
      ...prev,
      categories: (prev.categories || []).includes(categoryId)
        ? (prev.categories || []).filter(id => id !== categoryId)
        : [...(prev.categories || []), categoryId]
    }))
  }
  
  const toggleContentType = (contentType: string) => {
    setSearchParams(prev => ({
      ...prev,
      contentTypes: (prev.contentTypes || []).includes(contentType)
        ? (prev.contentTypes || []).filter(type => type !== contentType)
        : [...(prev.contentTypes || []), contentType]
    }))
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Champ de recherche */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              e.preventDefault()
              handleSearch(query)
            }
            if (e.key === 'Escape') {
              setIsOpen(false)
              inputRef.current?.blur()
            }
          }}
          className={`pr-20 ${compact ? 'h-9' : 'h-10'}`}
        />
        
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {!compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 w-8 p-0"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => query.trim() && handleSearch(query)}
            disabled={!query.trim()}
            className="h-8 w-8 p-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Filtres rapides */}
      {!compact && showFilters && (
        <Card className="mt-2 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Tri */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Trier par</Label>
              <Select
                value={searchParams.sortBy}
                onValueChange={(value: any) => 
                  setSearchParams(prev => ({ ...prev, sortBy: value }))
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Pertinence</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="popularity">Popularité</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Période */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Période</Label>
              <Select
                value={searchParams.dateRange}
                onValueChange={(value: any) => 
                  setSearchParams(prev => ({ ...prev, dateRange: value }))
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout</SelectItem>
                  <SelectItem value="day">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Types de contenu */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Type de contenu</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'article', label: 'Articles' },
                { value: 'news', label: 'Actualités' },
                { value: 'tutorial', label: 'Tutoriels' },
                { value: 'announcement', label: 'Annonces' },
              ].map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={(searchParams.contentTypes || []).includes(type.value)}
                    onCheckedChange={() => toggleContentType(type.value)}
                  />
                  <Label htmlFor={`type-${type.value}`} className="text-sm">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
      
      {/* Dropdown de résultats */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 max-h-96 overflow-y-auto z-50 shadow-lg">
          <CardContent className="p-0">
            {query.length < 2 ? (
              <div className="p-4 space-y-4">
                {/* Recherches récentes */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Recherches récentes</span>
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentSearches}
                        className="h-6 px-2 text-xs"
                      >
                        Effacer
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(search)}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Termes populaires */}
                <div>
                  <h4 className="text-sm font-medium flex items-center space-x-1 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Recherches populaires</span>
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {['coworking', 'productivité', 'espaces', 'communauté'].map((term) => (
                      <Badge
                        key={term}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleSuggestionClick(term)}
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Recherche en cours...</p>
                  </div>
                ) : (
                  <div>
                    {/* Résultats */}
                    {results.length > 0 && (
                      <div className="p-2">
                        <h4 className="text-sm font-medium mb-2 px-2">
                          Résultats ({results.length})
                        </h4>
                        <div className="space-y-1">
                          {results.slice(0, 8).map((result: any) => (
                            <button
                              key={result.id}
                              onClick={() => handleResultClick(result.slug)}
                              className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm line-clamp-1">
                                    {result.title}
                                  </h5>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {result.excerpt}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {result.category}
                                    </Badge>
                                    {result.views > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        {result.views} vues
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        {results.length > 8 && (
                          <div className="p-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSearch(query)}
                              className="w-full"
                            >
                              Voir tous les résultats ({results.length})
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <>
                        {results.length > 0 && <Separator />}
                        <div className="p-2">
                          <h4 className="text-sm font-medium mb-2 px-2">
                            Suggestions
                          </h4>
                          <div className="flex flex-wrap gap-1 px-2">
                            {suggestions.map((suggestion: any, index: any) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                {suggestion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Aucun résultat */}
                    {results.length === 0 && suggestions.length === 0 && !isLoading && (
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          Aucun résultat pour "{query}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}