'use client'

import { useEffect, useState } from 'react'
// import { io, Socket } from 'socket.io-client'
type Socket = any
declare const io: any
import { useSession } from 'next-auth/react'

export default function DebugMessagingPage() {
  const { data: session, status } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [channels, setChannels] = useState([])
  const [logs, setLogs] = useState<string[]>([])
  const [newChannelName, setNewChannelName] = useState('')

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev.slice(-20), `${timestamp} - ${message}`])
  }

  // Test de l'API channels
  const loadChannels = async () => {
    try {
      addLog('🔄 Chargement des channels...')
      const response = await fetch('/api/messaging/simple-channels')
      const data = await response.json()
      
      if (data.success) {
        setChannels(data.channels)
        addLog(`✅ ${data.channels.length} channels chargés`)
      } else {
        addLog(`❌ Erreur API: ${data.error}`)
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${(error as any).message}`)
    }
  }

  // Test création de channel
  const createChannel = async () => {
    if (!newChannelName.trim()) return
    
    try {
      addLog(`🔄 Création du channel "${newChannelName}"...`)
      const response = await fetch('/api/messaging/simple-create-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChannelName,
          type: 'public',
          description: `Channel ${newChannelName} créé via debug`
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        addLog(`✅ Channel "${newChannelName}" créé`)
        setNewChannelName('')
        loadChannels() // Recharger la liste
      } else {
        addLog(`❌ Erreur création: ${data.message || data.error}`)
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${(error as any).message}`)
    }
  }

  // WebSocket connection
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user) {
      addLog('❌ Pas de session utilisateur')
      return
    }

    addLog(`👤 Session trouvée: ${session.user.name}`)

    // Initialiser Socket.IO
    const newSocket = (io as any)({
      path: '/api/socket/',
      transports: ['websocket', 'polling'],
      auth: {
        sessionToken: 'test-token' // Token de test
      }
    })

    newSocket.on('connect', () => {
      setConnected(true)
      addLog(`✅ WebSocket connecté (ID: ${newSocket.id})`)
    })

    newSocket.on('disconnect', (reason: any) => {
      setConnected(false)
      addLog(`❌ WebSocket déconnecté: ${reason}`)
    })

    newSocket.on('connect_error', (error: any) => {
      addLog(`❌ Erreur connexion WebSocket: ${error?.message || error}`)
    })

    newSocket.on('error', (error: any) => {
      addLog(`❌ Erreur serveur: ${error?.message || error}`)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [session, status])

  // Charger channels au démarrage
  useEffect(() => {
    loadChannels()
  }, [])

  if (status === 'loading') {
    return <div className="p-8">Chargement de la session...</div>
  }

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Messagerie - Non connecté</h1>
        <p>Vous devez être connecté pour accéder à cette page.</p>
        <button 
          onClick={() => window.location.href = '/api/auth/signin'}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Se connecter
        </button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Messagerie</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* État de la session */}
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Session</h2>
          <div className="text-sm space-y-1">
            <p>👤 Utilisateur: {session.user?.name}</p>
            <p>📧 Email: {session.user?.email}</p>
            <p>🔑 Rôle: {session.user?.role || 'N/A'}</p>
            <p>🆔 ID: {session.user?.id || 'N/A'}</p>
          </div>
        </div>

        {/* État WebSocket */}
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">WebSocket</h2>
          <div className="text-sm space-y-1">
            <p>🔌 État: {connected ? '✅ Connecté' : '❌ Déconnecté'}</p>
            <p>🆔 Socket ID: {socket?.id || 'N/A'}</p>
            <p>🚀 Transport: {socket?.io.engine?.transport?.name || 'N/A'}</p>
          </div>
        </div>

        {/* Channels */}
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Channels ({channels.length})</h2>
          <div className="space-y-2 mb-4">
            {channels.map((channel: any) => (
              <div key={channel._id} className="p-2 bg-gray-100 rounded text-sm">
                <strong>{channel.name}</strong> ({channel.type})
                <br />
                <span className="text-gray-600">{channel.description}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={loadChannels}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Recharger
          </button>
        </div>

        {/* Création de channel */}
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Créer un Channel</h2>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Nom du channel"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={createChannel}
              disabled={!newChannelName.trim()}
              className="w-full px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
            >
              Créer Channel
            </button>
          </div>
        </div>
      </div>

      {/* Logs en temps réel */}
      <div className="mt-6 p-4 border rounded">
        <h2 className="font-semibold mb-2">Logs Debug</h2>
        <div className="bg-black text-green-400 p-3 rounded font-mono text-xs h-64 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
          {logs.length === 0 && <div className="text-gray-500">Aucun log...</div>}
        </div>
        <button
          onClick={() => setLogs([])}
          className="mt-2 px-3 py-1 bg-gray-500 text-white rounded text-sm"
        >
          Effacer logs
        </button>
      </div>
    </div>
  )
}