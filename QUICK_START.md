# 🚀 Quick Start - Démarrage rapide

## 📋 Étapes rapides

### 1. Compiler le backend

```bash
cd apps/backend/materials-service
npm run build
```

**Résultat attendu:**
```
> materials-service@0.0.1 build
> nest build

Exit Code: 0
```

### 2. Compiler le frontend

```bash
cd apps/frontend
npm run build
```

**Résultat attendu:**
```
✓ built in 51.99s
Exit Code: 0
```

### 3. Démarrer les services

**Terminal 1: Service des sites**
```bash
cd apps/backend/gestion-site
npm run start:dev
```

**Terminal 2: Service materials**
```bash
cd apps/backend/materials-service
npm run start:dev
```

**Terminal 3: Frontend**
```bash
cd apps/frontend
npm run dev
```

## 🧪 Tests rapides

### Test 1: Diagnostic des sites

```bash
curl -X GET http://localhost:3000/api/materials/diagnostic/sites \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 2: Récupérer les détails du site

```bash
# Remplacer MATERIAL_ID par un ID réel
curl -X GET http://localhost:3000/api/materials/MATERIAL_ID/site-details \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Récupérer les statistiques

```bash
# Remplacer MATERIAL_ID par un ID réel
curl -X GET http://localhost:3000/api/materials/MATERIAL_ID/aggregate-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🖥️ Test dans l'interface

1. Ouvrir http://localhost:5173
2. Naviguer vers Materials
3. Cliquer sur un matériau
4. Vérifier que les coordonnées GPS s'affichent
5. Vérifier que les statistiques des mouvements s'affichent

## 📊 Résultats attendus

### Coordonnées GPS
```
Chantier Assigné
Chantier Nord
123 Rue de la Paix
📍 48.856600°, 2.352200°
```

### Statistiques des mouvements
```
Synthèse des Mouvements
Total Entrées: 150
Total Sorties: 50
Solde Net: 100
```

## 🔍 Dépannage rapide

### Erreur 404 du site

```bash
# Vérifier le diagnostic
curl -X GET http://localhost:3000/api/materials/diagnostic/sites

# Vérifier que le service des sites est en cours d'exécution
curl -X GET http://localhost:3001/api/gestion-sites
```

### Pas de coordonnées GPS

```bash
# Vérifier que le site a des coordonnées
curl -X GET http://localhost:3001/api/gestion-sites/SITE_ID
```

### Statistiques affichent 0

```bash
# Vérifier que les mouvements sont enregistrés
curl -X GET http://localhost:3000/api/materials/MATERIAL_ID/aggregate-stats
```

## 📚 Documentation complète

- **CORRECTIONS_APPLIQUEES.md** - Détails des corrections
- **TESTING_GUIDE.md** - Guide complet de test
- **TROUBLESHOOTING.md** - Guide de dépannage
- **README_GPS_IMPLEMENTATION.md** - Vue d'ensemble

## ✅ Checklist

- [ ] Backend compile
- [ ] Frontend compile
- [ ] Service des sites démarre
- [ ] Service materials démarre
- [ ] Frontend démarre
- [ ] Diagnostic retourne des résultats
- [ ] Coordonnées GPS s'affichent
- [ ] Statistiques s'affichent
