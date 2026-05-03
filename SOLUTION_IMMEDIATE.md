# 🚀 SOLUTION IMMÉDIATE - 3 Commandes

## ⚡ Correction Rapide (5 minutes)

### 1️⃣ Fixer le site et les coordonnées GPS

```bash
node fix-material-site.js
```

**Ce script va**:
- ✅ Trouver ou créer le site "test 4"
- ✅ Ajouter les coordonnées GPS (33.8439, 9.4001)
- ✅ Assigner le site au matériau "Peinture blanche"

**Résultat attendu**:
```
✅ CORRECTION TERMINÉE
   Matériau: Peinture blanche (...)
   Site: test 4 (...)
   Coordonnées: 33.8439, 9.4001
```

### 2️⃣ Créer des mouvements de test

Ouvrez `test-create-movements.html` dans votre navigateur et:
1. Copiez le Material ID et Site ID affichés par le script précédent
2. Collez-les dans le formulaire
3. Cliquez sur "Créer les mouvements de test"

**OU via PowerShell**:
```powershell
# Remplacez les IDs par ceux affichés par le script
$body = @{
    materialId = "MATERIAL_ID_DU_SCRIPT"
    siteId = "SITE_ID_DU_SCRIPT"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/api/material-flow/test-movements" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### 3️⃣ Redémarrer et vérifier

```powershell
# Redémarrer le service materials
cd apps/backend/materials-service
npm start

# Actualiser la page (F5)
```

## ✅ Résultat Final

Après ces 3 étapes, vous devriez voir:

### 📍 Chantier Assigné
```
test 4
📍 33.8439, 9.4001
```

### 🌤️ Météo du Chantier
```
17°C - peu nuageux
Ressenti: 17°C
Humidité: 71%
Vent: 36 km/h
Ville: Gabès
```

### 📊 Synthèse des Mouvements
```
150 Total Entrées
80 Total Sorties
70 Solde Net
0 Anomalies
```

### 📋 Mouvements récents
```
1. +100 m³ - Réception initiale de stock (test)
2. -30 m³ - Utilisation sur chantier (test)
3. +50 m³ - Réapprovisionnement (test)
4. -40 m³ - Utilisation sur chantier (test)
5. -10 m³ - Matériel endommagé (test)
```

## 🔍 Vérification

### Logs Backend (terminal)
```
✅ Site data found: {...}
✅ Coordonnées extraites: lat=33.8439, lng=9.4001
```

### Logs Frontend (console F12)
```
✅ GPS Coordinates found: { lat: 33.8439, lng: 9.4001 }
✅ Movements loaded: [...]
📊 Aggregate stats loaded: {...}
```

## 🐛 Si ça ne fonctionne toujours pas

### Problème: "Site assigné" mais pas de météo

**Cause**: Le service n'a pas été redémarré

**Solution**:
```powershell
Stop-Process -Name node -Force
cd apps/backend/materials-service
npm start
```

### Problème: Mouvements à 0

**Cause**: Les mouvements n'ont pas été créés ou ont un siteId différent

**Solution**: Recréez les mouvements avec les bons IDs

### Problème: Erreur 404 sur /weather/city

**Cause**: Le widget météo ne reçoit pas les coordonnées GPS

**Solution**: 
1. Vérifiez les logs frontend (F12)
2. Cherchez "GPS Coordinates found"
3. Si absent, le backend ne retourne pas les coordonnées
4. Redémarrez le service

## 📞 Checklist Rapide

- [ ] Script `fix-material-site.js` exécuté avec succès
- [ ] Mouvements créés (via HTML ou PowerShell)
- [ ] Service materials redémarré
- [ ] Page actualisée (F5)
- [ ] Console ouverte (F12) pour voir les logs
- [ ] GPS et météo affichés
- [ ] Synthèse des mouvements affichée
- [ ] Mouvements récents affichés

## 🎉 C'est Tout!

Si tous les points sont cochés, MaterialDetails fonctionne parfaitement!

---

**Temps total**: ~5 minutes  
**Difficulté**: Facile  
**Résultat**: 100% fonctionnel
