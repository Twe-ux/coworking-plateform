'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { EmojiPicker } from './EmojiPicker'

interface Reaction {
  emoji: string
  users: string[]
  count: number
}

interface EmojiReactionsProps {
  reactions: Reaction[]
  onReaction?: (emoji: string) => void
  currentUserId: string
  maxVisible?: number
  className?: string
}

export function EmojiReactions({
  reactions,
  onReaction,
  currentUserId,
  maxVisible = 6,
  className
}: EmojiReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  if (reactions.length === 0 && !onReaction) {
    return null
  }

  const visibleReactions = reactions.slice(0, maxVisible)
  const hiddenCount = Math.max(0, reactions.length - maxVisible)

  const handleReactionClick = (emoji: string) => {
    if (!onReaction) return
    onReaction(emoji)
  }

  const handleEmojiSelect = (emoji: string) => {
    if (onReaction) {
      onReaction(emoji)
    }
    setShowEmojiPicker(false)
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      <AnimatePresence>
        {visibleReactions.map((reaction) => {
          const hasUserReacted = reaction.users.includes(currentUserId)
          
          return (
            <motion.div
              key={reaction.emoji}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={hasUserReacted ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleReactionClick(reaction.emoji)}
                    className={cn(
                      'h-7 px-2 py-1 text-sm gap-1 transition-all',
                      hasUserReacted
                        ? 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200'
                        : 'hover:bg-gray-50'
                    )}
                  >
                    <span className="text-base">{reaction.emoji}</span>
                    <span className="text-xs font-medium">{reaction.count}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-48">
                    <p className="font-medium mb-1">
                      {reaction.emoji} {reaction.count} {reaction.count === 1 ? 'réaction' : 'réactions'}
                    </p>
                    {reaction.users.length > 0 && (
                      <div className="text-xs text-gray-600">
                        {reaction.users.slice(0, 10).map((userId, index) => (
                          <span key={userId}>
                            {userId === currentUserId ? 'Vous' : `Utilisateur ${index + 1}`}
                            {index < Math.min(reaction.users.length, 10) - 1 && ', '}
                          </span>
                        ))}
                        {reaction.users.length > 10 && (
                          <span> et {reaction.users.length - 10} autres</span>
                        )}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Indicateur pour les réactions cachées */}
      {hiddenCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 py-1 text-xs text-gray-500"
            >
              +{hiddenCount}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hiddenCount} réaction{hiddenCount > 1 ? 's' : ''} supplémentaire{hiddenCount > 1 ? 's' : ''}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Bouton d'ajout de réaction */}
      {onReaction && (
        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ajouter une réaction</TooltipContent>
          </Tooltip>

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 mt-2 z-50"
              >
                <EmojiPicker
                  onEmojiSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}