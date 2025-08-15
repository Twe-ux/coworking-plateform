/**
 * Composant de filtres avancés pour le blog
 * Filtrage par catégorie, type de contenu, tags, etc.
 */

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Category } from '@/types/blog'

interface BlogFiltersProps {
  categories: Category[]
  className?: string
}

export function BlogFilters({ categories, className = '' }: BlogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [isOpen, setIsOpen] = useState(true)
  
  // État actuel des filtres
  const currentCategory = searchParams.get('category')
  const currentContentType = searchParams.get('contentType')
  const currentTags = searchParams.get('tags')?.split(',').filter(Boolean) || []
  const currentFeatured = searchParams.get('featured') === 'true'
  
  // Types de contenu disponibles
  const contentTypes = [
    { value: 'article', label: 'Articles', description: 'Contenu éditorial général' },
    { value: 'news', label: 'Actualités', description: 'Dernières nouvelles' },
    { value: 'tutorial', label: 'Tutoriels', description: 'Guides pratiques' },
    { value: 'announcement', label: 'Annonces', description: 'Communications officielles' },
  ]
  
  // Tags populaires (simulé - en réalité récupéré via API)
  const popularTags = [
    'coworking',
    'productivité',
    'espaces',
    'communauté',
    'télétravail',
    'networking',
    'startup',
    'innovation',
  ]
  
  // Catégories avec articles seulement
  const categoriesWithArticles = categories.filter(cat => 
    cat.stats?.articleCount && cat.stats.articleCount > 0
  )

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === null || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    
    // Toujours retourner à la première page lors du filtrage
    params.delete('page')
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newUrl)
  }
  
  const toggleTag = (tag: string) => {
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    
    updateFilter('tags', newTags.length > 0 ? newTags.join(',') : null)
  }
  
  const clearAllFilters = () => {
    router.push('/blog')
  }
  
  const hasActiveFilters = !!(currentCategory || currentContentType || currentTags.length || currentFeatured)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Filter className="h-5 w-5" />
            <span>Filtres</span>
          </CardTitle>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Effacer
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Articles à la une */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Sélection</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={currentFeatured}
              onCheckedChange={(checked) => {
                updateFilter('featured', checked ? 'true' : null)
              }}
            />
            <Label htmlFor="featured" className="text-sm cursor-pointer">
              Articles à la une
            </Label>
          </div>
        </div>
        
        <Separator />
        
        {/* Catégories */}
        {categoriesWithArticles.length > 0 && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <Label className="text-sm font-medium">Catégories</Label>
                <Button variant="ghost" size="sm" className="h-auto p-1">
                  {isOpen ? '−' : '+'}
                </Button>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-2 mt-3">
              {categoriesWithArticles.map((category) => (
                <div key={category._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category._id}`}
                    checked={currentCategory === category._id}
                    onCheckedChange={(checked) => {
                      updateFilter('category', checked ? category._id : null)
                    }}
                  />
                  <Label 
                    htmlFor={`category-${category._id}`} 
                    className="text-sm cursor-pointer flex items-center space-x-2 flex-1"
                  >
                    <span 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="flex-1">{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.stats?.articleCount}
                    </Badge>
                  </Label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
        
        <Separator />
        
        {/* Types de contenu */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Type de contenu</Label>
          <div className="space-y-2">
            {contentTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`content-type-${type.value}`}
                  checked={currentContentType === type.value}
                  onCheckedChange={(checked) => {
                    updateFilter('contentType', checked ? type.value : null)
                  }}
                />
                <Label 
                  htmlFor={`content-type-${type.value}`} 
                  className="text-sm cursor-pointer"
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs text-muted-foreground">{type.description}</div>
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Tags populaires */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tags populaires</Label>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Badge
                key={tag}
                variant={currentTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => toggleTag(tag)}
              >
                {currentTags.includes(tag) && <Check className="h-3 w-3 mr-1" />}
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Résumé des filtres actifs */}
        {hasActiveFilters && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filtres actifs</Label>
              <div className="text-xs text-muted-foreground">
                {[
                  currentFeatured && 'À la une',
                  currentCategory && categoriesWithArticles.find(c => c._id === currentCategory)?.name,
                  currentContentType && contentTypes.find(t => t.value === currentContentType)?.label,
                  ...currentTags.map(tag => `#${tag}`)
                ].filter(Boolean).join(', ')}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="w-full mt-2"
              >
                <X className="h-4 w-4 mr-2" />
                Effacer tous les filtres
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}