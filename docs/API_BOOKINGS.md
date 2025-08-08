# API Endpoints - Système de Réservations

Documentation complète des endpoints API pour la gestion des réservations de la plateforme coworking.

## Configuration

Les endpoints sont disponibles sur la base `/api/` et utilisent l'authentification NextAuth pour les opérations protégées.

### Headers requis

```
Content-Type: application/json
Authorization: Bearer <session-token> // Géré automatiquement par NextAuth
```

## Endpoints Réservations

### 1. POST /api/bookings - Créer une réservation

**Authentification:** Requise
**Méthode:** POST

```typescript
// Payload
{
  spaceId: string,
  date: string, // ISO date string (YYYY-MM-DD)
  startTime: string, // Format HH:mm
  endTime: string, // Format HH:mm
  duration: number,
  durationType: 'hour' | 'day' | 'week' | 'month',
  guests: number, // 1-20
  notes?: string // max 500 caractères
}
```

**Exemple de requête:**
```javascript
const response = await fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    spaceId: 'places',
    date: '2024-01-15',
    startTime: '14:00',
    endTime: '16:00',
    duration: 2,
    durationType: 'hour',
    guests: 4,
    notes: 'Réunion équipe marketing'
  })
})
```

**Réponse (201):**
```json
{
  "message": "Réservation créée avec succès",
  "booking": {
    "id": "65a1b2c3d4e5f6789012",
    "userId": "user123",
    "spaceId": "places",
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "16:00",
    "duration": 2,
    "durationType": "hour",
    "guests": 4,
    "totalPrice": 16,
    "status": "pending",
    "paymentStatus": "pending",
    "notes": "Réunion équipe marketing",
    "createdAt": "2024-01-10T10:30:00.000Z",
    "updatedAt": "2024-01-10T10:30:00.000Z"
  }
}
```

### 2. GET /api/bookings - Liste des réservations

**Authentification:** Requise
**Méthode:** GET

**Paramètres de requête:**
- `status` (optionnel): pending | confirmed | cancelled | completed
- `date` (optionnel): Date ISO (YYYY-MM-DD)
- `spaceId` (optionnel): ID de l'espace
- `limit` (optionnel): Nombre max de résultats (défaut: 10, max: 100)
- `offset` (optionnel): Décalage pour pagination (défaut: 0)

**Exemple:**
```javascript
const response = await fetch('/api/bookings?status=confirmed&limit=5&offset=0')
```

**Réponse (200):**
```json
{
  "bookings": [
    {
      "id": "65a1b2c3d4e5f6789012",
      "userId": "user123",
      "space": {
        "id": "places",
        "name": "Places du café",
        "location": "Rez-de-chaussée - Zone café",
        "capacity": 12,
        "specialty": "Café coworking",
        "image": "/images/spaces/cafe.jpg",
        "features": ["WiFi haut débit", "Prises électriques"],
        "rating": 4.7
      },
      "date": "2024-01-15T00:00:00.000Z",
      "startTime": "14:00",
      "endTime": "16:00",
      "status": "confirmed",
      "canBeCancelled": true,
      "canBeModified": false
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 5,
    "offset": 0,
    "hasMore": true
  }
}
```

### 3. GET /api/bookings/[id] - Détail d'une réservation

**Authentification:** Requise (ownership vérifié)
**Méthode:** GET

**Exemple:**
```javascript
const response = await fetch('/api/bookings/65a1b2c3d4e5f6789012')
```

**Réponse (200):**
```json
{
  "booking": {
    "id": "65a1b2c3d4e5f6789012",
    "user": {
      "id": "user123",
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean@example.com"
    },
    "space": {
      "id": "places",
      "name": "Places du café",
      "location": "Rez-de-chaussée - Zone café",
      "description": "Un espace ouvert et convivial...",
      "pricing": {
        "perHour": 8,
        "perDay": 45,
        "perWeek": 250,
        "perMonth": 900
      }
    },
    "canBeCancelled": true,
    "canBeModified": false,
    "isPast": false,
    "isActive": true,
    "formattedDate": "15/01/2024",
    "formattedTimeRange": "14:00 - 16:00"
  }
}
```

### 4. PUT /api/bookings/[id] - Modifier une réservation

**Authentification:** Requise (ownership vérifié)
**Méthode:** PUT

**Payload (tous les champs optionnels):**
```typescript
{
  date?: string,
  startTime?: string,
  endTime?: string,
  duration?: number,
  durationType?: 'hour' | 'day' | 'week' | 'month',
  guests?: number,
  notes?: string,
  status?: 'cancelled' // Pour annuler uniquement
}
```

**Exemple d'annulation:**
```javascript
const response = await fetch('/api/bookings/65a1b2c3d4e5f6789012', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'cancelled' })
})
```

**Réponse (200):**
```json
{
  "message": "Réservation annulée avec succès",
  "booking": {
    "id": "65a1b2c3d4e5f6789012",
    "status": "cancelled",
    "updatedAt": "2024-01-10T11:00:00.000Z"
  }
}
```

### 5. GET /api/bookings/availability - Vérifier disponibilité

**Authentification:** Non requise (endpoint public)
**Méthode:** GET

**Paramètres requis:**
- `spaceId`: ID de l'espace
- `date`: Date ISO (YYYY-MM-DD)

**Paramètres optionnels:**
- `startTime`: Heure de début (HH:mm) - pour vérification spécifique
- `endTime`: Heure de fin (HH:mm) - pour vérification spécifique
- `duration`: Durée minimale recherchée (en minutes)
- `slotDuration`: Taille des créneaux (15, 30, 60, 120 min, défaut: 60)

**Exemple - Vérification générale:**
```javascript
const response = await fetch('/api/bookings/availability?spaceId=places&date=2024-01-15')
```

**Exemple - Vérification spécifique:**
```javascript
const response = await fetch('/api/bookings/availability?spaceId=places&date=2024-01-15&startTime=14:00&endTime=16:00')
```

**Réponse (200) - Vérification générale:**
```json
{
  "available": true,
  "date": "2024-01-15",
  "spaceInfo": {
    "id": "places",
    "name": "Places du café",
    "capacity": 12,
    "openingHours": {
      "open": "08:00",
      "close": "20:00",
      "closed": false
    }
  },
  "availability": {
    "totalSlots": 12,
    "availableSlots": 8,
    "occupiedSlots": 4,
    "occupancyRate": 33.33
  },
  "timeSlots": [
    {
      "startTime": "08:00",
      "endTime": "09:00",
      "available": true,
      "duration": 60
    }
  ],
  "freeBlocks": [
    {
      "startTime": "08:00",
      "endTime": "12:00",
      "duration": 240
    }
  ],
  "recommendations": {
    "bestAvailability": {
      "startTime": "08:00",
      "endTime": "12:00",
      "duration": 240
    },
    "suggestedDuration": 120
  }
}
```

## Endpoints Espaces

### 6. GET /api/spaces - Liste des espaces

**Authentification:** Non requise (endpoint public)
**Méthode:** GET

**Paramètres optionnels:**
- `specialty`: 'Café coworking' | 'Salle privée' | 'Zone silencieuse'
- `minCapacity`: Capacité minimale (nombre)
- `available`: true | false
- `popular`: true | false
- `search`: Recherche textuelle dans nom/location/description
- `limit`: Nombre max de résultats (défaut: 20, max: 50)
- `offset`: Décalage pour pagination

**Exemple:**
```javascript
const response = await fetch('/api/spaces?available=true&specialty=Café coworking&limit=10')
```

**Réponse (200):**
```json
{
  "spaces": [
    {
      "id": "places",
      "name": "Places du café",
      "location": "Rez-de-chaussée - Zone café",
      "capacity": 12,
      "specialty": "Café coworking",
      "image": "/images/spaces/cafe.jpg",
      "features": ["WiFi haut débit", "Prises électriques"],
      "rating": 4.7,
      "description": "Un espace ouvert et convivial...",
      "amenities": ["Machine à café", "Tables partagées"],
      "isPopular": true,
      "available": true,
      "pricing": {
        "perHour": 8,
        "perDay": 45,
        "perWeek": 250,
        "perMonth": 900
      },
      "openingHours": {
        "monday": { "open": "08:00", "close": "20:00" }
      },
      "isOpen": true
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  },
  "filters": {
    "specialty": "Café coworking",
    "available": true
  }
}
```

## Gestion des Erreurs

Toutes les réponses d'erreur suivent le format suivant:

```json
{
  "error": "Message d'erreur lisible",
  "code": "ERROR_CODE",
  "details": [] // Détails additionnels si disponibles
}
```

### Codes d'erreur courants:

- `UNAUTHORIZED` (401): Authentification requise
- `FORBIDDEN` (403): Droits insuffisants
- `VALIDATION_ERROR` (400): Données invalides
- `BOOKING_NOT_FOUND` (404): Réservation introuvable
- `SPACE_NOT_FOUND` (404): Espace introuvable
- `TIME_SLOT_CONFLICT` (409): Créneau déjà réservé
- `CANNOT_CANCEL` (400): Réservation non annulable
- `CANNOT_MODIFY` (400): Réservation non modifiable
- `INTERNAL_ERROR` (500): Erreur serveur

## Utilisation avec le Client API

```typescript
import { bookingsApi, spacesApi } from '@/lib/api/bookings'

try {
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

  // Lister les réservations
  const bookings = await bookingsApi.list({
    status: 'confirmed',
    limit: 10
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

} catch (error) {
  console.error('Erreur API:', error)
}
```

## Logs et Monitoring

Tous les endpoints loggent les actions importantes avec les formats:
- `[BOOKING_CREATED]` - Nouvelle réservation
- `[BOOKING_CANCELLED]` - Annulation de réservation
- `[BOOKING_UPDATED]` - Modification de réservation
- `[BOOKING_DELETED]` - Suppression définitive (admin)
- `[SPACE_CREATED]` - Nouvel espace créé (admin)

Les logs incluent l'ID utilisateur et les détails de l'action pour l'audit et le debugging.