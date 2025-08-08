# API Endpoints - Système de Réservations Coworking

Ce document décrit l'implémentation complète des API endpoints pour le système de réservations de la plateforme coworking.

## Fichiers créés et modifiés

### Nouveaux Endpoints API

1. **`/app/api/bookings/route.ts`** - Gestion des réservations
   - POST: Créer une réservation
   - GET: Liste des réservations utilisateur avec pagination et filtres

2. **`/app/api/bookings/[id]/route.ts`** - Gestion individuelle des réservations
   - GET: Détail d'une réservation
   - PUT: Modifier/annuler une réservation
   - DELETE: Suppression administrative

3. **`/app/api/bookings/availability/route.ts`** - Vérification de disponibilité
   - GET: Disponibilité d'un espace avec créneaux libres

4. **`/app/api/spaces/route.ts`** - Gestion des espaces (amélioré)
   - GET: Liste publique des espaces avec filtres avancés
   - POST: Création d'espaces (admin)

### Types et Utilitaires

5. **`/types/booking.ts`** - Types TypeScript pour l'API
   - Interfaces compatibles avec l'interface BookingFlow existante
   - Types pour réponses API et paramètres de requête

6. **`/lib/api/bookings.ts`** - Client API côté frontend
   - Fonctions utilitaires pour appeler les endpoints
   - Gestion d'erreurs typée
   - Hook personnalisé useBookingsApi

### Documentation et Tests

7. **`/docs/API_BOOKINGS.md`** - Documentation complète
   - Exemples d'utilisation pour chaque endpoint
   - Codes d'erreur et gestion des cas limites

8. **`/__tests__/api/bookings.test.ts`** - Tests d'intégration
   - Tests automatisés pour tous les endpoints
   - Validation des données et sécurité

## Fonctionnalités Implémentées

### ✅ Authentification et Sécurité
- Integration NextAuth pour l'authentification
- Vérification d'ownership des réservations
- Validation Zod sur toutes les entrées
- Gestion des erreurs sécurisée
- Logs d'audit pour toutes les actions

### ✅ Gestion des Réservations
- Création avec validation des conflits
- Modification avec vérification des contraintes
- Annulation avec règles métier
- Liste avec filtres et pagination
- Détails complets avec informations d'espace

### ✅ Système de Disponibilité
- Vérification en temps réel des créneaux
- Créneaux libres consécutifs
- Recommandations intelligentes
- Support des heures d'ouverture
- Statistiques d'occupation

### ✅ API Espaces
- Liste publique avec filtres avancés
- Recherche textuelle
- Tri par popularité et note
- Insertion automatique des espaces par défaut
- Création administrative

### ✅ Compatibilité Frontend
- Types compatibles avec BookingFlow existant
- Client API prêt à l'emploi
- Gestion d'erreurs standardisée
- Support de la pagination

## Architecture

```
/app/api/
├── bookings/
│   ├── route.ts                 # POST, GET bookings
│   ├── [id]/
│   │   └── route.ts             # GET, PUT, DELETE booking
│   └── availability/
│       └── route.ts             # GET availability
└── spaces/
    └── route.ts                 # GET, POST spaces

/lib/
├── models/                      # Modèles MongoDB existants
├── mongodb-utils.ts            # Utilitaires existants
└── api/
    └── bookings.ts             # Client API

/types/
└── booking.ts                  # Types TypeScript

/docs/
└── API_BOOKINGS.md            # Documentation

/__tests__/api/
└── bookings.test.ts           # Tests
```

## Intégration avec l'existant

### Modèles MongoDB Utilisés
- `Booking` - Modèle de réservation avec validation
- `Space` - Modèle d'espace avec données par défaut
- Utilisation des utilitaires existants (`mongodb-utils.ts`)

### Authentication NextAuth
- Session utilisateur automatique
- Vérification des rôles (admin, client)
- CSRF protection en production

### Validation et Sécurité
- Schémas Zod pour validation stricte
- Gestion d'erreurs standardisée
- Rate limiting sur les appels API
- Logs de sécurité et d'audit

## Exemples d'Utilisation

### Côté Client

```typescript
import { bookingsApi, spacesApi } from '@/lib/api/bookings'

// Créer une réservation
const booking = await bookingsApi.create({
  spaceId: 'places',
  date: '2024-01-15',
  startTime: '14:00',
  endTime: '16:00',
  duration: 2,
  durationType: 'hour',
  guests: 4
})

// Vérifier disponibilité
const availability = await bookingsApi.checkAvailability({
  spaceId: 'places',
  date: '2024-01-15'
})

// Lister les espaces
const spaces = await spacesApi.list({
  available: true,
  specialty: 'Café coworking'
})
```

### Côté Serveur (API Routes)

```typescript
// Dans un composant Server
import { getServerSession } from 'next-auth'
import { bookingsApi } from '@/lib/api/bookings'

export default async function BookingsPage() {
  const session = await getServerSession(authOptions)
  
  // Utiliser les endpoints via fetch ou directement
  const bookings = await fetch('/api/bookings')
  
  return <BookingsList bookings={bookings} />
}
```

## Tests et Qualité

### Tests Automatisés
- Tests d'intégration pour tous les endpoints
- Validation des données et sécurité
- Gestion des erreurs et cas limites
- Nettoyage automatique des données de test

### Gestion d'Erreurs
- Codes d'erreur standardisés
- Messages utilisateur localisés
- Logs détaillés pour debug
- Fallbacks gracieux

## Performance

### Optimisations Implémentées
- Pagination efficace avec limit/offset
- Requêtes MongoDB optimisées avec `.lean()`
- Index appropriés sur les collections
- Sélection de champs spécifiques
- Cache des espaces par défaut

### Monitoring
- Logs structurés pour toutes les actions
- Métriques de performance disponibles
- Audit trail complet des réservations

## Sécurité

### Mesures Implémentées
- Authentification obligatoire pour les opérations sensibles
- Validation stricte de tous les inputs
- Protection contre les injections
- Rate limiting intégré
- Ownership verification
- CORS configuré correctement

### Audit et Logs
- Toutes les actions sont loggées
- IDs utilisateur inclus dans les logs
- Tracking des modifications et suppressions
- Logs d'erreur détaillés sans exposition d'informations sensibles

## Déploiement

Les endpoints sont prêts pour la production avec:
- Variables d'environnement configurées
- Gestion d'erreurs robuste
- Logs appropriés
- Tests de validation
- Documentation complète

Pour tester en local:
```bash
npm run dev
# Les endpoints sont disponibles sur http://localhost:3000/api/
```

## Prochaines Étapes

1. **Intégration Frontend**: Connecter l'interface BookingFlow existante
2. **Paiements**: Intégrer Stripe pour les transactions
3. **Notifications**: Système de notifications pour les réservations
4. **Analytics**: Tableaux de bord pour les statistiques
5. **Mobile**: API optimisées pour l'application mobile

Les endpoints sont maintenant prêts à être utilisés par l'interface utilisateur existante ou toute nouvelle interface frontend.