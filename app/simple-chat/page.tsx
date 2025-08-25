'use client'

import { useEffect, useState } from 'react'
// import { io, Socket } from 'socket.io-client'
type Socket = any
declare const io: any

export default function SimpleChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [channels, setChannels] = useState([])
  const [messages, setMessages] = useState<any[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Charger les channels
  const loadChannels = async () => {
    try {
      addLog('Chargement des channels...')
      const response = await fetch('/api/messaging/simple-channels')
      const data = await response.json()
      
      if (data.success) {
        setChannels(data.channels)
        addLog(`${data.channels.length} channels chargés`)
        
        // Sélectionner le premier channel par défaut
        if (data.channels.length > 0 && !selectedChannel) {
          setSelectedChannel(data.channels[0])
        }
      }
    } catch (error) {
      addLog(`Erreur: ${(error as any).message}`)
    }
  }

  // Initialiser Socket.IO
  useEffect(() => {
    addLog('Initialisation Socket.IO...')
    
    const newSocket = io({
      path: '/api/socket/',
      transports: ['websocket', 'polling'],
      auth: {
        sessionToken: 'debug-token'
      }
    })

    newSocket.on('connect', () => {
      setConnected(true)
      addLog(`✅ Connecté (${newSocket.id})`)
    })

    newSocket.on('disconnect', (reason: any) => {
      setConnected(false)
      addLog(`❌ Déconnecté: ${reason}`)
    })

    newSocket.on('connect_error', (error: any) => {
      addLog(`❌ Erreur: ${error.message}`)
    })

    newSocket.on('new_message', (message: any) => {
      addLog(`📨 Nouveau message`)
      setMessages(prev => [...prev, message])
    })

    newSocket.on('channel_history', (data: any) => {
      addLog(`📜 Historique reçu: ${data.messages.length} messages`)
      setMessages(data.messages)
    })

    setSocket(newSocket)
    loadChannels()

    return () => {
      newSocket.close()
    }
  }, [])

  // Rejoindre un channel
  const joinChannel = (channel: any) => {
    if (!socket || !connected) {
      addLog('❌ Pas de connexion Socket.IO')
      return
    }
    
    setSelectedChannel(channel)
    addLog(`Rejoindre channel: ${channel.name}`)
    socket.emit('join_channel', { channelId: channel._id })
  }

  // Envoyer un message
  const sendMessage = () => {
    if (!socket || !connected || !selectedChannel || !currentMessage.trim()) {
      addLog('❌ Impossible d\'envoyer le message')
      return
    }

    addLog(`Envoi message: ${currentMessage}`)
    socket.emit('send_message', {
      channelId: selectedChannel._id,
      content: currentMessage,
      messageType: 'text'
    })
    
    setCurrentMessage('')
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chat Simplifié - Debug</h1>
      
      {/* État de connexion */}
      <div className="mb-4 p-3 border rounded bg-gray-50">
        <h2 className="font-semibold">État</h2>
        <p>WebSocket: {connected ? '🟢 Connecté' : '🔴 Déconnecté'}</p>
        <p>Socket ID: {socket?.id || 'N/A'}</p>
        <p>Channel sélectionné: {selectedChannel?.name || 'Aucun'}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        
        {/* Channels */}
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">Channels ({channels.length})</h3>
          <div className="space-y-2">
            {channels.map((channel: any) => (
              <button
                key={channel._id}
                onClick={() => joinChannel(channel)}
                className={`w-full text-left p-2 rounded text-sm $${
                  selectedChannel?._id === channel._id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {channel.name}
                <br />
                <span className="text-xs opacity-75">({channel.type})</span>
              </button>
            ))}
          </div>
          <button 
            onClick={loadChannels}
            className="mt-2 w-full px-2 py-1 bg-green-500 text-white rounded text-sm"
          >
            Recharger
          </button>
        </div>

        {/* Messages */}
        <div className="col-span-2 border rounded p-3">
          <h3 className="font-semibold mb-2">Messages</h3>
          <div className="h-64 border rounded p-2 overflow-y-auto bg-gray-50 mb-2">
            {messages.map((msg, i) => (
              <div key={i} className="mb-2 p-2 bg-white rounded text-sm">
                <strong>{msg.sender?.name || 'Anonyme'}</strong>
                <br />
                {msg.content}
                <br />
                <span className="text-xs text-gray-500">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-gray-500 text-center py-8">
                Aucun message
              </div>
            )}
          </div>
          
          {/* Zone de saisie */}
          <div className="flex gap-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Tapez votre message..."
              className="flex-1 p-2 border rounded"
              disabled={!connected || !selectedChannel}
            />
            <button
              onClick={sendMessage}
              disabled={!connected || !selectedChannel || !currentMessage.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Envoyer
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">Logs</h3>
          <div className="h-64 border rounded p-2 overflow-y-auto bg-black text-green-400 text-xs font-mono">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
          <button
            onClick={() => setLogs([])}
            className="mt-2 w-full px-2 py-1 bg-gray-500 text-white rounded text-sm"
          >
            Effacer
          </button>
        </div>
      </div>
    </div>
  )
}