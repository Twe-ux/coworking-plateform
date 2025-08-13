# Consignes de Développement - Café Coworking Platform

## 🎯 Philosophie du Projet

### Principes Fondamentaux

1. **Mobile-First Always**: Chaque décision de design part du mobile
2. **Performance Obsession**: Viser 95+ sur Lighthouse
3. **Accessibilité Native**: WCAG 2.1 AA minimum
4. **Sécurité par Design**: Zero-trust architecture
5. **Code Maintenable**: Lisible > Clever

## 📱 Standards Mobile-First

### Breakpoints

```scss
// Mobile First Breakpoints
$mobile: 0px; // Default
$tablet: 768px; // md:
$desktop: 1024px; // lg:
$wide: 1280px; // xl:
```

### Règles CSS

```css
/* ❌ INTERDIT - Desktop First */
.component {
  width: 1200px;
  @media (max-width: 768px) {
    width: 100%;
  }
}

/* ✅ OBLIGATOIRE - Mobile First */
.component {
  width: 100%;
  @media (min-width: 768px) {
    width: 1200px;
  }
}
```

### Touch Targets

- Minimum 44x44px pour tous les éléments cliquables
- Espacement minimum 8px entre targets
- Hover states optionnels (touch first)

## 🏗️ Architecture & Code

### 🚀 Principes de Performance et Modularité

#### Code Splitting Obligatoire

```typescript
// ❌ INTERDIT - Import monolithique
import { BookingSystem } from './booking-system' // 500KB bundle

// ✅ OBLIGATOIRE - Dynamic imports avec code splitting
const BookingSystem = dynamic(
  () => import('./booking-system').then(mod => mod.BookingSystem),
  {
    loading: () => <BookingSkeleton />,
    ssr: false
  }
)

// ✅ Route-based code splitting
const BookingPage = lazy(() => import('./pages/booking'))
```

#### Règles de Code Splitting

1. **Tout composant > 50KB** doit être lazy loaded
2. **Chaque route** = un bundle séparé
3. **Modals et overlays** = toujours en dynamic import
4. **Features optionnelles** = lazy loading conditionnel
5. **Vendor splitting** pour les grosses librairies

```typescript
// Exemple de splitting intelligent
// utils/dynamic-imports.ts
export const loadStripeCheckout = () =>
  import('@stripe/stripe-js').then((m) => m.loadStripe)

export const loadChartLibrary = () =>
  import('recharts').then((m) => ({
    LineChart: m.LineChart,
    BarChart: m.BarChart,
  }))

export const loadRichTextEditor = () => import('@/components/rich-text-editor')
```

### 🔄 Réutilisation Maximale des Composants

#### Architecture Atomique

```
components/
├── atoms/              # Éléments de base réutilisables
│   ├── Button/
│   ├── Input/
│   ├── Badge/
│   └── Spinner/
├── molecules/          # Combinaisons d'atomes
│   ├── FormField/
│   ├── SearchBar/
│   └── PriceDisplay/
├── organisms/          # Composants complexes
│   ├── BookingCard/
│   ├── UserProfile/
│   └── NavigationMenu/
├── templates/          # Layouts de pages
│   ├── DashboardLayout/
│   └── PublicLayout/
└── features/          # Composants métier spécifiques
    ├── booking/
    ├── messaging/
    └── ecommerce/
```

#### Patterns de Réutilisation

```typescript
// ✅ Composant générique réutilisable
export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  loading,
  emptyState
}: DataTableProps<T>) => {
  // Logique générique
}

// ✅ Utilisation avec différents types
<DataTable data={bookings} columns={bookingColumns} />
<DataTable data={products} columns={productColumns} />
<DataTable data={users} columns={userColumns} />
```

#### Composition over Duplication

```typescript
// ❌ INTERDIT - Duplication
const BookingButton = () => (
  <button className="px-4 py-2 bg-blue-500 text-white rounded">
    Réserver
  </button>
)

const ProductButton = () => (
  <button className="px-4 py-2 bg-blue-500 text-white rounded">
    Acheter
  </button>
)

// ✅ OBLIGATOIRE - Composition
const ActionButton = ({ children, ...props }) => (
  <Button variant="primary" {...props}>
    {children}
  </Button>
)

// Utilisation
<ActionButton onClick={handleBooking}>Réserver</ActionButton>
<ActionButton onClick={handlePurchase}>Acheter</ActionButton>
```

### 📦 Stratégies de Bundle

#### Configuration Next.js

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@/components/ui'],
  },
  modularizeImports: {
    '@/components/ui': {
      transform: '@/components/ui/{{member}}',
    },
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },
}
```

#### Imports Optimisés

```typescript
// ❌ INTERDIT - Import total
import _ from 'lodash'
import * as Icons from 'lucide-react'

// ✅ OBLIGATOIRE - Imports spécifiques
import debounce from 'lodash/debounce'
import { Calendar, User, Settings } from 'lucide-react'
```

### 🎯 Métriques de Performance

Chaque composant doit respecter :

- **First Load JS**: < 85KB par route
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size Growth**: < 5KB par feature

### Structure des Composants

```typescript
// ✅ Structure standard d'un composant
import { FC } from 'react'
import { cn } from '@/lib/utils'

interface ComponentNameProps {
  className?: string
  children?: React.ReactNode
  // Props typées explicitement
}

export const ComponentName: FC<ComponentNameProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn("base-styles", className)} {...props}>
      {children}
    </div>
  )
}

ComponentName.displayName = 'ComponentName'
```

### Conventions de Nommage

```typescript
// Fichiers et dossiers
components / booking - calendar.tsx // kebab-case
hooks / use - booking.ts // kebab-case avec préfixe use-
utils / format - date.ts // kebab-case

// Composants React
BookingCalendar // PascalCase
useBooking // camelCase pour hooks
formatDate // camelCase pour fonctions

// Variables et constantes
const MAX_BOOKING_DAYS = 30 // SCREAMING_SNAKE_CASE pour constantes
const bookingData = {} // camelCase pour variables
```

### Imports Organization

```typescript
// 1. React/Next imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Third-party libraries
import { format } from 'date-fns'
import { z } from 'zod'

// 3. Internal absolute imports
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

// 4. Relative imports
import { BookingCard } from './booking-card'
import styles from './booking.module.css'

// 5. Types
import type { Booking } from '@/types'
```

## 🔒 Sécurité

### Validation des Données

```typescript
// ✅ TOUJOURS valider côté serveur
import { z } from 'zod'

const bookingSchema = z.object({
  date: z.string().datetime(),
  duration: z.number().min(30).max(480),
  spaceId: z.string().uuid(),
  userId: z.string().uuid(),
})

// API Route
export async function POST(req: Request) {
  const body = await req.json()

  // Validation
  const validated = bookingSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  // Vérification des permissions
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

### Gestion des Secrets

```bash
# .env.local
# ❌ JAMAIS de secrets dans le code
# ✅ Toujours utiliser les variables d'environnement

# Naming convention pour les variables
NEXT_PUBLIC_*  # Variables publiques (client-side)
*_SECRET      # Variables secrètes (server-side only)
*_URL         # URLs externes
*_KEY         # API keys
```

## 🎨 UI/UX Standards

### Composants shadcn/ui

```typescript
// ✅ Toujours étendre les composants shadcn/ui
import { Button as BaseButton } from '@/components/ui/button'

export const Button = ({ loading, ...props }) => {
  return (
    <BaseButton
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner /> : props.children}
    </BaseButton>
  )
}
```

### États de Chargement

```typescript
// ✅ Pattern standard pour les états
const Component = () => {
  const { data, error, isLoading } = useQuery()

  if (isLoading) return <Skeleton />
  if (error) return <ErrorBoundary error={error} />
  if (!data) return <EmptyState />

  return <Content data={data} />
}
```

### Animations

```css
/* Utiliser les transitions CSS pour les animations simples */
.component {
  transition: all 0.2s ease-in-out;
}

/* Framer Motion pour animations complexes */
```

## 📊 Performance

### Images

```typescript
// ✅ Toujours utiliser Next Image
import Image from 'next/image'

<Image
  src="/image.jpg"
  alt="Description détaillée"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={blurData}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### Code Splitting

```typescript
// ✅ Lazy loading pour les gros composants
const HeavyComponent = dynamic(
  () => import('./heavy-component'),
  {
    loading: () => <Skeleton />,
    ssr: false
  }
)
```

### Optimisation MongoDB

```typescript
// ✅ Toujours utiliser les projections
const bookings = await Booking.find({ userId })
  .select('date spaceId status') // Seulement les champs nécessaires
  .limit(10)
  .lean() // Pour des objets JS simples
```

## 🧪 Standards de Test

### Structure des Tests

```typescript
// component.test.tsx
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    const props = { ... }

    // Act
    render(<Component {...props} />)

    // Assert
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    // Test des interactions
  })
})
```

### Coverage Minimum

- Composants critiques: 90%
- API routes: 85%
- Utils/Helpers: 95%
- Overall: 80%

## 🚀 Git Workflow

### Branches

```bash
main              # Production
develop           # Development
feature/*         # Nouvelles features
fix/*            # Bug fixes
hotfix/*         # Fixes urgents prod
```

### Commits

```bash
# Format Conventional Commits
feat: add booking calendar component
fix: resolve payment processing issue
docs: update API documentation
style: format code with prettier
refactor: optimize booking query
test: add unit tests for auth
chore: update dependencies
```

### Pull Requests

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots

(if applicable)

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.logs left
```

## 📝 Documentation

### Code Comments

```typescript
/**
 * Calcule le prix total d'une réservation
 * @param booking - Objet de réservation
 * @param addOns - Services additionnels sélectionnés
 * @returns Prix total en centimes
 */
function calculateTotalPrice(booking: Booking, addOns: AddOn[]): number {
  // Logique complexe commentée
  // ...
}
```

### README Standards

Chaque module doit avoir un README avec :

- Description
- Installation
- Configuration
- Utilisation
- API Reference
- Exemples

## ⚡ Checklist Quotidienne

### Avant de Commencer

- [ ] Pull latest from develop
- [ ] Vérifier les issues assignées
- [ ] Lire les updates du sprint

### Avant de Commit

- [ ] Prettier executé
- [ ] ESLint sans erreurs
- [ ] Tests passent
- [ ] Pas de console.log
- [ ] Mobile-first vérifié

### Avant la PR

- [ ] Self-review complète
- [ ] Documentation à jour
- [ ] Screenshots si UI
- [ ] Description détaillée
- [ ] Assigné aux reviewers

## 🚨 Red Flags - À Éviter

1. **any** type en TypeScript
2. **!important** en CSS
3. **localStorage** pour données sensibles
4. **Hardcoded** values
5. **Console.log** en production
6. **Comments** en français dans le code
7. **Commits** directs sur main/develop
8. **Force push** sur branches partagées
9. **node_modules** dans git
10. **Secrets** dans le code

## 💡 Best Practices Spécifiques

### Gestion des Erreurs

```typescript
// ✅ Toujours avoir une stratégie d'erreur
try {
  await riskyOperation()
} catch (error) {
  // Log pour monitoring
  logger.error('Operation failed', { error, context })

  // Feedback utilisateur
  toast.error('Une erreur est survenue')

  // Recovery si possible
  await fallbackOperation()
}
```

### Internationalisation Ready

```typescript
// Préparer pour i18n même si monolangue
const messages = {
  booking: {
    success: 'Réservation confirmée',
    error: 'Erreur lors de la réservation',
  },
}
```

### Monitoring & Analytics

```typescript
// Track des événements importants
analytics.track('booking_completed', {
  spaceType: booking.space.type,
  duration: booking.duration,
  value: booking.totalPrice,
})
```

---

⚠️ **Ces consignes sont OBLIGATOIRES et non négociables. Tout code ne respectant pas ces standards sera refusé en review.**
