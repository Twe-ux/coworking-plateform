# Configuration du Cron Job pour la réinitialisation des shifts

## 1. Cron Job automatique (recommandé pour la production)

Ajouter cette ligne au crontab du serveur :

```bash
# Réinitialiser les shifts actifs tous les jours à minuit
0 0 * * * curl -X POST http://localhost:3000/api/admin/reset-shifts
```

Pour éditer le crontab :

```bash
crontab -e
```

## 2. Appel manuel via API

### Réinitialiser immédiatement :

```bash
curl -X POST http://localhost:3000/api/admin/reset-shifts
```

### Vérifier les shifts à réinitialiser :

```bash
curl -X GET http://localhost:3000/api/admin/reset-shifts
```

## 3. Depuis l'interface admin (à implémenter)

Bouton "Réinitialiser les shifts" dans l'interface d'administration.

## 4. Avec un service externe (Vercel Cron, etc.)

Pour les déploiements cloud, utiliser un service de cron externe qui appelle l'API.

## Fonctionnement

1. **À minuit** : Le script s'exécute automatiquement
2. **Détection** : Trouve tous les shifts avec status "active" d'hier ou plus anciens
3. **Réinitialisation** :
   - Met clockOut à 23:59:59 du jour du shift
   - Calcule les heures travaillées jusqu'à minuit
   - Change le status à "completed"
   - Marque hasError = true avec le type "MISSING_CLOCK_OUT"
4. **Affichage** : Les lignes apparaissent en rouge dans l'interface
