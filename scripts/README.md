# Scripts de gestion du système de présence

Ce dossier contient les scripts utilitaires pour gérer et maintenir le système de présence en ligne/hors ligne.

## 🚀 Script principal

### `presence-manager.js`

Gestionnaire principal qui regroupe toutes les fonctionnalités :

```bash
# Afficher le statut actuel du système
node scripts/presence-manager.js status

# Nettoyer tous les statuts (remettre tout le monde hors ligne)
node scripts/presence-manager.js cleanup

# Tester le système de présence
node scripts/presence-manager.js test

# Nettoyer les sessions obsolètes (inactives depuis 30+ minutes)
node scripts/presence-manager.js stale

# Afficher l'aide
node scripts/presence-manager.js help
```

## 🛠️ Scripts individuels

### `cleanup-presence.js`

Remet tous les utilisateurs comme hors ligne (`isOnline: false`). Utile pour :

- Résoudre les statuts fantômes
- Nettoyer après un redémarrage serveur
- Maintenance de la base de données

```bash
node scripts/cleanup-presence.js
```

### `test-presence.js`

Valide le bon fonctionnement du système de présence :

- Connexion à la base de données
- Vérification du schéma utilisateur
- Tests des opérations de présence
- Validation des index
- Simulation de mise à jour

```bash
node scripts/test-presence.js
```

### `cleanup-stale-sessions.js`

Nettoie les sessions obsolètes (utilisateurs marqués en ligne mais inactifs depuis longtemps) :

```bash
# Nettoyer les sessions inactives depuis 30 minutes (défaut)
node scripts/cleanup-stale-sessions.js

# Nettoyer avec un seuil personnalisé
node scripts/cleanup-stale-sessions.js --minutes=60

# Nettoyage périodique automatique
node scripts/cleanup-stale-sessions.js --scheduled --interval=15
```

## 🔧 Variables d'environnement

Les scripts utilisent la variable `MONGODB_URI` ou une valeur par défaut :

```bash
export MONGODB_URI="mongodb+srv://dev:3mEKdYmohYa4oCjZ@coworking.jhxdixz.mongodb.net/coworking-platform"
```

## 📋 Cas d'usage courants

### Résoudre les statuts fantômes

```bash
# 1. Nettoyer tous les statuts
node scripts/presence-manager.js cleanup

# 2. Tester que tout fonctionne
node scripts/presence-manager.js test

# 3. Vérifier le statut
node scripts/presence-manager.js status
```

### Maintenance régulière

```bash
# Nettoyer les sessions obsolètes quotidiennement
node scripts/cleanup-stale-sessions.js --minutes=60
```

### Debugging

```bash
# Afficher le statut complet
node scripts/presence-manager.js status

# Lancer tous les tests
node scripts/presence-manager.js test
```

## ⚠️ Précautions

- **Backup** : Toujours sauvegarder avant les opérations de nettoyage
- **Production** : Tester en environnement de développement avant la production
- **Timing** : Éviter les nettoyages pendant les heures de pointe
- **Monitoring** : Surveiller les logs après les opérations

## 📊 Monitoring recommandé

### Métriques à surveiller

- Nombre d'utilisateurs en ligne vs connexions Socket.IO réelles
- Sessions obsolètes (inactives depuis 30+ minutes)
- Erreurs de mise à jour de la base de données
- Temps de réponse des opérations de présence

### Cron jobs suggérés

```bash
# Nettoyer les sessions obsolètes toutes les 30 minutes
*/30 * * * * /usr/bin/node /path/to/scripts/cleanup-stale-sessions.js --minutes=60

# Test quotidien du système (à 3h du matin)
0 3 * * * /usr/bin/node /path/to/scripts/presence-manager.js test
```
