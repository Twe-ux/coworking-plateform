'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CreateArticleInput, CreateArticleSchema, generateSlug } from '@/lib/validation/blog'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { MDXEditor } from './MDXEditor'

interface Category {
  id: string
  name: string
  color: string
}

interface ArticleFormData {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  status: 'draft' | 'published' | 'archived'
  contentType: 'article' | 'news' | 'tutorial' | 'announcement'
  categoryId: string
  featured: boolean
  allowComments: boolean
  tags: string[]
}

interface ArticleFormProps {
  initialData?: Partial<ArticleFormData>
  categories: Category[]
  onSubmit: (data: CreateArticleInput, action: 'save' | 'publish') => Promise<void>
  isSubmitting: boolean
  mode: 'create' | 'edit'
}

export function ArticleForm({
  initialData,
  categories,
  onSubmit,
  isSubmitting,
  mode
}: ArticleFormProps) {
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(!initialData?.slug)

  const form = useForm<CreateArticleInput>({
    resolver: zodResolver(CreateArticleSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      excerpt: initialData?.excerpt || '',
      content: initialData?.content || '',
      coverImage: initialData?.coverImage || '',
      status: initialData?.status || 'draft',
      contentType: initialData?.contentType || 'article',
      categoryId: initialData?.categoryId || '',
      featured: initialData?.featured || false,
      allowComments: initialData?.allowComments ?? true,
      tags: initialData?.tags || [],
    },
  })

  // Auto-generate slug when title changes (only if not manually edited)
  const handleTitleChange = (title: string) => {
    form.setValue('title', title)
    if (autoGenerateSlug && mode === 'create') {
      form.setValue('slug', generateSlug(title))
    }
  }

  const handleSlugChange = (slug: string) => {
    form.setValue('slug', slug)
    setAutoGenerateSlug(false) // Disable auto-generation once manually edited
  }

  const handleSubmit = async (data: CreateArticleInput, action: 'save' | 'publish') => {
    // Convert tags string to array if needed
    if (typeof data.tags === 'string') {
      data.tags = data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
    }

    // Set status based on action
    const submitData = {
      ...data,
      status: action === 'publish' ? 'published' : data.status,
    }

    await onSubmit(submitData, action)
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="Le titre de votre article"
                        />
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
                        <Input
                          {...field}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          placeholder="url-de-votre-article"
                        />
                      </FormControl>
                      <FormDescription>
                        URL unique de l'article. 
                        {mode === 'create' 
                          ? ' Laissez vide pour générer automatiquement.' 
                          : ' Attention : modifier l\'URL cassera les liens existants.'
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Extrait *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Un court résumé de votre article"
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormDescription>
                        Résumé affiché dans les listes d'articles (max 500 caractères)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <MDXEditor
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(mode === 'create' || initialData?.status !== 'published') && (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => handleSubmit(form.getValues(), 'publish')}
                    disabled={isSubmitting}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Publier
                  </Button>
                )}
                <Button
                  type="button"
                  variant={mode === 'edit' && initialData?.status === 'published' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => handleSubmit(form.getValues(), 'save')}
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Enregistrement...' : mode === 'create' ? 'Enregistrer en brouillon' : 'Enregistrer'}
                </Button>
              </CardContent>
            </Card>

            {/* Publishing Options */}
            <Card>
              <CardHeader>
                <CardTitle>Publication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="published">Publié</SelectItem>
                          <SelectItem value="archived">Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de contenu</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="news">Actualité</SelectItem>
                          <SelectItem value="tutorial">Tutoriel</SelectItem>
                          <SelectItem value="announcement">Annonce</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Mettre à la une</FormLabel>
                          <FormDescription className="text-xs">
                            L'article apparaîtra en vedette
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowComments"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Autoriser les commentaires</FormLabel>
                          <FormDescription className="text-xs">
                            Les lecteurs pourront commenter
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle>Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={Array.isArray(field.value) ? field.value.join(', ') : field.value}
                          onChange={(e) => {
                            const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                            field.onChange(tags)
                          }}
                          placeholder="tag1, tag2, tag3"
                        />
                      </FormControl>
                      <FormDescription>
                        Séparez les tags par des virgules
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Media */}
            <Card>
              <CardHeader>
                <CardTitle>Image de couverture</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de l'image</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://exemple.com/image.jpg"
                        />
                      </FormControl>
                      <FormDescription>
                        Image principale affichée avec l'article
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}