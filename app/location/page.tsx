import { LocationSection } from '@/components/home/LocationSection'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nous trouver | Cow or King Café - Coworking Strasbourg',
  description:
    'Situé au cœur de Strasbourg, notre espace de coworking est facilement accessible. Découvrez nos horaires, comment venir et nos services.',
  keywords:
    'localisation, adresse, horaires, strasbourg, coworking, transport, parking',
}

export default function LocationPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="from-coffee-primary/5 to-coffee-accent/5 bg-gradient-to-br px-4 pt-32 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl">
            Venez nous{' '}
            <span className="from-coffee-accent to-coffee-primary bg-gradient-to-r bg-clip-text text-transparent">
              rencontrer
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
            Notre espace de coworking vous attend au cœur de Strasbourg, dans un
            cadre unique alliant productivité et convivialité.
          </p>

          {/* Statut en temps réel */}
          {/* <BusinessHours variant="hero" className="mb-8" /> */}

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button className="bg-coffee-primary hover:bg-coffee-primary/90 rounded-full px-8 py-4 font-semibold text-white transition-colors">
              Réserver maintenant
            </button>
            <button className="border-coffee-primary text-coffee-primary hover:bg-coffee-primary rounded-full border-2 px-8 py-4 font-semibold transition-colors hover:text-white">
              Nous appeler
            </button>
          </div>
        </div>
      </section>

      {/* Section principale */}
      <LocationSection />

      {/* Section FAQ localisation */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Questions fréquentes
          </h2>

          <div className="space-y-8">
            <div className="rounded-xl bg-gray-50 p-6">
              <h3 className="mb-3 text-lg font-bold text-gray-900">
                Y a-t-il du parking gratuit ?
              </h3>
              <p className="text-gray-600">
                Le stationnement en centre-ville est payant. Nous recommandons
                les parkings Austerlitz ou Gutenberg (3 min à pied) ou de venir
                en transport en commun - le tram s'arrête à 2 min du café.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-6">
              <h3 className="mb-3 text-lg font-bold text-gray-900">
                L'espace est-il accessible aux personnes à mobilité réduite ?
              </h3>
              <p className="text-gray-600">
                Oui, notre espace est entièrement accessible PMR avec un accès
                plain-pied, des toilettes adaptées et des espaces de travail
                aménagés.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-6">
              <h3 className="mb-3 text-lg font-bold text-gray-900">
                Peut-on venir avec des clients pour des réunions ?
              </h3>
              <p className="text-gray-600">
                Absolument ! Nous disposons de salles de réunion privées et
                d'espaces de réception. Nous pouvons également organiser un
                service café/collations pour vos rendez-vous professionnels.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-6">
              <h3 className="mb-3 text-lg font-bold text-gray-900">
                Y a-t-il des commerces à proximité ?
              </h3>
              <p className="text-gray-600">
                Situés Place Kléber, vous êtes au cœur de la zone commerciale de
                Strasbourg : restaurants, boutiques, services bancaires... tout
                est accessible à pied.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
