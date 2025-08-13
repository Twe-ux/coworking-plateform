# Guide de résolution des problèmes de configuration réseau

## Problème identifié

Le problème de configuration réseau était causé par plusieurs références au port 3001 au lieu du port 3000 configuré.

## Solutions implémentées

### 1. ✅ Correction de la configuration principale

- **Fichier**: `.env.local`
- **Changement**: `NEXTAUTH_URL=http://localhost:3001` → `NEXTAUTH_URL=http://localhost:3000`

### 2. ✅ Amélioration de la configuration NextAuth

- **Fichier**: `lib/auth.ts`
- **Ajout**: Logique de redirection renforcée avec vérification du port
- **Fonctionnalité**: Force l'utilisation du port 3000 dans toutes les redirections

### 3. ✅ Correction du middleware

- **Fichier**: `middleware.ts`
- **Amélioration**: Construction explicite des URLs avec le bon host:port
- **Sécurité**: Logs des redirections pour diagnostic

### 4. ✅ Correction du composant Logo

- **Fichier**: `components/Logo.tsx`
- **Changement**: `src="./logo.svg"` → `src="/logo.svg"`
- **Effet**: Évite les problèmes de chemin relatif selon le contexte

### 5. ✅ Mise à jour Docker Compose

- **Fichier**: `docker-compose.yml`
- **Changement**: Simplifié pour refléter l'architecture unifiée Next.js
- **Configuration**: Un seul service sur le port 3000

### 6. ✅ Outils de nettoyage et diagnostic

#### API de nettoyage serveur

- **Nouveau**: `app/api/auth/clear-session/route.ts`
- **Fonction**: Nettoie tous les cookies NextAuth côté serveur

#### Utilitaires client

- **Nouveau**: `lib/clear-auth-cache.ts`
- **Fonctions**:
  - `clearAuthCache()`: Nettoie localStorage/sessionStorage
  - `clearCompleteAuthCache()`: Nettoyage complet client+serveur
  - `fixPortInUrls()`: Corrige automatiquement les URLs avec mauvais port

#### Script de nettoyage

- **Nouveau**: `scripts/clear-auth-cache.js`
- **Usage**: `npm run clear-auth-cache`
- **Fonction**: Supprime le cache Next.js et donne des instructions

#### Composant de debug (développement uniquement)

- **Nouveau**: `components/debug/network-debug.tsx`
- **Fonction**: Panel de diagnostic des problèmes réseau
- **Accès**: Bouton 🔧 en bas à droite en mode développement

## Étapes de résolution pour l'utilisateur

### 1. Nettoyage automatique

```bash
npm run clear-auth-cache
```

### 2. Redémarrage du serveur

```bash
# Arrêter le serveur actuel (Ctrl+C)
npm run dev
```

### 3. Nettoyage navigateur

1. Ouvrir les outils de développement (F12)
2. Onglet "Application" → "Storage"
3. Supprimer tous les cookies pour `localhost`
4. Vider localStorage et sessionStorage
5. Hard refresh (Ctrl+Shift+R)

### 4. Vérification

1. Aller sur http://localhost:3000
2. Utiliser le panel de debug (bouton 🔧) pour vérifier la configuration
3. Tester le flux de connexion

## Diagnostic en cas de problème persistant

### Utiliser le composant NetworkDebug

Le composant de debug (bouton 🔧 visible en développement) permet de :

- Voir l'URL actuelle et le port
- Vérifier les cookies d'authentification
- Corriger automatiquement le port
- Nettoyer le cache complet

### Vérifications manuelles

1. **Variable d'environnement**:

   ```bash
   cat .env.local | grep NEXTAUTH_URL
   # Doit afficher: NEXTAUTH_URL=http://localhost:3000
   ```

2. **Cache Next.js**:

   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Cookies navigateur**:
   - Aller dans DevTools → Application → Cookies
   - Supprimer tous les cookies `next-auth.*`

4. **Session active**:
   ```bash
   # Utiliser l'API de nettoyage
   curl -X POST http://localhost:3000/api/auth/clear-session
   ```

## Prévention future

### Configuration recommandée

- Toujours utiliser des chemins absoluts pour les ressources statiques
- Centraliser la configuration des URLs dans les variables d'environnement
- Utiliser des validations de port dans les callbacks NextAuth

### Monitoring

- Le composant NetworkDebug aide à détecter les problèmes rapidement
- Les logs du middleware tracent les redirections
- L'API clear-session permet un nettoyage propre

## Fichiers modifiés

1. `/Users/twe/Developer/coworking-platform/.env.local`
2. `/Users/twe/Developer/coworking-platform/lib/auth.ts`
3. `/Users/twe/Developer/coworking-platform/middleware.ts`
4. `/Users/twe/Developer/coworking-platform/components/Logo.tsx`
5. `/Users/twe/Developer/coworking-platform/docker-compose.yml`
6. `/Users/twe/Developer/coworking-platform/package.json`
7. `/Users/twe/Developer/coworking-platform/app/layout.tsx`

## Fichiers ajoutés

1. `/Users/twe/Developer/coworking-platform/app/api/auth/clear-session/route.ts`
2. `/Users/twe/Developer/coworking-platform/lib/clear-auth-cache.ts`
3. `/Users/twe/Developer/coworking-platform/scripts/clear-auth-cache.js`
4. `/Users/twe/Developer/coworking-platform/components/debug/network-debug.tsx`

---

**Note**: Le composant de debug n'apparaît qu'en mode développement et doit être retiré en production.
