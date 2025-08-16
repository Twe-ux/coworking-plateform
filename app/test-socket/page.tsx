'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export default function TestSocketPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [status, setStatus] = useState('Déconnecté')

  useEffect(() => {
    // Initialiser Socket.IO
    const newSocket = io({
      path: '/api/socket/',
      transports: ['websocket', 'polling'],
      auth: {
        sessionToken: 'test-token' // Token de test
      }
    })

    newSocket.on('connect', () => {
      setConnected(true)
      setStatus('Connecté ✅')
      setMessages(prev => [...prev, `Connecté avec ID: ${newSocket.id}`])
    })

    newSocket.on('disconnect', () => {
      setConnected(false)
      setStatus('Déconnecté ❌')
      setMessages(prev => [...prev, 'Déconnecté du serveur'])
    })

    newSocket.on('connect_error', (error) => {
      setStatus(`Erreur: ${error.message}`)
      setMessages(prev => [...prev, `Erreur de connexion: ${error.message}`])
    })

    newSocket.on('error', (error) => {
      setMessages(prev => [...prev, `Erreur serveur: ${error.message}`])
    })

    // Messages de test
    newSocket.on('new_message', (data) => {
      setMessages(prev => [...prev, `Message reçu: ${JSON.stringify(data)}`])
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const sendTestMessage = () => {
    if (socket && connected) {
      socket.emit('send_message', {
        channelId: '68a0891f8a714206c7d19f02', // ID du channel Général
        content: 'Message de test depuis la page de test',
        messageType: 'text'
      })
      setMessages(prev => [...prev, 'Message de test envoyé'])
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Socket.IO</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">État de la connexion</h2>
          <p className="text-lg">{status}</p>
          <p className="text-sm text-gray-600">
            Socket ID: {socket?.id || 'N/A'}
          </p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Actions</h2>
          <div className="space-x-2">
            <button
              onClick={sendTestMessage}
              disabled={!connected}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Envoyer message de test
            </button>
            <button
              onClick={() => setMessages([])}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              Effacer les logs
            </button>
          </div>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Logs en temps réel</h2>
          <div className="bg-black text-green-400 p-3 rounded font-mono text-sm h-64 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i}>{new Date().toLocaleTimeString()} - {msg}</div>
            ))}
            {messages.length === 0 && <div className="text-gray-500">Aucun log...</div>}
          </div>
        </div>
      </div>
    </div>
  )
}