# Claude Code - Guide d'Utilisation pour le Projet Café Coworking

## 🎯 Vue d'ensemble

Ce guide explique comment utiliser efficacement Claude Code pour développer la plateforme de café coworking avec l'équipe d'agents virtuels.

## 🤖 Configuration des Agents

### Structure des Prompts d'Agent

Chaque agent doit être invoqué avec un contexte spécifique. Voici le format recommandé :

```
[ROLE: {NOM_AGENT}]
[CONTEXT: Développement plateforme café coworking - {Phase/Sprint actuel}]
[STACK: Next.js 14, TypeScript, shadcn/ui, MongoDB, Stripe, NextAuth]
[TASK: {Description spécifique de la tâche}]
```

### Exemple d'Utilisation

```bash
# Pour le Backend_Agent
claude "
[ROLE: Backend_Agent]
[CONTEXT: Sprint 1 - Système d'authentification]
[STACK: Next.js 14, NextAuth, MongoDB, TypeScript]
[TASK: Implémenter le système de rôles RBAC avec 4 niveaux (admin, manager, staff, client)]
"

# Pour le Frontend_Agent
claude "
[ROLE: Frontend_Agent]
[CONTEXT: Sprint 2 - Site Principal]
[STACK: Next.js 14, shadcn/ui, Tailwind CSS]
[TASK: Créer la homepage responsive mobile-first avec hero section]
"
```

## 📁 Structure de Projet Recommandée

```
coworking-platform/
├── apps/
│   ├── web/                 # Site principal
│   ├── dashboard/          # Dashboards multi-rôles
│   ├── api/               # API backend
│   └── admin/             # Interface admin
├── packages/
│   ├── ui/                # Composants partagés
│   ├── database/          # Modèles MongoDB
│   ├── auth/              # Logique authentification
│   └── utils/             # Utilitaires partagés
├── docs/
│   ├── PRD.md
│   ├── planning.md
│   ├── tasks.md
│   └── claude.md
└── config/
    ├── eslint/
    ├── typescript/
    └── tailwind/
```

## 🔄 Workflow de Développement

### 1. Initialisation du Sprint

```bash
# Créer une nouvelle branche pour le sprint
git checkout -b sprint-{numero}-{feature}

# Demander au PM_Agent de définir les objectifs
claude "[ROLE: PM_Agent] [TASK: Définir les user stories du Sprint {X} pour {feature}]"
```

### 2. Architecture et Design

```bash
# Consulter l'architecte pour la structure
claude "[ROLE: Architect_Agent] [TASK: Définir l'architecture pour {feature}]"

# Demander les wireframes UX
claude "[ROLE: UX_Agent] [TASK: Créer les wireframes mobile-first pour {feature}]"

# Obtenir le design UI
claude "[ROLE: UI_Agent] [TASK: Designer les composants shadcn/ui pour {feature}]"
```

### 3. Développement

```bash
# Backend development
claude "[ROLE: Backend_Agent] [TASK: Implémenter l'API pour {feature}]"

# Frontend development
claude "[ROLE: Frontend_Agent] [TASK: Créer les pages et composants pour {feature}]"

# Database schema
claude "[ROLE: DB_Agent] [TASK: Définir les schémas MongoDB pour {feature}]"
```

### 4. Tests et Sécurité

```bash
# Tests unitaires et E2E
claude "[ROLE: QA_Agent] [TASK: Écrire les tests pour {feature}]"

# Audit de sécurité
claude "[ROLE: Security_Agent] [TASK: Auditer la sécurité de {feature}]"
```

### 5. Déploiement

```bash
# Configuration DevOps
claude "[ROLE: DevOps_Agent] [TASK: Configurer le déploiement pour {feature}]"
```

## 💡 Bonnes Pratiques

### Communication entre Agents

Pour des tâches complexes nécessitant plusieurs agents :

```bash
# Exemple : Créer un système de réservation complet
claude "
[TEAM: Backend_Agent, Frontend_Agent, DB_Agent]
[CONTEXT: Sprint 4 - Système de réservation]
[TASK: Collaborer pour créer :
1. Schéma DB pour réservations (DB_Agent)
2. API CRUD avec validation (Backend_Agent)
3. Interface calendrier mobile-first (Frontend_Agent)]
"
```

### Revue de Code

```bash
# Demander une revue de code
claude "[ROLE: Senior_Developer] [TASK: Review le code de {feature} pour best practices Next.js]"
```

### Documentation

```bash
# Générer la documentation
claude "[ROLE: Technical_Writer] [TASK: Documenter l'API de {feature}]"
```

## 🛠️ Commandes Utiles

### Setup Initial

```bash
# Créer la structure du projet
claude "[ROLE: Architect_Agent] [TASK: Générer la structure complète du monorepo]"

# Configuration des outils
claude "[ROLE: DevOps_Agent] [TASK: Setup ESLint, Prettier, Husky pour le projet]"
```

### Développement de Features

```bash
# Créer un nouveau composant
claude "[ROLE: Frontend_Agent] [TASK: Créer composant {ComponentName} avec shadcn/ui]"

# Ajouter une route API
claude "[ROLE: Backend_Agent] [TASK: Créer route API {/api/endpoint} avec validation]"

# Optimiser les performances
claude "[ROLE: Performance_Expert] [TASK: Optimiser {feature} pour mobile]"
```

### Résolution de Problèmes

```bash
# Debug d'erreur
claude "[ROLE: Debug_Expert] [ERROR: {error message}] [TASK: Résoudre l'erreur]"

# Optimisation de requête
claude "[ROLE: DB_Agent] [TASK: Optimiser la requête MongoDB pour {feature}]"
```

## 📊 Suivi du Projet

### Rapport de Sprint

```bash
# Générer un rapport de sprint
claude "[ROLE: PM_Agent] [TASK: Générer rapport Sprint {X} avec métriques et burndown]"

# Analyser la vélocité
claude "[ROLE: PM_Agent] [TASK: Analyser vélocité équipe et prédire délais]"
```

### Métriques de Qualité

```bash
# Rapport de couverture de tests
claude "[ROLE: QA_Agent] [TASK: Analyser couverture tests et identifier zones à risque]"

# Audit de performance
claude "[ROLE: Performance_Expert] [TASK: Audit Lighthouse et recommandations]"
```

## 🚨 Gestion des Urgences

### Bugs Critiques

```bash
# Diagnostic rapide
claude "
[ROLE: Senior_Developer]
[URGENCY: HIGH]
[BUG: {description}]
[TASK: Diagnostic et fix immédiat]
"
```

### Rollback

```bash
# Plan de rollback
claude "[ROLE: DevOps_Agent] [TASK: Procédure rollback pour {feature}]"
```

## 📝 Templates de Tâches

### Template Feature Complète

```bash
claude "
[PROJECT: Café Coworking Platform]
[FEATURE: {nom_feature}]
[AGENTS: Architect_Agent, Backend_Agent, Frontend_Agent, QA_Agent]
[TASKS:
1. Architecture et schémas DB
2. API endpoints avec validation
3. Interface utilisateur mobile-first
4. Tests unitaires et E2E
5. Documentation technique]
[DELIVERABLES: Code production-ready avec tests >80% coverage]
"
```

### Template Composant UI

```bash
claude "
[ROLE: Frontend_Agent]
[COMPONENT: {ComponentName}]
[REQUIREMENTS:
- Mobile-first responsive
- Accessible (WCAG 2.1 AA)
- Dark mode support
- shadcn/ui style
- TypeScript avec props typées]
[TASK: Créer composant réutilisable]
"
```

### Template API Endpoint

```bash
claude "
[ROLE: Backend_Agent]
[ENDPOINT: {method} /api/{path}]
[REQUIREMENTS:
- Validation Zod
- Error handling
- Rate limiting
- Auth middleware
- Tests unitaires]
[TASK: Implémenter endpoint sécurisé]
"
```

## 🔧 Configuration Avancée

### Variables d'Environnement

```bash
# Générer template .env
claude "[ROLE: DevOps_Agent] [TASK: Créer .env.example avec toutes variables nécessaires]"
```

### Scripts NPM Personnalisés

```bash
# Créer scripts utiles
claude "[ROLE: DevOps_Agent] [TASK: Définir scripts npm pour dev, build, test, deploy]"
```

## 🎓 Formation et Onboarding

### Pour Nouveaux Développeurs

```bash
# Guide onboarding
claude "[ROLE: Senior_Developer] [TASK: Créer guide onboarding pour nouveau dev sur le projet]"

# Setup environnement
claude "[ROLE: DevOps_Agent] [TASK: Checklist setup environnement développement]"
```

## 💬 Communication d'Équipe

### Daily Standup

```bash
# Template daily
claude "
[ROLE: {YourRole}_Agent]
[STANDUP: {Date}]
[YESTERDAY: {tâches complétées}]
[TODAY: {tâches prévues}]
[BLOCKERS: {obstacles}]
"
```

### Code Review

```bash
# Demander review approfondie
claude "
[ROLE: Senior_Developer]
[PR: {pull_request_link}]
[FOCUS: Performance, Sécurité, Best Practices]
[TASK: Code review détaillée avec suggestions]
"
```

## 🔍 Debugging Avancé

### Analyse de Performance

```bash
claude "
[ROLE: Performance_Expert]
[ISSUE: {description problème performance}]
[METRICS: {métriques actuelles}]
[TASK: Identifier bottlenecks et optimiser]
"
```

### Memory Leaks

```bash
claude "
[ROLE: Debug_Expert]
[ISSUE: Memory leak suspected]
[COMPONENT: {component/feature}]
[TASK: Identifier et corriger fuites mémoire]
"
```

## 📚 Ressources et Documentation

### Génération Auto de Docs

```bash
# API Documentation
claude "[ROLE: Technical_Writer] [TASK: Générer documentation OpenAPI/Swagger]"

# Component Storybook
claude "[ROLE: Frontend_Agent] [TASK: Créer stories Storybook pour composants]"

# Architecture Decision Records
claude "[ROLE: Architect_Agent] [TASK: Documenter ADR pour {decision}]"
```

## 🏁 Checklist Pré-Déploiement

```bash
claude "
[ROLE: DevOps_Agent]
[SPRINT: {X}]
[TASK: Générer checklist complète pré-déploiement incluant:
- Tests passing
- Security scan
- Performance metrics
- Documentation à jour
- Rollback plan
- Monitoring setup]
"
```

## 💡 Tips & Tricks

1. **Contexte Persistant**: Toujours inclure le contexte du sprint actuel
2. **Agents Multiples**: N'hésitez pas à faire collaborer plusieurs agents
3. **Itération Rapide**: Utilisez des prompts courts pour des ajustements rapides
4. **Documentation**: Documentez au fur et à mesure avec Technical_Writer
5. **Tests First**: Demandez d'abord les tests, puis l'implémentation

## 🆘 Support

Si vous rencontrez des difficultés :

```bash
# Aide générale
claude "[ROLE: Senior_Developer] [HELP: {votre problème}]"

# Aide spécifique
claude "[ROLE: {Agent_Spécialisé}] [HELP: {problème dans son domaine}]"
```

## 🔄 Workflow Complet d'une Feature

Voici un exemple complet du développement d'une feature de A à Z :

### Exemple : Module de Messagerie Interne

```bash
# 1. Planning et conception
claude "[ROLE: PM_Agent] [TASK: User stories pour messagerie interne]"

# 2. Architecture technique
claude "[ROLE: Architect_Agent] [TASK: Architecture WebSocket pour chat temps réel]"

# 3. Design UX/UI
claude "[ROLE: UX_Agent] [TASK: Wireframes chat mobile-first]"
claude "[ROLE: UI_Agent] [TASK: Design system pour composants chat]"

# 4. Modélisation données
claude "[ROLE: DB_Agent] [TASK: Schémas MongoDB pour messages, conversations, notifications]"

# 5. Backend implementation
claude "[ROLE: Backend_Agent] [TASK: API WebSocket avec Socket.io pour messagerie]"

# 6. Frontend implementation
claude "[ROLE: Frontend_Agent] [TASK: Interface chat temps réel avec shadcn/ui]"

# 7. Tests
claude "[ROLE: QA_Agent] [TASK: Tests E2E pour messagerie temps réel]"

# 8. Sécurité
claude "[ROLE: Security_Agent] [TASK: Audit sécurité chat et encryption messages]"

# 9. Optimisation
claude "[ROLE: Performance_Expert] [TASK: Optimiser performance WebSocket mobile]"

# 10. Documentation
claude "[ROLE: Technical_Writer] [TASK: Documentation API chat et guide utilisateur]"

# 11. Déploiement
claude "[ROLE: DevOps_Agent] [TASK: Configuration production pour WebSocket]"
```

## 📈 Métriques et KPIs

### Commandes pour Tracking

```bash
# Générer dashboard métriques
claude "[ROLE: PM_Agent] [TASK: Dashboard KPIs sprint avec vélocité, burndown, coverage]"

# Analyse technique dette
claude "[ROLE: Architect_Agent] [TASK: Analyser dette technique et plan de refactoring]"

# Rapport qualité code
claude "[ROLE: QA_Agent] [TASK: Rapport qualité avec coverage, complexité, duplication]"
```

## 🚀 Commandes Avancées

### Migration de Données

```bash
claude "[ROLE: DB_Agent] [TASK: Script migration pour {changement schema}]"
```

### Optimisation SEO

```bash
claude "[ROLE: SEO_Expert] [TASK: Optimiser {page} pour SEO avec meta tags et structured data]"
```

### Internationalisation

```bash
claude "[ROLE: Frontend_Agent] [TASK: Implémenter i18n pour {module} avec next-intl]"
```

### Analytics Implementation

```bash
claude "[ROLE: Analytics_Expert] [TASK: Implémenter tracking GA4 et mixpanel pour {feature}]"
```

## 🔒 Sécurité Avancée

### Audit Complet

```bash
claude "
[ROLE: Security_Agent]
[TASK: Audit sécurité complet incluant:
- OWASP Top 10
- Injection SQL/NoSQL
- XSS/CSRF
- Auth vulnerabilities
- API security
- Dependencies scan]
"
```

### Penetration Testing

```bash
claude "[ROLE: Security_Agent] [TASK: Plan de tests de pénétration pour {module}]"
```

## 🎯 Patterns Réutilisables

### State Management

```bash
claude "[ROLE: Frontend_Agent] [TASK: Implémenter state management avec Zustand pour {feature}]"
```

### Caching Strategy

```bash
claude "[ROLE: Backend_Agent] [TASK: Stratégie de cache Redis pour {data type}]"
```

### Error Boundaries

```bash
claude "[ROLE: Frontend_Agent] [TASK: Error boundaries et fallback UI pour {module}]"
```

## 📱 Progressive Web App

### PWA Setup

```bash
claude "[ROLE: Frontend_Agent] [TASK: Configurer PWA avec service worker et manifest]"
```

### Offline Support

```bash
claude "[ROLE: Frontend_Agent] [TASK: Implémenter offline-first pour {feature}]"
```

## 🔮 Innovation et R&D

### AI Integration

```bash
claude "[ROLE: AI_Expert] [TASK: Intégrer recommandations AI pour suggestions espaces]"
```

### IoT Integration

```bash
claude "[ROLE: IoT_Expert] [TASK: Architecture pour intégration capteurs occupation]"
```

---

💡 **Note**: Ce guide est évolutif. Mettez-le à jour avec vos propres patterns et découvertes au fur et à mesure du projet.

🚀 **Conseil Final**: Commencez petit, itérez rapidement, et n'ayez pas peur d'expérimenter avec les agents. Ils sont là pour vous aider à construire une plateforme exceptionnelle!
