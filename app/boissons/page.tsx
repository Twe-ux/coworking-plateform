'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Star, Clock, Leaf, Coffee, Grid, List } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface Product {
  _id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  category: string
  price: number
  originalPrice?: number
  images: string[]
  mainImage?: string
  featured: boolean
  isOrganic?: boolean
  isFairTrade?: boolean
  isVegan?: boolean
  isGlutenFree?: boolean
  tags: string[]
  preparationTime?: number
  averageRating?: number
  totalReviews?: number
  nutrition?: {
    calories?: number
    caffeine?: number
    allergens?: string[]
  }
  isAvailable: boolean
  discountPercentage: number | null
}

interface Category {
  id: string
  name: string
  description: string
  icon: string
  color: string
  stats: {
    count: number
  }
}

const categoryIcons: Record<string, string> = {
  coffee: '☕',
  tea: '🍵',
  pastry: '🥐',
  sandwich: '🥪',
  snack: '🍪',
  beverage: '🥤',
  healthy: '🥗',
  breakfast: '🍳'
}

export default function BoissonsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popularity')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [selectedCategory, sortBy, searchTerm])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(searchTerm && { search: searchTerm }),
        sortBy,
        limit: '20'
      })

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.data.products)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.data.categories.filter((cat: Category) => cat.stats.count > 0))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesSearch
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 100
      }
    }
  }

  return (
    <div className="bg-coffee-light md:from-coffee-light md:via-coffee-light/80 md:to-coffee-light/60 relative min-h-screen overflow-hidden md:bg-gradient-to-br">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="bg-coffee-primary/10 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="bg-coffee-accent/10 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl"
          animate={{
            scale: [1.1, 1, 1.1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-coffee-primary to-coffee-accent bg-clip-text text-transparent mb-6">
            Nos Boissons & Délices
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Découvrez notre sélection artisanale de cafés, thés, et délicieuses pâtisseries. 
            Chaque produit est choisi avec soin pour accompagner vos moments de travail et de détente.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 rounded-full border-2 border-coffee-primary/20 focus:border-coffee-primary"
            />
          </div>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* Categories Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 bg-white/50 p-2 rounded-xl">
              <TabsTrigger 
                value="all" 
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg data-[state=active]:bg-coffee-primary data-[state=active]:text-white"
              >
                <span>🌟</span>
                <span className="hidden sm:inline">Tous</span>
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg data-[state=active]:bg-coffee-primary data-[state=active]:text-white"
                >
                  <span>{categoryIcons[category.id] || '📦'}</span>
                  <span className="hidden sm:inline">{category.name}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {category.stats.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trier par..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularité</SelectItem>
                  <SelectItem value="name">Nom A-Z</SelectItem>
                  <SelectItem value="price">Prix croissant</SelectItem>
                  <SelectItem value="rating">Note</SelectItem>
                  <SelectItem value="created">Plus récents</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex rounded-lg border border-gray-200 bg-white">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value={selectedCategory} className="mt-0">
            {loading ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="p-0">
                      <Skeleton className="h-48 w-full" />
                    </CardHeader>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}
              >
                <AnimatePresence>
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product._id}
                      variants={itemVariants}
                      layout
                      className={viewMode === 'list' ? 'md:col-span-1' : ''}
                    >
                      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-coffee-primary/10 hover:border-coffee-primary/30">
                        <CardHeader className="p-0 relative">
                          <div className="relative h-48 overflow-hidden">
                            <Image
                              src={product.mainImage || product.images[0] || '/placeholder-product.jpg'}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            
                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                              {product.featured && (
                                <Badge className="bg-coffee-accent text-white">
                                  <Star className="h-3 w-3 mr-1" />
                                  Vedette
                                </Badge>
                              )}
                              {product.discountPercentage && (
                                <Badge variant="destructive">
                                  -{product.discountPercentage}%
                                </Badge>
                              )}
                            </div>

                            {/* Icons écologiques */}
                            <div className="absolute top-3 right-3 flex flex-col gap-1">
                              {product.isOrganic && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  <Leaf className="h-3 w-3" />
                                </Badge>
                              )}
                              {product.isVegan && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  🌱
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-coffee-primary transition-colors">
                              {product.name}
                            </h3>
                            {product.averageRating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">
                                  {product.averageRating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>

                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {product.shortDescription || product.description}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {product.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {/* Informations additionnelles */}
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            {product.preparationTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {product.preparationTime}min
                              </div>
                            )}
                            {product.nutrition?.calories && (
                              <div className="flex items-center gap-1">
                                🔥 {product.nutrition.calories}cal
                              </div>
                            )}
                            {product.nutrition?.caffeine && (
                              <div className="flex items-center gap-1">
                                <Coffee className="h-3 w-3" />
                                {product.nutrition.caffeine}mg
                              </div>
                            )}
                          </div>
                        </CardContent>

                        <CardFooter className="p-4 pt-0 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {product.originalPrice && (
                              <span className="text-sm text-gray-400 line-through">
                                {product.originalPrice.toFixed(2)}€
                              </span>
                            )}
                            <span className="text-xl font-bold text-coffee-primary">
                              {product.price.toFixed(2)}€
                            </span>
                          </div>

                          <Button 
                            size="sm"
                            className="bg-coffee-primary hover:bg-coffee-accent text-white"
                          >
                            Commander
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {!loading && filteredProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucun produit trouvé
                </h3>
                <p className="text-gray-600 mb-6">
                  Essayez de modifier vos critères de recherche
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                  }}
                  variant="outline"
                >
                  Réinitialiser les filtres
                </Button>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}