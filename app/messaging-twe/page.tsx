'use client'

import { RouteGuard } from '@/components/auth/route-guard'
import Logo from '@/components/Logo'
import { useMessaging } from '@/hooks/use-messaging'
import { UserRole } from '@/types/auth'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function TestMessagingPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null)
  const [currentView, setCurrentView] = useState('messages')
  const { createDirectMessage, directMessages } = useMessaging()

  const handleStartChatWithUser = async (userId: string) => {
    try {
      console.log('Starting chat with user:', userId, selectedUserProfile?.name)

      // Create DM with user
      const result = await createDirectMessage(userId)
      console.log('DM creation result:', result)

      if (result && result.id) {
        // Directly select the chat with the returned ID
        const chatData = {
          id: result.id,
          name: selectedUserProfile?.name || 'Unknown User',
          avatar: selectedUserProfile?.avatar,
          isOnline: selectedUserProfile?.isOnline,
        }
        console.log('Setting selectedChat:', chatData)
        setSelectedChat(chatData)
        setCurrentView('messages') // Switch to messages view
        setSelectedUserProfile(null) // Hide profile
      } else {
        console.error('No DM ID returned from creation')
      }
    } catch (error) {
      console.error('Error starting chat:', error)
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
    { name: 'Espaces', href: '#espaces' },
    { name: 'Tarifs', href: '#tarifs' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '#contact' },
    { name: 'A propos', href: '#apropos' },
    { name: 'Messaging', href: '/messaging' },
  ]

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

        {/* Navigation Bar - Inverted Colors */}
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

              {/* CTA Button */}
              {/* <AuthButtons variant="navigation" size="sm" /> */}

              {/* <motion.div
                className="flex hidden md:block"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                >
                <Link
                href="/auth/signin"
                className="from-coffee-primary to-coffee-secondary rounded-full bg-gradient-to-r px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                Se connecter
                </Link>
                </motion.div> */}
            </div>
          </div>
        </motion.nav>

        {/* Main Content */}
        <div className="h-screen p-4 pt-32 pb-8">
          {/* <SidebarProvider defaultOpen={false}> */}
          <div className="flex h-[calc(90vh-50px)] w-full gap-2">
            {/* <TestAppSidebar
                collapsible="icon"
                onViewChange={setCurrentView}
              /> */}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-[320px] overflow-hidden rounded-2xl border-2 border-white bg-white/95 text-black backdrop-blur-sm"
            >
              {/* <ChatList
                  onChatSelect={setSelectedChat}
                  onUserProfileSelect={setSelectedUserProfile}
                  selectedChatId={selectedChat?.id}
                  currentView={currentView}
                /> */}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex-1 overflow-hidden rounded-2xl border-2 border-white bg-white/95 text-black backdrop-blur-sm"
            >
              {/* <ChatWindow
                  chatId={selectedChat?.id}
                  chatName={selectedChat?.name}
                  chatAvatar={selectedChat?.avatar}
                  isOnline={selectedChat?.isOnline}
                  userProfile={selectedUserProfile}
                  onStartChatWithUser={() => {
                    if (selectedUserProfile) {
                      handleStartChatWithUser(selectedUserProfile.id)
                    }
                  }}
                /> */}
            </motion.div>
          </div>
          {/* </SidebarProvider> */}
        </div>
      </div>
    </RouteGuard>
  )
}
