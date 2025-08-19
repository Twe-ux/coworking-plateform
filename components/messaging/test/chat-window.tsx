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
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const {
    socket,
    isConnected,
    sendMessage: sendSocketMessage,
    loadMessages,
    joinChannel,
  } = useMessaging()

  // Supprimé le scroll automatique
  // const scrollToBottom = useCallback(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  // }, [])

  // Charger les messages quand on sélectionne un chat
  useEffect(() => {
    if (chatId && socket && isConnected) {
      setIsLoading(true)
      setMessages([])

      // Rejoindre le channel
      joinChannel(chatId)

      // Charger l'historique
      loadMessages(chatId).then((msgs) => {
        setMessages(msgs || [])
        // setTimeout(scrollToBottom, 100) // Supprimé le scroll automatique
        setIsLoading(false)
      })
    }
  }, [chatId, socket, isConnected, joinChannel, loadMessages])

  // Écouter les nouveaux messages
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: Message) => {
      if (message.channel === chatId) {
        setMessages((prev) => {
          // Éviter les doublons
          const exists = prev.find((m) => m._id === message._id)
          if (exists) return prev
          return [...prev, message]
        })
        // setTimeout(scrollToBottom, 100) // Supprimé le scroll automatique
      }
    }

    const handleChannelHistory = (data: {
      channelId: string
      messages: Message[]
    }) => {
      if (data.channelId === chatId) {
        setMessages(data.messages || [])
        // setTimeout(scrollToBottom, 100) // Supprimé le scroll automatique
      }
    }

    const handleTyping = (data: {
      userId: string
      userName: string
      isTyping: boolean
    }) => {
      if (data.isTyping) {
        setTypingUsers((prev) => [
          ...prev.filter((name) => name !== data.userName),
          data.userName,
        ])
      } else {
        setTypingUsers((prev) => prev.filter((name) => name !== data.userName))
      }
    }

    socket.on('new_message', handleNewMessage)
    socket.on('channel_history', handleChannelHistory)
    socket.on('user_typing', handleTyping)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('channel_history', handleChannelHistory)
      socket.off('user_typing', handleTyping)
    }
  }, [socket, chatId])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !socket || !isConnected) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    // Arrêter l'indicateur de frappe
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    if (socket) {
      socket.emit('typing_stop', { channelId: chatId })
    }

    try {
      await sendSocketMessage(chatId, messageContent)
    } catch (error) {
      console.error('Erreur envoi message:', error)
    }
  }

  const handleTyping = () => {
    if (!socket || !chatId) return

    socket.emit('typing_start', { channelId: chatId })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { channelId: chatId })
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

  // Vue profil utilisateur
  if (userProfile) {
    return (
      <div className="flex h-full flex-col">
        {/* Header profil */}
        <div className="border-b p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={userProfile.avatar}
                alt={getUserDisplayName(userProfile)}
              />
              <AvatarFallback className="text-lg">
                {getUserDisplayName(userProfile)
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="text-xl font-semibold">
                {getUserDisplayName(userProfile)}
              </h2>
              <div className="mt-1 flex items-center gap-2">
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
            {/* Informations de base */}
            <div>
              <h3 className="mb-3 text-lg font-semibold">Informations</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <p className="text-sm">{userProfile.email}</p>
                </div>

                {userProfile.profession && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Profession
                    </label>
                    <p className="text-sm">{userProfile.profession}</p>
                  </div>
                )}

                {userProfile.company && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Entreprise
                    </label>
                    <p className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4" />
                      {userProfile.company}
                    </p>
                  </div>
                )}

                {userProfile.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Localisation
                    </label>
                    <p className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4" />
                      {userProfile.location}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {userProfile.bio && (
              <div>
                <h3 className="mb-3 text-lg font-semibold">À propos</h3>
                <p className="text-sm leading-relaxed text-gray-700">
                  {userProfile.bio}
                </p>
              </div>
            )}

            {/* Liens et contact */}
            <div className="space-y-3">
              {userProfile.website && (
                <a
                  href={userProfile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 transition-colors hover:text-blue-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visiter le site web
                </a>
              )}

              {userProfile.phone && (
                <p className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  {userProfile.phone}
                </p>
              )}
            </div>

            {/* Action */}
            <div className="pt-4">
              <Button onClick={onStartChatWithUser} className="w-full">
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
        <ScrollArea className="flex-1 overflow-y-scroll p-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
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
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Indicateur de frappe */}
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-sm text-gray-500"
                >
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                  <span>
                    {typingUsers.join(', ')}{' '}
                    {typingUsers.length === 1 ? 'tape' : 'tapent'}...
                  </span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
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
