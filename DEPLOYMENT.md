# Guide de Déploiement

## Options de Build pour les Déploiements de Test

### 1. Build avec TypeScript moins strict
```bash
pnpm run build:deploy
```
- Utilise `tsconfig.deploy.json` avec des règles TypeScript moins strictes
- Recommandé pour les tests de déploiement

### 2. Build en ignorant les erreurs TypeScript
```bash
pnpm run build:loose
```
- Ignore complètement les erreurs TypeScript
- À utiliser uniquement en cas d'urgence

### 3. Build standard (production)
```bash
pnpm run build
```
- Build standard avec toutes les vérifications TypeScript strictes
- À utiliser pour la production finale

## Configuration des Variables d'Environnement

### Pour ignorer les erreurs TypeScript sur Northflank/Heroku :
```bash
SKIP_TYPE_CHECK=true
```

### Scripts Northflank/Heroku
Vous pouvez modifier le script de build dans votre plateforme de déploiement :

#### Option 1 : Build moins strict
```json
{
  "scripts": {
    "build": "pnpm run build:deploy"
  }
}
```

#### Option 2 : Build sans vérifications TypeScript
```json
{
  "scripts": {
    "heroku-postbuild": "SKIP_TYPE_CHECK=true pnpm run build:loose"
  }
}
```

## Fichiers de Configuration

- `tsconfig.json` : Configuration TypeScript standard (stricte)
- `tsconfig.deploy.json` : Configuration TypeScript assouplie pour les déploiements
- `next.config.js` : Inclut la possibilité d'ignorer les erreurs TypeScript

## Stratégie Recommandée

1. **Développement** : Utiliser le mode strict (`pnpm dev`)
2. **Tests de déploiement** : Utiliser `pnpm run build:deploy`
3. **Production** : Corriger toutes les erreurs et utiliser `pnpm run build`

## Notes Importantes

⚠️ **Attention** : L'option `build:loose` ignore complètement les erreurs TypeScript. 
À utiliser uniquement pour des tests rapides de déploiement.

✅ **Recommandé** : Utilisez `build:deploy` qui garde une vérification TypeScript 
mais avec des règles moins strictes.