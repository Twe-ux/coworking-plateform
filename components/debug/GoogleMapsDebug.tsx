'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface DiagnosticResult {
  step: string
  status: 'success' | 'error' | 'warning' | 'loading'
  message: string
  details?: string
}

export function GoogleMapsDebug() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const updateDiagnostic = (step: string, status: DiagnosticResult['status'], message: string, details?: string) => {
    setDiagnostics(prev => {
      const existing = prev.find(d => d.step === step)
      const newDiag = { step, status, message, details }
      
      if (existing) {
        return prev.map(d => d.step === step ? newDiag : d)
      } else {
        return [...prev, newDiag]
      }
    })
  }

  const runDiagnostics = async () => {
    // Test 1: API Key présente
    updateDiagnostic('apikey', 'loading', 'Vérification de la clé API...')
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      updateDiagnostic('apikey', 'error', 'Clé API Google Maps manquante', 
        'Ajoutez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY dans .env.local')
      setIsRunning(false)
      return
    }
    
    updateDiagnostic('apikey', 'success', 'Clé API trouvée', 
      `Clé: ${apiKey.substring(0, 8)}...`)

    // Test 2: Format de la clé
    updateDiagnostic('format', 'loading', 'Vérification du format de la clé...')
    if (apiKey.startsWith('AIza') && apiKey.length === 39) {
      updateDiagnostic('format', 'success', 'Format de clé valide')
    } else {
      updateDiagnostic('format', 'warning', 'Format de clé inhabituel', 
        'Les clés Google Maps commencent généralement par "AIza" et font 39 caractères')
    }

    // Test 3: Test de connectivité
    updateDiagnostic('connectivity', 'loading', 'Test de connectivité Google Maps API...')
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`,
        { method: 'HEAD', mode: 'no-cors' }
      )
      updateDiagnostic('connectivity', 'success', 'Connectivité OK')
    } catch (error) {
      updateDiagnostic('connectivity', 'warning', 'Test de connectivité incomplet', 
        'Mode CORS, impossible de tester complètement')
    }

    // Test 4: Test de chargement du script
    updateDiagnostic('script', 'loading', 'Test de chargement du script Google Maps...')
    try {
      const scriptTest = document.createElement('script')
      scriptTest.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      
      scriptTest.onload = () => {
        updateDiagnostic('script', 'success', 'Script Google Maps chargé avec succès')
      }
      
      scriptTest.onerror = (error) => {
        updateDiagnostic('script', 'error', 'Erreur de chargement du script', 
          'Vérifiez que l\'API Maps JavaScript est activée dans Google Cloud Console')
      }
      
      document.head.appendChild(scriptTest)
      
      // Timeout après 10 secondes
      setTimeout(() => {
        if (diagnostics.find(d => d.step === 'script')?.status === 'loading') {
          updateDiagnostic('script', 'error', 'Timeout lors du chargement', 
            'Le script met trop de temps à charger')
        }
        setIsRunning(false)
        document.head.removeChild(scriptTest)
      }, 10000)
      
    } catch (error) {
      updateDiagnostic('script', 'error', 'Erreur lors du test de script', 
        error instanceof Error ? error.message : 'Erreur inconnue')
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'loading': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusBg = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200'
      case 'error': return 'bg-red-50 border-red-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      case 'loading': return 'bg-blue-50 border-blue-200'
    }
  }

  const hasErrors = diagnostics.some(d => d.status === 'error')
  const hasWarnings = diagnostics.some(d => d.status === 'warning')

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🔍 Diagnostic Google Maps API
        </h2>
        <p className="text-gray-600">
          Vérification de la configuration et des erreurs
        </p>
      </div>

      <div className="space-y-4">
        {diagnostics.map((diagnostic) => (
          <div
            key={diagnostic.step}
            className={`p-4 rounded-lg border ${getStatusBg(diagnostic.status)}`}
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(diagnostic.status)}
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">
                  {diagnostic.message}
                </h3>
                {diagnostic.details && (
                  <p className="text-sm text-gray-600 bg-white/50 p-2 rounded">
                    {diagnostic.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isRunning && (
        <div className="mt-8 p-6 bg-gray-50 rounded-xl">
          <h3 className="font-bold text-gray-900 mb-4">
            📋 Résumé et Actions Recommandées
          </h3>
          
          {hasErrors && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">❌ Erreurs Critiques :</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Vérifiez que l'API Maps JavaScript est activée dans Google Cloud Console</li>
                <li>• Vérifiez les restrictions de domaine (doit inclure localhost:3000)</li>
                <li>• Vérifiez que la clé API est correcte</li>
              </ul>
            </div>
          )}

          {hasWarnings && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">⚠️ Avertissements :</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Vérifiez la configuration dans Google Cloud Console</li>
                <li>• Consultez les logs de la console du navigateur</li>
              </ul>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🔧 Guide de Configuration :</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Ouvrez <a href="https://console.cloud.google.com/" target="_blank" className="underline">Google Cloud Console</a></li>
              <li>2. Activez "Maps JavaScript API"</li>
              <li>3. Vérifiez les restrictions de votre clé API</li>
              <li>4. Ajoutez "http://localhost:3000/*" aux domaines autorisés</li>
              <li>5. Redémarrez votre serveur de dev</li>
            </ol>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <button 
          onClick={() => {
            setDiagnostics([])
            setIsRunning(true)
            runDiagnostics()
          }}
          className="bg-coffee-primary text-white px-6 py-3 rounded-full hover:bg-coffee-primary/90 transition-colors"
          disabled={isRunning}
        >
          {isRunning ? 'Test en cours...' : '🔄 Relancer le diagnostic'}
        </button>
      </div>
    </div>
  )
}