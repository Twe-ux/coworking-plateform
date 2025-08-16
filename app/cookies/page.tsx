import { Metadata } from 'next'
import { ScrollToTop } from '@/components/ui/scroll-to-top'
import { CookiePreferencesManager } from '@/components/legal/CookiePreferencesManager'

export const metadata: Metadata = {
  title: 'Politique des Cookies | Cow or King Café - Coworking Strasbourg',
  description: 'Politique détaillée des cookies utilisés sur notre site. Gérez vos préférences et comprenez l\'utilisation des cookies.',
  keywords: 'cookies, politique, RGPD, préférences, coworking, strasbourg',
}

export default function CookiesPage() {
  const lastUpdate = '15 août 2024'

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 to-yellow-100">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700 mb-6">
            🍪 Politique des Cookies
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Gestion des{' '}
            <span className="bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
              Cookies
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Comprendre et contrôler les cookies utilisés sur notre site
          </p>
          <p className="text-sm text-gray-500">
            Dernière mise à jour : {lastUpdate} • Conforme RGPD
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sommaire */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-gray-50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Sommaire</h2>
              <nav className="space-y-2">
                <a href="#definition" className="block text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  1. Qu'est-ce qu'un cookie ?
                </a>
                <a href="#types" className="block text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  2. Types de cookies
                </a>
                <a href="#utilisation" className="block text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  3. Notre utilisation
                </a>
                <a href="#duree" className="block text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  4. Durée de conservation
                </a>
                <a href="#droits" className="block text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  5. Vos droits et choix
                </a>
                <a href="#gestion" className="block text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  6. Gérer vos préférences
                </a>
                <a href="#tiers" className="block text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  7. Cookies tiers
                </a>
                <a href="#contact" className="block text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  8. Contact
                </a>
              </nav>
            </div>
          </div>

          {/* Contenu */}
          <div className="lg:col-span-3">
            <div className="prose prose-lg max-w-none">
              
              {/* Résumé rapide */}
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 mb-12">
                <h2 className="text-2xl font-bold text-orange-900 mb-4">
                  🍪 En résumé
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-2">Cookies essentiels</h3>
                    <p className="text-orange-700">
                      Toujours actifs pour le fonctionnement du site
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-2">Votre contrôle</h3>
                    <p className="text-orange-700">
                      Vous choisissez les cookies analytiques et marketing
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-2">Modification</h3>
                    <p className="text-orange-700">
                      Changez vos préférences à tout moment
                    </p>
                  </div>
                </div>
              </div>

              {/* Article 1 */}
              <section id="definition" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Qu'est-ce qu'un cookie ?</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    📖 Définition technique
                  </h3>
                  <p className="text-blue-800 mb-4">
                    Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, tablette, smartphone) 
                    par votre navigateur lors de la visite d'un site web. Il permet au site de vous reconnaître lors 
                    de vos prochaines visites.
                  </p>
                  <ul className="text-blue-700 space-y-2 text-sm">
                    <li>• <strong>Taille :</strong> Maximum 4 Ko de données</li>
                    <li>• <strong>Contenu :</strong> Identifiants, préférences, historique</li>
                    <li>• <strong>Stockage :</strong> Sur votre appareil, pas sur nos serveurs</li>
                    <li>• <strong>Accès :</strong> Seul le site qui l'a créé peut le lire</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">1.1 Pourquoi utilisons-nous des cookies ?</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Les cookies nous permettent d'améliorer votre expérience en :
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Vous reconnectant automatiquement à votre compte</li>
                  <li>Mémorisant vos préférences (langue, thème, réglages)</li>
                  <li>Gardant vos réservations en cours dans votre panier</li>
                  <li>Analysant l'utilisation du site pour l'améliorer</li>
                  <li>Vous proposant du contenu personnalisé</li>
                </ul>
              </section>

              {/* Article 2 */}
              <section id="types" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Types de cookies que nous utilisons</h2>
                
                <div className="space-y-6">
                  <div className="border border-green-200 rounded-xl p-6 bg-green-50">
                    <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center gap-2">
                      🔒 Cookies essentiels (obligatoires)
                    </h3>
                    <p className="text-green-800 mb-4">
                      Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-green-900 mb-2">Authentification</h4>
                        <ul className="text-green-700 space-y-1">
                          <li>• Session utilisateur</li>
                          <li>• Tokens de sécurité</li>
                          <li>• Protection CSRF</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900 mb-2">Fonctionnement</h4>
                        <ul className="text-green-700 space-y-1">
                          <li>• Panier de réservation</li>
                          <li>• Navigation sécurisée</li>
                          <li>• Équilibrage de charge</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-green-100 rounded-lg">
                      <p className="text-green-800 text-sm">
                        <strong>Base légale :</strong> Intérêt légitime (fonctionnement du service)
                      </p>
                    </div>
                  </div>

                  <div className="border border-blue-200 rounded-xl p-6 bg-blue-50">
                    <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
                      ⚙️ Cookies fonctionnels (avec consentement)
                    </h3>
                    <p className="text-blue-800 mb-4">
                      Améliorent votre expérience en mémorisant vos préférences.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Préférences utilisateur</h4>
                        <ul className="text-blue-700 space-y-1">
                          <li>• Langue d'affichage</li>
                          <li>• Thème sombre/clair</li>
                          <li>• Réglages d'accessibilité</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Personnalisation</h4>
                        <ul className="text-blue-700 space-y-1">
                          <li>• Mise en page préférée</li>
                          <li>• Filtres de recherche</li>
                          <li>• Historique de navigation</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                      <p className="text-blue-800 text-sm">
                        <strong>Base légale :</strong> Consentement de l'utilisateur
                      </p>
                    </div>
                  </div>

                  <div className="border border-purple-200 rounded-xl p-6 bg-purple-50">
                    <h3 className="text-xl font-semibold text-purple-900 mb-4 flex items-center gap-2">
                      📊 Cookies analytiques (avec consentement)
                    </h3>
                    <p className="text-purple-800 mb-4">
                      Nous aident à comprendre comment vous utilisez notre site pour l'améliorer.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-purple-900 mb-2">Mesures d'audience</h4>
                        <ul className="text-purple-700 space-y-1">
                          <li>• Google Analytics (anonymisé)</li>
                          <li>• Pages les plus visitées</li>
                          <li>• Temps passé sur le site</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-900 mb-2">Performance</h4>
                        <ul className="text-purple-700 space-y-1">
                          <li>• Vitesse de chargement</li>
                          <li>• Erreurs techniques</li>
                          <li>• Optimisation mobile</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                      <p className="text-purple-800 text-sm">
                        <strong>Base légale :</strong> Consentement de l'utilisateur
                      </p>
                    </div>
                  </div>

                  <div className="border border-orange-200 rounded-xl p-6 bg-orange-50">
                    <h3 className="text-xl font-semibold text-orange-900 mb-4 flex items-center gap-2">
                      🎯 Cookies marketing (avec consentement)
                    </h3>
                    <p className="text-orange-800 mb-4">
                      Personnalisent les publicités et mesurent l'efficacité de nos campagnes.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-orange-900 mb-2">Publicité ciblée</h4>
                        <ul className="text-orange-700 space-y-1">
                          <li>• Google Ads</li>
                          <li>• Facebook Pixel</li>
                          <li>• Retargeting</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-900 mb-2">Réseaux sociaux</h4>
                        <ul className="text-orange-700 space-y-1">
                          <li>• Boutons de partage</li>
                          <li>• Widgets sociaux</li>
                          <li>• Intégrations vidéo</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                      <p className="text-orange-800 text-sm">
                        <strong>Base légale :</strong> Consentement de l'utilisateur
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Article 3 */}
              <section id="utilisation" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Notre utilisation détaillée</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cookie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Finalité
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durée
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="bg-green-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">next-auth.session-token</td>
                        <td className="px-6 py-4 text-sm text-gray-600">Authentification utilisateur</td>
                        <td className="px-6 py-4 text-sm text-gray-600">30 jours</td>
                        <td className="px-6 py-4 text-sm text-green-600 font-medium">Essentiel</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">reservation-cart</td>
                        <td className="px-6 py-4 text-sm text-gray-600">Panier de réservation</td>
                        <td className="px-6 py-4 text-sm text-gray-600">24 heures</td>
                        <td className="px-6 py-4 text-sm text-green-600 font-medium">Essentiel</td>
                      </tr>
                      <tr className="bg-blue-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">user-preferences</td>
                        <td className="px-6 py-4 text-sm text-gray-600">Préférences d'affichage</td>
                        <td className="px-6 py-4 text-sm text-gray-600">1 an</td>
                        <td className="px-6 py-4 text-sm text-blue-600 font-medium">Fonctionnel</td>
                      </tr>
                      <tr className="bg-purple-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">_ga, _ga_*</td>
                        <td className="px-6 py-4 text-sm text-gray-600">Google Analytics (anonymisé)</td>
                        <td className="px-6 py-4 text-sm text-gray-600">2 ans</td>
                        <td className="px-6 py-4 text-sm text-purple-600 font-medium">Analytique</td>
                      </tr>
                      <tr className="bg-orange-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">_fbp</td>
                        <td className="px-6 py-4 text-sm text-gray-600">Facebook Pixel</td>
                        <td className="px-6 py-4 text-sm text-gray-600">3 mois</td>
                        <td className="px-6 py-4 text-sm text-orange-600 font-medium">Marketing</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Article 4 */}
              <section id="duree" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Durée de conservation</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                      ⏱️ Cookies de session
                    </h3>
                    <p className="text-yellow-800 text-sm mb-3">
                      Supprimés automatiquement à la fermeture du navigateur
                    </p>
                    <ul className="text-yellow-700 space-y-1 text-sm">
                      <li>• Authentification temporaire</li>
                      <li>• Panier de réservation</li>
                      <li>• Navigation sécurisée</li>
                    </ul>
                  </div>
                  
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-3">
                      📅 Cookies persistants
                    </h3>
                    <p className="text-indigo-800 text-sm mb-3">
                      Conservés selon la durée définie (maximum 25 mois)
                    </p>
                    <ul className="text-indigo-700 space-y-1 text-sm">
                      <li>• Préférences utilisateur : 1 an</li>
                      <li>• Analytics : 2 ans maximum</li>
                      <li>• Marketing : 3 mois maximum</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    🔄 Renouvellement du consentement
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Conformément au RGPD, nous vous demanderons de renouveler votre consentement :
                  </p>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• <strong>Tous les 13 mois</strong> pour les cookies non-essentiels</li>
                    <li>• <strong>En cas de modification</strong> de notre politique</li>
                    <li>• <strong>Sur demande</strong> de votre part</li>
                  </ul>
                </div>
              </section>

              {/* Article 5 */}
              <section id="droits" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Vos droits et choix</h2>
                
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
                  <h3 className="text-xl font-semibold text-green-900 mb-4">
                    ✅ Vous avez le contrôle total
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-green-800 mb-3">Vos droits :</h4>
                      <ul className="text-green-700 space-y-2 text-sm">
                        <li>• <strong>Accepter</strong> tous les cookies</li>
                        <li>• <strong>Refuser</strong> les cookies non-essentiels</li>
                        <li>• <strong>Personnaliser</strong> vos préférences</li>
                        <li>• <strong>Modifier</strong> vos choix à tout moment</li>
                        <li>• <strong>Supprimer</strong> les cookies existants</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-800 mb-3">Conséquences du refus :</h4>
                      <ul className="text-green-700 space-y-2 text-sm">
                        <li>• <strong>Aucun impact</strong> sur les fonctionnalités essentielles</li>
                        <li>• <strong>Préférences non sauvegardées</strong> (langue, thème)</li>
                        <li>• <strong>Pas de statistiques</strong> d'amélioration</li>
                        <li>• <strong>Publicités moins pertinentes</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Article 6 - Gestionnaire de préférences */}
              <section id="gestion" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Gérer vos préférences</h2>
                
                <CookiePreferencesManager />
              </section>

              {/* Article 7 */}
              <section id="tiers" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Cookies de services tiers</h2>
                
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-3">
                      🌐 Services externes
                    </h3>
                    <p className="text-red-800 mb-4">
                      Certains cookies sont déposés par des services tiers que nous utilisons :
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <h4 className="font-semibold text-red-900 mb-2">Google Services</h4>
                        <ul className="text-red-700 space-y-1">
                          <li>• <strong>Google Analytics :</strong> Mesure d'audience anonymisée</li>
                          <li>• <strong>Google Maps :</strong> Cartes interactives</li>
                          <li>• <strong>Google Fonts :</strong> Polices d'affichage</li>
                        </ul>
                        <p className="text-red-600 text-xs mt-2">
                          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                            Politique de confidentialité Google
                          </a>
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-red-900 mb-2">Autres services</h4>
                        <ul className="text-red-700 space-y-1">
                          <li>• <strong>Stripe :</strong> Paiements sécurisés</li>
                          <li>• <strong>Facebook :</strong> Partage social et publicité</li>
                          <li>• <strong>Vercel :</strong> Hébergement et performance</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                      🔒 Protection de vos données
                    </h3>
                    <p className="text-blue-800 mb-3">
                      Tous nos partenaires respectent le RGPD et vos données sont protégées :
                    </p>
                    <ul className="text-blue-700 space-y-1 text-sm">
                      <li>• <strong>Anonymisation :</strong> Google Analytics configuré pour anonymiser les IP</li>
                      <li>• <strong>Chiffrement :</strong> Toutes les données sont chiffrées en transit</li>
                      <li>• <strong>Limitation :</strong> Seules les données nécessaires sont partagées</li>
                      <li>• <strong>Contrôle :</strong> Vous pouvez refuser ces cookies à tout moment</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Article 8 */}
              <section id="contact" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Contact et assistance</h2>
                
                <div className="bg-coffee-primary/5 border border-coffee-primary/20 rounded-2xl p-8">
                  <h3 className="text-lg font-semibold text-coffee-primary mb-4">
                    💬 Besoin d'aide ?
                  </h3>
                  <p className="text-gray-700 mb-6">
                    Pour toute question concernant notre utilisation des cookies ou pour exercer vos droits :
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Support technique</h4>
                      <div className="space-y-2 text-gray-700">
                        <p><strong>Email :</strong> <a href="mailto:support@coworkingcafe.fr" className="text-coffee-primary hover:underline">support@coworkingcafe.fr</a></p>
                        <p><strong>Téléphone :</strong> 03 88 XX XX XX</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Protection des données</h4>
                      <div className="space-y-2 text-gray-700">
                        <p><strong>DPO :</strong> <a href="mailto:dpo@coworkingcafe.fr" className="text-coffee-primary hover:underline">dpo@coworkingcafe.fr</a></p>
                        <p><strong>Confidentialité :</strong> <a href="/confidentialite" className="text-coffee-primary hover:underline">Voir notre politique</a></p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-white rounded-lg">
                    <p className="text-gray-600 text-sm">
                      <strong>Délai de réponse :</strong> 72 heures maximum pour les questions techniques, 
                      1 mois pour les demandes RGPD
                    </p>
                  </div>
                </div>
              </section>

              {/* Footer du document */}
              <div className="border-t pt-8 text-center text-sm text-gray-500">
                <p>Document mis à jour le {lastUpdate}</p>
                <p className="mt-2">
                  Version 1.0 - Politique des Cookies - Cow or King Café
                </p>
                <p className="mt-2">
                  Conforme au Règlement Général sur la Protection des Données (RGPD)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollToTop />
    </main>
  )
}