'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen,
  Smartphone,
  Code,
  Palette,
  Zap,
  CheckCircle,
  Target,
  Layers,
  Settings,
  Eye,
  TouchPad,
  ArrowRight,
  Copy
} from 'lucide-react'

interface OptimizationTip {
  id: string
  title: string
  description: string
  code?: string
  before?: string
  after?: string
  impact: 'high' | 'medium' | 'low'
}

export function MobileOptimizationGuide() {
  const [activeTab, setActiveTab] = useState('overview')
  const [copiedCode, setCopiedCode] = useState<string>('')

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const optimizations: Record<string, OptimizationTip[]> = {
    layout: [
      {
        id: 'responsive-grid',
        title: 'Grilles responsives avec breakpoints',
        description: 'Utiliser des grilles adaptatives qui s\'empilent sur mobile',
        code: `// ✅ Recommandé : Mobile-first approach
<div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
  <Card className="p-3 md:p-4">...</Card>
</div>

// ❌ Éviter : Desktop-first
<div className="grid grid-cols-4 gap-4 sm:grid-cols-2 sm:gap-2">`,
        impact: 'high'
      },
      {
        id: 'spacing',
        title: 'Espacement adaptatif',
        description: 'Réduire les espacements sur mobile pour optimiser l\'espace',
        code: `// Espacement responsive
<div className="space-y-4 md:space-y-6">
  <div className="p-2 md:p-4">...</div>
</div>`,
        impact: 'medium'
      },
      {
        id: 'sidebar',
        title: 'Sidebar collapsible mobile',
        description: 'Sidebar qui se transforme en overlay sur mobile',
        code: `// Sidebar responsive avec overlay mobile
{isMobile ? (
  <>
    {openMobile && (
      <div className="fixed inset-0 z-40 bg-black/50" 
           onClick={() => setOpenMobile(false)} />
    )}
    <div className={cn(
      "fixed left-0 top-0 z-50 h-full w-64 transform transition-transform",
      openMobile ? "translate-x-0" : "-translate-x-full"
    )}>
      {children}
    </div>
  </>
) : (
  <div className="hidden md:flex w-64">{children}</div>
)}`,
        impact: 'high'
      }
    ],
    interactions: [
      {
        id: 'touch-targets',
        title: 'Taille minimale des cibles tactiles',
        description: 'Assurer une taille minimale de 44px pour tous les éléments interactifs',
        code: `// Taille minimale pour mobile
<Button className="min-h-10 touch-manipulation">
  Bouton tactile
</Button>

// Pour les éléments plus petits, ajouter du padding
<button className="p-3 min-h-10 min-w-10">
  <Icon className="h-4 w-4" />
</button>`,
        impact: 'high'
      },
      {
        id: 'feedback',
        title: 'Feedback tactile visuel',
        description: 'Ajouter des effets visuels pour les interactions tactiles',
        code: `// Feedback tactile avec Tailwind
<Button className="active:scale-95 transition-transform">
  Appuyer pour voir l'effet
</Button>

// États de hover/focus adaptatifs
<Button className="hover:bg-gray-100 focus:ring-2 focus:ring-blue-500">
  Bouton accessible
</Button>`,
        impact: 'medium'
      },
      {
        id: 'scroll-optimization',
        title: 'Optimisation du scroll',
        description: 'Améliorer les performances de défilement',
        code: `// Optimisation du scroll
<div className="overflow-y-auto touch-pan-y">
  {/* Contenu scrollable */}
</div>

// Scroll smooth pour la navigation
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}`,
        impact: 'medium'
      }
    ],
    typography: [
      {
        id: 'font-sizes',
        title: 'Tailles de police adaptatives',
        description: 'Utiliser des tailles de police qui s\'adaptent à l\'écran',
        code: `// Hiérarchie typographique responsive
<h1 className="text-xl md:text-2xl font-bold">
  Titre principal
</h1>

<p className="text-sm md:text-base text-gray-600">
  Texte de description
</p>

// Éviter les textes trop petits sur mobile
<span className="text-xs md:text-sm">
  Détails secondaires
</span>`,
        impact: 'high'
      },
      {
        id: 'truncation',
        title: 'Gestion du texte long',
        description: 'Tronquer intelligemment le texte sur mobile',
        code: `// Troncature responsive
<h3 className="truncate md:text-clip max-w-40 md:max-w-none">
  {longTitle}
</h3>

// Texte multi-ligne avec limitation
<p className="line-clamp-2 md:line-clamp-none">
  {longDescription}
</p>`,
        impact: 'medium'
      }
    ],
    performance: [
      {
        id: 'chart-heights',
        title: 'Hauteurs de graphiques adaptatives',
        description: 'Réduire la hauteur des graphiques sur mobile',
        code: `// Graphiques avec hauteur responsive
<div className="h-48 md:h-64 lg:h-80">
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data}>
      <XAxis fontSize={12} />
      <YAxis fontSize={10} width={60} />
      {/* Configuration mobile-optimized */}
    </AreaChart>
  </ResponsiveContainer>
</div>`,
        impact: 'high'
      },
      {
        id: 'conditional-rendering',
        title: 'Rendu conditionnel mobile',
        description: 'Masquer ou simplifier certains éléments sur mobile',
        code: `// Masquer des éléments non critiques sur mobile
<div className="hidden md:block">
  {/* Contenu desktop uniquement */}
</div>

// Simplifier pour mobile
<span className="block sm:hidden">Fermer</span>
<span className="hidden sm:block">Fermer la modal</span>

// Alternative mobile
{isMobile ? (
  <SimpleComponent />
) : (
  <ComplexComponent />
)}`,
        impact: 'medium'
      }
    ]
  }

  const impactColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  }

  const impactLabels = {
    high: 'Impact élevé',
    medium: 'Impact moyen',
    low: 'Impact faible'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <BookOpen className="h-6 w-6" />
            <span>Guide d'optimisation mobile</span>
          </h2>
          <p className="text-gray-600">
            Stratégies et meilleures pratiques pour une interface mobile parfaite
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">5</div>
            <div className="text-xs text-gray-600">Composants optimisés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">320px</div>
            <div className="text-xs text-gray-600">Largeur minimale</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">44px</div>
            <div className="text-xs text-gray-600">Cibles tactiles min</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">AA</div>
            <div className="text-xs text-gray-600">Niveau WCAG</div>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-1">
            <Target className="h-4 w-4" />
            <span className="hidden sm:block">Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center space-x-1">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:block">Layout</span>
          </TabsTrigger>
          <TabsTrigger value="interactions" className="flex items-center space-x-1">
            <TouchPad className="h-4 w-4" />
            <span className="hidden sm:block">Interactions</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center space-x-1">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:block">Typo</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-1">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:block">Perfs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span>Optimisations réalisées</span>
                </CardTitle>
                <CardDescription>
                  Résumé des améliorations apportées aux composants dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>AppSidebar</span>
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600 pl-6">
                      <li>• Navigation mobile avec overlay</li>
                      <li>• Interactions tactiles uniquement sur mobile</li>
                      <li>• Animation fluide de transition</li>
                      <li>• Fermeture par tap à côté</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>BookingCalendar</span>
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600 pl-6">
                      <li>• Grille calendrier responsive</li>
                      <li>• Filtres empilés sur mobile</li>
                      <li>• Navigation simplifiée</li>
                      <li>• Détails réservation optimisés</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>RevenueAnalytics</span>
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600 pl-6">
                      <li>• Graphiques hauteur adaptive</li>
                      <li>• KPIs en grille 2x2 sur mobile</li>
                      <li>• Contrôles tactiles optimisés</li>
                      <li>• Labels graphiques réduits</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>OccupancyAnalytics</span>
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600 pl-6">
                      <li>• Interface simplifiée mobile</li>
                      <li>• Graphiques radiaux → listes</li>
                      <li>• Métriques condensées</li>
                      <li>• Barres de progression visuelles</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Breakpoints utilisés</CardTitle>
                <CardDescription>
                  Points de rupture responsive pour les différentes tailles d'écran
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">Mobile (default)</span>
                      <p className="text-sm text-gray-600">0px - 767px</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Base mobile-first</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">Tablet (md:)</span>
                      <p className="text-sm text-gray-600">768px+</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">md: prefix</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">Desktop (lg:)</span>
                      <p className="text-sm text-gray-600">1024px+</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">lg: prefix</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {Object.entries(optimizations).map(([category, tips]) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="space-y-6">
              {tips.map((tip) => (
                <Card key={tip.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{tip.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {tip.description}
                        </CardDescription>
                      </div>
                      <Badge className={impactColors[tip.impact]}>
                        {impactLabels[tip.impact]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {tip.code && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium flex items-center space-x-2">
                            <Code className="h-4 w-4" />
                            <span>Implémentation</span>
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(tip.code!, tip.id)}
                            className="flex items-center space-x-1"
                          >
                            <Copy className="h-3 w-3" />
                            <span>{copiedCode === tip.id ? 'Copié!' : 'Copier'}</span>
                          </Button>
                        </div>
                        <pre className="bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{tip.code}</code>
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Référence rapide - Classes Tailwind mobile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Layout responsive</h4>
              <div className="space-y-1 text-sm font-mono">
                <div><code>grid-cols-2 md:grid-cols-4</code> - Grille adaptive</div>
                <div><code>gap-2 md:gap-4</code> - Espacement adaptatif</div>
                <div><code>p-3 md:p-4</code> - Padding responsive</div>
                <div><code>space-y-4 md:space-y-6</code> - Espacement vertical</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Typographie mobile</h4>
              <div className="space-y-1 text-sm font-mono">
                <div><code>text-lg md:text-2xl</code> - Taille adaptative</div>
                <div><code>text-sm md:text-base</code> - Texte secondaire</div>
                <div><code>truncate md:text-clip</code> - Gestion overflow</div>
                <div><code>line-clamp-2 md:line-clamp-none</code> - Limitation lignes</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Interactions tactiles</h4>
              <div className="space-y-1 text-sm font-mono">
                <div><code>min-h-10</code> - Hauteur minimale 40px</div>
                <div><code>touch-manipulation</code> - Optimisation tactile</div>
                <div><code>active:scale-95</code> - Feedback visuel</div>
                <div><code>focus:ring-2</code> - Indicateur focus</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Visibilité conditionnelle</h4>
              <div className="space-y-1 text-sm font-mono">
                <div><code>hidden md:block</code> - Masqué sur mobile</div>
                <div><code>block md:hidden</code> - Visible sur mobile uniquement</div>
                <div><code>hidden sm:block</code> - À partir de 640px</div>
                <div><code>md:col-span-2</code> - Largeur adaptative</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}