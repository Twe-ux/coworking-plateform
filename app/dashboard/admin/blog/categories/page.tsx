'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { CreateCategoryInput, CreateCategorySchema, UpdateCategoryInput } from '@/lib/validation/blog'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronDown,
  ChevronRight,
  Edit3,
  Eye,
  EyeOff,
  FolderTree,
  MoreVertical,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  icon?: string
  parentCategoryId?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  articlesCount: number
  children?: Category[]
}

interface CategoryTreeItemProps {
  category: Category
  level: number
  onEdit: (category: Category) => void
  onDelete: (categoryId: string) => void
  onToggleActive: (categoryId: string, isActive: boolean) => void
}

function CategoryTreeItem({ category, level, onEdit, onDelete, onToggleActive }: CategoryTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
        style={{ marginLeft: `${level * 20}px` }}
      >
        {/* Expand/Collapse Button */}
        {category.children && category.children.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="h-6 w-6" />
        )}

        {/* Category Color */}
        <div
          className="h-4 w-4 rounded-full border"
          style={{ backgroundColor: category.color }}
        />

        {/* Category Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{category.name}</h4>
            {!category.isActive && (
              <Badge variant="outline" className="text-xs">
                Inactif
              </Badge>
            )}
          </div>
          {category.description && (
            <p className="text-sm text-muted-foreground truncate">
              {category.description}
            </p>
          )}
        </div>

        {/* Article Count */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Tag className="h-4 w-4" />
          <span>{category.articlesCount}</span>
        </div>

        {/* Active Toggle */}
        <Switch
          checked={category.isActive}
          onCheckedChange={(checked) => onToggleActive(category.id, checked)}
        />

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleActive(category.id, !category.isActive)}>
              {category.isActive ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Désactiver
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Activer
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(category.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children Categories */}
      {isExpanded && category.children && category.children.length > 0 && (
        <div className="space-y-2">
          {category.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CategoryFormProps {
  category?: Category
  categories: Category[]
  onSubmit: (data: CreateCategoryInput | UpdateCategoryInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

function CategoryForm({ category, categories, onSubmit, onCancel, isSubmitting }: CategoryFormProps) {
  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      color: category?.color || '#3B82F6',
      icon: category?.icon || '',
      parentCategoryId: category?.parentCategoryId || undefined,
      isActive: category?.isActive ?? true,
      sortOrder: category?.sortOrder || 0,
    },
    mode: 'onChange',
  })

  const handleSubmit = (data: CreateCategoryInput) => {
    // Convert 'none' to undefined (omit field) for API
    const submitData = {
      ...data
    }
    
    if (data.parentCategoryId === 'none' || data.parentCategoryId === undefined) {
      delete submitData.parentCategoryId
    }
    
    onSubmit(submitData)
  }

  // Filter out current category and its descendants when selecting parent
  const getAvailableParents = () => {
    if (!category) return categories

    const isDescendant = (cat: Category, ancestorId: string): boolean => {
      if (cat.id === ancestorId) return true
      if (cat.parentCategoryId === ancestorId) return true
      const parent = categories.find(c => c.id === cat.parentCategoryId)
      return parent ? isDescendant(parent, ancestorId) : false
    }

    return categories.filter(cat => cat.id !== category.id && !isDescendant(cat, category.id))
  }

  const availableParents = getAvailableParents()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nom de la catégorie" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="url-de-la-categorie" />
                </FormControl>
                <FormDescription>
                  URL unique de la catégorie. Laissez vide pour générer automatiquement.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Description de la catégorie"
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Couleur</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input {...field} type="color" className="w-16 h-10" />
                    <Input {...field} placeholder="#3B82F6" className="flex-1" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icône</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="folder, tag, book..." />
                </FormControl>
                <FormDescription>
                  Nom de l'icône Lucide (optionnel)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="parentCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie parente</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'none'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Aucune (catégorie racine)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Aucune (catégorie racine)</SelectItem>
                    {availableParents.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: parent.color }}
                          />
                          {parent.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordre de tri</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Ordre d'affichage (0 = premier)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Catégorie active</FormLabel>
                <FormDescription>
                  Les catégories inactives n'apparaissent pas sur le site public
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {category ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default function CategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories?includeHierarchy=true&includeStats=true')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les catégories',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map(categories.map(cat => [cat.id, { ...cat, children: [] }]))
    const tree: Category[] = []

    categories.forEach(category => {
      const cat = categoryMap.get(category.id)!
      if (category.parentCategoryId && categoryMap.has(category.parentCategoryId)) {
        const parent: any = categoryMap.get(category.parentCategoryId)!
        parent.children.push(cat)
      } else {
        tree.push(cat)
      }
    })

    // Sort categories and children by sortOrder
    const sortCategories = (cats: Category[]) => {
      cats.sort((a, b) => a.sortOrder - b.sortOrder)
      cats.forEach(cat => {
        if (cat.children) sortCategories(cat.children)
      })
    }

    sortCategories(tree)
    return tree
  }

  const handleCreate = () => {
    setEditingCategory(undefined)
    setIsDialogOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (data: CreateCategoryInput | UpdateCategoryInput) => {
    setIsSubmitting(true)
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Succès',
          description: `Catégorie ${editingCategory ? 'modifiée' : 'créée'} avec succès`,
        })
        setIsDialogOpen(false)
        fetchCategories()
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de sauvegarder la catégorie',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Succès',
          description: 'Catégorie supprimée avec succès',
        })
        fetchCategories()
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de supprimer la catégorie',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression',
        variant: 'destructive',
      })
    }
  }

  const handleToggleActive = async (categoryId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Succès',
          description: `Catégorie ${isActive ? 'activée' : 'désactivée'}`,
        })
        fetchCategories()
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de modifier le statut',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      })
    }
  }

  const categoryTree = buildCategoryTree(categories)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catégories</h1>
          <p className="text-muted-foreground">
            Organisez vos articles en catégories hiérarchiques
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle catégorie
        </Button>
      </div>

      {/* Categories Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Arborescence des catégories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : categoryTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderTree className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Aucune catégorie</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Commencez par créer votre première catégorie
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une catégorie
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {categoryTree.map((category) => (
                <CategoryTreeItem
                  key={category.id}
                  category={category}
                  level={0}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}