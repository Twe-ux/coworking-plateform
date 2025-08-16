import { Metadata } from 'next'
import { ScrollToTop } from '@/components/ui/scroll-to-top'
import { CookieButton } from '@/components/legal/CookieButton'

export const metadata: Metadata = {
  title: 'Mentions Légales | Cow or King Café - Coworking Strasbourg',
  description: 'Mentions légales de Cow or King Café. Informations sur l\'éditeur, l\'hébergeur et les obligations légales.',
  keywords: 'mentions légales, éditeur, hébergeur, coworking, strasbourg',
}

export default function MentionsLegalesPage() {
  const lastUpdate = '15 août 2024'

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 mb-6">
            ⚖️ Informations Légales
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Mentions{' '}
            <span className="bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
              Légales
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Informations légales relatives à l'édition et à l'hébergement du site
          </p>
          <p className="text-sm text-gray-500">
            Dernière mise à jour : {lastUpdate}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          
          {/* Article 1 - Éditeur du site */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Éditeur du site</h2>
            
            <div className="bg-coffee-primary/5 border border-coffee-primary/20 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-coffee-primary mb-4">
                    📍 Identification de l'entreprise
                  </h3>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Dénomination sociale :</strong> Cow or King Café</p>
                    <p><strong>Forme juridique :</strong> [SARL / SAS / Auto-entrepreneur]</p>
                    <p><strong>Capital social :</strong> [Montant] €</p>
                    <p><strong>SIRET :</strong> [Numéro SIRET]</p>
                    <p><strong>TVA Intracommunautaire :</strong> [Numéro TVA]</p>
                    <p><strong>Code APE :</strong> 5630Z (Débits de boissons)</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-coffee-primary mb-4">
                    📞 Coordonnées
                  </h3>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Adresse :</strong><br />
                       1 rue de la Division Leclerc<br />
                       67000 Strasbourg<br />
                       France
                    </p>
                    <p><strong>Téléphone :</strong> 03 88 XX XX XX</p>
                    <p><strong>Email :</strong> <a href="mailto:contact@coworkingcafe.fr" className="text-coffee-primary hover:underline">contact@coworkingcafe.fr</a></p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-coffee-primary/20">
                <h3 className="text-lg font-semibold text-coffee-primary mb-4">
                  👤 Représentant légal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                  <div>
                    <p><strong>Gérant / Président :</strong> [Nom du dirigeant]</p>
                    <p><strong>Directeur de publication :</strong> [Nom du directeur]</p>
                  </div>
                  <div>
                    <p><strong>Email direction :</strong> <a href="mailto:direction@coworkingcafe.fr" className="text-coffee-primary hover:underline">direction@coworkingcafe.fr</a></p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Article 2 - Hébergement */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Hébergement du site</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    🌐 Hébergeur principal
                  </h3>
                  <div className="space-y-3 text-blue-800">
                    <p><strong>Société :</strong> Vercel Inc.</p>
                    <p><strong>Adresse :</strong><br />
                       440 N Barranca Ave #4133<br />
                       Covina, CA 91723<br />
                       États-Unis
                    </p>
                    <p><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="underline">vercel.com</a></p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    🗄️ Hébergement données
                  </h3>
                  <div className="space-y-3 text-blue-800">
                    <p><strong>Base de données :</strong> MongoDB Atlas</p>
                    <p><strong>Société :</strong> MongoDB, Inc.</p>
                    <p><strong>Localisation :</strong> Europe (Frankfurt, Allemagne)</p>
                    <p><strong>Conformité :</strong> RGPD, ISO 27001</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-100 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-2">🔒 Sécurité et conformité</h4>
                <p className="text-blue-800 text-sm">
                  Tous nos hébergeurs respectent les standards de sécurité internationaux et les exigences du RGPD 
                  pour la protection des données européennes.
                </p>
              </div>
            </div>
          </section>

          {/* Article 3 - Propriété intellectuelle */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Propriété intellectuelle</h2>
            
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">
                  © Droits d'auteur
                </h3>
                <p className="text-purple-800 mb-4">
                  L'ensemble des éléments accessibles sur le site (textes, images, graphismes, logo, icônes, sons, 
                  logiciels, etc.) reste la propriété exclusive de Cow or King Café, à l'exception des marques, 
                  logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
                </p>
                <ul className="text-purple-700 space-y-2 text-sm">
                  <li>• Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site est interdite</li>
                  <li>• Sauf autorisation écrite préalable de Cow or King Café</li>
                  <li>• Cette interdiction s'étend aux bases de données figurant sur le site</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  ™ Marques et logos
                </h3>
                <p className="text-green-800">
                  "Cow or King Café" ainsi que les logos et marques présents sur le site sont des marques déposées 
                  ou en cours de dépôt. Toute utilisation non autorisée de ces marques est interdite.
                </p>
              </div>
            </div>
          </section>

          {/* Article 4 - Données personnelles */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Protection des données personnelles</h2>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4">
                🔐 Traitement des données
              </h3>
              <p className="text-indigo-800 mb-4">
                Les données personnelles collectées sur ce site font l'objet d'un traitement informatique 
                conforme au Règlement Général sur la Protection des Données (RGPD).
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-indigo-700">
                <div>
                  <h4 className="font-semibold mb-2">Responsable du traitement :</h4>
                  <p>Cow or King Café</p>
                  <p>1 rue de la Division Leclerc</p>
                  <p>67000 Strasbourg</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Délégué à la Protection des Données :</h4>
                  <p>Email : <a href="mailto:dpo@coworkingcafe.fr" className="underline">dpo@coworkingcafe.fr</a></p>
                  <p>Tél : 03 88 XX XX XX</p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-indigo-100 rounded-lg">
                <p className="text-indigo-800 text-sm">
                  <strong>Pour plus d'informations :</strong> Consultez notre 
                  <a href="/confidentialite" className="underline ml-1">Politique de Confidentialité</a>
                </p>
              </div>
            </div>
          </section>

          {/* Article 5 - Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Utilisation des cookies</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                🍪 Politique des cookies
              </h3>
              <p className="text-yellow-800 mb-4">
                Ce site utilise des cookies pour améliorer votre expérience de navigation, réaliser des statistiques 
                de visites et vous proposer des contenus adaptés.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-yellow-700 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Cookies essentiels</h4>
                  <p>Nécessaires au fonctionnement du site</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Cookies analytiques</h4>
                  <p>Mesure d'audience anonymisée</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Cookies marketing</h4>
                  <p>Personnalisation publicitaire</p>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-3">
                <CookieButton />
                <a href="/cookies" className="bg-white text-yellow-600 border border-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-50 transition-colors text-sm">
                  📄 Politique détaillée
                </a>
              </div>
            </div>
          </section>

          {/* Article 6 - Responsabilité */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Limitation de responsabilité</h2>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-3">
                  ⚠️ Informations du site
                </h3>
                <p className="text-red-800 mb-3">
                  Cow or King Café s'efforce de fournir des informations aussi précises que possible. 
                  Toutefois, il ne pourra être tenu responsable des omissions, des inexactitudes et des 
                  carences dans la mise à jour.
                </p>
                <ul className="text-red-700 space-y-1 text-sm">
                  <li>• Les informations sont données à titre indicatif</li>
                  <li>• Elles ne sauraient engager la responsabilité de l'éditeur</li>
                  <li>• Vérifiez toujours les informations importantes</li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-orange-900 mb-3">
                  🔗 Liens externes
                </h3>
                <p className="text-orange-800">
                  Les liens hypertextes mis en place dans le cadre du présent site internet en direction 
                  d'autres ressources présentes sur le réseau Internet ne sauraient engager la responsabilité 
                  de Cow or King Café.
                </p>
              </div>
            </div>
          </section>

          {/* Article 7 - Droit applicable */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Droit applicable et juridictions</h2>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ⚖️ Législation française
              </h3>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Droit applicable :</strong> Les présentes mentions légales sont régies par le droit français.
                </p>
                <p>
                  <strong>Juridiction compétente :</strong> En cas de litige, les tribunaux de Strasbourg seront seuls compétents.
                </p>
                <p>
                  <strong>Conformité :</strong> Ce site est conforme aux dispositions de :
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>La loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique</li>
                  <li>Le Règlement Général sur la Protection des Données (RGPD)</li>
                  <li>La loi « Informatique et Libertés » du 6 janvier 1978 modifiée</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Article 8 - Contact */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Contact</h2>
            
            <div className="bg-coffee-primary/5 border border-coffee-primary/20 rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-coffee-primary mb-4">
                📞 Nous contacter
              </h3>
              <p className="text-gray-700 mb-6">
                Pour toute question relative aux présentes mentions légales ou au site en général :
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Contact général</h4>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Email :</strong> <a href="mailto:contact@coworkingcafe.fr" className="text-coffee-primary hover:underline">contact@coworkingcafe.fr</a></p>
                    <p><strong>Téléphone :</strong> 03 88 XX XX XX</p>
                    <p><strong>Horaires :</strong> Lun-Ven 9h-18h</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Questions légales</h4>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Email :</strong> <a href="mailto:legal@coworkingcafe.fr" className="text-coffee-primary hover:underline">legal@coworkingcafe.fr</a></p>
                    <p><strong>DPO :</strong> <a href="mailto:dpo@coworkingcafe.fr" className="text-coffee-primary hover:underline">dpo@coworkingcafe.fr</a></p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-white rounded-lg">
                <p className="text-gray-600 text-sm">
                  <strong>Adresse postale :</strong> Cow or King Café, 1 rue de la Division Leclerc, 67000 Strasbourg, France
                </p>
              </div>
            </div>
          </section>

          {/* Footer du document */}
          <div className="border-t pt-8 text-center text-sm text-gray-500">
            <p>Document mis à jour le {lastUpdate}</p>
            <p className="mt-2">
              Version 1.0 - Mentions Légales - Cow or King Café
            </p>
            <p className="mt-2">
              Conforme à la Loi pour la Confiance dans l'Économie Numérique (LCEN)
            </p>
          </div>
        </div>
      </div>

      <ScrollToTop />
    </main>
  )
}