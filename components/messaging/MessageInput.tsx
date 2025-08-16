'use client'

import { useState, useRef, useCallback, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Smile, Paperclip, AtSign, Hash, Bold, Italic, Code, Image, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import { EmojiPicker } from './EmojiPicker'
import { AttachmentUpload } from './AttachmentUpload'

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: any[]) => void
  onTyping?: () => void
  placeholder?: string
  allowFileUpload?: boolean
  allowReactions?: boolean
  disabled?: boolean
  replyingTo?: {
    _id: string
    content: string
    sender: {
      name: string
    }
  }
  onCancelReply?: () => void
  maxLength?: number
  slowModeDelay?: number
}

interface Attachment {
  file: File
  url: string
  type: 'image' | 'file'
  preview?: string
}

interface MentionSuggestion {
  _id: string
  name: string
  avatar?: string
  role: string
}

interface ChannelSuggestion {
  _id: string
  name: string
  type: string
}

export function MessageInput({
  onSendMessage,
  onTyping,
  placeholder = 'Tapez votre message...',
  allowFileUpload = true,
  allowReactions = true,
  disabled = false,
  replyingTo,
  onCancelReply,
  maxLength = 10000,
  slowModeDelay = 0
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachmentUpload, setShowAttachmentUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [mentions, setMentions] = useState<MentionSuggestion[]>([])
  const [channels, setChannels] = useState<ChannelSuggestion[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [showChannels, setShowChannels] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [channelQuery, setChannelQuery] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Ajuster automatiquement la hauteur du textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 200 // Maximum 200px
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }, [])

  // Gérer les changements de texte
  const handleMessageChange = (value: string) => {
    setMessage(value)
    onTyping?.()
    
    // Ajuster la hauteur
    setTimeout(adjustTextareaHeight, 0)
    
    // Détecter les mentions (@)
    const mentionMatch = value.match(/@([a-zA-Z0-9_]*)$/)
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
      setShowMentions(true)
      // TODO: Rechercher les utilisateurs
    } else {
      setShowMentions(false)
    }
    
    // Détecter les channels (#)
    const channelMatch = value.match(/#([a-zA-Z0-9_-]*)$/)
    if (channelMatch) {
      setChannelQuery(channelMatch[1])
      setShowChannels(true)
      // TODO: Rechercher les channels
    } else {
      setShowChannels(false)
    }
  }

  // Gérer les touches du clavier
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Envoyer avec Ctrl+Enter ou Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSendMessage()
      return
    }
    
    // Enter simple pour nouvelle ligne
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
      return
    }
    
    // Navigation dans les suggestions
    if (showMentions || showChannels) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Tab') {
        e.preventDefault()
        // TODO: Navigation dans les suggestions
      }
      if (e.key === 'Escape') {
        setShowMentions(false)
        setShowChannels(false)
      }
    }
  }

  // Envoyer le message
  const handleSendMessage = () => {
    if (!message.trim() && attachments.length === 0) return
    if (disabled || cooldownRemaining > 0) return

    // Préparer les attachments
    const messageAttachments = attachments.map(attachment => ({
      url: attachment.url,
      type: attachment.type,
      filename: attachment.file.name,
      size: attachment.file.size,
      mimeType: attachment.file.type
    }))

    // Envoyer le message
    onSendMessage(message.trim(), messageAttachments)

    // Réinitialiser
    setMessage('')
    setAttachments([])
    setShowEmojiPicker(false)
    
    // Remettre la hauteur du textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Gérer le slow mode
    if (slowModeDelay > 0) {
      setCooldownRemaining(slowModeDelay)
      const interval = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  // Ajouter un emoji
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newMessage = message.slice(0, start) + emoji + message.slice(end)
      setMessage(newMessage)
      
      // Replacer le curseur après l'emoji
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    }
    setShowEmojiPicker(false)
  }

  // Gérer l'upload de fichiers
  const handleFileSelect = async (files: FileList) => {
    if (!allowFileUpload) return

    setIsUploading(true)
    const newAttachments: Attachment[] = []

    for (const file of Array.from(files)) {
      // Vérifications
      if (file.size > 50 * 1024 * 1024) { // 50MB max
        alert(`Le fichier ${file.name} est trop volumineux (max 50MB)`)
        continue
      }

      // Créer l'URL pour l'aperçu
      const url = URL.createObjectURL(file)
      
      const attachment: Attachment = {
        file,
        url,
        type: file.type.startsWith('image/') ? 'image' : 'file'
      }

      // Créer un aperçu pour les images
      if (attachment.type === 'image') {
        attachment.preview = url
      }

      newAttachments.push(attachment)
    }

    setAttachments(prev => [...prev, ...newAttachments])
    setIsUploading(false)
  }

  // Supprimer un attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev]
      URL.revokeObjectURL(newAttachments[index].url)
      newAttachments.splice(index, 1)
      return newAttachments
    })
  }

  // Formatage du texte
  const formatText = (format: 'bold' | 'italic' | 'code') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = message.slice(start, end)

    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'code':
        formattedText = `\`${selectedText}\``
        break
    }

    const newMessage = message.slice(0, start) + formattedText + message.slice(end)
    setMessage(newMessage)

    // Replacer le curseur
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + formattedText.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  const isMessageEmpty = !message.trim() && attachments.length === 0
  const isOverLimit = message.length > maxLength

  return (
    <div className="relative">
      {/* Message de réponse */}
      {replyingTo && (
        <div className="bg-gray-50 border-l-4 border-blue-500 p-3 mb-2 rounded-r">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              Réponse à {replyingTo.sender.name}
            </span>
            {onCancelReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelReply}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate max-w-md">
            {replyingTo.content}
          </p>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-3">
          <ScrollArea className="max-h-32">
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group"
                >
                  {attachment.type === 'image' ? (
                    <div className="relative w-20 h-20 bg-gray-100 rounded border overflow-hidden">
                      <img
                        src={attachment.preview}
                        alt={attachment.file.name}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-gray-100 rounded p-2 max-w-48">
                      <div className="p-1 bg-white rounded">
                        <Paperclip className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {attachment.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Zone de saisie principale */}
      <div className="relative border rounded-lg bg-white">
        {/* Barre d'outils de formatage */}
        <div className="flex items-center justify-between p-2 border-b bg-gray-50">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('bold')}
                  className="h-8 w-8 p-0"
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Gras (Ctrl+B)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('italic')}
                  className="h-8 w-8 p-0"
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italique (Ctrl+I)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('code')}
                  className="h-8 w-8 p-0"
                >
                  <Code className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Code (Ctrl+`)</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-1">
            {/* Compteur de caractères */}
            <span className={cn(
              "text-xs",
              isOverLimit ? "text-red-500" : "text-gray-500"
            )}>
              {message.length}/{maxLength}
            </span>

            {/* Cooldown */}
            {cooldownRemaining > 0 && (
              <Badge variant="outline" className="text-xs">
                {cooldownRemaining}s
              </Badge>
            )}
          </div>
        </div>

        {/* Zone de texte */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || cooldownRemaining > 0}
            className={cn(
              "min-h-12 max-h-48 resize-none border-0 focus:ring-0 rounded-none",
              "placeholder:text-gray-400"
            )}
            style={{ paddingRight: '120px' }}
          />

          {/* Boutons d'action */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            {allowFileUpload && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,*"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled || isUploading}
                      className="h-8 w-8 p-0"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Joindre un fichier</TooltipContent>
                </Tooltip>
              </>
            )}

            {allowReactions && (
              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      disabled={disabled}
                      className="h-8 w-8 p-0"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ajouter un emoji</TooltipContent>
                </Tooltip>

                <AnimatePresence>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 z-50">
                      <EmojiPicker
                        onEmojiSelect={handleEmojiSelect}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSendMessage}
                  disabled={disabled || isMessageEmpty || isOverLimit || cooldownRemaining > 0}
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Envoyer (Ctrl+Enter)
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Suggestions de mentions */}
        <AnimatePresence>
          {showMentions && mentions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-full left-0 right-0 mb-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto z-50"
            >
              {mentions.map((mention) => (
                <button
                  key={mention._id}
                  className="w-full p-2 hover:bg-gray-50 flex items-center gap-2 text-left"
                  onClick={() => {
                    // TODO: Insérer la mention
                  }}
                >
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                    {mention.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{mention.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {mention.role}
                  </Badge>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Aide */}
      <div className="mt-2 text-xs text-gray-500">
        <span>Ctrl+Enter pour envoyer • Shift+Enter pour nouvelle ligne</span>
        {slowModeDelay > 0 && (
          <span> • Slow mode: {slowModeDelay}s entre les messages</span>
        )}
      </div>
    </div>
  )
}