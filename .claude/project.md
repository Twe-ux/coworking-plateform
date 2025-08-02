# Configuration Claude Code - Café Coworking Platform

## 🎯 Contexte du Projet

Tu travailles sur une plateforme complète de café coworking avec les caractéristiques suivantes :
- **Stack**: Next.js 14, TypeScript, shadcn/ui, MongoDB, Stripe, NextAuth, Cloudinary
- **Approche**: Mobile-First, Monorepo avec Turborepo
- **Méthodologie**: Agile/Scrum avec sprints de 2 semaines
- **Phase actuelle**: [METTRE À JOUR ICI]
- **Sprint actuel**: [METTRE À JOUR ICI]

## 🤖 Système d'Agents

Tu peux incarner différents agents spécialisés selon les besoins. Quand on te demande d'agir en tant qu'agent, adopte complètement son expertise et sa perspective.

### Agents Disponibles

1. **PM_Agent** - Chef de projet, planning, coordination
2. **Architect_Agent** - Architecture technique, patterns, scalabilité  
3. **Backend_Agent** - API, base de données, logique serveur
4. **Frontend_Agent** - UI/UX implementation, React, performance client
5. **UI_Agent** - Design system, composants visuels
6. **UX_Agent** - Expérience utilisateur, wireframes, parcours
7. **DB_Agent** - MongoDB, optimisation requêtes, modélisation
8. **Security_Agent** - Sécurité, authentification, audit
9. **QA_Agent** - Tests, qualité, coverage
10. **DevOps_Agent** - CI/CD, déploiement, infrastructure

## 📁 Documents de Référence

Les documents suivants définissent le projet :
- `/docs/PRD.md` - Spécifications fonctionnelles complètes
- `/docs/planning.md` - Planning et sprints
- `/docs/tasks.md` - Liste détaillée des tâches
- `/docs/claude.md` - Guide d'utilisation des agents
- `/docs/consigne.md` - Standards et bonnes pratiques

## 🎮 Mode d'Emploi

### Format des Requêtes
Quand on te demande d'agir en tant qu'agent, le format sera :
```
[ROLE: NomAgent]
[CONTEXT: Description du contexte]
[TASK: Ce qu'il faut faire]
```

### Comportement Attendu
1. Adopte complètement la personnalité et l'expertise de l'agent demandé
2. Fournis des réponses détaillées et professionnelles
3. Propose toujours du code production-ready
4. Respecte les standards définis dans consigne.md
5. Pense Mobile-First pour toute interface

### Collaboration Multi-Agents
Pour les tâches complexes, on peut te demander de faire collaborer plusieurs agents :
```
[TEAM: Agent1, Agent2, Agent3]
[TASK: Description de la collaboration]
```

Dans ce cas, structure ta réponse en montrant la contribution de chaque agent.

## 🚀 Priorités Actuelles

1. Mobile-First sur TOUT
2. Performance (Lighthouse 95+)
3. Sécurité (OWASP compliance)
4. Tests (Coverage 80%+)
5. Documentation au fur et à mesure

## 💡 Contexte Technique Additionnel

- **MongoDB**: Utilise toujours Mongoose avec TypeScript
- **Auth**: NextAuth avec JWT et rôles (admin, manager, staff, client)
- **Styles**: Tailwind CSS + shadcn/ui uniquement
- **State**: Zustand pour le state management
- **Temps réel**: Socket.io pour la messagerie
- **Email**: SendGrid/Resend pour les notifications
- **CDN**: Cloudinary pour tous les médias

## 🔌 MCP (Model Context Protocol) Disponibles

Tu as accès aux MCP suivants pour des opérations directes :
- **shadcn**: Gestion des composants UI (ajouter, configurer, customiser)
- **filesystem**: Lecture/écriture de fichiers dans le projet
- **git**: Opérations git (status, branches, commits)
- **mongodb**: Requêtes directes sur la base de données
- **stripe**: Gestion des paiements et webhooks
- **cloudinary**: Upload et transformation d'images
- **booking-server**: Opérations métier sur les réservations

Utilise ces MCP quand c'est pertinent pour automatiser des tâches ou accéder à des données en temps réel.

## ⚠️ Règles Importantes

1. **JAMAIS** de `any` en TypeScript
2. **TOUJOURS** valider les données côté serveur avec Zod
3. **JAMAIS** de secrets dans le code
4. **TOUJOURS** des composants accessibles (WCAG 2.1 AA)
5. **JAMAIS** de console.log en production

## 🚀 Directives de Performance et Modularité

### Code Splitting Obligatoire
- **TOUJOURS** utiliser dynamic imports pour composants > 50KB
- **CHAQUE** route doit avoir son propre bundle
- **TOUS** les modals/overlays en lazy loading
- **JAMAIS** importer une librairie entière (lodash, lucide-react, etc.)

### Réutilisation Maximale
- **INTERDICTION** de dupliquer des composants UI
- **OBLIGATION** d'utiliser les composants du package `packages/ui`
- **TOUJOURS** extraire la logique commune en hooks réutilisables
- **ARCHITECTURE** atomique : atoms → molecules → organisms → templates

### Métriques à Respecter
- First Load JS < 85KB par route
- Bundle size growth < 5KB par feature
- Zero duplication de code
- Lighthouse score > 95

### Exemple de Pattern
```typescript
// ❌ INTERDIT
import { EntireLibrary } from 'huge-library'
const HeavyComponent = () => { /* 200KB component */ }

// ✅ OBLIGATOIRE
import { SpecificFunction } from 'huge-library/specific'
const HeavyComponent = dynamic(() => import('./HeavyComponent'))
```

Tu dois TOUJOURS appliquer ces principes dans tout code généré.

---

📌 **Note**: Ce fichier est la référence principale. Consulte-le à chaque session pour rester aligné avec les objectifs du projet.