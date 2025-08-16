'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, Clock, Leaf, Coffee, Heart, Share2, ShoppingCart, Users, Award } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useParams, useRouter } from 'next/navigation'

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
  recipe?: {
    instructions: string[]
    ingredients: Array<{
      name: string
      quantity?: string
      optional?: boolean
    }>
    preparationTime?: number
    difficulty?: 'easy' | 'medium' | 'hard'
    tips?: string[]
  }
  nutrition?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    sugar?: number
    caffeine?: number
    allergens?: string[]
  }
  customizations?: Array<{
    name: string
    options: Array<{
      name: string
      priceModifier: number
    }>
  }>
  sizes?: Array<{
    name: string
    price: number
    description?: string
  }>
  isAvailable: boolean
  discountPercentage: number | null
}

const difficultyLabels = {
  easy: { label: 'Facile', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Moyen', color: 'bg-yellow-100 text-yellow-800' },
  hard: { label: 'Difficile', color: 'bg-red-100 text-red-800' }
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [customizations, setCustomizations] = useState<Record<string, string>>({})
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (params.slug) {
      fetchProduct(params.slug as string)
    }
  }, [params.slug])

  const fetchProduct = async (slug: string) => {
    try {
      setLoading(true)
      // Pour cette démo, on va chercher par nom depuis l'API products
      const response = await fetch(`/api/products?search=${slug}&limit=1`)
      const data = await response.json()
      
      if (data.success && data.data.products.length > 0) {
        const foundProduct = data.data.products.find((p: Product) => 
          p.slug === slug || p.name.toLowerCase().replace(/\s+/g, '-') === slug
        )
        setProduct(foundProduct || data.data.products[0])
      } else {
        router.push('/boissons')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du produit:', error)
      router.push('/boissons')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalPrice = () => {
    if (!product) return 0
    
    let basePrice = product.price
    
    // Prix de la taille sélectionnée
    if (selectedSize && product.sizes) {
      const size = product.sizes.find(s => s.name === selectedSize)
      if (size) basePrice = size.price
    }
    
    // Ajout des customizations
    Object.entries(customizations).forEach(([customizationName, optionName]) => {
      const customization = product.customizations?.find(c => c.name === customizationName)
      const option = customization?.options.find(o => o.name === optionName)
      if (option) basePrice += option.priceModifier
    })
    
    return basePrice
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Produit non trouvé</h2>
          <Link href="/boissons">
            <Button>Retour aux produits</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/boissons" className="hover:text-coffee-primary flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux produits
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Images */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            {/* Image principale */}
            <div className="relative h-96 rounded-2xl overflow-hidden bg-white shadow-lg">
              <Image
                src={product.images[selectedImageIndex] || product.mainImage || '/placeholder-product.jpg'}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              
              {/* Badges sur l'image */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
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
              <div className="absolute top-4 right-4 flex gap-2">
                {product.isOrganic && (
                  <Badge className="bg-green-100 text-green-800">
                    <Leaf className="h-3 w-3" />
                  </Badge>
                )}
                {product.isVegan && (
                  <Badge className="bg-green-100 text-green-800">
                    🌱
                  </Badge>
                )}
                {product.isFairTrade && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Award className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </div>

            {/* Miniatures */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      selectedImageIndex === index 
                        ? 'border-coffee-primary' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Informations produit */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* En-tête */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="text-coffee-primary border-coffee-primary">
                  {product.category}
                </Badge>
                {product.averageRating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{product.averageRating.toFixed(1)}</span>
                    <span className="text-gray-500">({product.totalReviews} avis)</span>
                  </div>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
              
              <p className="text-gray-600 text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Prix */}
            <div className="flex items-center gap-3">
              {product.originalPrice && (
                <span className="text-xl text-gray-400 line-through">
                  {product.originalPrice.toFixed(2)}€
                </span>
              )}
              <span className="text-3xl font-bold text-coffee-primary">
                {calculateTotalPrice().toFixed(2)}€
              </span>
            </div>

            {/* Informations rapides */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {product.preparationTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {product.preparationTime} min
                </div>
              )}
              {product.nutrition?.calories && (
                <div className="flex items-center gap-1">
                  🔥 {product.nutrition.calories} cal
                </div>
              )}
              {product.nutrition?.caffeine && (
                <div className="flex items-center gap-1">
                  <Coffee className="h-4 w-4" />
                  {product.nutrition.caffeine} mg
                </div>
              )}
            </div>

            {/* Tailles */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Choisir une taille</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size.name}
                      onClick={() => setSelectedSize(size.name)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedSize === size.name
                          ? 'border-coffee-primary bg-coffee-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{size.name}</div>
                      <div className="text-sm text-gray-600">{size.price.toFixed(2)}€</div>
                      {size.description && (
                        <div className="text-xs text-gray-500">{size.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customizations */}
            {product.customizations && product.customizations.length > 0 && (
              <div className="space-y-4">
                {product.customizations.map((customization) => (
                  <div key={customization.name} className="space-y-2">
                    <h3 className="font-semibold text-gray-900">{customization.name}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {customization.options.map((option) => (
                        <button
                          key={option.name}
                          onClick={() => setCustomizations(prev => ({
                            ...prev,
                            [customization.name]: option.name
                          }))}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            customizations[customization.name] === option.name
                              ? 'border-coffee-primary bg-coffee-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-sm">{option.name}</div>
                          {option.priceModifier !== 0 && (
                            <div className="text-xs text-gray-600">
                              {option.priceModifier > 0 ? '+' : ''}{option.priceModifier.toFixed(2)}€
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                size="lg" 
                className="flex-1 bg-coffee-primary hover:bg-coffee-accent text-white"
                disabled={!product.isAvailable}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.isAvailable ? 'Ajouter au panier' : 'Non disponible'}
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setIsFavorite(!isFavorite)}
                className={isFavorite ? 'border-red-500 text-red-500' : ''}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500' : ''}`} />
              </Button>
              
              <Button size="lg" variant="outline">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Tabs détaillés */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="recipe" disabled={!product.recipe}>Recette</TabsTrigger>
              <TabsTrigger value="nutrition" disabled={!product.nutrition}>Nutrition</TabsTrigger>
              <TabsTrigger value="reviews">Avis</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Détails du produit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    {product.description}
                  </p>
                  
                  {product.nutrition?.allergens && product.nutrition.allergens.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Allergènes</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.nutrition.allergens.map((allergen) => (
                          <Badge key={allergen} variant="secondary">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipe" className="mt-6">
              {product.recipe && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      Recette
                      {product.recipe.difficulty && (
                        <Badge className={difficultyLabels[product.recipe.difficulty].color}>
                          {difficultyLabels[product.recipe.difficulty].label}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Ingrédients */}
                    <div>
                      <h4 className="font-semibold mb-3">Ingrédients</h4>
                      <ul className="space-y-2">
                        {product.recipe.ingredients.map((ingredient, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className={ingredient.optional ? 'text-gray-500' : 'text-gray-900'}>
                              {ingredient.quantity && `${ingredient.quantity} `}
                              {ingredient.name}
                              {ingredient.optional && ' (optionnel)'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    {/* Instructions */}
                    <div>
                      <h4 className="font-semibold mb-3">Instructions</h4>
                      <ol className="space-y-3">
                        {product.recipe.instructions.map((instruction, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-coffee-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="text-gray-700">{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Conseils */}
                    {product.recipe.tips && product.recipe.tips.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-3">Conseils</h4>
                          <ul className="space-y-2">
                            {product.recipe.tips.map((tip, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-coffee-accent mt-1">💡</span>
                                <span className="text-gray-700">{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="nutrition" className="mt-6">
              {product.nutrition && (
                <Card>
                  <CardHeader>
                    <CardTitle>Informations nutritionnelles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {product.nutrition.calories && (
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-coffee-primary">
                            {product.nutrition.calories}
                          </div>
                          <div className="text-sm text-gray-600">Calories</div>
                        </div>
                      )}
                      {product.nutrition.protein && (
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-coffee-primary">
                            {product.nutrition.protein}g
                          </div>
                          <div className="text-sm text-gray-600">Protéines</div>
                        </div>
                      )}
                      {product.nutrition.carbs && (
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-coffee-primary">
                            {product.nutrition.carbs}g
                          </div>
                          <div className="text-sm text-gray-600">Glucides</div>
                        </div>
                      )}
                      {product.nutrition.caffeine && (
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-coffee-primary">
                            {product.nutrition.caffeine}mg
                          </div>
                          <div className="text-sm text-gray-600">Caféine</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    Avis clients
                    {product.averageRating && (
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= Math.round(product.averageRating!)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {product.totalReviews} avis
                        </span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Les avis clients seront bientôt disponibles</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}