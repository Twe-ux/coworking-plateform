'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Smile, Paperclip, MoreVertical, Users, Settings, Hash, Lock, Bot, Plus, MessageCircle, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

interface Channel {
  _id: string
  name: string
  type: 'public' | 'private' | 'direct' | 'ai_assistant'
  description?: string
  unreadCount?: number
  lastActivity?: string
  memberCount?: number
  isActive?: boolean
}

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

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  role?: string
  isOnline?: boolean
}

export function ImprovedChatInterface() {
  const { data: session } = useSession()
  const { toast } = useToast()

  // États principaux
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [directChannels, setDirectChannels] = useState<Channel[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  
  // États UI
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showUsersList, setShowUsersList] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [selectedTab, setSelectedTab] = useState('channels')

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Charger les channels depuis l'API
  const loadChannels = async () => {
    try {
      const response = await fetch('/api/messaging/simple-channels')
      const data = await response.json()
      
      if (data.success) {
        const publicChannels = data.channels.filter((ch: Channel) => ch.type !== 'direct')
        const directChats = data.channels.filter((ch: Channel) => ch.type === 'direct')
        
        setChannels(publicChannels)
        setDirectChannels(directChats)
        
        // Sélectionner le premier channel par défaut
        if (publicChannels.length > 0 && !activeChannel) {
          setActiveChannel(publicChannels[0])
        }
      }
    } catch (error) {
      console.error('Erreur chargement channels:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les channels',
        variant: 'destructive'
      })
    }
  }

  // Charger les utilisateurs disponibles pour messages directs
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/messaging/users')
      const data = await response.json()
      
      if (data.success) {
        setAvailableUsers(data.users)
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
    }
  }

  // Initialiser Socket.IO
  useEffect(() => {
    if (!session?.user) return

    console.log('🔌 Initialisation Socket.IO...')
    
    const newSocket = io({
      path: '/api/socket/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: false,
      auth: {
        sessionToken: 'auth-token',
        userId: session.user.id,
        userRole: (session.user as any).role,
        userName: (session.user.firstName && session.user.lastName) 
          ? `${session.user.firstName} ${session.user.lastName}`
          : session.user.name,
        userEmail: session.user.email
      }
    })

    // Events de connexion
    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('✅ WebSocket connecté')
      toast({
        title: 'Connecté',
        description: 'Chat en temps réel activé'
      })
    })

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false)
      console.log('❌ WebSocket déconnecté:', reason)
      
      // Ne pas afficher d'erreur si c'est une déconnexion volontaire
      if (reason !== 'io client disconnect' && reason !== 'transport close') {
        toast({
          title: 'Déconnecté',
          description: 'Tentative de reconnexion...',
          variant: 'destructive'
        })
      }
    })

    newSocket.on('reconnect', (attemptNumber) => {
      setIsConnected(true)
      console.log('✅ WebSocket reconnecté après', attemptNumber, 'tentatives')
      toast({
        title: 'Reconnecté',
        description: 'Chat en temps réel restauré'
      })
    })

    newSocket.on('reconnect_error', (error) => {
      console.log('❌ Erreur de reconnexion:', error.message)
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion:', error)
      setIsConnected(false)
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive'
      })
    })

    // Events de chat
    newSocket.on('new_message', (message: Message) => {
      console.log('📨 Nouveau message reçu')
      setMessages(prev => [...prev, message])
      setTimeout(scrollToBottom, 100)
    })

    newSocket.on('channel_history', (data: { channelId: string; messages: Message[] }) => {
      console.log(`📜 Historique reçu: ${data.messages.length} messages`)
      setMessages(data.messages)
      setTimeout(scrollToBottom, 100)
    })

    newSocket.on('user_typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userName])
      } else {
        setTypingUsers(prev => prev.filter(name => name !== data.userName))
      }
    })

    setSocket(newSocket)
    loadChannels()
    loadUsers()

    return () => {
      newSocket.close()
    }
  }, [session])

  // Rejoindre un channel
  const joinChannel = (channel: Channel) => {
    if (!socket || !isConnected) {
      toast({
        title: 'Erreur',
        description: 'Pas de connexion au chat',
        variant: 'destructive'
      })
      return
    }

    console.log(`📺 Rejoindre channel: ${channel.name}`)
    setActiveChannel(channel)
    setMessages([])
    setIsLoading(true)
    
    socket.emit('join_channel', { channelId: channel._id })
    
    setTimeout(() => setIsLoading(false), 1000)
  }

  // Envoyer un message
  const sendMessage = () => {
    if (!socket || !isConnected || !activeChannel || !currentMessage.trim()) {
      return
    }

    console.log('📤 Envoi message')
    socket.emit('send_message', {
      channelId: activeChannel._id,
      content: currentMessage.trim(),
      messageType: 'text'
    })

    setCurrentMessage('')
    
    // Arrêter l'indicateur de frappe
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    socket.emit('typing_stop', { channelId: activeChannel._id })
  }

  // Gestion de la frappe
  const handleTyping = () => {
    if (!socket || !activeChannel) return

    socket.emit('typing_start', { channelId: activeChannel._id })
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { channelId: activeChannel._id })
    }, 2000)
  }

  // Créer un nouveau channel
  const createChannel = async () => {
    if (!newChannelName.trim()) return

    try {
      const response = await fetch('/api/messaging/simple-create-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChannelName.trim(),
          type: 'public',
          description: `Channel ${newChannelName.trim()}`
        })
      })

      if (response.ok) {
        toast({
          title: 'Succès',
          description: `Channel "${newChannelName}" créé`
        })
        setNewChannelName('')
        setShowCreateChannel(false)
        loadChannels()
      } else {
        const error = await response.json()
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le channel',
        variant: 'destructive'
      })
    }
  }

  // Créer un chat direct avec un utilisateur
  const createDirectChat = async (user: User) => {
    try {
      const response = await fetch('/api/messaging/simple-create-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Direct: ${session?.user?.name} - ${user.name}`,
          type: 'direct',
          description: `Chat direct avec ${user.name}`,
          targetUserId: user._id
        })
      })

      if (response.ok) {
        toast({
          title: 'Chat direct créé',
          description: `Conversation avec ${user.name}`
        })
        setShowUsersList(false)
        loadChannels()
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le chat direct',
        variant: 'destructive'
      })
    }
  }

  const getChannelIcon = (channel: Channel) => {
    switch (channel.type) {
      case 'public':
        return <Hash className="h-4 w-4" />
      case 'private':
        return <Lock className="h-4 w-4" />
      case 'ai_assistant':
        return <Bot className="h-4 w-4" />
      case 'direct':
        return <MessageCircle className="h-4 w-4" />
      default:
        return <Hash className="h-4 w-4" />
    }
  }

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
        
        {/* Sidebar - Channels et Messages Directs */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Messagerie</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-600">
                  {isConnected ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="channels">Channels</TabsTrigger>
                <TabsTrigger value="direct">Direct</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Contenu des onglets */}
          <Tabs value={selectedTab} className="flex-1 flex flex-col">
            
            {/* Channels publics */}
            <TabsContent value="channels" className="flex-1 m-0">
              <div className="p-3 border-b">
                <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau Channel
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer un nouveau channel</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Nom du channel"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && createChannel()}
                      />
                      <div className="flex gap-2">
                        <Button onClick={createChannel} className="flex-1">
                          Créer
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreateChannel(false)}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {channels.map((channel) => (
                    <button
                      key={channel._id}
                      onClick={() => joinChannel(channel)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activeChannel?._id === channel._id
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getChannelIcon(channel)}
                        <span className="font-medium">{channel.name}</span>
                        {channel.type === 'ai_assistant' && (
                          <Badge variant="secondary" className="text-xs">IA</Badge>
                        )}
                      </div>
                      {channel.description && (
                        <p className="text-xs opacity-75 mt-1 truncate">
                          {channel.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Messages directs */}
            <TabsContent value="direct" className="flex-1 m-0">
              <div className="p-3 border-b">
                <Dialog open={showUsersList} onOpenChange={setShowUsersList}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Nouveau Chat Direct
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Commencer un chat direct</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-64">
                      <div className="space-y-2">
                        {availableUsers.map((user) => (
                          <button
                            key={user._id}
                            onClick={() => createDirectChat(user)}
                            className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center gap-3"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-xs text-gray-600">{user.email}</p>
                            </div>
                            {user.isOnline && (
                              <div className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {directChannels.map((channel) => (
                    <button
                      key={channel._id}
                      onClick={() => joinChannel(channel)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activeChannel?._id === channel._id
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <span className="font-medium">{channel.name}</span>
                      </div>
                    </button>
                  ))}
                  {directChannels.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-4">
                      Aucun chat direct
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
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
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {isConnected ? '🟢 En ligne' : '🔴 Hors ligne'}
                    </Badge>
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
                    <>
                      {messages.map((message, index) => (
                        <div key={message._id} className="mb-4 group">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {message.sender.name?.split(' ').map(n => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{message.sender.name}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Indicateur de frappe */}
                      {typingUsers.length > 0 && (
                        <div className="text-xs text-gray-500 italic">
                          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'tape' : 'tapent'}...
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </ScrollArea>

                {/* Zone de saisie */}
                <div className="border-t bg-white p-4">
                  <div className="flex gap-2">
                    <Input
                      value={currentMessage}
                      onChange={(e) => {
                        setCurrentMessage(e.target.value)
                        handleTyping()
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={`Envoyer un message dans ${activeChannel.name}...`}
                      disabled={!isConnected}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!isConnected || !currentMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {!isConnected && (
                    <p className="text-xs text-red-500 mt-2">
                      Connexion perdue. Rechargez la page pour reconnecter.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* État vide */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Hash className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sélectionnez un channel
                </h3>
                <p className="text-gray-600">
                  Choisissez un channel ou commencez un chat direct
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}