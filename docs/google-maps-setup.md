# 🗺️ Configuration Google Maps API - Guide Complet

## 📝 Étapes de Configuration

### 1. Créer le Projet Google Cloud

1. **Aller sur** [Google Cloud Console](https://console.cloud.google.com/)
2. **Cliquer** sur le sélecteur de projet (en haut)
3. **"Nouveau projet"** 
4. **Nom** : `Coworking-Platform-Maps` (ou votre choix)
5. **Créer**

### 2. Activer les APIs Nécessaires

Dans votre nouveau projet :

1. **Aller dans** : `APIs et services > Bibliothèque`
2. **Rechercher et activer** :
   - ✅ **Maps JavaScript API** (obligatoire)
   - ✅ **Places API** (recommandé pour autocomplete)
   - ✅ **Geocoding API** (optionnel, pour conversion adresse/coordonnées)

### 3. Créer une Clé API

1. **Aller dans** : `APIs et services > Identifiants`
2. **"+ Créer des identifiants"** > **"Clé API"**
3. **Copier la clé** (elle commence par `AIza...`)

### 4. Restrictions de Sécurité ⚡ IMPORTANT

**SANS restrictions** = n'importe qui peut utiliser votre clé = facture énorme !

#### Option A : Restrictions par Domaine (Recommandé pour production)

1. **Cliquer** sur votre clé API créée
2. **"Restrictions d'application"** :
   - Sélectionner : **"Référents HTTP (sites Web)"**
   - **Ajouter** :
     ```
     http://localhost:3000/*
     https://localhost:3000/*
     https://votre-domaine.com/*
     https://www.votre-domaine.com/*
     ```

#### Option B : Restrictions par API (Plus sécurisé)

1. **"Restrictions d'API"** :
   - **Cocher** : "Limiter la clé"
   - **Sélectionner uniquement** :
     - Maps JavaScript API
     - Places API (si utilisé)
     - Geocoding API (si utilisé)

### 5. Configuration dans votre Projet

1. **Copier** le fichier `.env.local.example` vers `.env.local` :
   ```bash
   cp .env.local.example .env.local
   ```

2. **Éditer** `.env.local` :
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaVotreCléAPIIci
   ```

3. **Redémarrer** le serveur de développement :
   ```bash
   pnpm dev
   ```

## 🔒 Niveaux de Sécurité Recommandés

### Développement Local
```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza_votre_cle_dev

# Restrictions domaine :
http://localhost:3000/*
http://localhost:3001/*
```

### Staging/Test
```bash
# .env.staging
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza_votre_cle_staging

# Restrictions domaine :
https://staging.votre-app.com/*
https://test.votre-app.vercel.app/*
```

### Production
```bash
# .env.production
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza_votre_cle_prod

# Restrictions domaine :
https://votre-domaine-final.com/*
https://www.votre-domaine-final.com/*
```

## 💰 Contrôle des Coûts

### 1. Définir un Budget (OBLIGATOIRE!)

1. **Menu** : `Facturation > Budgets et alertes`
2. **"Créer un budget"**
3. **Montant** : 10€/mois (ou votre limite)
4. **Alertes** : 50%, 90%, 100%

### 2. Quotas par Jour

1. **APIs et services > Quotas**
2. **Maps JavaScript API**
3. **Définir limite** : 1000 requêtes/jour (ajustez selon besoin)

## 🎯 Configuration Finale dans le Code

```typescript
// components/home/GoogleMap.tsx
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('⚠️ Google Maps API key not configured')
  // Fallback vers design sans carte
}
```

## 🔍 Test de Fonctionnement

1. **Ouvrir** : http://localhost:3000/location
2. **Vérifier** :
   - ✅ Carte Google Maps s'affiche
   - ✅ Marqueur sur Strasbourg
   - ✅ InfoWindow clickable
   - ✅ Boutons navigation fonctionnels

## ❌ Dépannage Erreurs Courantes

### Erreur : "This page can't load Google Maps correctly"
- **Cause** : Clé API invalide ou restrictions trop strictes
- **Solution** : Vérifier la clé dans `.env.local` et les restrictions

### Erreur : "API key not authorized"
- **Cause** : Domaine non autorisé dans restrictions
- **Solution** : Ajouter `localhost:3000/*` aux domaines autorisés

### Erreur : "Quota exceeded"
- **Cause** : Limite de requêtes atteinte
- **Solution** : Augmenter les quotas ou attendre 24h

### Carte grise/vide
- **Cause** : APIs pas activées
- **Solution** : Activer "Maps JavaScript API" dans Google Cloud

## 📊 Monitoring d'Usage

1. **Google Cloud Console** > **APIs et services** > **Tableau de bord**
2. **Voir** :
   - Requêtes par jour
   - Erreurs
   - Latence

## 🚀 Optimisations Recommandées

### 1. Lazy Loading
```typescript
// Carte chargée seulement quand visible
useEffect(() => {
  if (isInView) {
    loadGoogleMaps()
  }
}, [isInView])
```

### 2. Cache Local
```typescript
// Éviter recharger la carte à chaque visite
localStorage.setItem('mapsLoaded', 'true')
```

### 3. Fallback Gracieux
```typescript
// Si Maps fail, montrer image statique
if (mapsError) {
  return <StaticMapImage />
}
```

## 🎯 Résumé Action Rapide

1. **Créer projet** Google Cloud
2. **Activer** Maps JavaScript API  
3. **Créer clé** API
4. **Restreindre** à votre domaine
5. **Budget** 10€/mois maximum
6. **Copier clé** dans `.env.local`
7. **Tester** sur http://localhost:3000/location

**Temps estimé** : 10-15 minutes

---

💡 **Conseil** : Commencez avec restrictions larges en dev, puis resserrez en production !

🔒 **Sécurité** : Ne JAMAIS committer `.env.local` dans git !