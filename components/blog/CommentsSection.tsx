/**
 * Section complète des commentaires pour les articles de blog
 * Affichage, ajout et gestion des commentaires publics
 */

'use client'

import { useState } from 'react'
import { MessageCircle, Plus, Minus, Reply, Flag, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'
import { useComments } from '@/hooks/use-blog'
import type { Comment } from '@/types/blog'

interface CommentsSectionProps {
  articleId: string
}

export function CommentsSection({ articleId }: CommentsSectionProps) {
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest')
  
  // Récupérer les commentaires approuvés
  const { 
    comments, 
    meta, 
    isLoading, 
    error, 
    refresh 
  } = useComments({
    articleId,
    filters: { 
      status: 'approved' // Seulement les commentaires approuvés pour le public
    },
    pagination: { 
      page: 1, 
      limit: 50, 
      sortBy: sortBy === 'newest' ? 'createdAt' : sortBy === 'oldest' ? 'createdAt' : 'createdAt',
      sortOrder: sortBy === 'oldest' ? 'asc' : 'desc' 
    }
  })
  
  // Organiser les commentaires en structure hiérarchique
  const organizeComments = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment & { replies: Comment[] }>()
    const rootComments: (Comment & { replies: Comment[] })[] = []
    
    // Créer une map de tous les commentaires
    comments.forEach(comment => {
      commentMap.set(comment._id, { ...comment, replies: [] })
    })
    
    // Organiser en hiérarchie
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment._id)!
      
      if (comment.parentComment && typeof comment.parentComment === 'string') {
        const parent = commentMap.get(comment.parentComment)
        if (parent) {
          parent.replies.push(commentWithReplies)
        } else {
          // Commentaire parent non trouvé, traiter comme commentaire racine
          rootComments.push(commentWithReplies)
        }
      } else {
        rootComments.push(commentWithReplies)
      }
    })
    
    return rootComments
  }
  
  const organizedComments = organizeComments(comments)
  const totalComments = meta?.total || 0
  
  const handleCommentSubmitted = () => {
    // Rafraîchir la liste des commentaires
    refresh()
    setShowCommentForm(false)
  }
  
  const handleCommentError = (error: string) => {
    console.error('Erreur commentaire:', error)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>
              Commentaires ({totalComments})
            </span>
          </CardTitle>
          
          {/* Options de tri */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              <option value="newest">Plus récents</option>
              <option value="oldest">Plus anciens</option>
              <option value="popular">Plus populaires</option>
            </select>
          </div>
        </div>
        
        {/* Bouton pour ajouter un commentaire */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Partagez votre opinion sur cet article
          </p>
          
          <Button
            variant={showCommentForm ? "outline" : "default"}
            size="sm"
            onClick={() => setShowCommentForm(!showCommentForm)}
            className="flex items-center space-x-1"
          >
            {showCommentForm ? (
              <>
                <Minus className="h-4 w-4" />
                <span>Annuler</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Ajouter un commentaire</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Formulaire de commentaire */}
        {showCommentForm && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <CommentForm
              articleId={articleId}
              onSubmitted={handleCommentSubmitted}
              onError={handleCommentError}
              onCancel={() => setShowCommentForm(false)}
            />
          </div>
        )}
        
        {/* État de chargement */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Erreur */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">
              Erreur lors du chargement des commentaires
            </p>
            <Button variant="outline" onClick={() => refresh()}>
              Réessayer
            </Button>
          </div>
        )}
        
        {/* Commentaires */}
        {!isLoading && !error && (
          <div className="space-y-6">
            {totalComments === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun commentaire</h3>
                <p className="text-muted-foreground mb-4">
                  Soyez le premier à commenter cet article !
                </p>
                {!showCommentForm && (
                  <Button onClick={() => setShowCommentForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Écrire un commentaire
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {organizedComments.map((comment) => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    articleId={articleId}
                    onReplySubmitted={handleCommentSubmitted}
                    depth={0}
                    maxDepth={3}
                  />
                ))}
                
                {/* Message si beaucoup de commentaires */}
                {totalComments > 50 && (
                  <div className="text-center pt-6 border-t">
                    <p className="text-sm text-muted-foreground mb-3">
                      Seuls les 50 premiers commentaires sont affichés
                    </p>
                    <Button variant="outline" size="sm">
                      Charger plus de commentaires
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}