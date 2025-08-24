'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMessaging } from '@/hooks/use-messaging'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot,
  Building,
  Check,
  CheckCheck,
  ExternalLink,
  Globe,
  Hash,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface Message {
  _id: string
  content: string
  messageType: 'text' | 'image' | 'file' | 'system'
  sender: {
    _id: string
    name: string
    avatar?: string
    role?: string
  }
  channel: string
  createdAt: string
  reactions?: any[]
  attachments?: any[]
  readBy?: {
    user: string
    readAt: string
  }[]
}

interface UserProfile {
  _id: string
  name: string
  email: string
  avatar?: string
  role?: string
  bio?: string
  profession?: string
  website?: string
  phone?: string
  location?: string
  company?: string
  isOnline?: boolean
  firstName?: string
  lastName?: string
}

interface ChatWindowProps {
  chatId?: string
  chatName?: string
  chatAvatar?: string
  isOnline?: boolean
  userProfile?: UserProfile
  onStartChatWithUser?: () => void
}

export function ChatWindow({
  chatId,
  chatName,
  chatAvatar,
  isOnline,
  userProfile,
  onStartChatWithUser,
}: ChatWindowProps) {
  const { data: session } = useSession()
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const {
    socket,
    isConnected,
    messages,
    sendMessage: sendSocketMessage,
    loadMessages,
    joinChannel,
    markMessagesAsRead,
  } = useMessaging()

  // Scroll automatique vers le dernier message (zone de chat seulement)
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      // Méthode 1: Scroll direct du conteneur
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      })
    } else if (messagesEndRef.current) {
      // Méthode 2: scrollIntoView avec options restrictives
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [])

  // Charger les messages quand on sélectionne un chat
  useEffect(() => {
    if (chatId && socket && isConnected) {
      setIsLoading(true)

      // Rejoindre le channel
      joinChannel(chatId)

      // Charger l'historique
      loadMessages(chatId).then((msgs) => {
        // Marquer les messages des autres comme lus
        if (msgs && msgs.length > 0) {
          const unreadMessageIds = msgs
            .filter(
              (msg) =>
                msg.sender._id !== session?.user?.id &&
                !msg.readBy?.some((read) => read.user === session?.user?.id)
            )
            .map((msg) => msg._id)

          if (unreadMessageIds.length > 0) {
            setTimeout(() => {
              markMessagesAsRead(chatId, unreadMessageIds)
            }, 1500) // Délai pour simuler la lecture
          }
        }

        setTimeout(scrollToBottom, 100) // Scroll vers le dernier message
        setIsLoading(false)
      })
    }
  }, [
    chatId,
    socket,
    isConnected,
    joinChannel,
    loadMessages,
    markMessagesAsRead,
    session?.user?.id,
    scrollToBottom,
  ])

  // Scroll automatiquement quand les messages changent  
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100)
    }
  }, [messages, scrollToBottom])

  // Marquer automatiquement les messages comme lus
  useEffect(() => {
    if (!chatId || !messages.length) return

    const unreadMessages = messages.filter(
      (message) =>
        message.sender._id !== session?.user?.id &&
        !message.readBy?.some((read) => read.user === session?.user?.id)
    )

    if (unreadMessages.length > 0) {
      setTimeout(() => {
        markMessagesAsRead(chatId, unreadMessages.map(m => m._id))
      }, 1000) // Délai d'1 seconde pour simuler la lecture
    }
  }, [messages, chatId, session?.user?.id, markMessagesAsRead])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !socket || !isConnected) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    // Arrêter l'indicateur de frappe
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    if (socket) {
      socket.send(JSON.stringify({ type: 'typing', channelId: chatId, isTyping: false }))
    }

    try {
      await sendSocketMessage(chatId, messageContent)
      setTimeout(scrollToBottom, 100) // Scroll après envoi
    } catch (error) {
      console.error('Erreur envoi message:', error)
    }
  }

  const handleTyping = () => {
    if (!socket || !chatId) return

    socket.send(JSON.stringify({ type: 'typing', channelId: chatId, isTyping: true }))

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.send(JSON.stringify({ type: 'typing', channelId: chatId, isTyping: false }))
    }, 2000)
  }

  const getUserDisplayName = (user: UserProfile) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || user.email || 'Utilisateur'
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isMyMessage = (message: Message) => {
    return message.sender._id === session?.user?.id
  }

  const isLastMyMessage = (message: Message, index: number) => {
    if (!isMyMessage(message)) return false

    // Chercher s'il y a un message plus récent de moi après celui-ci
    for (let i = index + 1; i < messages.length; i++) {
      if (isMyMessage(messages[i])) {
        return false // Il y a un message plus récent de moi
      }
    }
    return true // C'est le dernier message que j'ai envoyé
  }

  const getMessageStatus = (message: Message) => {
    if (!isMyMessage(message)) return null // Pas de statut pour les messages d'autres utilisateurs

    // Si pas de readBy, le message est envoyé mais pas lu
    if (!message.readBy || message.readBy.length === 0) {
      return 'sent' // Une seule coche
    }

    // Si l'autre utilisateur a lu le message (dans un DM)
    const otherUserHasRead = message.readBy.some(
      (read) => read.user !== session?.user?.id
    )
    return otherUserHasRead ? 'read' : 'sent'
  }

  const renderMessageStatus = (message: Message) => {
    const status = getMessageStatus(message)

    if (status === 'sent') {
      return (
        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <Check className="h-3 w-3" />
          <span>Envoyé</span>
        </div>
      )
    } else if (status === 'read') {
      return (
        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <CheckCheck className="h-3 w-3" />
          <span>Lu</span>
        </div>
      )
    }

    return null
  }

  // Vue profil utilisateur
  if (userProfile) {
    console.log('👤 UserProfile data:', userProfile)
    return (
      <div className="flex h-full flex-col">
        {/* Header profil centré */}
        <div className="border-b p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={userProfile.avatar}
                alt={getUserDisplayName(userProfile)}
              />
              <AvatarFallback className="text-xl">
                {getUserDisplayName(userProfile)
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                {userProfile.firstName && userProfile.lastName
                  ? `${userProfile.firstName} ${userProfile.lastName}`
                  : getUserDisplayName(userProfile)}
              </h2>

              {userProfile.bio ? (
                <p className="mx-auto max-w-md leading-relaxed text-gray-600">
                  {userProfile.bio}
                </p>
              ) : (
                <p className="mx-auto max-w-md text-sm text-gray-400 italic">
                  Aucune bio disponible
                </p>
              )}

              <div className="flex items-center justify-center gap-2">
                <Badge variant={userProfile.isOnline ? 'default' : 'secondary'}>
                  {userProfile.isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}
                </Badge>
                {userProfile.role && (
                  <Badge variant="outline">{userProfile.role}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu profil */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Informations professionnelles */}
            <div>
              <h3 className="mb-3 text-lg font-semibold">
                Informations professionnelles
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Travail
                  </label>
                  <p className="text-sm">
                    {userProfile.profession || 'Non renseigné'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Entreprise
                  </label>
                  <p className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4" />
                    {userProfile.company || 'Non renseigné'}
                  </p>
                </div>

                {userProfile.website && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Site web
                    </label>
                    <a
                      href={userProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 transition-colors hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {userProfile.website}
                    </a>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Localisation
                  </label>
                  <p className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4" />
                    {userProfile.location || 'Non renseigné'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            {userProfile.phone && (
              <div>
                <h3 className="mb-3 text-lg font-semibold">Contact</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Téléphone
                    </label>
                    <p className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4" />
                      {userProfile.phone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action */}
            <div className="pt-4">
              <Button
                onClick={() => {
                  console.log(
                    '🔥 Button clicked! UserProfile:',
                    userProfile?._id
                  )
                  onStartChatWithUser?.()
                }}
                className="w-full"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Envoyer un message
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Vue chat vide
  if (!chatId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md text-center">
          <MessageCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold">
            Sélectionnez une conversation
          </h3>
          <p className="text-gray-600">
            Choisissez un channel ou un contact pour commencer à discuter
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header du chat */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              {chatName?.includes('Direct:') ? (
                <MessageCircle className="h-6 w-6 text-green-600" />
              ) : chatName?.includes('Assistant') ? (
                <Bot className="h-6 w-6 text-purple-600" />
              ) : (
                <Hash className="h-6 w-6 text-blue-600" />
              )}

              <div>
                <h2 className="font-semibold">{chatName}</h2>
                {isOnline && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    En ligne
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? '🟢 Connecté' : '🔴 Déconnecté'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ScrollArea
          ref={scrollAreaRef}
          className="flex-1 overflow-y-scroll p-4"
        >
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              <AnimatePresence>
                {messages.map((message, index) => {
                  const isMe = isMyMessage(message)
                  const showAvatar =
                    !isMe &&
                    (index === 0 ||
                      messages[index - 1]?.sender._id !== message.sender._id)

                  return (
                    <motion.div
                      key={message._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={cn(
                        'flex max-w-[80%] gap-3',
                        isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      )}
                    >
                      {!isMe && (
                        <div className="flex flex-col items-center">
                          {showAvatar ? (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.sender.avatar} />
                              <AvatarFallback className="text-xs">
                                {message.sender.name
                                  ?.split(' ')
                                  .map((n) => n[0])
                                  .join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-8 w-8" />
                          )}
                        </div>
                      )}

                      <div
                        className={cn(
                          'flex flex-col gap-1',
                          isMe && 'items-end'
                        )}
                      >
                        {!isMe && showAvatar && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {message.sender.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col">
                          <div
                            className={cn(
                              'relative max-w-md px-4 py-2 break-words shadow-sm',
                              isMe
                                ? 'rounded-2xl rounded-br-md bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : 'rounded-2xl rounded-bl-md border border-gray-200 bg-white text-gray-900'
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                            {isMe && (
                              <span className="mt-1 block text-xs text-blue-100">
                                {formatTime(message.createdAt)}
                              </span>
                            )}
                          </div>

                          {/* Statut sous la bulle - seulement sur le dernier message que j'ai envoyé */}
                          {isLastMyMessage(message, index) && (
                            <div className="mt-1 flex justify-end">
                              {renderMessageStatus(message)}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Indicateur de frappe */}
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mr-auto mb-2 flex max-w-[80%] items-end gap-3"
                >
                  <div className="flex flex-col items-center">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-xs text-blue-700">
                        {typingUsers[0]
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex min-h-[48px] items-center rounded-2xl rounded-bl-md border border-blue-200 bg-blue-50 px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-blue-600"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-blue-700"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </ScrollArea>

        {/* Zone de saisie */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping()
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder={`Envoyer un message${chatName ? ` dans ${chatName}` : ''}...`}
              disabled={!isConnected}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!isConnected || !newMessage.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {!isConnected && (
            <p className="mt-2 text-xs text-red-500">
              Connexion perdue. Tentative de reconnexion...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
