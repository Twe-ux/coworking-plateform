'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Smile, Paperclip, MoreVertical, Users, Settings, Hash, Lock, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/use-toast'

import { MessageList } from './MessageList'
import { ChannelList } from './ChannelList'
import { UserPresenceIndicator } from './UserPresenceIndicator'
import { TypingIndicator } from './TypingIndicator'
import { MessageInput } from './MessageInput'
import { EmojiPicker } from './EmojiPicker'
import { AttachmentUpload } from './AttachmentUpload'

import { getWebSocketClient, ClientMessage, UserPresence, TypingIndicator as TypingData } from '@/lib/websocket/client'
import { useSession } from 'next-auth/react'

interface Channel {
  _id: string
  name: string
  type: 'public' | 'private' | 'direct' | 'ai_assistant'
  description?: string
  unreadCount: number
  lastActivity: string
  members: {
    user: {
      _id: string
      name: string
      avatar?: string
      role: string
    }
    role: string
    lastSeen?: string
  }[]
  settings: {
    allowFileUploads: boolean
    allowReactions: boolean
    slowModeSeconds: number
  }
}

export interface ChatInterfaceProps {
  initialChannels?: Channel[]
  onChannelChange?: (channelId: string) => void
}

export function ChatInterface({ initialChannels = [], onChannelChange }: ChatInterfaceProps) {
  const { data: session } = useSession()
  const wsClient = getWebSocketClient()
  const { toast } = useToast()

  // États
  const [channels, setChannels] = useState<Channel[]>(initialChannels)
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<ClientMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [userPresence, setUserPresence] = useState<Map<string, UserPresence>>(new Map())
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingData>>(new Map())
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachmentUpload, setShowAttachmentUpload] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Scroll automatique vers le bas
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Initialisation WebSocket
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        await wsClient.connect()
        setIsConnected(true)
      } catch (error) {
        console.error('Erreur de connexion WebSocket:', error)
        toast({
          title: 'Erreur de connexion',
          description: 'Impossible de se connecter au chat en temps réel',
          variant: 'destructive'
        })
      }
    }

    if (session?.user) {
      initializeWebSocket()
    }

    return () => {
      wsClient.disconnect()
    }
  }, [session])

  // Gestionnaires d'événements WebSocket
  useEffect(() => {
    const handleNewMessage = (message: ClientMessage) => {
      if (activeChannel && message.channel === activeChannel._id) {
        setMessages(prev => [...prev, message])
        
        // Marquer comme lu si l'utilisateur est actif
        if (document.visibilityState === 'visible') {
          setTimeout(() => {
            wsClient.markMessagesRead(message.channel, [message._id])
          }, 1000)
        }
      }
      
      // Mettre à jour le compteur non lu
      setChannels(prev => prev.map(channel => 
        channel._id === message.channel
          ? { 
              ...channel, 
              unreadCount: activeChannel?._id === message.channel ? 0 : channel.unreadCount + 1,
              lastActivity: message.createdAt
            }
          : channel
      ))
    }

    const handleUserPresence = (presence: UserPresence) => {
      setUserPresence(prev => new Map(prev).set(presence.userId, presence))
    }

    const handleUserTyping = (typing: TypingData) => {
      if (typing.isTyping && typing.userId !== session?.user?.id) {
        setTypingUsers(prev => new Map(prev).set(typing.userId, typing))
        
        // Supprimer après 3 secondes
        setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev)
            newMap.delete(typing.userId)
            return newMap
          })
        }, 3000)
      } else {
        setTypingUsers(prev => {
          const newMap = new Map(prev)
          newMap.delete(typing.userId)
          return newMap
        })
      }
    }

    const handleChannelHistory = (data: { channelId: string; messages: ClientMessage[]; hasMore: boolean }) => {
      if (activeChannel && data.channelId === activeChannel._id) {
        setMessages(data.messages)
        setTimeout(scrollToBottom, 100)
      }
    }

    const handleReactionAdded = (data: { messageId: string; emoji: string; userId: string; reactions: any[] }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId 
          ? { ...msg, reactions: data.reactions }
          : msg
      ))
    }

    const handleError = (error: { message: string }) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }

    // Enregistrer les événements
    wsClient.on('new_message', handleNewMessage)
    wsClient.on('user_presence', handleUserPresence)
    wsClient.on('user_typing', handleUserTyping)
    wsClient.on('channel_history', handleChannelHistory)
    wsClient.on('reaction_added', handleReactionAdded)
    wsClient.on('reaction_removed', handleReactionAdded) // Même handler
    wsClient.on('error', handleError)

    return () => {
      wsClient.off('new_message', handleNewMessage)
      wsClient.off('user_presence', handleUserPresence)
      wsClient.off('user_typing', handleUserTyping)
      wsClient.off('channel_history', handleChannelHistory)
      wsClient.off('reaction_added', handleReactionAdded)
      wsClient.off('reaction_removed', handleReactionAdded)
      wsClient.off('error', handleError)
    }
  }, [activeChannel, session, wsClient, scrollToBottom])

  // Charger l'historique des messages quand on change de channel
  useEffect(() => {
    if (activeChannel && isConnected) {
      setIsLoading(true)
      setMessages([])
      
      // Rejoindre le channel
      wsClient.joinChannel(activeChannel._id)
      
      // Demander l'historique
      wsClient.requestChannelHistory(activeChannel._id, { limit: 50 })
      
      // Marquer les messages comme lus
      setTimeout(() => {
        setChannels(prev => prev.map(channel => 
          channel._id === activeChannel._id
            ? { ...channel, unreadCount: 0 }
            : channel
        ))
      }, 1000)

      setIsLoading(false)
    }
  }, [activeChannel, isConnected, wsClient])

  // Scroll automatique quand de nouveaux messages arrivent
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Gestionnaires
  const handleChannelSelect = (channel: Channel) => {
    if (activeChannel) {
      wsClient.leaveChannel(activeChannel._id)
    }
    
    setActiveChannel(channel)
    onChannelChange?.(channel._id)
  }

  const handleSendMessage = (content: string, attachments?: any[]) => {
    if (!activeChannel || !content.trim()) return

    wsClient.sendMessage(activeChannel._id, content, {
      messageType: attachments && attachments.length > 0 ? 'file' : 'text',
      attachments
    })
  }

  const handleTyping = () => {
    if (!activeChannel) return

    wsClient.startTyping(activeChannel._id)
    
    // Arrêter de taper après 3 secondes
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      wsClient.stopTyping(activeChannel._id)
    }, 3000)
  }

  const handleReaction = (messageId: string, emoji: string) => {
    wsClient.addReaction(messageId, emoji)
    setShowEmojiPicker(false)
  }

  const getChannelIcon = (channel: Channel) => {
    switch (channel.type) {
      case 'public':
        return <Hash className="h-4 w-4" />
      case 'private':
        return <Lock className="h-4 w-4" />
      case 'ai_assistant':
        return <Bot className="h-4 w-4" />
      default:
        return <Hash className="h-4 w-4" />
    }
  }

  const getOnlineMembers = (channel: Channel) => {
    return channel.members.filter(member => {
      const presence = userPresence.get(member.user._id)
      return presence?.status === 'online'
    })
  }

  const currentTypingUsers = Array.from(typingUsers.values())
    .filter(typing => typing.channelId === activeChannel?._id)

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Authentification requise</h3>
          <p className="text-gray-600">Veuillez vous connecter pour accéder au chat.</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex h-full bg-white border rounded-lg overflow-hidden">
        {/* Sidebar - Liste des channels */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Messagerie</h2>
              <div className="flex items-center gap-2">
                <UserPresenceIndicator 
                  status={isConnected ? 'online' : 'offline'} 
                  size="sm" 
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Users className="h-4 w-4 mr-2" />
                      Créer un channel
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Paramètres
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Liste des channels */}
          <ScrollArea className="flex-1">
            <ChannelList
              channels={channels}
              activeChannel={activeChannel}
              onChannelSelect={handleChannelSelect}
              userPresence={userPresence}
            />
          </ScrollArea>
        </div>

        {/* Zone de chat principale */}
        <div className="flex-1 flex flex-col">
          {activeChannel ? (
            <>
              {/* Header du channel */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getChannelIcon(activeChannel)}
                    <div>
                      <h3 className="text-lg font-semibold">{activeChannel.name}</h3>
                      {activeChannel.description && (
                        <p className="text-sm text-gray-600">{activeChannel.description}</p>
                      )}
                    </div>
                    {activeChannel.type === 'ai_assistant' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Bot className="h-3 w-3 mr-1" />
                        IA
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {getOnlineMembers(activeChannel).length}/{activeChannel.members.length}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {getOnlineMembers(activeChannel).length} membres en ligne
                      </TooltipContent>
                    </Tooltip>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Users className="h-4 w-4 mr-2" />
                          Membres
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Paramètres du channel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Zone des messages */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <MessageList
                      messages={messages}
                      currentUserId={session.user.id}
                      onReaction={handleReaction}
                      userPresence={userPresence}
                    />
                  )}
                  
                  {/* Indicateur de frappe */}
                  <AnimatePresence>
                    {currentTypingUsers.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-2"
                      >
                        <TypingIndicator users={currentTypingUsers} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Zone de saisie */}
                <div className="border-t bg-white p-4">
                  {activeChannel.settings.slowModeSeconds > 0 && (
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs">
                        Slow mode: {activeChannel.settings.slowModeSeconds}s
                      </Badge>
                    </div>
                  )}
                  
                  <MessageInput
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                    placeholder={`Envoyer un message dans #${activeChannel.name}`}
                    allowFileUpload={activeChannel.settings.allowFileUploads}
                    allowReactions={activeChannel.settings.allowReactions}
                    disabled={!isConnected}
                  />
                </div>
              </div>
            </>
          ) : (
            /* État vide - aucun channel sélectionné */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Hash className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sélectionnez un channel
                </h3>
                <p className="text-gray-600">
                  Choisissez un channel dans la liste pour commencer à discuter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}