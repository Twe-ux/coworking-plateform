'use client'

import { RouteGuard } from '@/components/auth/route-guard'
import { useMessaging } from '@/hooks/use-messaging'
import { UserRole } from '@/types/auth'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'

export default function WebSocketTestPage() {
  const { data: session } = useSession()
  const { socket, isConnected, messages, onlineUsers, sendMessage, joinChannel } = useMessaging()
  const [testChannelId, setTestChannelId] = useState('67541234567890123456789a') // Test channel ID
  const [messageText, setMessageText] = useState('')

  useEffect(() => {
    if (isConnected && testChannelId) {
      console.log('🚀 Joining test channel:', testChannelId)
      joinChannel(testChannelId)
    }
  }, [isConnected, testChannelId, joinChannel])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !isConnected) return

    try {
      await sendMessage(testChannelId, messageText)
      setMessageText('')
      console.log('✅ Message sent successfully')
    } catch (error) {
      console.error('❌ Error sending message:', error)
    }
  }

  return (
    <RouteGuard requiredRoles={[UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN]}>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">WebSocket Test Page</h1>
          
          {/* Connection Status */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">WebSocket Connected:</p>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isConnected ? 'Connected ✅' : 'Disconnected ❌'}
                </span>
              </div>
              <div>
                <p className="font-medium">User:</p>
                <span className="text-gray-600">
                  {session?.user?.email || 'Not authenticated'}
                </span>
              </div>
            </div>
          </div>

          {/* Online Users */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Online Users ({onlineUsers.size})</h2>
            <div className="grid grid-cols-1 gap-2">
              {Array.from(onlineUsers).map(userId => (
                <div key={userId} className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{userId}</span>
                </div>
              ))}
              {onlineUsers.size === 0 && (
                <p className="text-gray-500 italic">No users online</p>
              )}
            </div>
          </div>

          {/* Send Message */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Send Test Message</h2>
            <div className="flex space-x-4">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a test message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isConnected}
              />
              <button
                onClick={handleSendMessage}
                disabled={!isConnected || !messageText.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Messages ({messages.length})</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div key={message._id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {message.sender.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{message.content}</p>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-gray-500 italic">No messages yet</p>
              )}
            </div>
          </div>

          {/* WebSocket Debug Info */}
          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <h3 className="font-medium text-gray-900 mb-2">Debug Info</h3>
            <pre className="text-xs text-gray-600 overflow-x-auto">
              {JSON.stringify({
                connected: isConnected,
                socketState: socket?.readyState,
                onlineUsersCount: onlineUsers.size,
                messagesCount: messages.length,
                testChannelId,
                userEmail: session?.user?.email
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}