'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hash, Lock, Users, Bot, Plus, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { UserPresenceIndicator } from './UserPresenceIndicator'
// import { UserPresence } from '@/lib/websocket/client'
type UserPresence = { userId: string; status: 'online' | 'offline'; lastSeen?: Date }

interface Channel {
  _id: string
  name: string
  type: 'public' | 'private' | 'direct' | 'ai_assistant'
  description?: string
  unreadCount: number
  lastActivity: string
  lastMessage?: {
    content: string
    sender: {
      name: string
    }
    createdAt: string
  }
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
}

interface ChannelListProps {
  channels: Channel[]
  activeChannel: Channel | null
  onChannelSelect: (channel: Channel) => void
  onCreateChannel?: () => void
  userPresence?: Map<string, UserPresence>
}

function ChannelItem({
  channel,
  isActive,
  onClick,
  userPresence
}: {
  channel: Channel
  isActive: boolean
  onClick: () => void
  userPresence?: Map<string, UserPresence>
}) {
  const getChannelIcon = () => {
    switch (channel.type) {
      case 'public':
        return <Hash className="h-4 w-4 text-gray-500" />
      case 'private':
        return <Lock className="h-4 w-4 text-gray-500" />
      case 'ai_assistant':
        return <Bot className="h-4 w-4 text-blue-500" />
      case 'direct':
        // Pour les messages directs, afficher l'avatar de l'autre utilisateur
        const otherMember = channel.members.find(m => m.user._id !== 'current-user-id') // TODO: remplacer par l'ID réel
        return otherMember ? (
          <div className="relative">
            <Avatar className="h-6 w-6">
              <AvatarImage src={otherMember.user.avatar} />
              <AvatarFallback className="text-xs">
                {otherMember.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {userPresence && (
              <UserPresenceIndicator
                status={userPresence.get(otherMember.user._id)?.status || 'offline'}
                className="absolute -bottom-1 -right-1"
                size="xs"
              />
            )}
          </div>
        ) : (
          <Users className="h-4 w-4 text-gray-500" />
        )
      default:
        return <Hash className="h-4 w-4 text-gray-500" />
    }
  }

  const getChannelName = () => {
    if (channel.type === 'direct') {
      const otherMember = channel.members.find(m => m.user._id !== 'current-user-id') // TODO: remplacer par l'ID réel
      return otherMember ? otherMember.user.name : 'Discussion privée'
    }
    return channel.name
  }

  const getLastActivity = () => {
    if (channel.lastMessage) {
      return formatDistanceToNow(new Date(channel.lastMessage.createdAt), {
        addSuffix: true,
        locale: fr
      })
    }
    return formatDistanceToNow(new Date(channel.lastActivity), {
      addSuffix: true,
      locale: fr
    })
  }

  const getLastMessagePreview = () => {
    if (!channel.lastMessage) return null
    
    const maxLength = 40
    let preview = channel.lastMessage.content
    
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength) + '...'
    }
    
    return (
      <span className="text-xs text-gray-500 truncate">
        {channel.type !== 'direct' && (
          <span className="font-medium">{channel.lastMessage.sender.name}: </span>
        )}
        {preview}
      </span>
    )
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg text-left transition-all duration-200 group",
        "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
        isActive ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-gray-50"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getChannelIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={cn(
              "font-medium truncate text-sm",
              isActive ? "text-blue-900" : "text-gray-900",
              channel.unreadCount > 0 && !isActive && "font-semibold"
            )}>
              {getChannelName()}
            </h3>
            
            <div className="flex items-center gap-1">
              {channel.unreadCount > 0 && (
                <Badge 
                  variant={isActive ? "secondary" : "default"}
                  className={cn(
                    "text-xs h-5 min-w-5 px-1.5",
                    isActive ? "bg-blue-100 text-blue-800" : "bg-red-500 text-white"
                  )}
                >
                  {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                </Badge>
              )}
              
              <span className="text-xs text-gray-400 group-hover:text-gray-600">
                {getLastActivity()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {getLastMessagePreview()}
            </div>
            
            {channel.type === 'ai_assistant' && (
              <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                IA
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  )
}

function ChannelSection({
  title,
  channels,
  activeChannel,
  onChannelSelect,
  userPresence,
  onCreateChannel
}: {
  title: string
  channels: Channel[]
  activeChannel: Channel | null
  onChannelSelect: (channel: Channel) => void
  userPresence?: Map<string, UserPresence>
  onCreateChannel?: () => void
}) {
  if (channels.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {title}
        </h2>
        {onCreateChannel && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateChannel}
                className="h-6 w-6 p-0 hover:bg-gray-200"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Créer un {title.toLowerCase()}</TooltipContent>
          </Tooltip>
        )}
      </div>
      
      <div className="space-y-1">
        {channels.map((channel) => (
          <ChannelItem
            key={channel._id}
            channel={channel}
            isActive={activeChannel?._id === channel._id}
            onClick={() => onChannelSelect(channel)}
            userPresence={userPresence}
          />
        ))}
      </div>
    </div>
  )
}

export function ChannelList({
  channels,
  activeChannel,
  onChannelSelect,
  onCreateChannel,
  userPresence
}: ChannelListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrer les channels par recherche
  const filteredChannels = channels.filter(channel => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    const channelName = channel.type === 'direct' 
      ? channel.members.find(m => m.user._id !== 'current-user-id')?.user.name || ''
      : channel.name
    
    return channelName.toLowerCase().includes(query) ||
           channel.description?.toLowerCase().includes(query)
  })

  // Grouper les channels par type
  const publicChannels = filteredChannels.filter(c => c.type === 'public')
  const privateChannels = filteredChannels.filter(c => c.type === 'private')
  const directChannels = filteredChannels.filter(c => c.type === 'direct')
  const aiChannels = filteredChannels.filter(c => c.type === 'ai_assistant')

  // Trier par dernière activité
  const sortByActivity = (a: Channel, b: Channel) => {
    const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.lastActivity)
    const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.lastActivity)
    return bTime.getTime() - aTime.getTime()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Barre de recherche */}
      <div className="p-4 border-b bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher des channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Liste des channels */}
      <ScrollArea className="flex-1 p-4">
        {filteredChannels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? (
              <>
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Aucun channel trouvé</p>
                <p className="text-xs text-gray-400">Essayez un autre terme de recherche</p>
              </>
            ) : (
              <>
                <Hash className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Aucun channel disponible</p>
                <p className="text-xs text-gray-400">Créez votre premier channel</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Messages directs */}
            <ChannelSection
              title="Messages directs"
              channels={directChannels.sort(sortByActivity)}
              activeChannel={activeChannel}
              onChannelSelect={onChannelSelect}
              userPresence={userPresence}
            />

            {/* Channels publics */}
            <ChannelSection
              title="Channels publics"
              channels={publicChannels.sort(sortByActivity)}
              activeChannel={activeChannel}
              onChannelSelect={onChannelSelect}
              userPresence={userPresence}
              onCreateChannel={onCreateChannel}
            />

            {/* Channels privés */}
            <ChannelSection
              title="Channels privés"
              channels={privateChannels.sort(sortByActivity)}
              activeChannel={activeChannel}
              onChannelSelect={onChannelSelect}
              userPresence={userPresence}
              onCreateChannel={onCreateChannel}
            />

            {/* Assistants IA */}
            <ChannelSection
              title="Assistants IA"
              channels={aiChannels.sort(sortByActivity)}
              activeChannel={activeChannel}
              onChannelSelect={onChannelSelect}
              userPresence={userPresence}
              onCreateChannel={onCreateChannel}
            />
          </div>
        )}
      </ScrollArea>

      {/* Bouton de création rapide */}
      {onCreateChannel && (
        <div className="p-4 border-t bg-white">
          <Button
            onClick={onCreateChannel}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau channel
          </Button>
        </div>
      )}
    </div>
  )
}