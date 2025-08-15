/**
 * Formulaire pour ajouter un commentaire ou une réponse
 * Support pour les utilisateurs authentifiés et non authentifiés
 */

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Send, User, Mail, Link as LinkIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateComment } from '@/hooks/use-blog'
import type { CommentFormData } from '@/types/blog'

interface CommentFormProps {
  articleId: string
  parentCommentId?: string
  onSubmitted: () => void
  onCancel?: () => void
  onError?: (error: string) => void
  placeholder?: string
  compact?: boolean
}

export function CommentForm({
  articleId,
  parentCommentId,
  onSubmitted,
  onCancel,
  onError,
  placeholder = 'Écrivez votre commentaire...',
  compact = false
}: CommentFormProps) {
  const { data: session } = useSession()
  const { createComment, isSubmitting, error } = useCreateComment()
  
  // État du formulaire
  const [formData, setFormData] = useState<CommentFormData>({
    content: '',
    authorName: session?.user?.name || '',
    authorEmail: session?.user?.email || '',
    authorWebsite: '',
    parentCommentId,
  })
  
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  // Validation du formulaire
  const isFormValid = 
    formData.content.trim().length >= 10 &&
    formData.authorName.trim().length >= 2 &&
    formData.authorEmail.trim().length >= 5 &&
    formData.authorEmail.includes('@') &&
    agreedToTerms
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      return
    }
    
    try {
      await createComment(articleId, {
        ...formData,
        content: formData.content.trim(),
        authorName: formData.authorName.trim(),
        authorEmail: formData.authorEmail.trim().toLowerCase(),
        authorWebsite: formData.authorWebsite?.trim() || undefined,
      })
      
      // Réinitialiser le formulaire
      setFormData({
        content: '',
        authorName: session?.user?.name || '',
        authorEmail: session?.user?.email || '',
        authorWebsite: '',
        parentCommentId,
      })
      setAgreedToTerms(false)
      setShowSuccessMessage(true)
      
      // Masquer le message après 3 secondes
      setTimeout(() => setShowSuccessMessage(false), 3000)
      
      // Notifier le parent
      onSubmitted()
      
    } catch (err) {
      console.error('Erreur lors de l\'envoi du commentaire:', err)
      if (onError) {
        onError(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    }
  }
  
  const handleInputChange = (field: keyof CommentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  // Message de succès
  if (showSuccessMessage) {
    return (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
        <AlertDescription className="text-green-800 dark:text-green-200">
          {parentCommentId 
            ? 'Votre réponse a été soumise et est en attente de modération.'
            : 'Votre commentaire a été soumis et est en attente de modération.'
          }
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* En-tête avec utilisateur connecté */}
      {session?.user && !compact && (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image || undefined} />
            <AvatarFallback className="text-xs">
              {session.user.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">Connecté</p>
          </div>
        </div>
      )}
      
      {/* Zone de texte pour le commentaire */}
      <div>
        <Label htmlFor="content" className="sr-only">
          Commentaire
        </Label>
        <Textarea
          id="content"
          placeholder={placeholder}
          value={formData.content}
          onChange={(e) => handleInputChange('content', e.target.value)}
          className={`resize-none ${compact ? 'min-h-[80px]' : 'min-h-[120px]'}`}
          maxLength={2000}
          required
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-muted-foreground">
            Minimum 10 caractères
          </p>
          <p className="text-xs text-muted-foreground">
            {formData.content.length}/2000
          </p>
        </div>
      </div>
      
      {/* Informations de l'auteur (si non connecté) */}
      {!session?.user && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="authorName" className="flex items-center space-x-1 text-sm">
              <User className="h-3 w-3" />
              <span>Nom *</span>
            </Label>
            <Input
              id="authorName"
              type="text"
              value={formData.authorName}
              onChange={(e) => handleInputChange('authorName', e.target.value)}
              placeholder="Votre nom"
              maxLength={100}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="authorEmail" className="flex items-center space-x-1 text-sm">
              <Mail className="h-3 w-3" />
              <span>Email *</span>
            </Label>
            <Input
              id="authorEmail"
              type="email"
              value={formData.authorEmail}
              onChange={(e) => handleInputChange('authorEmail', e.target.value)}
              placeholder="votre@email.com"
              maxLength={254}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ne sera pas publié
            </p>
          </div>
          
          <div className="sm:col-span-2">
            <Label htmlFor="authorWebsite" className="flex items-center space-x-1 text-sm">
              <LinkIcon className="h-3 w-3" />
              <span>Site web (optionnel)</span>
            </Label>
            <Input
              id="authorWebsite"
              type="url"
              value={formData.authorWebsite}
              onChange={(e) => handleInputChange('authorWebsite', e.target.value)}
              placeholder="https://votre-site.com"
            />
          </div>
        </div>
      )}
      
      {/* Conditions d'utilisation */}
      <div className="flex items-start space-x-2">
        <Checkbox
          id="terms"
          checked={agreedToTerms}
          onCheckedChange={setAgreedToTerms}
          className="mt-0.5"
          required
        />
        <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
          J'accepte que mon commentaire soit soumis à modération et je respecte les{' '}
          <a 
            href="/terms" 
            target="_blank" 
            className="text-primary hover:underline"
          >
            conditions d'utilisation
          </a>
          .
        </Label>
      </div>
      
      {/* Message d'erreur */}
      {error && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Boutons d'action */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-muted-foreground">
          {parentCommentId ? 'Réponse' : 'Commentaire'} soumis à modération
        </div>
        
        <div className="flex items-center space-x-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1" />
              Annuler
            </Button>
          )}
          
          <Button
            type="submit"
            size="sm"
            disabled={!isFormValid || isSubmitting}
            className="flex items-center space-x-1"
          >
            <Send className="h-4 w-4" />
            <span>
              {isSubmitting 
                ? 'Envoi...' 
                : parentCommentId 
                  ? 'Répondre' 
                  : 'Publier'
              }
            </span>
          </Button>
        </div>
      </div>
      
      {/* Informations sur la modération */}
      {!compact && (
        <div className="p-3 bg-muted/30 rounded-md">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Note:</strong> Tous les commentaires sont modérés avant publication. 
            Nous nous réservons le droit de supprimer tout contenu inapproprié, spam ou hors-sujet. 
            Les commentaires respectueux et constructifs sont encouragés.
          </p>
        </div>
      )}
    </form>
  )
}