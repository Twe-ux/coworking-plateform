'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, X, Plus, Minus, Save, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

interface FormData {
  name: string
  description: string
  shortDescription: string
  category: string
  subcategory: string
  price: string
  originalPrice: string
  images: string[]
  featured: boolean
  isOrganic: boolean
  isFairTrade: boolean
  isVegan: boolean
  isGlutenFree: boolean
  tags: string[]
  preparationTime: string
  isUnlimited: boolean
  stockQuantity: string
  status: string
  recipe: {
    instructions: string[]
    ingredients: Array<{
      name: string
      quantity: string
      optional: boolean
    }>
    preparationTime: string
    difficulty: 'easy' | 'medium' | 'hard'
    tips: string[]
  }
  nutrition: {
    calories: string
    protein: string
    carbs: string
    fat: string
    sugar: string
    caffeine: string
    allergens: string[]
  }
  customizations: Array<{
    name: string
    options: Array<{
      name: string
      priceModifier: string
    }>
  }>
  sizes: Array<{
    name: string
    price: string
    description: string
  }>
  availableHours: {
    start: string
    end: string
  }
}

const categories = [
  { value: 'coffee', label: '☕ Café' },
  { value: 'tea', label: '🍵 Thé' },
  { value: 'pastry', label: '🥐 Pâtisseries' },
  { value: 'sandwich', label: '🥪 Sandwichs' },
  { value: 'snack', label: '🍪 Snacks' },
  { value: 'beverage', label: '🥤 Boissons' },
  { value: 'healthy', label: '🥗 Healthy' },
  { value: 'breakfast', label: '🍳 Petit-déjeuner' }
]

const allergens = [
  'Gluten', 'Lactose', 'Fruits à coque', 'Arachides', 'Soja', 'Œufs', 'Poisson', 'Crustacés'
]

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const [formData, setFormData] = useState<FormData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [newAllergen, setNewAllergen] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (params?.id) {
      fetchProduct(params.id as string)
    }
  }, [params?.id])

  const fetchProduct = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/products/${id}`)
      const data = await response.json()
      
      if (data.success) {
        const product = data.data
        setFormData({
          name: product.name || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          category: product.category || '',
          subcategory: product.subcategory || '',
          price: product.price?.toString() || '',
          originalPrice: product.originalPrice?.toString() || '',
          images: product.images || [],
          featured: product.featured || false,
          isOrganic: product.isOrganic || false,
          isFairTrade: product.isFairTrade || false,
          isVegan: product.isVegan || false,
          isGlutenFree: product.isGlutenFree || false,
          tags: product.tags || [],
          preparationTime: product.preparationTime?.toString() || '',
          isUnlimited: product.isUnlimited !== false,
          stockQuantity: product.stockQuantity?.toString() || '',
          status: product.status || 'available',
          recipe: {
            instructions: product.recipe?.instructions || [''],
            ingredients: product.recipe?.ingredients || [{ name: '', quantity: '', optional: false }],
            preparationTime: product.recipe?.preparationTime?.toString() || '',
            difficulty: product.recipe?.difficulty || 'easy',
            tips: product.recipe?.tips || ['']
          },
          nutrition: {
            calories: product.nutrition?.calories?.toString() || '',
            protein: product.nutrition?.protein?.toString() || '',
            carbs: product.nutrition?.carbs?.toString() || '',
            fat: product.nutrition?.fat?.toString() || '',
            sugar: product.nutrition?.sugar?.toString() || '',
            caffeine: product.nutrition?.caffeine?.toString() || '',
            allergens: product.nutrition?.allergens || []
          },
          customizations: product.customizations || [],
          sizes: product.sizes || [],
          availableHours: {
            start: product.availableHours?.start || '',
            end: product.availableHours?.end || ''
          }
        })
      } else {
        router.push('/dashboard/admin/products')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du produit:', error)
      router.push('/dashboard/admin/products')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null)
  }

  const handleNestedInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => prev ? ({
      ...prev,
      [section]: {
        ...prev[section as keyof FormData] as any,
        [field]: value
      }
    }) : null)
  }

  const addImage = () => {
    if (newImageUrl.trim() && formData) {
      setFormData(prev => prev ? ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }) : null)
      setNewImageUrl('')
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => prev ? ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }) : null)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })

      const result = await response.json()

      if (result.success) {
        if (formData) {
          setFormData(prev => prev ? ({
            ...prev,
            images: [...prev.images, result.data.url]
          }) : null)
        }
      } else {
        alert(result.message || 'Erreur lors de l\'upload')
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error)
      alert('Erreur lors de l\'upload de l\'image')
    } finally {
      setUploadingImage(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && formData && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => prev ? ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }) : null)
      setNewTag('')
    }
  }

  const removeTag = (index: number) => {
    setFormData(prev => prev ? ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }) : null)
  }

  const addAllergen = () => {
    if (newAllergen && formData && !formData.nutrition.allergens.includes(newAllergen)) {
      setFormData(prev => prev ? ({
        ...prev,
        nutrition: {
          ...prev.nutrition,
          allergens: [...prev.nutrition.allergens, newAllergen]
        }
      }) : null)
      setNewAllergen('')
    }
  }

  const removeAllergen = (index: number) => {
    setFormData(prev => prev ? ({
      ...prev,
      nutrition: {
        ...prev.nutrition,
        allergens: prev.nutrition.allergens.filter((_, i) => i !== index)
      }
    }) : null)
  }

  const addRecipeInstruction = () => {
    setFormData(prev => prev ? ({
      ...prev,
      recipe: {
        ...prev.recipe,
        instructions: [...prev.recipe.instructions, '']
      }
    }) : null)
  }

  const updateRecipeInstruction = (index: number, value: string) => {
    setFormData(prev => prev ? ({
      ...prev,
      recipe: {
        ...prev.recipe,
        instructions: prev.recipe.instructions.map((instruction, i) => 
          i === index ? value : instruction
        )
      }
    }) : null)
  }

  const removeRecipeInstruction = (index: number) => {
    setFormData(prev => prev ? ({
      ...prev,
      recipe: {
        ...prev.recipe,
        instructions: prev.recipe.instructions.filter((_, i) => i !== index)
      }
    }) : null)
  }

  const addIngredient = () => {
    setFormData(prev => prev ? ({
      ...prev,
      recipe: {
        ...prev.recipe,
        ingredients: [...prev.recipe.ingredients, { name: '', quantity: '', optional: false }]
      }
    }) : null)
  }

  const updateIngredient = (index: number, field: string, value: any) => {
    setFormData(prev => prev ? ({
      ...prev,
      recipe: {
        ...prev.recipe,
        ingredients: prev.recipe.ingredients.map((ingredient, i) => 
          i === index ? { ...ingredient, [field]: value } : ingredient
        )
      }
    }) : null)
  }

  const removeIngredient = (index: number) => {
    setFormData(prev => prev ? ({
      ...prev,
      recipe: {
        ...prev.recipe,
        ingredients: prev.recipe.ingredients.filter((_, i) => i !== index)
      }
    }) : null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setIsSubmitting(true)

    try {
      // Transformation des données pour l'API
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : undefined,
        stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : undefined,
        recipe: formData.recipe.instructions[0] || formData.recipe.ingredients[0]?.name ? {
          ...formData.recipe,
          preparationTime: formData.recipe.preparationTime ? parseInt(formData.recipe.preparationTime) : undefined,
          instructions: formData.recipe.instructions.filter(i => i.trim()),
          ingredients: formData.recipe.ingredients.filter(i => i.name.trim()),
          tips: formData.recipe.tips.filter(t => t.trim())
        } : undefined,
        nutrition: Object.values(formData.nutrition).some(v => v) ? {
          calories: formData.nutrition.calories ? parseInt(formData.nutrition.calories) : undefined,
          protein: formData.nutrition.protein ? parseFloat(formData.nutrition.protein) : undefined,
          carbs: formData.nutrition.carbs ? parseFloat(formData.nutrition.carbs) : undefined,
          fat: formData.nutrition.fat ? parseFloat(formData.nutrition.fat) : undefined,
          sugar: formData.nutrition.sugar ? parseFloat(formData.nutrition.sugar) : undefined,
          caffeine: formData.nutrition.caffeine ? parseFloat(formData.nutrition.caffeine) : undefined,
          allergens: formData.nutrition.allergens
        } : undefined,
        customizations: formData.customizations.filter(c => c.name.trim()),
        sizes: formData.sizes.filter(s => s.name.trim()),
        availableHours: formData.availableHours.start && formData.availableHours.end ? formData.availableHours : undefined
      }

      console.log('Updating product with data:', submitData)

      const response = await fetch(`/api/products/${params?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()

      if (result.success) {
        router.push('/dashboard/admin/products')
      } else {
        console.error('Product update error:', result)
        const errorMessage = result.errors ? 
          `Erreurs de validation:\n${result.errors.join('\n')}` : 
          result.message || 'Erreur lors de la mise à jour du produit'
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour du produit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteProduct = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return

    try {
      const response = await fetch(`/api/products/${params?.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/dashboard/admin/products')
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Produit non trouvé</h1>
        <Link href="/dashboard/admin/products">
          <Button>Retour aux produits</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modifier le produit</h1>
            <p className="text-muted-foreground">
              Modifiez les informations de votre produit
            </p>
          </div>
        </div>
        <Button 
          variant="destructive" 
          onClick={deleteProduct}
          size="sm"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Informations</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="recipe">Recette</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations principales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du produit *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ex: Café Latte"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Description courte</Label>
                  <Input
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    placeholder="Résumé en une phrase"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description complète *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Description détaillée du produit"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Prix (€) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="5.50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Prix original (€)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      value={formData.originalPrice}
                      onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                      placeholder="6.50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="unavailable">Indisponible</SelectItem>
                        <SelectItem value="coming_soon">Bientôt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => handleInputChange('featured', checked)}
                    />
                    <Label htmlFor="featured">Produit vedette</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isOrganic"
                      checked={formData.isOrganic}
                      onCheckedChange={(checked) => handleInputChange('isOrganic', checked)}
                    />
                    <Label htmlFor="isOrganic">Bio</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isVegan"
                      checked={formData.isVegan}
                      onCheckedChange={(checked) => handleInputChange('isVegan', checked)}
                    />
                    <Label htmlFor="isVegan">Végan</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isGlutenFree"
                      checked={formData.isGlutenFree}
                      onCheckedChange={(checked) => handleInputChange('isGlutenFree', checked)}
                    />
                    <Label htmlFor="isGlutenFree">Sans gluten</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload par fichier */}
                <div className="space-y-4">
                  <Label>Upload d'image</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            {uploadingImage ? 'Upload en cours...' : 'Cliquez pour uploader une image'}
                          </span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Ajout par URL */}
                <div className="space-y-4">
                  <Label>Ajouter par URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://exemple.com/image.jpg"
                      className="flex-1"
                    />
                    <Button type="button" onClick={addImage}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Images existantes */}
                <div className="space-y-4">
                  <Label>Images du produit ({formData.images.length})</Label>
                  {formData.images.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Aucune image ajoutée. Ajoutez des images pour améliorer la présentation de votre produit.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="relative h-32 rounded-lg overflow-hidden border">
                            <Image
                              src={image}
                              alt={`Image ${index + 1}`}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/placeholder-product.jpg'
                              }}
                            />
                            {index === 0 && (
                              <Badge className="absolute top-2 left-2 bg-green-500">
                                Principal
                              </Badge>
                            )}
                            <Button
                              type="button"
                              onClick={() => removeImage(index)}
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            Image {index + 1}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Ajouter un tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-1 text-xs hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock et disponibilité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isUnlimited"
                    checked={formData.isUnlimited}
                    onCheckedChange={(checked) => handleInputChange('isUnlimited', checked)}
                  />
                  <Label htmlFor="isUnlimited">Stock illimité</Label>
                </div>

                {!formData.isUnlimited && (
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity">Quantité en stock</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                      placeholder="100"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="preparationTime">Temps de préparation (min)</Label>
                  <Input
                    id="preparationTime"
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => handleInputChange('preparationTime', e.target.value)}
                    placeholder="5"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipe" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recette</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipePrepTime">Temps de préparation (min)</Label>
                    <Input
                      id="recipePrepTime"
                      type="number"
                      value={formData.recipe.preparationTime}
                      onChange={(e) => handleNestedInputChange('recipe', 'preparationTime', e.target.value)}
                      placeholder="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulté</Label>
                    <Select 
                      value={formData.recipe.difficulty} 
                      onValueChange={(value) => handleNestedInputChange('recipe', 'difficulty', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Facile</SelectItem>
                        <SelectItem value="medium">Moyen</SelectItem>
                        <SelectItem value="hard">Difficile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Ingrédients</Label>
                    <Button type="button" onClick={addIngredient} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                  
                  {formData.recipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        placeholder="Nom de l'ingrédient"
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                        className="col-span-5"
                      />
                      <Input
                        placeholder="Quantité"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                        className="col-span-3"
                      />
                      <div className="col-span-3 flex items-center space-x-2">
                        <Switch
                          checked={ingredient.optional}
                          onCheckedChange={(checked) => updateIngredient(index, 'optional', checked)}
                        />
                        <Label className="text-xs">Optionnel</Label>
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        size="sm"
                        variant="ghost"
                        className="col-span-1"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Instructions</Label>
                    <Button type="button" onClick={addRecipeInstruction} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                  
                  {formData.recipe.instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <span className="min-w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium mt-1">
                        {index + 1}
                      </span>
                      <Textarea
                        placeholder="Étape de la recette"
                        value={instruction}
                        onChange={(e) => updateRecipeInstruction(index, e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <Button
                        type="button"
                        onClick={() => removeRecipeInstruction(index)}
                        size="sm"
                        variant="ghost"
                        className="mt-1"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations nutritionnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={formData.nutrition.calories}
                      onChange={(e) => handleNestedInputChange('nutrition', 'calories', e.target.value)}
                      placeholder="250"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="protein">Protéines (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      step="0.1"
                      value={formData.nutrition.protein}
                      onChange={(e) => handleNestedInputChange('nutrition', 'protein', e.target.value)}
                      placeholder="8.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carbs">Glucides (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      step="0.1"
                      value={formData.nutrition.carbs}
                      onChange={(e) => handleNestedInputChange('nutrition', 'carbs', e.target.value)}
                      placeholder="12.3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fat">Lipides (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      step="0.1"
                      value={formData.nutrition.fat}
                      onChange={(e) => handleNestedInputChange('nutrition', 'fat', e.target.value)}
                      placeholder="4.2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sugar">Sucres (g)</Label>
                    <Input
                      id="sugar"
                      type="number"
                      step="0.1"
                      value={formData.nutrition.sugar}
                      onChange={(e) => handleNestedInputChange('nutrition', 'sugar', e.target.value)}
                      placeholder="8.0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caffeine">Caféine (mg)</Label>
                    <Input
                      id="caffeine"
                      type="number"
                      step="0.1"
                      value={formData.nutrition.caffeine}
                      onChange={(e) => handleNestedInputChange('nutrition', 'caffeine', e.target.value)}
                      placeholder="95"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Select value={newAllergen} onValueChange={setNewAllergen}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Ajouter un allergène" />
                      </SelectTrigger>
                      <SelectContent>
                        {allergens.filter(a => !formData.nutrition.allergens.includes(a)).map((allergen) => (
                          <SelectItem key={allergen} value={allergen}>
                            {allergen}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={addAllergen}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.nutrition.allergens.map((allergen, index) => (
                      <Badge key={index} variant="destructive" className="flex items-center gap-1">
                        {allergen}
                        <button
                          type="button"
                          onClick={() => removeAllergen(index)}
                          className="ml-1 text-xs hover:text-red-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Horaires de disponibilité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Heure de début</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.availableHours.start}
                      onChange={(e) => handleNestedInputChange('availableHours', 'start', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">Heure de fin</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.availableHours.end}
                      onChange={(e) => handleNestedInputChange('availableHours', 'end', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Buttons */}
        <div className="flex justify-between pt-6">
          <Link href="/dashboard/admin/products">
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
          </Button>
        </div>
      </form>
    </div>
  )
}