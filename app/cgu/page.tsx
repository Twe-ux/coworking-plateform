import { Metadata } from 'next'
import { ScrollToTop } from '@/components/ui/scroll-to-top'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation | Cow or King Café - Coworking Strasbourg',
  description: 'Consultez les conditions générales d\'utilisation de notre espace de coworking café à Strasbourg. Règles d\'utilisation, réservations et annulations.',
  robots: 'index, follow'
}

export default function CGUPage() {
  const lastUpdate = '15 août 2024'

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-coffee-primary/5 to-coffee-accent/5">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Conditions Générales d'{' '}
            <span className="bg-gradient-to-r from-coffee-accent to-coffee-primary bg-clip-text text-transparent">
              Utilisation
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Règles d'utilisation de notre espace de coworking café
          </p>
          <p className="text-sm text-gray-500">
            Dernière mise à jour : {lastUpdate}
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
                <a href="#article1" className="block text-sm text-gray-600 hover:text-coffee-primary transition-colors">
                  1. Définitions
                </a>
                <a href="#article2" className="block text-sm text-gray-600 hover:text-coffee-primary transition-colors">
                  2. Objet
                </a>
                <a href="#article3" className="block text-sm text-gray-600 hover:text-coffee-primary transition-colors">
                  3. Acceptation des CGU
                </a>
                <a href="#article4" className="block text-sm text-gray-600 hover:text-coffee-primary transition-colors">
                  4. Accès aux services
                </a>
                <a href="#article5" className="block text-sm text-gray-600 hover:text-coffee-primary transition-colors">
                  5. Réservations
                </a>
                <a href="#article6" className="block text-sm text-gray-600 hover:text-coffee-primary transition-colors">
                  6. Annulations et remboursements
                </a>
                <a href="#article7" className="block text-sm text-gray-600 hover:text-coffee-primary transition-colors">
                  7. Règles d'utilisation
                </a>
                <a href="#article8" className="block text-sm text-gray-600 hover:text-coffee-primary transition-colors">
                  8. Obligations du client
                </a>
                <a href="#article9" className="block text-sm text-gray-600 hover:text-coffee-primary transition-colors">
                  9. Protection des données
                </a>
                <a href="#article10" className="block text-sm text-gray-600 hover:text-coffee-primary transition-colors">
                  10. Responsabilité
                </a>
                <a href="#article11" className="block text-sm text-gray-600 hover:text-coffee-primary transition-colors">
                  11. Propriété intellectuelle
                </a>
                <a href="#article12" className="block text-sm text-gray-600 hover:text-coffee-primary transition-colors">
                  12. Modification des CGU
                </a>
                <a href="#article13" className="block text-sm text-gray-600 hover:text-coffee-primary transition-colors">
                  13. Droit applicable et litiges
                </a>
                <a href="#contact" className="block text-sm text-gray-600 hover:text-coffee-primary transition-colors">
                  Contact
                </a>
              </nav>
            </div>
          </div>

          {/* Contenu */}
          <div className="lg:col-span-3">
            <div className="prose prose-lg max-w-none">
              
              {/* Article 1 */}
              <section id="article1" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Définitions</h2>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="mb-4">
                    <strong>&quot;Cow or King Café&quot;</strong> : désigne l'espace de coworking café situé au 1 rue de la Division Leclerc, 67000 Strasbourg, exploité par [Nom de la société].
                  </p>
                  <p className="mb-4">
                    <strong>&quot;Client&quot; ou &quot;Utilisateur&quot;</strong> : désigne toute personne physique ou morale utilisant les services de l'espace de coworking.
                  </p>
                  <p className="mb-4">
                    <strong>&quot;Services&quot;</strong> : désigne l'ensemble des prestations proposées par Cow or King Café, incluant l'accès aux espaces de travail, salles de réunion, services de restauration et équipements mis à disposition.
                  </p>
                  <p>
                    <strong>&quot;Plateforme&quot;</strong> : désigne le site internet et l'application mobile permettant la réservation des services.
                  </p>
                </div>
              </section>

              {/* Article 2 */}
              <section id="article2" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Objet</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Les présentes Conditions Générales d'Utilisation (CGU) définissent les termes et conditions d'utilisation des services proposés par Cow or King Café, espace de coworking café situé à Strasbourg.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Elles s'appliquent à toute utilisation de nos services, que ce soit sur place, via notre plateforme de réservation en ligne, ou par tout autre moyen de communication.
                </p>
              </section>

              {/* Article 3 */}
              <section id="article3" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Acceptation des CGU</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  L'utilisation des services de Cow or King Café implique l'acceptation pleine et entière des présentes CGU.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  En cas de non-acceptation des CGU, l'utilisateur doit renoncer à l'utilisation des services.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Important :</strong> Nous vous recommandons de conserver une copie des présentes CGU et de consulter régulièrement leur version mise à jour.
                  </p>
                </div>
              </section>

              {/* Article 4 */}
              <section id="article4" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Accès aux services</h2>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">4.1 Horaires d'ouverture</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Lundi à Vendredi : 8h00 - 20h00</li>
                  <li>Samedi : 9h00 - 18h00</li>
                  <li>Dimanche : 10h00 - 17h00</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">4.2 Conditions d'accès</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  L'accès aux services est ouvert à toute personne majeure ou mineure accompagnée d'un tuteur légal.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Un système de contrôle d'accès peut être mis en place pour garantir la sécurité des utilisateurs et du matériel.
                </p>
              </section>

              {/* Article 5 */}
              <section id="article5" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Réservations</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">5.1 Modalités de réservation</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Les réservations peuvent être effectuées :
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>En ligne via notre plateforme de réservation</li>
                  <li>Par téléphone au 03 88 XX XX XX</li>
                  <li>Directement sur place, sous réserve de disponibilité</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">5.2 Confirmation de réservation</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Toute réservation est confirmée par l'envoi d'un email de confirmation contenant :
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Les détails de la réservation (date, heure, espace)</li>
                  <li>Le montant total à régler</li>
                  <li>Les conditions d'annulation applicables</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">5.3 Paiement</h3>
                <p className="text-gray-700 leading-relaxed">
                  Le paiement s'effectue au moment de la réservation par carte bancaire sécurisée ou sur place par carte bancaire, espèces ou chèque.
                </p>
              </section>

              {/* Article 6 */}
              <section id="article6" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Annulations et remboursements</h2>
                
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
                  <h3 className="text-xl font-semibold text-orange-900 mb-4">Politique d'annulation</h3>
                  
                  <h4 className="font-semibold text-orange-800 mb-2">Espaces de travail partagés :</h4>
                  <ul className="list-disc list-inside text-orange-800 mb-4 space-y-1">
                    <li><strong>Plus de 48h avant :</strong> Remboursement intégral</li>
                    <li><strong>24h à 48h avant :</strong> Remboursement à 50%</li>
                    <li><strong>Moins de 24h :</strong> Aucun remboursement</li>
                  </ul>

                  <h4 className="font-semibold text-orange-800 mb-2">Salles de réunion privées :</h4>
                  <ul className="list-disc list-inside text-orange-800 mb-4 space-y-1">
                    <li><strong>Plus de 72h avant :</strong> Remboursement intégral</li>
                    <li><strong>48h à 72h avant :</strong> Remboursement à 70%</li>
                    <li><strong>24h à 48h avant :</strong> Remboursement à 30%</li>
                    <li><strong>Moins de 24h :</strong> Aucun remboursement</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">6.1 Procédure d'annulation</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Les annulations doivent être notifiées par email à <a href="mailto:reservations@coworkingcafe.fr" className="text-coffee-primary hover:underline">reservations@coworkingcafe.fr</a> ou via l'espace client de la plateforme.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">6.2 Cas de force majeure</h3>
                <p className="text-gray-700 leading-relaxed">
                  En cas de force majeure (maladie avec certificat médical, grève des transports, etc.), un remboursement ou un report peut être accordé à la discrétion de la direction.
                </p>
              </section>

              {/* Article 7 */}
              <section id="article7" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Règles d'utilisation</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">7.1 Respect de l'environnement de travail</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Maintenir un niveau sonore approprié (téléphone en mode silencieux)</li>
                  <li>Nettoyer son espace de travail après utilisation</li>
                  <li>Respecter les autres utilisateurs et le personnel</li>
                  <li>Ne pas déplacer le mobilier sans autorisation</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">7.2 Utilisation des équipements</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>WiFi gratuit et illimité fourni</li>
                  <li>Prises électriques disponibles à chaque poste</li>
                  <li>Imprimante/scanner accessible moyennant participation</li>
                  <li>Cuisine équipée en libre-service</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">7.3 Interdictions</h3>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <ul className="list-disc list-inside text-red-800 space-y-2">
                    <li>Fumer dans l'enceinte de l'établissement</li>
                    <li>Consommer de l'alcool sauf autorisation expresse</li>
                    <li>Introduire des animaux (sauf chiens d'assistance)</li>
                    <li>Utiliser les espaces à des fins illégales</li>
                    <li>Tenir des activités commerciales non autorisées</li>
                  </ul>
                </div>
              </section>

              {/* Article 8 */}
              <section id="article8" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Obligations du client</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">8.1 Obligations générales</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Le client s'engage à :
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Respecter les présentes CGU et le règlement intérieur</li>
                  <li>Effectuer toutes les formalités administratives, fiscales et sociales qui lui incombent</li>
                  <li>Souscrire une assurance responsabilité civile professionnelle</li>
                  <li>Signaler immédiatement tout dommage ou dysfonctionnement</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">8.2 Protection des données et confidentialité</h3>
                <p className="text-gray-700 leading-relaxed">
                  Le client s'engage à respecter la confidentialité des informations auxquelles il pourrait avoir accès concernant les autres utilisateurs ou l'établissement.
                </p>
              </section>

              {/* Article 9 */}
              <section id="article9" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Protection des données personnelles</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">Conformité RGPD</h3>
                  
                  <h4 className="font-semibold text-blue-800 mb-2">Données collectées :</h4>
                  <ul className="list-disc list-inside text-blue-800 mb-4 space-y-1">
                    <li>Informations d'identification (nom, prénom, email, téléphone)</li>
                    <li>Données de facturation et de paiement</li>
                    <li>Données de connexion et d'utilisation des services</li>
                  </ul>

                  <h4 className="font-semibold text-blue-800 mb-2">Finalités du traitement :</h4>
                  <ul className="list-disc list-inside text-blue-800 mb-4 space-y-1">
                    <li>Gestion des réservations et de la facturation</li>
                    <li>Communication commerciale (avec consentement)</li>
                    <li>Amélioration de nos services</li>
                    <li>Respect des obligations légales et comptables</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">9.1 Droits des utilisateurs</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Conformément au RGPD, vous disposez des droits suivants :
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Droit d'accès à vos données personnelles</li>
                  <li>Droit de rectification et de mise à jour</li>
                  <li>Droit à l'effacement ("droit à l'oubli")</li>
                  <li>Droit à la limitation du traitement</li>
                  <li>Droit à la portabilité des données</li>
                  <li>Droit d'opposition au traitement</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">9.2 Conservation des données</h3>
                <p className="text-gray-700 leading-relaxed">
                  Les données sont conservées pendant la durée de la relation contractuelle et peuvent être conservées pendant 10 ans après la fin de la relation pour respecter les obligations comptables et fiscales.
                </p>
              </section>

              {/* Article 10 */}
              <section id="article10" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Responsabilité</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">10.1 Responsabilité de Cow or King Café</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Cow or King Café s'engage à fournir ses services avec diligence et professionnalisme. Toutefois, sa responsabilité est limitée aux dommages directs prouvés.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Cow or King Café ne peut être tenu responsable :
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Des vols ou dégradations d'effets personnels</li>
                  <li>Des interruptions de service dues à des cas de force majeure</li>
                  <li>Des dysfonctionnements temporaires d'internet ou d'équipements</li>
                  <li>Des dommages indirects (perte d'exploitation, manque à gagner)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">10.2 Responsabilité du client</h3>
                <p className="text-gray-700 leading-relaxed">
                  Le client est responsable de tous dommages causés aux biens, aux personnes ou à l'image de l'établissement du fait de son utilisation des services.
                </p>
              </section>

              {/* Article 11 */}
              <section id="article11" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Propriété intellectuelle</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Tous les éléments du site internet et de la marque "Cow or King Café" (textes, images, vidéos, logos, etc.) sont protégés par les droits de propriété intellectuelle.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Toute reproduction, représentation, modification ou adaptation sans autorisation expresse est interdite et constitue une contrefaçon sanctionnée par le Code de la propriété intellectuelle.
                </p>
              </section>

              {/* Article 12 */}
              <section id="article12" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">12. Modification des CGU</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Cow or King Café se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur le site internet.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Les utilisateurs sont invités à consulter régulièrement les CGU. L'utilisation continue des services après modification vaut acceptation des nouvelles conditions.
                </p>
              </section>

              {/* Article 13 */}
              <section id="article13" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">13. Droit applicable et litiges</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'efforceront de trouver une solution amiable.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  À défaut d'accord amiable dans un délai de 30 jours, le litige sera porté devant les tribunaux compétents de Strasbourg.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-800 text-sm">
                    <strong>Médiation :</strong> Conformément à la loi, nous adhérons à un service de médiation de la consommation. En cas de litige, vous pouvez saisir gratuitement le médiateur via <a href="https://www.economie.gouv.fr/mediation-conso" className="underline">economie.gouv.fr/mediation-conso</a>
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section id="contact" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact</h2>
                <div className="bg-coffee-primary/5 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-coffee-primary mb-4">
                    Cow or King Café
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Adresse :</strong> 1 rue de la Division Leclerc, 67000 Strasbourg</p>
                    <p><strong>Téléphone :</strong> 03 88 XX XX XX</p>
                    <p><strong>Email :</strong> <a href="mailto:contact@coworkingcafe.fr" className="text-coffee-primary hover:underline">contact@coworkingcafe.fr</a></p>
                    <p><strong>Horaires d'accueil :</strong> Lundi au Vendredi, 9h00 - 18h00</p>
                  </div>
                </div>
              </section>

              {/* Footer du document */}
              <div className="border-t pt-8 text-center text-sm text-gray-500">
                <p>Document mis à jour le {lastUpdate}</p>
                <p className="mt-2">
                  Version 1.0 - Conditions Générales d'Utilisation Cow or King Café
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