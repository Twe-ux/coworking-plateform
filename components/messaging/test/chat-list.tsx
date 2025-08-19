'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Search, MessageCircle, Hash, Bot, Users, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

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
  currentView: 'messages' | 'contacts'
}

export function ChatList({ onChatSelect, onUserProfileSelect, selectedChatId, currentView }: ChatListProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [channels, setChannels] = useState<Channel[]>([])
  const [directChannels, setDirectChannels] = useState<Channel[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Charger les channels
  const loadChannels = async () => {
    try {
      const response = await fetch('/api/messaging/simple-channels')
      const data = await response.json()
      
      if (data.success) {
        const publicChannels = data.channels.filter((ch: Channel) => ch.type !== 'direct' && ch.type !== 'dm')
        const directChats = data.channels.filter((ch: Channel) => ch.type === 'direct' || ch.type === 'dm')
        
        setChannels(publicChannels)
        setDirectChannels(directChats)
      }
    } catch (error) {
      console.error('Erreur chargement channels:', error)
    }
  }

  // Charger les utilisateurs disponibles
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/messaging/users')
      const data = await response.json()
      
      if (data.success) {
        // Filtrer l'utilisateur actuel
        const users = data.users.filter((user: User) => user._id !== session?.user?.id)
        setAvailableUsers(users)
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
      loadUsers()
    }
  }, [session])

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

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || user.email || 'Utilisateur'
  }

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDirectChannels = directChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = availableUsers.filter(user =>
    getUserDisplayName(user).toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header avec recherche */}
      <div className="p-4 border-b">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {currentView === 'contacts' && (
          <Button size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau contact
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {/* Vue Messages */}
        {currentView === 'messages' && (
          <div className="p-2">
            {/* Channels publics */}
            {filteredChannels.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Channels
                </div>
                <div className="space-y-1">
                  {filteredChannels.map((channel) => (
                    <button
                      key={channel._id}
                      onClick={() => onChatSelect({
                        id: channel._id,
                        name: channel.name,
                        type: channel.type,
                        description: channel.description
                      })}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-100",
                        selectedChatId === channel._id && "bg-blue-50 border border-blue-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {getChannelIcon(channel)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{channel.name}</span>
                            {channel.unreadCount && channel.unreadCount > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {channel.unreadCount}
                              </Badge>
                            )}
                          </div>
                          {channel.description && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {channel.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages directs */}
            {filteredDirectChannels.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Messages directs
                </div>
                <div className="space-y-1">
                  {filteredDirectChannels.map((channel) => (
                    <button
                      key={channel._id}
                      onClick={() => onChatSelect({
                        id: channel._id,
                        name: channel.name,
                        type: channel.type,
                        isDirect: true
                      })}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-100",
                        selectedChatId === channel._id && "bg-green-50 border border-green-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate">{channel.name}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* État vide */}
            {filteredChannels.length === 0 && filteredDirectChannels.length === 0 && (
              <div className="text-center p-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune conversation</p>
                {searchQuery && (
                  <p className="text-sm mt-2">Aucun résultat pour "{searchQuery}"</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Vue Contacts */}
        {currentView === 'contacts' && (
          <div className="p-2">
            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Contacts disponibles
            </div>
            
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => onUserProfileSelect(user)}
                  className="w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={getUserDisplayName(user)} />
                      <AvatarFallback>
                        {getUserDisplayName(user).split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {getUserDisplayName(user)}
                        </span>
                        {user.isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      {user.role && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {user.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* État vide contacts */}
            {filteredUsers.length === 0 && (
              <div className="text-center p-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun contact</p>
                {searchQuery && (
                  <p className="text-sm mt-2">Aucun résultat pour "{searchQuery}"</p>
                )}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}