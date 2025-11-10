# 🚀 Déploiement Netlify - Guide Complet

## ⚠️ Limitation Importante : Socket.IO

**Netlify ne supporte pas Socket.IO** en natif car il utilise des **fonctions serverless** qui ne peuvent pas maintenir des connexions WebSocket persistantes.

## 🎯 Options de Déploiement

### Option 1: Déploiement Sans Socket.IO (Recommandé)

#### 1. Préparation du Build
```bash
# Build standard Next.js pour Netlify
npm run build
```

#### 2. Configuration Netlify Dashboard
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Functions directory**: `netlify/functions` (optionnel)

#### 3. Variables d'Environnement Requises
```bash
# Dans Netlify Dashboard > Site Settings > Environment Variables
NODE_ENV=production
NEXTAUTH_URL=https://your-app.netlify.app
NEXTAUTH_SECRET=your-secret-here
MONGODB_URI=your-mongodb-connection-string
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### Option 2: Remplacer Socket.IO par des Services Cloud

#### A. Pusher (Recommandé)
```bash
# Installation
npm install pusher pusher-js
```

**Configuration:**
```javascript
// lib/pusher.js
import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Server-side
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
})

// Client-side
export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER
})
```

#### B. Supabase Realtime
```bash
npm install @supabase/supabase-js
```

#### C. Ably
```bash
npm install ably
```

## 📝 Étapes de Déploiement

### 1. Connexion GitHub
1. Connecter votre repo GitHub à Netlify
2. Sélectionner la branche `main`

### 2. Configuration Build
```toml
# netlify.toml (déjà créé)
[build]
  publish = ".next"
  command = "npm run build"

[build.environment]
  NODE_ENV = "production"
```

### 3. Deploy Settings
- **Branch to deploy**: `main`
- **Build command**: `npm run build`
- **Publish directory**: `.next`

### 4. Custom Headers (Sécurité)
```
# _headers (à créer dans le dossier public/)
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

### 5. Redirects pour Next.js
```
# _redirects (à créer dans le dossier public/)
/api/* /.netlify/functions/:splat 200
/* /index.html 200
```

## 🔧 Configuration MongoDB

### Atlas (Recommandé pour Netlify)
1. Whitelist IP: `0.0.0.0/0` (pour fonctions serverless)
2. Connection string dans variables d'environnement Netlify

## ⚡ Optimisations Performance

### 1. Next.js Config
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Pour site statique
  trailingSlash: true,
  images: {
    unoptimized: true // Requis pour export statique
  }
}

module.exports = nextConfig
```

### 2. Bundle Analysis
```bash
# Analyser la taille du bundle
npm run build
```

## 🚦 Post-Déploiement

### 1. Test des Fonctionnalités
- [ ] Authentification NextAuth
- [ ] Connexion MongoDB
- [ ] API Routes
- [ ] Stripe (si utilisé)
- [ ] Upload d'images

### 2. Monitoring
- Utiliser les Analytics Netlify
- Configurer les alertes d'erreur

## 🔄 Alternative : Vercel ou Railway

Si Socket.IO est critique pour votre application :

**Vercel**: Support partiel Socket.IO avec Edge Functions
**Railway**: Support complet Socket.IO avec serveurs persistants

## 📚 Ressources

- [Documentation Netlify Next.js](https://docs.netlify.com/frameworks/next-js/)
- [Pusher Documentation](https://pusher.com/docs/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)