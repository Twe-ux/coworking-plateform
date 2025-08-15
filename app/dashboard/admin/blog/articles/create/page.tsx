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
import { useToast } from '@/hooks/use-toast'
import { CreateArticleInput, CreateArticleSchema, generateSlug } from '@/lib/validation/blog'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Eye, FileText, Save, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface Category {
  id: string
  name: string
  color: string
  slug: string
  isActive: boolean
}

interface MDXEditorProps {
  value: string
  onChange: (value: string) => void
}

function MDXEditor({ value, onChange }: MDXEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [renderedContent, setRenderedContent] = useState('')

  const renderMDX = useCallback(async (content: string) => {
    // Simple markdown-to-HTML conversion for preview
    // In a real implementation, you'd use a proper MDX renderer
    let html = content
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>')

    html = '<p class="mb-4">' + html + '</p>'
    setRenderedContent(html)
  }, [])

  useEffect(() => {
    if (isPreviewMode) {
      renderMDX(value)
    }
  }, [value, isPreviewMode, renderMDX])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Contenu de l'article</h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={!isPreviewMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsPreviewMode(false)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Éditeur
          </Button>
          <Button
            type="button"
            variant={isPreviewMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsPreviewMode(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Aperçu
          </Button>
        </div>
      </div>

      {isPreviewMode ? (
        <Card>
          <CardContent className="p-6">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          </CardContent>
        </Card>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Rédigez votre article en Markdown..."
          className="min-h-[400px] font-mono text-sm"
        />
      )}

      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Conseils d'écriture :</strong>
        </p>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li># Titre principal, ## Sous-titre, ### Titre de section</li>
          <li>**Texte en gras**, *Texte en italique*</li>
          <li>`Code inline` et ```blocs de code```</li>
          <li>[Lien](https://exemple.com) et ![Image](url-image)</li>
        </ul>
      </div>
    </div>
  )
}

export default function CreateArticlePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  console.log('État des catégories:', categories.length, categories)

  const form = useForm<CreateArticleInput>({
    resolver: zodResolver(CreateArticleSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: '',
      status: 'draft',
      contentType: 'article',
      categoryId: '',
      tags: [],
      featured: false,
      allowComments: true,
      scheduledPublishAt: undefined,
      expiresAt: undefined,
    },
  })

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories?isActive=true')
      const data = await response.json()
      console.log('Réponse des catégories:', data)
      if (data.success) {
        console.log('Catégories chargées:', data.data)
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleTitleChange = (title: string) => {
    form.setValue('title', title)
    if (!form.getValues('slug')) {
      form.setValue('slug', generateSlug(title))
    }
  }

  const handleSubmit = async (data: CreateArticleInput, publish = false) => {
    setIsSubmitting(true)
    try {
      console.log('Données du form avant traitement:', JSON.stringify(data, null, 2))
      
      // Clean up the data before validation
      const cleanedData = {
        ...data,
        // Convert empty strings to undefined for optional fields
        slug: data.slug?.trim() || undefined,
        coverImage: data.coverImage?.trim() || undefined,
        // Ensure tags is always an array
        tags: Array.isArray(data.tags) ? data.tags : [],
        // Remove undefined optional date fields
        scheduledPublishAt: data.scheduledPublishAt || undefined,
        expiresAt: data.expiresAt || undefined,
      }
      
      console.log('Données nettoyées avant validation:', JSON.stringify(cleanedData, null, 2))
      
      // Validate the form data first
      const validationResult = CreateArticleSchema.safeParse(cleanedData)
      if (!validationResult.success) {
        console.error('Validation errors:', validationResult.error.issues)
        const errorMessages = validationResult.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ')
        toast({
          title: 'Erreur de validation',
          description: errorMessages,
          variant: 'destructive',
        })
        return
      }

      // Prepare the data for submission
      const validatedData = validationResult.data
      
      // Set status based on action
      const submitData = {
        ...validatedData,
        status: publish ? 'published' : 'draft',
      }

      console.log('Données validées à envoyer:', JSON.stringify(submitData, null, 2))
      
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()
      console.log('Réponse de l\'API:', result)

      if (result.success) {
        toast({
          title: 'Succès',
          description: `Article ${publish ? 'publié' : 'enregistré en brouillon'}`,
        })
        router.push('/dashboard/admin/blog/articles')
      } else {
        console.error('Erreur de l\'API:', result)
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de créer l\'article',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/blog/articles">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvel article</h1>
          <p className="text-muted-foreground">
            Créez un nouvel article pour votre blog
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          className="space-y-6"
          onSubmit={form.handleSubmit((data) => handleSubmit(data, false))}
        >
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
                            placeholder="url-de-votre-article"
                          />
                        </FormControl>
                        <FormDescription>
                          URL unique de l'article. Laissez vide pour générer automatiquement.
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

                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm">Mettre à la une</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="allowComments"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm">Autoriser les commentaires</FormLabel>
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
                            {categories.length === 0 ? (
                              <SelectItem value="loading" disabled>
                                Chargement des catégories...
                              </SelectItem>
                            ) : (
                              categories.map((category) => {
                                console.log('Rendu catégorie:', category)
                                return (
                                  <SelectItem key={category.id} value={category.id}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                      />
                                      {category.name}
                                    </div>
                                  </SelectItem>
                                )
                              })
                            )}
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

              {/* Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => form.handleSubmit((data) => handleSubmit(data, true))()}
                      disabled={isSubmitting}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Publier
                    </Button>
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer en brouillon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}