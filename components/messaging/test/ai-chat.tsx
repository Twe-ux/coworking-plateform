'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePusherMessaging as useMessaging } from '@/hooks/use-pusher-messaging'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot,
  Lightbulb,
  MessageCircle,
  Send,
  Sparkles,
  Zap,
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

export function AiChat() {
  const { data: session } = useSession()
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const {
    socket,
    isConnected,
    sendMessage: sendSocketMessage,
    loadMessages,
    joinChannel,
  } = useMessaging()

  // Scroll automatique vers le dernier message
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      })
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [])

  // Messages de bienvenue de l'IA
  useEffect(() => {
    setMessages([
      {
        _id: 'welcome-1',
        content:
          "Bonjour ! Je suis votre assistant IA personnel. Comment puis-je vous aider aujourd'hui ?",
        messageType: 'text',
        sender: {
          _id: 'ai-assistant',
          name: 'Assistant IA',
          avatar: '',
          role: 'assistant',
        },
        channel: 'ai-private',
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'welcome-2',
        content:
          'Je peux vous aider avec :\n\n🤖 Réponses aux questions\n💡 Conseils et suggestions\n⚡ Automatisation de tâches\n📊 Analyse de données\n✨ Brainstorming créatif',
        messageType: 'text',
        sender: {
          _id: 'ai-assistant',
          name: 'Assistant IA',
          avatar: '',
          role: 'assistant',
        },
        channel: 'ai-private',
        createdAt: new Date().toISOString(),
      },
    ])
  }, [])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    // Ajouter le message utilisateur
    const userMessage: Message = {
      _id: `user-${Date.now()}`,
      content: messageContent,
      messageType: 'text',
      sender: {
        _id: session?.user?.id || 'user',
        name: session?.user?.name || 'Utilisateur',
        avatar: session?.user?.image || '',
        role: 'user',
      },
      channel: 'ai-private',
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    // Simuler une réponse de l'IA après un délai
    setTimeout(
      () => {
        const aiResponse: Message = {
          _id: `ai-${Date.now()}`,
          content: generateAIResponse(messageContent),
          messageType: 'text',
          sender: {
            _id: 'ai-assistant',
            name: 'Assistant IA',
            avatar: '',
            role: 'assistant',
          },
          channel: 'ai-private',
          createdAt: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, aiResponse])
        setIsTyping(false)
        setTimeout(scrollToBottom, 100)
      },
      1500 + Math.random() * 1000
    ) // Délai réaliste

    setTimeout(scrollToBottom, 100)
  }

  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()

    if (
      message.includes('bonjour') ||
      message.includes('salut') ||
      message.includes('hello')
    ) {
      return '👋 Bonjour ! Ravi de discuter avec vous. En quoi puis-je vous être utile ?'
    }

    if (message.includes('coworking') || message.includes('espace')) {
      return "🏢 En tant qu'assistant du coworking, je peux vous aider avec :\n\n• Réservations d'espaces\n• Informations sur les services\n• Planning des événements\n• Support technique\n• Mise en relation avec d'autres membres\n\nQue souhaitez-vous savoir ?"
    }

    if (message.includes('réserver') || message.includes('booking')) {
      return "📅 Pour faire une réservation, vous pouvez :\n\n1. Utiliser le système de réservation en ligne\n2. Me préciser vos besoins (date, heure, type d'espace)\n3. Consulter les disponibilités en temps réel\n\nQuelles sont vos préférences ?"
    }

    if (message.includes('aide') || message.includes('help')) {
      return '🤝 Je suis là pour vous aider ! Je peux vous assister avec :\n\n✨ Questions sur le coworking\n🔧 Support technique\n📊 Statistiques et rapports\n🎯 Optimisation de votre expérience\n💡 Suggestions personnalisées\n\nDites-moi ce dont vous avez besoin !'
    }

    if (message.includes('merci') || message.includes('thanks')) {
      return "😊 Je vous en prie ! C'est un plaisir de vous aider. N'hésitez pas si vous avez d'autres questions !"
    }

    // Réponse par défaut
    return `🤖 Intéressant ! "${userMessage}"\n\nJe comprends votre question. En tant qu'assistant IA du coworking, je peux vous fournir des informations personnalisées. Pouvez-vous me donner plus de détails sur ce que vous recherchez ?`
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

  const quickActions = [
    {
      icon: Lightbulb,
      text: 'Conseils productivité',
      query: 'Donnez-moi des conseils pour être plus productif en coworking',
    },
    {
      icon: Zap,
      text: 'Réserver un espace',
      query: 'Comment réserver un espace de travail ?',
    },
    {
      icon: MessageCircle,
      text: 'Contacter support',
      query: "J'ai besoin d'aide avec le support technique",
    },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Header de l'IA */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="h-8 w-8 text-purple-600" />
                <div className="absolute -right-1 -bottom-1 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-green-500"></div>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Assistant IA</h2>
                <div className="flex items-center gap-1 text-xs text-purple-600">
                  <Sparkles className="h-3 w-3" />
                  Toujours disponible
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-700"
            >
              <Bot className="mr-1 h-3 w-3" />
              IA Privée
            </Badge>
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
          <div className="space-y-4 pb-4">
            <AnimatePresence>
              {messages.map((message, index) => {
                const isMe = isMyMessage(message)
                const isAI = message.sender.role === 'assistant'

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
                        <div className="relative">
                          {isAI ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                          ) : (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.sender.avatar} />
                              <AvatarFallback className="text-xs">
                                {message.sender.name
                                  ?.split(' ')
                                  .map((n) => n[0])
                                  .join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    )}

                    <div
                      className={cn('flex flex-col gap-1', isMe && 'items-end')}
                    >
                      {!isMe && (
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
                            'relative max-w-md px-4 py-3 break-words shadow-sm',
                            isMe
                              ? 'rounded-2xl rounded-br-md bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                              : isAI
                                ? 'rounded-2xl rounded-bl-md bg-gradient-to-r from-purple-500 to-pink-500 text-white'
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
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Indicateur de frappe IA */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mr-auto flex max-w-[80%] items-center gap-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl rounded-bl-md bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white" />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-white"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-white"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </ScrollArea>

        {/* Actions rapides */}
        {messages.length <= 2 && (
          <div className="border-t border-b bg-gray-50 p-4">
            <p className="mb-3 text-sm text-gray-600">Actions rapides :</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => {
                    setNewMessage(action.query)
                  }}
                >
                  <action.icon className="h-4 w-4" />
                  {action.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Zone de saisie */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Tapez votre message à l'assistant IA..."
              disabled={!isConnected || isTyping}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!isConnected || !newMessage.trim() || isTyping}
              size="icon"
              className="bg-purple-600 hover:bg-purple-700"
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
