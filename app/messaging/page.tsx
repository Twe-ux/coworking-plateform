'use client'

// Force dynamic rendering for this page to avoid SSR issues
export const dynamic = 'force-dynamic'

import { motion } from 'framer-motion'
import { AlertTriangle, Menu, Shield, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { RouteGuard } from '@/components/auth/route-guard'
import Logo from '@/components/Logo'
import { AiChat } from '@/components/messaging/test/ai-chat'
import { ChatList } from '@/components/messaging/test/chat-list'
import { ChatWindow } from '@/components/messaging/test/chat-window'
import { TestAppSidebar } from '@/components/messaging/test/test-app-sidebar'
import { SidebarProvider } from '@/components/messaging/test/ui/sidebar'
import { usePusherMessaging as useMessaging } from '@/hooks/use-pusher-messaging-safe'
// import { useNotifications } from '@/hooks/use-notifications'
import { UserRole } from '@/types/auth'

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

export default function MessagingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ipRestricted, setIpRestricted] = useState(false)
  const [clientIP, setClientIP] = useState<string>('')

  // États pour la nouvelle interface
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null)
  const [currentView, setCurrentView] = useState('messages')
  const { createDirectMessage, directMessages, isConnected, joinChannel, joinChannelAndWait, refreshDirectMessages } = useMessaging()
  // const { notificationCounts } = useNotifications()
  const notificationCounts = { totalUnread: 0 } // Safe default for build

  // Fonction pour gérer le changement de vue avec nettoyage des états
  const handleViewChange = (newView: string) => {
    console.log('🔄 Changing view from', currentView, 'to', newView)

    // Nettoyer les sélections selon la vue
    if (newView !== 'contacts') {
      setSelectedUserProfile(null) // Effacer le profil utilisateur si on quitte les contacts
    }
    if (newView === 'ai') {
      setSelectedChat(null) // Effacer le chat sélectionné si on va vers l'IA
    }

    setCurrentView(newView)
  }

  // Redirection si non authentifié
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/messaging')
    }
  }, [status, router])

  // Vérification des restrictions IP
  useEffect(() => {
    const checkIPRestriction = async () => {
      try {
        const response = await fetch('/api/messaging/ip-check')
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 403) {
            setIpRestricted(true)
            setClientIP(data.clientIP || '')
            setError(data.message || 'Accès refusé depuis cette adresse IP')
          } else {
            setError(data.message || 'Erreur de vérification IP')
          }
          return
        }

        setClientIP(data.clientIP || '')
        setIpRestricted(false)
        setLoading(false)
      } catch (error) {
        console.error('Erreur lors de la vérification IP:', error)
        setError('Impossible de vérifier les restrictions IP')
        setLoading(false)
      }
    }

    if (session?.user) {
      checkIPRestriction()
    }
  }, [session])

  const handleStartChatWithUser = async (userId: string) => {
    try {
      console.log(
        '🚀 Starting chat with user:',
        userId,
        selectedUserProfile?.name
      )
      console.log('📧 Selected user profile:', selectedUserProfile)

      // Create DM with user
      console.log('📝 Calling createDirectMessage...')
      const result = await createDirectMessage(userId)
      console.log('✅ DM creation result:', result)

      if (result && result.id) {
        const dmId = result.id
        
        // IMPORTANT: Wait for Pusher channel to be ready before proceeding
        console.log('📺 🕰️ Joining and waiting for Pusher channel:', dmId)
        
        try {
          await joinChannelAndWait(dmId)
          console.log('✅ Channel is ready, user can now send messages!')
        } catch (error) {
          console.error('❌ Failed to join channel:', error)
          // Fallback to normal join if wait fails
          joinChannel(dmId)
        }
        
        // Create chat data
        const chatData = {
          id: dmId,
          name:
            selectedUserProfile?.firstName && selectedUserProfile?.lastName
              ? `${selectedUserProfile.firstName} ${selectedUserProfile.lastName}`
              : selectedUserProfile?.name || 'Unknown User',
          avatar: selectedUserProfile?.avatar,
          isOnline: selectedUserProfile?.isOnline,
          isDirect: true,
        }
        console.log('🎯 Setting selectedChat:', chatData)
        console.log('🔄 Changing view from', currentView, 'to messages')

        // Update UI state
        setSelectedChat(chatData)
        setCurrentView('messages') // Switch to messages view to see DMs
        setSelectedUserProfile(null) // Hide profile
        
        // FIXME: Force refresh of DM list to show the new conversation
        console.log('🔄 Refreshing DM list to include new conversation')
        
        // Method 1: Refresh via hook
        await refreshDirectMessages()
        
        // Method 2: Also trigger ChatList refresh
        window.dispatchEvent(new CustomEvent('dm-created', { detail: { dmId, chatData } }))

        console.log('✅ All state updated successfully')
      } else {
        console.error('❌ No DM ID returned from creation')
      }
    } catch (error) {
      console.error('💥 Error starting chat:', error)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { name: 'Accueil', href: '/' },
    { name: 'Espaces', href: '/#espaces' },
    { name: 'Tarifs', href: '/#tarifs' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/#contact' },
  ]

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Redirection en cours
  }

  if (ipRestricted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-red-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Accès Restreint</CardTitle>
              <CardDescription>
                Le système de messagerie est restreint à certaines adresses IP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error ||
                    "Votre adresse IP n'est pas autorisée à accéder au système de messagerie."}
                </AlertDescription>
              </Alert>

              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-sm text-gray-600">Votre adresse IP :</p>
                <Badge variant="outline" className="font-mono">
                  {clientIP || 'Inconnue'}
                </Badge>
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  Retour à l&apos;accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (error && !ipRestricted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-yellow-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle className="text-yellow-900">
                Erreur de Chargement
              </CardTitle>
              <CardDescription>
                Impossible de charger le système de messagerie
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Réessayer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="flex-1"
                >
                  Retour
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <RouteGuard
      requiredRoles={[
        UserRole.CLIENT,
        UserRole.STAFF,
        UserRole.MANAGER,
        UserRole.ADMIN,
      ]}
    >
      <div className="from-coffee-accent via-coffee-accent min-h-screen bg-gradient-to-br to-black text-white">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="bg-coffee-primary absolute top-10 left-10 h-32 w-32 rounded-full blur-3xl" />
          <div className="bg-coffee-primary absolute right-20 bottom-20 h-40 w-40 rounded-full blur-3xl" />
        </div>

        {/* Navigation Bar */}
        <motion.nav
          className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
            scrolled
              ? 'bg-coffee-accent/90 shadow-lg backdrop-blur-md'
              : 'bg-coffee-accent/90 shadow-lg backdrop-blur-md'
          }`}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto max-w-7xl px-4 py-2">
            <div className="flex h-24 items-center justify-between">
              {/* Mobile Menu Button */}
              <button
                className="focus:ring-coffee-primary rounded-md p-2 text-white focus:ring-2 focus:outline-none md:hidden"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center">
                <Logo
                  size="xl"
                  animated={true}
                  variant="white"
                  showText={false}
                />
              </Link>

              {/* Desktop Navigation */}
              <div className="ml-16 hidden w-full gap-8 md:flex md:items-center md:space-x-8">
                {navItems.map((item) => (
                  <motion.div key={item.name} whileHover={{ scale: 1.05 }}>
                    <Link
                      href={item.href}
                      className="hover:text-coffee-primary text-lg font-medium text-white transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                {/* Badge de notifications */}
                {notificationCounts.totalUnread > 0 && (
                  <div className="relative">
                    <Badge
                      variant="destructive"
                      className="animate-pulse bg-red-500"
                    >
                      📧 {notificationCounts.totalUnread} nouveau
                      {notificationCounts.totalUnread > 1 ? 'x' : ''} message
                      {notificationCounts.totalUnread > 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}

                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {isConnected ? '🟢 En ligne' : '🔴 Déconnecté'}
                </Badge>
                <div className="text-xs text-white/70">
                  IP: <span className="font-mono">{clientIP}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Main Content */}
        <div className="h-screen p-4 pt-32 pb-8">
          <SidebarProvider defaultOpen={false}>
            <div className="flex h-[calc(90vh-50px)] w-full gap-2">
              <TestAppSidebar
                className="relative overflow-hidden"
                collapsible="icon"
                onViewChange={handleViewChange}
                activeView={currentView}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-[320px] overflow-hidden rounded-2xl border-2 border-white bg-white/95 text-black backdrop-blur-sm"
              >
                <ChatList
                  onChatSelect={setSelectedChat}
                  onUserProfileSelect={setSelectedUserProfile}
                  selectedChatId={selectedChat?.id}
                  currentView={currentView}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="flex-1 overflow-hidden rounded-2xl border-2 border-white bg-white/95 text-black backdrop-blur-sm"
              >
                {currentView === 'ai' ? (
                  <AiChat />
                ) : (
                  <ChatWindow
                    chatId={selectedChat?.id}
                    chatName={selectedChat?.name}
                    chatAvatar={selectedChat?.avatar}
                    isOnline={selectedChat?.isOnline}
                    userProfile={selectedUserProfile}
                    onStartChatWithUser={() => {
                      if (selectedUserProfile) {
                        handleStartChatWithUser(selectedUserProfile._id)
                      }
                    }}
                  />
                )}
              </motion.div>
            </div>
          </SidebarProvider>
        </div>
      </div>
    </RouteGuard>
  )
}
