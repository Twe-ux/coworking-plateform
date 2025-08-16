'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface TypingUser {
  userId: string
  channelId: string
  isTyping: boolean
  user?: {
    name: string
    avatar?: string
  }
}

interface TypingIndicatorProps {
  users: TypingUser[]
  className?: string
}

function TypingDots() {
  return (
    <div className="flex items-center space-x-1">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-gray-400 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  )
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  const typingUsers = users.filter(user => user.isTyping)
  
  if (typingUsers.length === 0) {
    return null
  }

  const formatTypingText = () => {
    const names = typingUsers.map(user => user.user?.name || 'Utilisateur').slice(0, 3)
    
    if (names.length === 1) {
      return `${names[0]} est en train d'écrire...`
    } else if (names.length === 2) {
      return `${names[0]} et ${names[1]} sont en train d'écrire...`
    } else if (names.length === 3) {
      return `${names[0]}, ${names[1]} et ${names[2]} sont en train d'écrire...`
    } else {
      return `${names[0]}, ${names[1]} et ${typingUsers.length - 2} autres sont en train d'écrire...`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex items-center gap-3 px-4 py-2 text-sm text-gray-600',
        className
      )}
    >
      {/* Avatars des utilisateurs */}
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map((typingUser) => (
          <Avatar key={typingUser.userId} className="h-6 w-6 border-2 border-white">
            <AvatarImage src={typingUser.user?.avatar} />
            <AvatarFallback className="text-xs">
              {typingUser.user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        ))}
        {typingUsers.length > 3 && (
          <div className="h-6 w-6 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              +{typingUsers.length - 3}
            </span>
          </div>
        )}
      </div>

      {/* Texte et indicateur */}
      <div className="flex items-center gap-2">
        <span className="text-sm italic">
          {formatTypingText()}
        </span>
        <TypingDots />
      </div>
    </motion.div>
  )
}