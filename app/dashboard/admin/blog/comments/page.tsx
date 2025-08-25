'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  ModerateCommentInput,
  ModerateCommentSchema,
} from '@/lib/validation/blog'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  Check,
  Clock,
  Filter,
  MessageSquare,
  MoreVertical,
  Reply,
  Search,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface Comment {
  id: string
  content: string
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  type: 'comment' | 'reply'
  authorName: string
  authorEmail: string
  authorWebsite?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  updatedAt: string
  article: {
    id: string
    title: string
    slug: string
  }
  parentComment?: {
    id: string
    authorName: string
    content: string
  }
  replies: Comment[]
  moderationNote?: string
}

interface CommentsResponse {
  success: boolean
  data: Comment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    pending: number
    approved: number
    rejected: number
    spam: number
  }
}

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente', icon: Clock },
  { value: 'approved', label: 'Approuvé', icon: Check },
  { value: 'rejected', label: 'Rejeté', icon: X },
  { value: 'spam', label: 'Spam', icon: AlertTriangle },
]

interface ModerationDialogProps {
  comment: Comment | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (commentId: string, data: ModerateCommentInput) => void
  isSubmitting: boolean
}

function ModerationDialog({
  comment,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: ModerationDialogProps) {
  const form = useForm<ModerateCommentInput>({
    resolver: zodResolver(ModerateCommentSchema),
    defaultValues: {
      action: 'approve',
      note: '',
    },
  })

  const handleSubmit = (data: ModerateCommentInput) => {
    if (comment) {
      onSubmit(comment.id, data)
    }
  }

  if (!comment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modérer le commentaire</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comment Preview */}
          <div className="bg-muted/50 rounded-lg border p-4">
            <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span>{comment.authorName}</span>
              <span>•</span>
              <span>{comment.authorEmail}</span>
              <span>•</span>
              <span>{new Date(comment.createdAt).toLocaleString('fr-FR')}</span>
            </div>
            <p className="text-sm">{comment.content}</p>
            <div className="text-muted-foreground mt-2 text-xs">
              Article:{' '}
              <Link
                href={`/blog/${comment.article.slug}`}
                className="underline"
              >
                {comment.article.title}
              </Link>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="approve">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            Approuver
                          </div>
                        </SelectItem>
                        <SelectItem value="reject">
                          <div className="flex items-center gap-2">
                            <X className="h-4 w-4 text-red-600" />
                            Rejeter
                          </div>
                        </SelectItem>
                        <SelectItem value="spam">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            Marquer comme spam
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note de modération (optionnelle)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Raison de la décision de modération..."
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Traitement...' : 'Confirmer'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CommentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [comments, setComments] = useState<Comment[]>([])
  const [selectedComments, setSelectedComments] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    spam: 0,
  })
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [moderationComment, setModerationComment] = useState<Comment | null>(
    null
  )
  const [isModerationDialogOpen, setIsModerationDialogOpen] = useState(false)
  const [isSubmittingModeration, setIsSubmittingModeration] = useState(false)

  // Filters state
  const [filters, setFilters] = useState({
    search: searchParams?.get('search') || '',
    status: searchParams?.get('status') || 'pending',
    articleId: searchParams?.get('articleId') || 'all',
  })

  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })

      // Add filters to params
      if (filters.search) params.set('search', filters.search)
      if (filters.status !== 'all') params.set('status', filters.status)
      if (filters.articleId !== 'all')
        params.set('articleId', filters.articleId)

      const response = await fetch(`/api/comments?${params.toString()}`)
      const data: CommentsResponse = await response.json()

      if (data.success) {
        setComments(data.data)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les commentaires',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [page, limit, filters.search, filters.status, filters.articleId])

  const updateURL = (newFilters: typeof filters) => {
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value)
      }
    })
    router.push(`/dashboard/admin/blog/comments?${params.toString()}`, {
      scroll: false,
    })
  }

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setPage(1)
    updateURL(newFilters)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchComments()
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedComments(checked ? comments.map((comment) => comment.id) : [])
  }

  const handleSelectComment = (commentId: string, checked: boolean) => {
    setSelectedComments((prev) =>
      checked ? [...prev, commentId] : prev.filter((id) => id !== commentId)
    )
  }

  const handleBulkAction = async (
    action: 'approve' | 'reject' | 'spam' | 'delete'
  ) => {
    if (selectedComments.length === 0) return

    setIsProcessing(true)
    try {
      const promises = selectedComments.map(async (commentId) => {
        if (action === 'delete') {
          const response = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE',
          })
          return response.ok
        } else {
          const response = await fetch(`/api/comments/${commentId}/moderate`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
          })
          return response.ok
        }
      })

      const results = await Promise.all(promises)
      const successCount = results.filter(Boolean).length

      if (successCount === selectedComments.length) {
        toast({
          title: 'Succès',
          description: `${successCount} commentaire(s) ${
            action === 'approve'
              ? 'approuvé(s)'
              : action === 'reject'
                ? 'rejeté(s)'
                : action === 'spam'
                  ? 'marqué(s) comme spam'
                  : 'supprimé(s)'
          }`,
        })
        setSelectedComments([])
        fetchComments()
      } else {
        toast({
          title: 'Partiellement réussi',
          description: `${successCount}/${selectedComments.length} commentaires traités`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error("Erreur lors de l'action groupée:", error)
      toast({
        title: 'Erreur',
        description: "Impossible d'effectuer l'action groupée",
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleModerate = (comment: Comment) => {
    setModerationComment(comment)
    setIsModerationDialogOpen(true)
  }

  const handleModerationSubmit = async (
    commentId: string,
    data: ModerateCommentInput
  ) => {
    setIsSubmittingModeration(true)
    try {
      const response = await fetch(`/api/comments/${commentId}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Succès',
          description: 'Commentaire modéré avec succès',
        })
        setIsModerationDialogOpen(false)
        setModerationComment(null)
        fetchComments()
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de modérer le commentaire',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erreur lors de la modération:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la modération',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingModeration(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Succès',
          description: 'Commentaire supprimé avec succès',
        })
        fetchComments()
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de supprimer le commentaire',
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'rejected':
        return 'outline'
      case 'spam':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approuvé'
      case 'pending':
        return 'En attente'
      case 'rejected':
        return 'Rejeté'
      case 'spam':
        return 'Spam'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return Check
      case 'pending':
        return Clock
      case 'rejected':
        return X
      case 'spam':
        return AlertTriangle
      default:
        return MessageSquare
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Modération des commentaires
          </h1>
          <p className="text-muted-foreground">
            Gérez et modérez les commentaires de votre blog
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {statusOptions.slice(1).map((option) => {
          const Icon = option.icon
          const count = stats[option.value as keyof typeof stats]
          return (
            <Card
              key={option.value}
              className={
                filters.status === option.value ? 'border-primary' : ''
              }
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {option.label}
                </CardTitle>
                {Icon && <Icon className="text-muted-foreground h-4 w-4" />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <Button
                  variant="link"
                  size="sm"
                  className="text-muted-foreground h-auto p-0 text-xs"
                  onClick={() => handleFilterChange('status', option.value)}
                >
                  Voir tout
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recherche</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Contenu, auteur, email..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                  />
                  <Button type="submit" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => {
                      const Icon = option.icon || MessageSquare
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedComments.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedComments.length} commentaire(s) sélectionné(s)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                  disabled={isProcessing}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approuver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('reject')}
                  disabled={isProcessing}
                >
                  <X className="mr-2 h-4 w-4" />
                  Rejeter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('spam')}
                  disabled={isProcessing}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Spam
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  disabled={isProcessing}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 border-b p-4">
                  <Skeleton className="mt-1 h-4 w-4" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">Aucun commentaire</h3>
              <p className="text-muted-foreground text-sm">
                Aucun commentaire ne correspond aux filtres sélectionnés
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {comments.map((comment) => {
                const StatusIcon = getStatusIcon(comment.status)
                return (
                  <div
                    key={comment.id}
                    className="hover:bg-muted/50 flex gap-4 p-4 transition-colors"
                  >
                    <Checkbox
                      checked={selectedComments.includes(comment.id)}
                      onCheckedChange={(checked) =>
                        handleSelectComment(comment.id, checked === true)
                      }
                      className="mt-1"
                    />

                    <div className="min-w-0 flex-1">
                      {/* Comment Header */}
                      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span className="font-medium">
                          {comment.authorName}
                        </span>
                        <span>•</span>
                        <span>{comment.authorEmail}</span>
                        <span>•</span>
                        <span>
                          {new Date(comment.createdAt).toLocaleString('fr-FR')}
                        </span>
                        {comment.type === 'reply' && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Reply className="h-3 w-3" />
                              <span>Réponse</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Parent Comment */}
                      {comment.parentComment && (
                        <div className="bg-muted/50 mb-2 rounded p-2 text-sm">
                          <p className="text-muted-foreground mb-1 text-xs">
                            En réponse à {comment.parentComment.authorName}:
                          </p>
                          <p className="italic">
                            "{comment.parentComment.content.slice(0, 100)}..."
                          </p>
                        </div>
                      )}

                      {/* Comment Content */}
                      <div className="mb-2">
                        <p className="text-sm leading-relaxed">
                          {comment.content}
                        </p>
                      </div>

                      {/* Article Info */}
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <MessageSquare className="h-3 w-3" />
                        <span>Article:</span>
                        <Link
                          href={`/blog/${comment.article.slug}`}
                          className="underline hover:no-underline"
                          target="_blank"
                        >
                          {comment.article.title}
                        </Link>
                      </div>

                      {/* Moderation Note */}
                      {comment.moderationNote && (
                        <div className="mt-2 rounded border border-blue-200 bg-blue-50 p-2 text-sm">
                          <p className="text-blue-800">
                            <Shield className="mr-1 inline h-3 w-3" />
                            Note de modération: {comment.moderationNote}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-start">
                      <Badge
                        variant={getStatusBadgeVariant(comment.status)}
                        className="flex items-center gap-1"
                      >
                        <StatusIcon className="h-3 w-3" />
                        {getStatusLabel(comment.status)}
                      </Badge>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleModerate(comment)}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Modérer
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/blog/${comment.article.slug}#comment-${comment.id}`}
                            target="_blank"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Voir sur le site
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}

              {/* Select All Checkbox at top */}
              {comments.length > 0 && (
                <div className="bg-muted/30 flex items-center gap-2 border-t p-4">
                  <Checkbox
                    checked={
                      selectedComments.length === comments.length &&
                      comments.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-muted-foreground text-sm">
                    Sélectionner tous les commentaires de cette page
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Affichage {(page - 1) * limit + 1} à{' '}
            {Math.min(page * limit, total)} sur{' '}
            {total} commentaires
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              Précédent
            </Button>
            <span className="text-sm">
              Page {page} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Moderation Dialog */}
      <ModerationDialog
        comment={moderationComment}
        isOpen={isModerationDialogOpen}
        onClose={() => {
          setIsModerationDialogOpen(false)
          setModerationComment(null)
        }}
        onSubmit={handleModerationSubmit}
        isSubmitting={isSubmittingModeration}
      />
    </div>
  )
}
