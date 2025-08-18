'use client'

import {
  Circle,
  Hash,
  MessageCircle,
  Search,
  Plus,
  Settings,
  Users,
  Bot,
  Clock,
  Star,
  Phone,
  Video,
} from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface MessagingSidebarContextualProps {
  activeNav: string
  isVisible: boolean
  className?: string
}

interface ContactItem {
  id: string
  name: string
  email: string
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen?: string
  avatar?: string
}

interface ConversationItem {
  id: string
  name: string
  lastMessage: string
  timestamp: string
  unreadCount?: number
  avatar?: string
  isGroup?: boolean
}

interface ChannelItem {
  id: string
  name: string
  description: string
  memberCount: number
  isPrivate?: boolean
  unreadCount?: number
}

const mockContacts: ContactItem[] = [
  {
    id: '1',
    name: 'Alice Martin',
    email: 'alice@cowork.com',
    status: 'online',
    avatar: '/avatars/alice.jpg',
  },
  {
    id: '2',
    name: 'Bob Wilson',
    email: 'bob@cowork.com',
    status: 'away',
    lastSeen: 'Il y a 5 min',
  },
  {
    id: '3',
    name: 'Carol Smith',
    email: 'carol@cowork.com',
    status: 'busy',
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'david@cowork.com',
    status: 'offline',
    lastSeen: 'Il y a 2h',
  },
]

const mockConversations: ConversationItem[] = [
  {
    id: '1',
    name: 'Alice Martin',
    lastMessage: 'Parfait, on se voit à 14h pour la réunion',
    timestamp: '10:30',
    unreadCount: 2,
    avatar: '/avatars/alice.jpg',
  },
  {
    id: '2',
    name: 'Équipe Dev',
    lastMessage: 'Le déploiement est terminé 🚀',
    timestamp: 'Hier',
    unreadCount: 1,
    isGroup: true,
  },
  {
    id: '3',
    name: 'Bob Wilson',
    lastMessage: 'Merci pour le feedback !',
    timestamp: 'Mer',
    avatar: '/avatars/bob.jpg',
  },
]

const mockChannels: ChannelItem[] = [
  {
    id: '1',
    name: 'général',
    description: "Discussion générale de l'équipe",
    memberCount: 24,
    unreadCount: 3,
  },
  {
    id: '2',
    name: 'projet-alpha',
    description: 'Coordination du projet Alpha',
    memberCount: 8,
    isPrivate: true,
    unreadCount: 1,
  },
  {
    id: '3',
    name: 'développement',
    description: 'Discussions techniques',
    memberCount: 12,
  },
]

const StatusIndicator = ({ status }: { status: ContactItem['status'] }) => {
  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400',
  }

  return (
    <div
      className={`h-3 w-3 rounded-full ${statusColors[status]} border-2 border-white`}
    />
  )
}

export function MessagingSidebarContextual({
  activeNav,
  isVisible,
  className = '',
}: MessagingSidebarContextualProps) {
  if (!isVisible) return null

  const renderContactsList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contacts</h3>
        <Button size="sm" variant="ghost">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
        <Input placeholder="Rechercher un contact..." className="pl-10" />
      </div>

      <div className="space-y-1">
        <div className="text-muted-foreground px-2 text-sm font-medium">
          En ligne ({mockContacts.filter((c) => c.status === 'online').length})
        </div>
        {mockContacts
          .filter((contact) => contact.status === 'online')
          .map((contact) => (
            <div
              key={contact.id}
              className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-lg p-2"
            >
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback className="bg-coffee-primary text-sm text-white">
                    {contact.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -right-1 -bottom-1">
                  <StatusIndicator status={contact.status} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {contact.name}
                </div>
                <div className="text-muted-foreground truncate text-xs">
                  {contact.email}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Video className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
      </div>

      <Separator />

      <div className="space-y-1">
        <div className="text-muted-foreground px-2 text-sm font-medium">
          Autres ({mockContacts.filter((c) => c.status !== 'online').length})
        </div>
        {mockContacts
          .filter((contact) => contact.status !== 'online')
          .map((contact) => (
            <div
              key={contact.id}
              className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-lg p-2"
            >
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback className="bg-gray-500 text-sm text-white">
                    {contact.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -right-1 -bottom-1">
                  <StatusIndicator status={contact.status} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {contact.name}
                </div>
                <div className="text-muted-foreground truncate text-xs">
                  {contact.lastSeen || contact.email}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )

  const renderConversationsList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Messages</h3>
        <Button size="sm" variant="ghost">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
        <Input placeholder="Rechercher une conversation..." className="pl-10" />
      </div>

      <div className="space-y-1">
        {mockConversations.map((conversation) => (
          <div
            key={conversation.id}
            className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-lg p-3"
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={conversation.avatar} />
                <AvatarFallback className="bg-coffee-primary text-white">
                  {conversation.isGroup ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    conversation.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                  )}
                </AvatarFallback>
              </Avatar>
              {conversation.unreadCount && (
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {conversation.unreadCount}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <div className="truncate text-sm font-medium">
                  {conversation.name}
                </div>
                <div className="text-muted-foreground text-xs">
                  {conversation.timestamp}
                </div>
              </div>
              <div className="text-muted-foreground truncate text-sm">
                {conversation.lastMessage}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderChannelsList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Channels</h3>
        <Button size="sm" variant="ghost">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
        <Input placeholder="Rechercher un channel..." className="pl-10" />
      </div>

      <div className="space-y-1">
        {mockChannels.map((channel) => (
          <div
            key={channel.id}
            className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-lg p-3"
          >
            <div className="relative">
              <div className="bg-coffee-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <Hash className="text-coffee-primary h-4 w-4" />
              </div>
              {channel.unreadCount && (
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {channel.unreadCount}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-medium">
                  #{channel.name}
                </div>
                {channel.isPrivate && (
                  <div className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                    Privé
                  </div>
                )}
              </div>
              <div className="text-muted-foreground truncate text-xs">
                {channel.description} • {channel.memberCount} membres
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderAIAssistant = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Assistant IA</h3>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-medium">Assistant CoWork</div>
              <div className="text-muted-foreground text-sm">En ligne</div>
            </div>
          </div>
          <Button className="w-full" variant="outline">
            <MessageCircle className="mr-2 h-4 w-4" />
            Nouvelle conversation
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Conversations récentes</div>
          <div className="space-y-1">
            <div className="hover:bg-muted cursor-pointer rounded-lg border p-3">
              <div className="text-sm font-medium">Résumé des messages</div>
              <div className="text-muted-foreground text-xs">Il y a 2h</div>
            </div>
            <div className="hover:bg-muted cursor-pointer rounded-lg border p-3">
              <div className="text-sm font-medium">Traduction EN → FR</div>
              <div className="text-muted-foreground text-xs">Hier</div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-medium">Actions rapides</div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-auto flex-col p-3">
              <Clock className="mb-1 h-4 w-4" />
              <span className="text-xs">Résumer</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto flex-col p-3">
              <Star className="mb-1 h-4 w-4" />
              <span className="text-xs">Traduire</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Paramètres</h3>

      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Préférences générales
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <Circle className="mr-2 h-4 w-4" />
          Statut et disponibilité
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Notifications
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Confidentialité
        </Button>
      </div>
    </div>
  )

  const getContent = () => {
    switch (activeNav) {
      case 'Messages':
        return renderConversationsList()
      case 'Contacts':
        return renderContactsList()
      case 'Channels':
        return renderChannelsList()
      case 'Assistant IA':
        return renderAIAssistant()
      case 'Paramètres':
        return renderSettings()
      default:
        return renderConversationsList()
    }
  }

  return (
    <div
      className={`border-coffee-primary bg-background h-full border-r ${className}`}
    >
      <ScrollArea className="h-full">
        <div className="p-4">{getContent()}</div>
      </ScrollArea>
    </div>
  )
}
