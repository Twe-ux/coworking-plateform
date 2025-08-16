'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Palette, Upload, Hash } from 'lucide-react'
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

const initialFormData: FormData = {
  name: '',
  description: '',
  icon: '',
  color: '#8B4513',
  image: '',
  isActive: true,
  sortOrder: '0',
  parentCategoryId: '',
  metaTitle: '',
  metaDescription: ''
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

export default function CreateCategoryPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parentCategories, setParentCategories] = useState<Category[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchParentCategories()
  }, [])

  const fetchParentCategories = async () => {
    try {
      const response = await fetch('/api/product-categories?parentId=null&activeOnly=true')
      const data = await response.json()
      
      if (data.success) {
        setParentCategories(data.data.categories)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories parent:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
        setFormData(prev => ({
          ...prev,
          image: result.data.url
        }))
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
    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        sortOrder: parseInt(formData.sortOrder) || 0,
        parentCategoryId: formData.parentCategoryId || null
      }

      const response = await fetch('/api/product-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()

      if (result.success) {
        router.push('/dashboard/admin/products/categories')
      } else {
        alert(result.message || 'Erreur lors de la création de la catégorie')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création de la catégorie')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/products/categories">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Créer une nouvelle catégorie</h1>
          <p className="text-muted-foreground">
            Organisez vos produits avec une nouvelle catégorie
          </p>
        </div>
      </div>

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
                        {uploadingImage ? 'Upload en cours...' : 'Cliquez pour uploader une image'}
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
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/admin/products/categories">
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : 'Créer la catégorie'}
          </Button>
        </div>
      </form>
    </div>
  )
}