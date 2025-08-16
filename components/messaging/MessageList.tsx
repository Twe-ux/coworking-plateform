'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow, format, isSameDay, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  MoreVertical, 
  Reply, 
  Edit, 
  Trash2, 
  Copy, 
  Flag,
  Download,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  Bot
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { ClientMessage, UserPresence } from '@/lib/websocket/client'
import { EmojiReactions } from './EmojiReactions'

interface MessageListProps {
  messages: ClientMessage[]
  currentUserId: string
  onReaction?: (messageId: string, emoji: string) => void
  onReply?: (message: ClientMessage) => void
  onEdit?: (message: ClientMessage) => void
  onDelete?: (messageId: string) => void
  userPresence?: Map<string, UserPresence>
}

interface MessageItemProps {
  message: ClientMessage
  previousMessage?: ClientMessage
  nextMessage?: ClientMessage
  currentUserId: string
  onReaction?: (messageId: string, emoji: string) => void
  onReply?: (message: ClientMessage) => void
  onEdit?: (message: ClientMessage) => void
  onDelete?: (messageId: string) => void
  showAvatar: boolean
  showTimestamp: boolean
}

function MessageItem({
  message,
  previousMessage,
  nextMessage,
  currentUserId,
  onReaction,
  onReply,
  onEdit,
  onDelete,
  showAvatar,
  showTimestamp
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false)
  const [showFullTimestamp, setShowFullTimestamp] = useState(false)
  const isOwnMessage = message.sender._id === currentUserId
  const isSystemMessage = message.messageType === 'system'
  const isAIMessage = message.messageType === 'ai_response'

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content)
  }

  const formatTimestamp = (date: string) => {
    const messageDate = new Date(date)
    
    if (showFullTimestamp) {
      return format(messageDate, 'PPPp', { locale: fr })
    }
    
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm')
    } else if (isYesterday(messageDate)) {
      return `Hier ${format(messageDate, 'HH:mm')}`
    } else {
      return format(messageDate, 'dd/MM HH:mm')
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null

    return (
      <div className="mt-2 space-y-2">
        {message.attachments.map((attachment, index) => (
          <div
            key={index}
            className="border rounded-lg p-3 bg-gray-50 max-w-sm"
          >
            {attachment.type === 'image' ? (
              <div className="space-y-2">
                <img
                  src={attachment.url}
                  alt={attachment.filename}
                  className="max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(attachment.url, '_blank')}
                />
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{attachment.filename}</span>
                  <span>{(attachment.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {getFileIcon(attachment.mimeType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.filename}</p>
                  <p className="text-xs text-gray-600">
                    {(attachment.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(attachment.url, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderMentions = () => {
    if (!message.mentions || message.mentions.length === 0) return message.content

    let content = message.content
    message.mentions.forEach(mention => {
      const mentionRegex = new RegExp(`@${mention.name}`, 'gi')
      content = content.replace(
        mentionRegex,
        `<span class="bg-blue-100 text-blue-800 px-1 rounded font-medium">@${mention.name}</span>`
      )
    })

    return <span dangerouslySetInnerHTML={{ __html: content }} />
  }

  if (isSystemMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-4"
      >
        <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
          {message.content}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative flex gap-3 px-4 py-2 hover:bg-gray-50 transition-colors",
        showAvatar ? "mt-4" : "mt-1"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-10">
        {showAvatar ? (
          <Avatar className="h-10 w-10">
            <AvatarImage src={message.sender.avatar} />
            <AvatarFallback>
              {isAIMessage ? (
                <Bot className="h-5 w-5" />
              ) : (
                message.sender.name.charAt(0).toUpperCase()
              )}
            </AvatarFallback>
          </Avatar>
        ) : null}
      </div>

      {/* Contenu du message */}
      <div className="flex-1 min-w-0">
        {showAvatar && (
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">
              {message.sender.name}
            </span>
            
            {isAIMessage && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                <Bot className="h-3 w-3 mr-1" />
                IA
              </Badge>
            )}
            
            <Badge variant="outline" className="text-xs">
              {message.sender.role}
            </Badge>
            
            <Tooltip>
              <TooltipTrigger>
                <button
                  className="text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => setShowFullTimestamp(!showFullTimestamp)}
                >
                  {formatTimestamp(message.createdAt)}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {format(new Date(message.createdAt), 'PPPp', { locale: fr })}
              </TooltipContent>
            </Tooltip>
            
            {message.isEdited && (
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-xs text-gray-500">(modifié)</span>
                </TooltipTrigger>
                <TooltipContent>
                  Modifié le {format(new Date(message.editedAt!), 'PPp', { locale: fr })}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Message parent (réponse) */}
        {message.parentMessage && (
          <div className="bg-gray-100 border-l-2 border-gray-300 pl-3 py-2 mb-2 rounded text-sm">
            <div className="flex items-center gap-2 mb-1">
              <Reply className="h-3 w-3 text-gray-500" />
              <span className="font-medium text-gray-700">
                Réponse à {message.parentMessage.sender.name}
              </span>
            </div>
            <p className="text-gray-600 truncate">
              {message.parentMessage.content}
            </p>
          </div>
        )}

        {/* Contenu du message */}
        <div className="text-gray-900 break-words">
          {renderMentions()}
        </div>

        {/* Pièces jointes */}
        {renderAttachments()}

        {/* Réactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-2">
            <EmojiReactions
              reactions={message.reactions}
              onReaction={onReaction ? (emoji) => onReaction(message._id, emoji) : undefined}
              currentUserId={currentUserId}
            />
          </div>
        )}
      </div>

      {/* Actions du message */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute right-4 top-2 bg-white border rounded-lg shadow-lg flex"
          >
            {onReaction && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReaction(message._id, '👍')}
                  >
                    👍
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ajouter une réaction</TooltipContent>
              </Tooltip>
            )}

            {onReply && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReply(message)}
                  >
                    <Reply className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Répondre</TooltipContent>
              </Tooltip>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyMessage}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le message
                </DropdownMenuItem>
                
                {isOwnMessage && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(message)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                )}
                
                {(isOwnMessage || currentUserId) && onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(message._id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem>
                  <Flag className="h-4 w-4 mr-2" />
                  Signaler
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function DateSeparator({ date }: { date: Date }) {
  const formatDate = () => {
    if (isToday(date)) {
      return "Aujourd'hui"
    } else if (isYesterday(date)) {
      return 'Hier'
    } else {
      return format(date, 'EEEE d MMMM yyyy', { locale: fr })
    }
  }

  return (
    <div className="flex items-center justify-center my-6">
      <div className="bg-white border px-4 py-2 rounded-full shadow-sm">
        <span className="text-sm font-medium text-gray-700">
          {formatDate()}
        </span>
      </div>
    </div>
  )
}

export function MessageList({
  messages,
  currentUserId,
  onReaction,
  onReply,
  onEdit,
  onDelete,
  userPresence
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <p>Aucun message pour le moment</p>
          <p className="text-sm">Soyez le premier à écrire dans ce channel!</p>
        </div>
      </div>
    )
  }

  // Grouper les messages par jour et déterminer quand afficher l'avatar
  const groupedMessages = messages.reduce((acc, message, index) => {
    const messageDate = new Date(message.createdAt)
    const previousMessage = messages[index - 1]
    const nextMessage = messages[index + 1]
    
    // Déterminer si on doit afficher l'avatar
    const showAvatar = !previousMessage ||
      previousMessage.sender._id !== message.sender._id ||
      !isSameDay(new Date(previousMessage.createdAt), messageDate) ||
      (new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime()) > 5 * 60 * 1000 // 5 minutes

    // Déterminer si on doit afficher la date
    const showDateSeparator = !previousMessage ||
      !isSameDay(new Date(previousMessage.createdAt), messageDate)

    if (showDateSeparator) {
      acc.push({
        type: 'date',
        date: messageDate,
        id: `date-${messageDate.toISOString()}`
      })
    }

    acc.push({
      type: 'message',
      message,
      previousMessage,
      nextMessage,
      showAvatar,
      showTimestamp: showAvatar,
      id: message._id
    })

    return acc
  }, [] as Array<{
    type: 'date' | 'message'
    date?: Date
    message?: ClientMessage
    previousMessage?: ClientMessage
    nextMessage?: ClientMessage
    showAvatar?: boolean
    showTimestamp?: boolean
    id: string
  }>)

  return (
    <div className="space-y-0">
      <AnimatePresence>
        {groupedMessages.map((item) => {
          if (item.type === 'date') {
            return <DateSeparator key={item.id} date={item.date!} />
          }

          return (
            <MessageItem
              key={item.id}
              message={item.message!}
              previousMessage={item.previousMessage}
              nextMessage={item.nextMessage}
              currentUserId={currentUserId}
              onReaction={onReaction}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              showAvatar={item.showAvatar!}
              showTimestamp={item.showTimestamp!}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}