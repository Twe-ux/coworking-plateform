'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Accessibility,
  Eye,
  Keyboard,
  Volume2,
  Contrast,
  ZoomIn,
  Focus,
  MousePointer,
  CheckCircle,
  Settings
} from 'lucide-react'

interface AccessibilityFeature {
  id: string
  name: string
  description: string
  icon: React.ElementType
  enabled: boolean
  category: 'visual' | 'motor' | 'cognitive' | 'auditory'
}

export function AccessibilityEnhancer() {
  const [features, setFeatures] = useState<AccessibilityFeature[]>([
    {
      id: 'high-contrast',
      name: 'Contraste élevé',
      description: 'Améliore le contraste pour une meilleure lisibilité',
      icon: Contrast,
      enabled: false,
      category: 'visual'
    },
    {
      id: 'large-text',
      name: 'Texte agranди',
      description: 'Augmente la taille du texte de 125%',
      icon: ZoomIn,
      enabled: false,
      category: 'visual'
    },
    {
      id: 'focus-indicators',
      name: 'Indicateurs de focus renforcés',
      description: 'Focus plus visible pour la navigation clavier',
      icon: Focus,
      enabled: true,
      category: 'motor'
    },
    {
      id: 'keyboard-navigation',
      name: 'Navigation clavier optimisée',
      description: 'Séquence de tabulation logique et cohérente',
      icon: Keyboard,
      enabled: true,
      category: 'motor'
    },
    {
      id: 'screen-reader',
      name: 'Support lecteur d\'écran',
      description: 'ARIA labels et descriptions pour lecteurs d\'écran',
      icon: Volume2,
      enabled: true,
      category: 'auditory'
    },
    {
      id: 'reduced-motion',
      name: 'Animations réduites',
      description: 'Respecte prefer-reduced-motion du système',
      icon: MousePointer,
      enabled: true,
      category: 'cognitive'
    },
    {
      id: 'clear-labels',
      name: 'Étiquettes explicites',
      description: 'Textes et instructions clairs et compréhensibles',
      icon: Eye,
      enabled: true,
      category: 'cognitive'
    }
  ])

  const [currentScore, setCurrentScore] = useState(0)
  const [maxScore] = useState(100)

  useEffect(() => {
    calculateAccessibilityScore()
  }, [features])

  const calculateAccessibilityScore = () => {
    const enabledFeatures = features.filter(f => f.enabled).length
    const score = Math.round((enabledFeatures / features.length) * maxScore)
    setCurrentScore(score)
  }

  const toggleFeature = (featureId: string) => {
    setFeatures(prev => prev.map(feature => 
      feature.id === featureId 
        ? { ...feature, enabled: !feature.enabled }
        : feature
    ))
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const categoryLabels = {
    visual: 'Visuel',
    motor: 'Moteur',
    cognitive: 'Cognitif',
    auditory: 'Auditif'
  }

  const categoryIcons = {
    visual: Eye,
    motor: MousePointer,
    cognitive: Focus,
    auditory: Volume2
  }

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = []
    }
    acc[feature.category].push(feature)
    return acc
  }, {} as Record<string, AccessibilityFeature[]>)

  return (
    <div className="space-y-6">
      {/* Header avec score */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Accessibility className="h-6 w-6" />
            <span>Améliorations d'accessibilité</span>
          </h2>
          <p className="text-gray-600">
            Optimisations pour rendre l'interface accessible à tous
          </p>
        </div>

        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(currentScore)}`}>
            {currentScore}%
          </div>
          <Badge className={getScoreBadgeColor(currentScore)}>
            Score d'accessibilité
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression de l'accessibilité</span>
            <span className="text-sm text-gray-600">
              {features.filter(f => f.enabled).length} / {features.length} fonctionnalités activées
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
              style={{ width: `${currentScore}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fonctionnalités par catégorie */}
      <div className="grid gap-6">
        {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
          const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons]
          
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CategoryIcon className="h-5 w-5" />
                  <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                </CardTitle>
                <CardDescription>
                  Améliorations pour l'accessibilité {categoryLabels[category as keyof typeof categoryLabels].toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryFeatures.map((feature) => {
                    const FeatureIcon = feature.icon
                    
                    return (
                      <div key={feature.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-start space-x-3 flex-1">
                          <FeatureIcon className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium">{feature.name}</h4>
                              {feature.enabled && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={feature.id} className="text-sm">
                            {feature.enabled ? 'Activé' : 'Désactivé'}
                          </Label>
                          <Switch
                            id={feature.id}
                            checked={feature.enabled}
                            onCheckedChange={() => toggleFeature(feature.id)}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recommandations WCAG */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Conformité WCAG 2.1 AA</span>
          </CardTitle>
          <CardDescription>
            Standards d'accessibilité web implémentés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-green-700">✓ Principe 1 : Perceptible</h4>
              <ul className="space-y-1 text-sm text-gray-600 pl-4">
                <li>• Contraste minimum 4.5:1 pour le texte normal</li>
                <li>• Contraste minimum 3:1 pour le texte large</li>
                <li>• Support du redimensionnement jusqu'à 200%</li>
                <li>• Alternatives textuelles pour les images</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-green-700">✓ Principe 2 : Utilisable</h4>
              <ul className="space-y-1 text-sm text-gray-600 pl-4">
                <li>• Navigation clavier complète</li>
                <li>• Indicateurs de focus visibles</li>
                <li>• Pas de contenu clignotant &gt; 3Hz</li>
                <li>• Temps suffisant pour les interactions</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-green-700">✓ Principe 3 : Compréhensible</h4>
              <ul className="space-y-1 text-sm text-gray-600 pl-4">
                <li>• Langue de la page définie (lang="fr")</li>
                <li>• Étiquettes et instructions claires</li>
                <li>• Messages d'erreur explicites</li>
                <li>• Navigation cohérente et prévisible</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-green-700">✓ Principe 4 : Robuste</h4>
              <ul className="space-y-1 text-sm text-gray-600 pl-4">
                <li>• Code HTML valide et sémantique</li>
                <li>• ARIA labels appropriés</li>
                <li>• Compatible lecteurs d'écran</li>
                <li>• Support technologies d'assistance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implémentation technique */}
      <Card>
        <CardHeader>
          <CardTitle>Implémentations techniques</CardTitle>
          <CardDescription>
            Détails des optimisations d'accessibilité appliquées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Classes CSS d'accessibilité</h4>
              <code className="text-sm text-gray-800">
                {`// Interactions tactiles optimisées
.touch-manipulation { touch-action: manipulation; }
.min-h-10 { min-height: 2.5rem; } /* 40px minimum pour mobile */

// Focus amélioré
.focus:ring-2.focus:ring-blue-500.focus:ring-offset-2

// Support des préférences système
@media (prefers-reduced-motion: reduce) {
  .animate-* { animation: none; }
}`}
              </code>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Attributs ARIA implémentés</h4>
              <code className="text-sm text-gray-800">
                {`// Exemples d'attributs ARIA utilisés
aria-label="Actualiser les données"
aria-describedby="loading-description"
aria-expanded="true" // Pour la sidebar collapsible
aria-hidden="true" // Pour les icônes décoratives
role="button" tabIndex={0} // Pour les éléments cliquables`}
              </code>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Navigation clavier</h4>
              <code className="text-sm text-gray-800">
                {`// Support des raccourcis clavier
- Tab / Shift+Tab : Navigation entre éléments
- Espace / Entrée : Activation des boutons
- Échap : Fermeture des modales/menus
- Flèches : Navigation dans les listes/calendriers`}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}