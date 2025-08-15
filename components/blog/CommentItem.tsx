/**
 * Composant pour afficher un commentaire individuel
 * Support des réponses imbriquées et des actions
 */

'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Reply, 
  Flag, 
  Heart, 
  MessageCircle, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { CommentForm } from './CommentForm'
import type { Comment } from '@/types/blog'

interface CommentItemProps {
  comment: Comment & { replies?: Comment[] }
  articleId: string
  onReplySubmitted: () => void
  depth: number
  maxDepth: number
}

export function CommentItem({ 
  comment, 
  articleId, 
  onReplySubmitted, 
  depth, 
  maxDepth 
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { 
    addSuffix: true, 
    locale: fr 
  })
  
  const hasReplies = comment.replies && comment.replies.length > 0
  const canReply = depth < maxDepth
  
  // Initiales pour l'avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  
  const handleReplySubmitted = () => {
    setShowReplyForm(false)
    onReplySubmitted()
  }
  
  const handleLike = () => {
    setIsLiked(!isLiked)
    // Ici vous pourriez implémenter la logique pour liker un commentaire
  }
  
  const handleReport = () => {
    // Logique pour signaler un commentaire
    console.log('Signaler le commentaire:', comment._id)
  }

  return (
    <div className={`space-y-3 ${depth > 0 ? 'ml-6 pl-4 border-l-2 border-muted' : ''}`}>
      {/* Commentaire principal */}
      <div className="flex space-x-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage 
            src={comment.authorAvatar} 
            alt={comment.authorName}
          />
          <AvatarFallback className="text-xs">
            {getInitials(comment.authorName)}
          </AvatarFallback>
        </Avatar>
        
        {/* Contenu du commentaire */}
        <div className="flex-1 min-w-0">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-sm">
                {comment.authorName}
              </h4>
              
              {/* Site web de l'auteur */}
              {comment.authorWebsite && (
                <a
                  href={comment.authorWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              
              {/* Badge utilisateur vérifié */}
              {comment.isVerified && (
                <Badge variant="secondary" className="text-xs">
                  Vérifié
                </Badge>
              )}
              
              {/* Date */}
              <time 
                className="text-xs text-muted-foreground"
                dateTime={comment.createdAt.toString()}
              >
                {timeAgo}
              </time>
            </div>
            
            {/* Menu d'actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleReport}>
                  <Flag className="h-4 w-4 mr-2" />
                  Signaler
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Contenu du commentaire */}
          <div className="prose prose-sm max-w-none text-foreground mb-3">
            <p className="leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-4 text-xs">
            {/* Like */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 px-2 space-x-1 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
              onClick={handleLike}
            >
              <Heart className={`h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
              <span>Utile</span>
            </Button>
            
            {/* Répondre */}
            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 space-x-1 text-muted-foreground"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <Reply className="h-3 w-3" />
                <span>Répondre</span>
              </Button>
            )}
            
            {/* Nombre de réponses */}
            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 space-x-1 text-muted-foreground"
                onClick={() => setShowReplies(!showReplies)}
              >
                <MessageCircle className="h-3 w-3" />
                <span>
                  {comment.replies!.length} réponse{comment.replies!.length > 1 ? 's' : ''}
                </span>
                {showReplies ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Formulaire de réponse */}
      {showReplyForm && (
        <div className="ml-13 p-3 border rounded-lg bg-muted/30">
          <CommentForm
            articleId={articleId}
            parentCommentId={comment._id}
            onSubmitted={handleReplySubmitted}
            onCancel={() => setShowReplyForm(false)}
            placeholder={`Répondre à ${comment.authorName}...`}
            compact
          />
        </div>
      )}
      
      {/* Réponses */}
      {hasReplies && showReplies && (
        <div className="space-y-4 mt-4">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              articleId={articleId}
              onReplySubmitted={onReplySubmitted}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
          
          {/* Séparateur après les réponses */}
          {depth === 0 && <Separator className="my-6" />}
        </div>
      )}
    </div>
  )
}