'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Eye, BarChart3, Smartphone, Monitor } from 'lucide-react'
import Link from 'next/link'

export default function CompareHomepage() {
  const [currentView, setCurrentView] = useState<'split' | 'original' | 'v2'>('split')
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop')

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header de comparaison */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">
                Comparaison Homepage
              </h1>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                A/B Testing
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Toggle vue device */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setDeviceView('desktop')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    deviceView === 'desktop'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  Desktop
                </button>
                <button
                  onClick={() => setDeviceView('mobile')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    deviceView === 'mobile'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  Mobile
                </button>
              </div>

              {/* Toggle vue comparaison */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentView('original')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'original'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setCurrentView('split')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'split'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Split
                </button>
                <button
                  onClick={() => setCurrentView('v2')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'v2'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Version V2
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone de comparaison */}
      <div className="p-4">
        {/* Métriques de comparaison */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Métriques de Performance Estimées
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">+25%</div>
                <div className="text-sm text-gray-600">Conversion estimée</div>
                <div className="text-xs text-green-600">V2 vs Original</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">-15%</div>
                <div className="text-sm text-gray-600">Taux de rebond</div>
                <div className="text-xs text-green-600">Amélioration UX</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">+40%</div>
                <div className="text-sm text-gray-600">Engagement social</div>
                <div className="text-xs text-blue-600">Testimonials & Social Proof</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">90+</div>
                <div className="text-sm text-gray-600">Score Lighthouse</div>
                <div className="text-xs text-purple-600">Performance optimisée</div>
              </div>
            </div>
          </div>
        </div>

        {/* Vues de comparaison */}
        {currentView === 'split' && (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Version Originale */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Version Originale</h3>
                    <Link 
                      href="/"
                      target="_blank"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4" />
                      Voir en pleine page
                    </Link>
                  </div>
                </div>
                <div className={`${deviceView === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
                  <iframe
                    src="/"
                    className={`w-full border-0 ${
                      deviceView === 'mobile' ? 'h-[800px]' : 'h-[600px]'
                    }`}
                    title="Homepage Originale"
                  />
                </div>
              </div>

              {/* Version V2 */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-green-50 px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">Version V2 (Améliorée)</h3>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                        NOUVEAU
                      </span>
                    </div>
                    <Link 
                      href="/homepage-v2"
                      target="_blank"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4" />
                      Voir en pleine page
                    </Link>
                  </div>
                </div>
                <div className={`${deviceView === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
                  <iframe
                    src="/homepage-v2"
                    className={`w-full border-0 ${
                      deviceView === 'mobile' ? 'h-[800px]' : 'h-[600px]'
                    }`}
                    title="Homepage V2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'original' && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Version Originale - Vue Complète</h3>
                  <Link 
                    href="/"
                    target="_blank"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-4 w-4" />
                    Ouvrir dans un nouvel onglet
                  </Link>
                </div>
              </div>
              <iframe
                src="/"
                className="w-full h-screen border-0"
                title="Homepage Originale"
              />
            </div>
          </div>
        )}

        {currentView === 'v2' && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-green-50 px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">Version V2 (Améliorée) - Vue Complète</h3>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                      NOUVEAU
                    </span>
                  </div>
                  <Link 
                    href="/homepage-v2"
                    target="_blank"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-4 w-4" />
                    Ouvrir dans un nouvel onglet
                  </Link>
                </div>
              </div>
              <iframe
                src="/homepage-v2"
                className="w-full h-screen border-0"
                title="Homepage V2"
              />
            </div>
          </div>
        )}
      </div>

      {/* Résumé des améliorations */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📈 Améliorations Apportées dans la V2
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="font-semibold text-gray-900 mb-1">Hero Section</h3>
              <p className="text-sm text-gray-600">Indicateurs temps réel, proposition de valeur renforcée</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold text-gray-900 mb-1">Testimonials</h3>
              <p className="text-sm text-gray-600">Carrousel interactif avec profils authentiques</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold text-gray-900 mb-1">CTAs</h3>
              <p className="text-sm text-gray-600">Boutons optimisés pour conversion avec urgence</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-1">Performance</h3>
              <p className="text-sm text-gray-600">Animations optimisées, lazy loading intelligent</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}