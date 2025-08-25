'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Palette, Upload, Hash, Save, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

interface FormData {
  name: string
  description: string
  icon: string
  color: string
  image: string
  isActive: boolean
  sortOrder: string
  parentCategoryId: string
  metaTitle: string
  metaDescription: string
}

interface Category {
  _id: string
  name: string
  slug: string
}

interface CategoryWithStats extends Category {
  productCount: number
  childrenCount: number
  hasChildren: boolean
  createdBy: {
    name: string
    email: string
  }
  createdAt: string
}

const predefinedIcons = [
  '☕', '🍵', '🥐', '🥪', '🍪', '🥤', '🥗', '🍳',
  '🍰', '🧁', '🍞', '🥙', '🍕', '🌮', '🍔', '🍟',
  '🍎', '🍌', '🍇', '🥑', '🥕', '🥬', '🍅', '🫐'
]

const predefinedColors = [
  '#8B4513', '#228B22', '#DAA520', '#CD853F', '#DEB887',
  '#4169E1', '#32CD32', '#FF6347', '#9370DB', '#20B2AA',
  '#FF69B4', '#FFA500', '#DC143C', '#00CED1', '#7B68EE'
]

export default function EditCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const [formData, setFormData] = useState<FormData | null>(null)
  const [originalCategory, setOriginalCategory] = useState<CategoryWithStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parentCategories, setParentCategories] = useState<Category[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (params?.id) {
      fetchCategory(params?.id as string)
      fetchParentCategories()
    }
  }, [params?.id])

  const fetchCategory = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/product-categories/${id}`)
      const data = await response.json()
      
      if (data.success) {
        const category = data.data
        setOriginalCategory(category)
        setFormData({
          name: category.name || '',
          description: category.description || '',
          icon: category.icon || '',
          color: category.color || '#8B4513',
          image: category.image || '',
          isActive: category.isActive !== false,
          sortOrder: category.sortOrder?.toString() || '0',
          parentCategoryId: category.parentCategoryId?._id || '',
          metaTitle: category.metaTitle || '',
          metaDescription: category.metaDescription || ''
        })
      } else {
        router.push('/dashboard/admin/products/categories')
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la catégorie:', error)
      router.push('/dashboard/admin/products/categories')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchParentCategories = async () => {
    try {
      const response = await fetch('/api/product-categories?parentId=null&activeOnly=false')
      const data = await response.json()
      
      if (data.success) {
        // Exclure la catégorie actuelle de la liste des parents possibles
        const filteredCategories = data.data.categories.filter(
          (cat: Category) => cat._id !== params?.id
        )
        setParentCategories(filteredCategories)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories parent:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => prev ? ({
      ...prev,
      [field]: value
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
        setFormData(prev => prev ? ({
          ...prev,
          image: result.data.url
        }) : null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        sortOrder: parseInt(formData.sortOrder) || 0,
        parentCategoryId: formData.parentCategoryId || null
      }

      const response = await fetch(`/api/product-categories/${params?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()

      if (result.success) {
        router.push('/dashboard/admin/products/categories')
      } else {
        alert(result.message || 'Erreur lors de la mise à jour de la catégorie')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour de la catégorie')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteCategory = async () => {
    if (!originalCategory) return

    const confirmMessage = originalCategory.productCount > 0 
      ? `Cette catégorie contient ${originalCategory.productCount} produit(s). Vous ne pouvez pas la supprimer.`
      : originalCategory.childrenCount > 0
      ? `Cette catégorie contient ${originalCategory.childrenCount} sous-catégorie(s). Vous ne pouvez pas la supprimer.`
      : 'Êtes-vous sûr de vouloir supprimer cette catégorie ?'

    if (originalCategory.productCount > 0 || originalCategory.childrenCount > 0) {
      alert(confirmMessage)
      return
    }

    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/product-categories/${params?.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        router.push('/dashboard/admin/products/categories')
      } else {
        alert(result.message || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
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

  if (!formData || !originalCategory) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Catégorie non trouvée</h1>
        <Link href="/dashboard/admin/products/categories">
          <Button>Retour aux catégories</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/products/categories">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modifier la catégorie</h1>
            <p className="text-muted-foreground">
              Modifiez les informations de la catégorie "{originalCategory.name}"
            </p>
          </div>
        </div>
        <Button 
          variant="destructive" 
          onClick={deleteCategory}
          size="sm"
          disabled={originalCategory.productCount > 0 || originalCategory.childrenCount > 0}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
      </div>

      {/* Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{originalCategory.productCount}</div>
              <div className="text-sm text-muted-foreground">Produits</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{originalCategory.childrenCount}</div>
              <div className="text-sm text-muted-foreground">Sous-catégories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {(originalCategory as any).isActive ? 'Active' : 'Inactive'}
              </div>
              <div className="text-sm text-muted-foreground">Statut</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de base */}
        <Card>
          <CardHeader>
            <CardTitle>Informations principales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la catégorie *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Café"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentCategoryId">Catégorie parent</Label>
                <Select 
                  value={formData.parentCategoryId} 
                  onValueChange={(value) => handleInputChange('parentCategoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune (catégorie principale)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune (catégorie principale)</SelectItem>
                    {parentCategories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Description de la catégorie"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Ordre d'affichage</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Catégorie active</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Apparence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apparence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Icône */}
            <div className="space-y-4">
              <Label>Icône de la catégorie</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.icon}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                  placeholder="😀"
                  className="w-20 text-center text-lg"
                  maxLength={2}
                />
                <div className="flex-1">
                  <div className="grid grid-cols-8 gap-2">
                    {predefinedIcons.map((icon) => (
                      <Button
                        key={icon}
                        type="button"
                        variant={formData.icon === icon ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleInputChange('icon', icon)}
                        className="h-10 w-10 p-0 text-lg"
                      >
                        {icon}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Couleur */}
            <div className="space-y-4">
              <Label>Couleur de la catégorie</Label>
              <div className="flex gap-2">
                <div className="relative">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <Hash className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-white mix-blend-difference" />
                </div>
                <Input
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="#8B4513"
                  className="w-32"
                />
                <div className="flex-1">
                  <div className="grid grid-cols-8 gap-2">
                    {predefinedColors.map((color) => (
                      <Button
                        key={color}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleInputChange('color', color)}
                        className="h-10 w-10 p-0 border-2"
                        style={{ 
                          backgroundColor: color,
                          borderColor: formData.color === color ? '#000' : '#ccc'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Image */}
            <div className="space-y-4">
              <Label>Image de la catégorie</Label>
              
              {/* Upload d'image */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <div>
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-gray-900">
                        {uploadingImage ? 'Upload en cours...' : 'Cliquez pour uploader une nouvelle image'}
                      </span>
                      <input
                        id="image-upload"
                        name="image-upload"
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

              {/* URL manuelle */}
              <div className="space-y-2">
                <Label htmlFor="image">Ou URL de l'image</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => handleInputChange('image', e.target.value)}
                  placeholder="https://exemple.com/image.jpg"
                />
              </div>

              {/* Preview */}
              {formData.image && (
                <div className="space-y-2">
                  <Label>Aperçu</Label>
                  <div className="relative h-32 w-32 rounded-lg overflow-hidden border">
                    <Image
                      src={formData.image}
                      alt="Aperçu de la catégorie"
                      fill
                      className="object-cover"
                      onError={() => handleInputChange('image', '')}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <CardTitle>Référencement (SEO)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Titre SEO</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                placeholder="Titre pour les moteurs de recherche"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                {formData.metaTitle.length}/60 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Description SEO</Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                placeholder="Description pour les moteurs de recherche"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                {formData.metaDescription.length}/160 caractères
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-between">
          <Link href="/dashboard/admin/products/categories">
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