'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Bot,
  Hash,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useMessaging } from '@/hooks/use-messaging-minimal'
import { useNotifications } from '@/hooks/use-notifications'

interface Channel {
  _id: string
  name: string
  type: 'public' | 'private' | 'direct' | 'dm' | 'ai_assistant'
  description?: string
  unreadCount?: number
  lastActivity?: string
  memberCount?: number
  isActive?: boolean
}

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  role?: string
  isOnline?: boolean
  firstName?: string
  lastName?: string
}

interface ChatListProps {
  onChatSelect: (chat: any) => void
  onUserProfileSelect: (user: User) => void
  selectedChatId?: string
  currentView: 'messages' | 'contacts' | 'channels'
}

export function ChatList({
  onChatSelect,
  onUserProfileSelect,
  selectedChatId,
  currentView,
}: ChatListProps) {
  const { data: session } = useSession()
  const {
    onlineUsers,
    userStatuses,
    socket,
    isConnected,
  } = useMessaging()
  
  // Helper function since getUserOnlineStatus is not available in minimal hook
  const getUserOnlineStatus = (userId: string) => false
  const { notificationCounts, markChannelAsRead } = useNotifications()
  const [searchQuery, setSearchQuery] = useState('')
  const [channels, setChannels] = useState<Channel[]>([])
  const [directChannels, setDirectChannels] = useState<Channel[]>([])
  const [directMessages, setDirectMessages] = useState<Channel[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Charger les channels (pas les DMs)
  const loadChannels = async () => {
    try {
      const response = await fetch('/api/messaging/simple-channels')
      const data = await response.json()

      if (data.success) {
        const publicChannels = data.channels.filter(
          (ch: Channel) => ch.type !== 'direct' && ch.type !== 'dm'
        )
        setChannels(publicChannels)
      }
    } catch (error) {
      console.error('Erreur chargement channels:', error)
    }
  }

  // Charger les messages directs pour la vue Messages
  const loadDirectMessages = async () => {
    try {
      const response = await fetch('/api/messaging/simple-channels')
      const data = await response.json()

      if (data.success) {
        const directChats = data.channels.filter(
          (ch: Channel) => ch.type === 'direct' || ch.type === 'dm'
        )
        setDirectMessages(directChats)
      }
    } catch (error) {
      console.error('Erreur chargement DMs:', error)
    }
  }

  // Charger les utilisateurs disponibles
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/messaging/users')
      const data = await response.json()

      if (data.success) {
        // Filtrer l'utilisateur actuel et utiliser directement le statut depuis la DB
        const users = data.users
          .filter((user: User) => user._id !== session?.user?.id)
          .map((user: User) => ({
            ...user,
            isOnline: user.isOnline || false, // Utiliser directement le statut de la DB
          }))
        setAvailableUsers(users)
        console.log(
          '👥 Utilisateurs chargés avec statuts DB:',
          users.map(
            (u: User) => `${u.name}: ${u.isOnline ? '🟢 en ligne' : '⚫ hors ligne'}`
          )
        )
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      loadChannels()
      loadDirectMessages()
      loadUsers()
    }
  }, [session?.user?.id])

  // Rafraîchir les statuts utilisateurs toutes les 10 secondes
  useEffect(() => {
    if (!session?.user) return

    const refreshStatuses = setInterval(() => {
      if (currentView === 'contacts') {
        console.log('🔄 Rafraîchissement périodique des statuts utilisateurs...')
        loadUsers()
      }
    }, 10000) // Toutes les 10 secondes

    return () => clearInterval(refreshStatuses)
  }, [session?.user?.id, currentView])

  // Forcer la resynchronisation quand on passe à la vue contacts ou messages
  useEffect(() => {
    if (currentView === 'contacts') {
      console.log('🔄 Switching to contacts view, refreshing user statuses from DB')
      loadUsers() // Recharger depuis la DB au lieu de Socket.io
    } else if (currentView === 'messages') {
      console.log('🔄 Switching to messages view, refreshing DMs from DB')
      loadDirectMessages() // Recharger immédiatement les DMs
    }
  }, [currentView])

  // Recharger les DMs périodiquement pour détecter les nouveaux
  useEffect(() => {
    if (currentView === 'messages' && session?.user) {
      console.log('🔄 Messages view active, setting up DM refresh interval')
      const interval = setInterval(() => {
        console.log('🔄 Refreshing DMs...')
        loadDirectMessages()
      }, 5000) // Toutes les 5 secondes

      return () => clearInterval(interval)
    }
  }, [currentView, session?.user?.id])

  const getChannelIcon = (channel: Channel) => {
    switch (channel.type) {
      case 'public':
        return <Hash className="h-4 w-4 text-blue-600" />
      case 'private':
        return <Hash className="h-4 w-4 text-orange-600" />
      case 'ai_assistant':
        return <Bot className="h-4 w-4 text-purple-600" />
      case 'direct':
      case 'dm':
        return <MessageCircle className="h-4 w-4 text-green-600" />
      default:
        return <Hash className="h-4 w-4" />
    }
  }
  const getChannelBg = (channel: Channel) => {
    switch (channel.type) {
      case 'public':
        return 'border border-blue-200 bg-blue-50'
      case 'private':
        return 'border border-orange-200 bg-orange-50'
      case 'ai_assistant':
        return 'border border-purple-200 bg-purple-50'
      case 'direct':
      case 'dm':
        return 'border border-green-200 bg-green-50'
      default:
        return 'border border-gray-200 bg-gray-50'
    }
  }

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || user.email || 'Utilisateur'
  }

  // Synchroniser les statuts en ligne avec les utilisateurs disponibles
  useEffect(() => {
    if (availableUsers.length > 0) {
      console.log('🔄 ChatList: Synchronizing user statuses', {
        onlineUsers: Array.from(onlineUsers),
        userStatuses: userStatuses,
        availableUsers: availableUsers.length,
      })

      setAvailableUsers((prevUsers) =>
        prevUsers.map((user) => {
          const newOnlineStatus = getUserOnlineStatus(user._id)
          if (user.isOnline !== newOnlineStatus) {
            console.log(
              `👤 User ${user._id} (${getUserDisplayName(user)}) status changed: ${user.isOnline} -> ${newOnlineStatus}`
            )
          }
          return {
            ...user,
            isOnline: newOnlineStatus,
          }
        })
      )
    }
  }, [onlineUsers, userStatuses]) // Re-synchroniser quand les statuts changent

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDirectChannels = directChannels.filter((channel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDirectMessages = directMessages.filter((dm) =>
    dm.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = availableUsers
    .filter(
      (user) =>
        // Seulement les utilisateurs en ligne (utilise directement la DB)
        user.isOnline &&
        (getUserDisplayName(user)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      // Tri par nom alphabétique (tous sont en ligne)
      return getUserDisplayName(a).localeCompare(getUserDisplayName(b))
    })

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header avec recherche */}
      <div className="border-b p-4">
        <div className="relative mb-3">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* {currentView === 'contacts' && (
          <Button size="sm" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau contact
          </Button>
        )} */}
      </div>

      <ScrollArea className="flex-1">
        {/* Vue Messages */}
        {currentView === 'messages' && (
          <div className="p-2">
            {/* Messages directs */}
            {filteredDirectMessages.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Messages directs
                </div>
                <div className="space-y-1">
                  {filteredDirectMessages.map((dm) => (
                    <Card key={dm._id}>
                      <button
                        onClick={() => {
                          markChannelAsRead(dm._id, dm.type) // Marquer comme lu avec type
                          onChatSelect({
                            id: dm._id,
                            name: dm.name,
                            type: dm.type,
                            isDirect: true,
                          })
                        }}
                        className={cn(
                          'w-full rounded-lg p-3 text-left transition-colors hover:bg-gray-100',
                          selectedChatId === dm._id &&
                            'border border-green-200 bg-green-50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-4 w-4 text-green-600" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="truncate font-medium">
                                {dm.name}
                              </span>
                              {notificationCounts.channelBreakdown[dm._id] >
                                0 && (
                                <Badge
                                  variant="default"
                                  className="ml-2 bg-blue-500"
                                >
                                  {notificationCounts.channelBreakdown[dm._id]}
                                </Badge>
                              )}
                            </div>
                            {dm.lastActivity && (
                              <p className="mt-1 text-xs text-gray-500">
                                {new Date(dm.lastActivity).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* État vide */}
            {filteredDirectMessages.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Aucun message direct</p>
                {searchQuery && (
                  <p className="mt-2 text-sm">
                    Aucun résultat pour &quot;{searchQuery}&quot;
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Vue Channels */}
        {currentView === 'channels' && (
          <div className="p-2">
            {/* Channels publics */}
            {filteredChannels.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Channels
                </div>
                <div className="space-y-1">
                  {filteredChannels.map((channel) => (
                    <Card key={channel._id}>
                      <button
                        onClick={() => {
                          markChannelAsRead(channel._id, channel.type) // Marquer comme lu avec type
                          onChatSelect({
                            id: channel._id,
                            name: channel.name,
                            type: channel.type,
                            description: channel.description,
                          })
                        }}
                        className={cn(
                          'rounded-lg p-3 text-left transition-colors hover:bg-gray-100',
                          selectedChatId === channel._id &&
                            getChannelBg(channel)
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {getChannelIcon(channel)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="truncate font-medium">
                                {channel.name}
                              </span>
                              {notificationCounts.channelBreakdown[
                                channel._id
                              ] > 0 && (
                                <Badge
                                  variant="default"
                                  className="ml-2 bg-orange-500"
                                >
                                  {
                                    notificationCounts.channelBreakdown[
                                      channel._id
                                    ]
                                  }
                                </Badge>
                              )}
                            </div>
                            {channel.description && (
                              <p className="mt-1 w-62 truncate text-xs text-gray-500">
                                {channel.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* État vide */}
            {filteredChannels.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Aucune conversation</p>
                {searchQuery && (
                  <p className="mt-2 text-sm">
                    Aucun résultat pour &quot;{searchQuery}&quot;
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Vue Contacts */}
        {currentView === 'contacts' && (
          <div className="p-2">
            <div className="mb-2 px-2 py-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Contacts en ligne
            </div>

            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <Card key={user._id}>
                  <button
                    onClick={() => onUserProfileSelect(user)}
                    className="w-full rounded-lg p-3 text-left transition-colors hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user.avatar}
                            alt={getUserDisplayName(user)}
                          />
                          <AvatarFallback>
                            {getUserDisplayName(user)
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {user.isOnline && (
                          <div className="absolute -right-0.5 -bottom-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-green-500"></div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {getUserDisplayName(user)}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                            <span className="text-xs font-medium text-green-600">
                              En ligne
                            </span>
                          </div>
                        </div>
                        <p className="truncate text-xs text-gray-500">
                          {user.email}
                        </p>
                        {/* {user.role && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {user.role}
                          </Badge>
                        )} */}
                      </div>
                    </div>
                  </button>
                </Card>
              ))}
            </div>

            {/* État vide contacts */}
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Aucun contact en ligne</p>
                {searchQuery && (
                  <p className="mt-2 text-sm">
                    Aucun résultat pour &quot;{searchQuery}&quot;
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
