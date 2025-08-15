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
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { UpdateArticleInput, UpdateArticleSchema, generateSlug } from '@/lib/validation/blog'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  FileText, 
  History, 
  Save, 
  Send, 
  Trash2,
  ExternalLink,
  MessageSquare,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface Article {
  id: string
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
  viewsCount: number
  commentsCount: number
  authorId: string
  authorName: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    color: string
  }
}

interface Category {
  id: string
  name: string
  color: string
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

export default function EditArticlePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [article, setArticle] = useState<Article | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<UpdateArticleInput>({
    resolver: zodResolver(UpdateArticleSchema),
  })

  const fetchArticle = useCallback(async () => {
    if (!params.id) return

    try {
      const response = await fetch(`/api/articles/${params.id}`)
      const data = await response.json()

      if (data.success && data.data) {
        const articleData = data.data
        setArticle(articleData)

        // Populate form with article data
        form.reset({
          title: articleData.title,
          slug: articleData.slug,
          excerpt: articleData.excerpt,
          content: articleData.content,
          coverImage: articleData.coverImage || '',
          status: articleData.status,
          contentType: articleData.contentType,
          categoryId: articleData.categoryId,
          featured: articleData.featured,
          allowComments: articleData.allowComments,
          tags: articleData.tags,
        })
      } else {
        toast({
          title: 'Erreur',
          description: 'Article introuvable',
          variant: 'destructive',
        })
        router.push('/dashboard/admin/blog/articles')
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'article:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer l\'article',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [params.id, form, toast, router])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories?isActive=true')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error)
    }
  }, [])

  useEffect(() => {
    fetchArticle()
    fetchCategories()
  }, [fetchArticle, fetchCategories])

  const handleTitleChange = (title: string) => {
    form.setValue('title', title)
    // Only auto-generate slug if it hasn't been manually edited
    const currentSlug = form.getValues('slug')
    const originalSlug = article?.slug
    if (currentSlug === originalSlug || !currentSlug) {
      form.setValue('slug', generateSlug(title))
    }
  }

  const handleSubmit = async (data: UpdateArticleInput, publish = false) => {
    if (!article) return

    setIsSubmitting(true)
    try {
      // Convert tags string to array if needed
      if (typeof data.tags === 'string') {
        data.tags = data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      }

      // Set status based on action
      const submitData = {
        ...data,
        status: publish ? 'published' : data.status,
      }

      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Succès',
          description: `Article ${publish ? 'publié' : 'mis à jour'}`,
        })
        // Refresh article data
        fetchArticle()
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de mettre à jour l\'article',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!article || !confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Succès',
          description: 'Article supprimé',
        })
        router.push('/dashboard/admin/blog/articles')
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de supprimer l\'article',
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
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Article introuvable</h2>
          <p className="text-muted-foreground mb-4">
            L'article que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Link href="/dashboard/admin/blog/articles">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux articles
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'default'
      case 'draft':
        return 'secondary'
      case 'archived':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Publié'
      case 'draft':
        return 'Brouillon'
      case 'archived':
        return 'Archivé'
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/blog/articles">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Modifier l'article</h1>
            <p className="text-muted-foreground">
              {article.title}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href={`/blog/${article.slug}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/dashboard/admin/blog/articles/${article.id}/history`)}
          >
            <History className="mr-2 h-4 w-4" />
            Historique
          </Button>
        </div>
      </div>

      {/* Article Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: article.category.color }}
              />
              <span className="text-sm font-medium">{getStatusLabel(article.status)}</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {article.category.name}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{article.viewsCount} vues</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Statistiques de lecture
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{article.commentsCount} commentaires</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Engagement des lecteurs
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {article.publishedAt 
                  ? new Date(article.publishedAt).toLocaleDateString('fr-FR')
                  : 'Non publié'
                }
              </span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Date de publication
            </div>
          </CardContent>
        </Card>
      </div>

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
                            placeholder="url-de-votre-article"
                          />
                        </FormControl>
                        <FormDescription>
                          URL unique de l'article. Attention : modifier l'URL cassera les liens existants.
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

              {/* Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {article.status !== 'published' && (
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => handleSubmit(form.getValues(), true)}
                        disabled={isSubmitting}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Publier
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant={article.status === 'published' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => handleSubmit(form.getValues(), false)}
                      disabled={isSubmitting}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isDeleting ? 'Suppression...' : 'Supprimer'}
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