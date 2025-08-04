# Système de Sécurité - Plateforme Coworking

## Vue d'ensemble

Ce système de protection des routes implémente une sécurité multicouche basée sur les rôles avec les meilleures pratiques OWASP pour Next.js 14 et NextAuth.

## Rôles et Hiérarchie

### Structure hiérarchique
```
ADMIN (👑)
├── MANAGER (👤)
├── STAFF (👷)
└── CLIENT (👋)
```

### Permissions par rôle
- **ADMIN**: Accès complet à toutes les routes
- **MANAGER**: Accès aux sections manager, staff et client
- **STAFF**: Accès aux sections staff et client
- **CLIENT**: Accès uniquement aux sections client

## Protection des Routes

### Routes protégées
- `/admin/*` → Admin uniquement
- `/dashboard/admin/*` → Admin uniquement  
- `/dashboard/manager/*` → Admin + Manager
- `/dashboard/staff/*` → Admin + Manager + Staff
- `/dashboard/client/*` → Tous les utilisateurs connectés

### Routes publiques
- `/`
- `/auth/*`
- `/api/auth/*` (NextAuth)
- `/api/health`

## Composants de Sécurité

### 1. Middleware (`middleware.ts`)
**Fonctionnalités:**
- Vérification JWT tokens
- Validation des rôles et permissions
- Protection CSRF automatique
- Headers de sécurité (CSP, HSTS, etc.)
- Rate limiting par IP (100 req/min)
- Détection d'activités suspectes
- Logging des accès et tentatives d'intrusion

**Headers de sécurité appliqués:**
```typescript
{
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval'...",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

### 2. Authentification (`lib/auth.ts`)
**Sécurité renforcée:**
- Sessions JWT avec expiration 24h
- Cookies sécurisés avec flags HttpOnly/Secure
- Protection contre brute force (5 tentatives max, blocage 15min)
- Validation de la force des mots de passe
- Logging des événements de sécurité
- Vérification de l'état actif du compte

### 3. Utilitaires de sécurité (`lib/auth-utils.ts`)
**Fonctions principales:**
- `hasRole()`: Vérification hiérarchique des rôles
- `hasRouteAccess()`: Validation d'accès aux routes
- `validateCSRFToken()`: Protection CSRF
- `checkBruteForce()`: Détection tentatives de force brute
- `logSecurityEvent()`: Audit de sécurité
- `validatePasswordStrength()`: Validation mots de passe

### 4. Composants de protection React
**Composants disponibles:**
- `<AuthGuard>`: Protection par authentification
- `<RoleGuard>`: Protection par rôle
- `<AdminGuard>`: Protection admin uniquement
- `<ManagerGuard>`: Protection manager+
- `<StaffGuard>`: Protection staff+
- `<ConditionalRender>`: Rendu conditionnel

### 5. Hooks d'authentification
**Hooks personnalisés:**
- `useAuth()`: État d'authentification complet
- `useRequireAuth()`: Protection par authentification
- `useRequireRole()`: Protection par rôle
- `useSecurityStatus()`: État de sécurité

### 6. Requêtes sécurisées (`lib/secure-fetch.ts`)
**API sécurisée:**
- Gestion automatique des tokens CSRF
- Headers de sécurité automatiques
- Timeout configurable (10s par défaut)
- Gestion d'erreurs robuste
- Support cookies de session

## Détection de Menaces

### Patterns suspects détectés
```typescript
[
  /\/\.env/,           // Tentative accès fichiers env
  /\/wp-admin/,        // Scan WordPress
  /\/phpmyadmin/,      // Scan phpMyAdmin
  /<script/i,          // Injection XSS
  /javascript:/i,      // Injection JavaScript
  /union.*select/i,    // Injection SQL
  /drop.*table/i,      // Injection SQL destructive
]
```

### Rate Limiting
- **Limite**: 100 requêtes par minute par IP
- **Fenêtre**: 60 secondes
- **Action**: HTTP 429 avec Retry-After header

## Audit et Logging

### Événements loggés
- Connexions/déconnexions
- Tentatives d'accès non autorisées
- Détection d'activités suspectes
- Échecs de validation CSRF
- Erreurs du middleware
- Dépassements de rate limit

### Format des logs
```typescript
{
  id: string,
  userId?: string,
  action: string,
  resource: string,
  ip: string,
  userAgent: string,
  timestamp: Date,
  success: boolean,
  details?: Record<string, any>
}
```

## Configuration des Cookies

### Paramètres de sécurité
```typescript
{
  httpOnly: true,           // Inaccessible en JavaScript
  sameSite: 'lax',         // Protection CSRF
  secure: true,            // HTTPS uniquement (production)
  maxAge: 24 * 60 * 60     // 24 heures
}
```

### Noms des cookies
- Production: `__Secure-next-auth.session-token`
- Développement: `next-auth.session-token`

## Variables d'Environnement

### Requises
```env
NEXTAUTH_SECRET=<secret-cryptographique-fort>
NEXTAUTH_URL=<url-base-application>
NODE_ENV=production|development
```

## Tests de Sécurité

### Tests intégrés
1. **Test API sécurisée**: Vérifie l'authentification et CSRF
2. **Test protection CSRF**: Confirme le blocage des requêtes sans token
3. **Test rate limiting**: Vérifie les limitations par IP
4. **Test détection patterns**: Valide la détection d'activités suspectes

### Commandes de test
```bash
# Tests unitaires
pnpm test

# Tests de sécurité spécifiques
pnpm test:security

# Audit de dépendances
pnpm audit
```

## Recommandations de Déploiement

### Production
1. **HTTPS obligatoire** avec certificats valides
2. **Headers de sécurité** configurés au niveau du reverse proxy
3. **Monitoring** des logs de sécurité en temps réel
4. **Rate limiting** au niveau infrastructure (Cloudflare, etc.)
5. **WAF** (Web Application Firewall) recommandé

### Variables d'environnement production
```env
NODE_ENV=production
NEXTAUTH_SECRET=<secret-256-bits-minimum>
NEXTAUTH_URL=https://votre-domaine.com
```

## Maintenance

### Rotation des secrets
- Renouveler `NEXTAUTH_SECRET` périodiquement
- Invalider les sessions actives lors du changement

### Monitoring
- Surveiller les logs d'audit de sécurité
- Alertes sur tentatives d'intrusion
- Métriques de rate limiting

### Mises à jour
- Mettre à jour NextAuth régulièrement
- Surveiller les CVE relatives à Next.js
- Audit de sécurité trimestriel recommandé

## Conformité OWASP

Ce système implémente les protections contre le Top 10 OWASP 2021:

1. **A01 - Broken Access Control**: Contrôle d'accès robuste par rôles
2. **A02 - Cryptographic Failures**: JWT sécurisés, cookies chiffrés
3. **A03 - Injection**: Validation et sanitisation des entrées
4. **A04 - Insecure Design**: Architecture de sécurité multicouche
5. **A05 - Security Misconfiguration**: Headers et cookies sécurisés
6. **A06 - Vulnerable Components**: Dépendances maintenues à jour
7. **A07 - Authentication Failures**: Protection brute force, sessions sécurisées
8. **A08 - Software Integrity Failures**: Validation des composants
9. **A09 - Logging Failures**: Audit complet des événements de sécurité
10. **A10 - SSRF**: Validation des URLs et origines

## Support

Pour les questions de sécurité, contactez l'équipe de développement.
En cas de vulnérabilité découverte, suivez la procédure de divulgation responsable.