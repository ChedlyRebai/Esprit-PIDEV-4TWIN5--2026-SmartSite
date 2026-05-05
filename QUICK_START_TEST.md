# 🚀 QUICK START - Test Materials Service

Date: 2 Mai 2026  
Objectif: Tester rapidement que toutes les corrections fonctionnent

---

## ⚡ TESTS RAPIDES (5 minutes)

### Test 1: Compilation TypeScript ✅

```bash
cd apps/backend/materials-service
npm run build
```

**Attendu**: Exit Code: 0 (pas d'erreur)  
**Durée**: 30 secondes

---

### Test 2: Vérification Automatique ✅

```bash
node verify-materials-fixes.cjs
```

**Attendu**: 
```
🎉 ALL CHECKS PASSED! Materials Service is ready.
✅ TypeScript compilation should succeed
✅ Site information will be fetched from MongoDB
✅ Frontend will display site name, address, and GPS coordinates
```

**Durée**: 5 secondes

---

### Test 3: Démarrage du Service

```bash
cd apps/backend/materials-service
npm start
```

**Attendu dans les logs**:
```
✅ Connexion MongoDB sites établie
[Nest] INFO [MaterialsService] ✅ Site info loaded: Chantier Nord (48.8566, 2.3522)
```

**Durée**: 10 secondes

---

### Test 4: Test API - Liste des Matériaux

```bash
# Dans un nouveau terminal
curl http://localhost:3002/api/materials | jq
```

**Attendu dans la réponse**:
```json
{
  "data": [
    {
      "_id": "...",
      "name": "Ciment Portland",
      "code": "CIM001",
      "siteName": "Chantier Nord Paris",
      "siteAddress": "123 Rue de la Paix, 75001 Paris",
      "siteCoordinates": {
        "lat": 48.8566,
        "lng": 2.3522
      }
    }
  ]
}
```

**Durée**: 5 secondes

---

### Test 5: Test API - Détails d'un Matériau

```bash
# Remplacer {materialId} par un ID réel
curl http://localhost:3002/api/materials/{materialId} | jq
```

**Attendu dans la réponse**:
```json
{
  "_id": "...",
  "name": "Ciment Portland",
  "siteName": "Chantier Nord Paris",
  "siteAddress": "123 Rue de la Paix, 75001 Paris",
  "siteCoordinates": {
    "lat": 48.8566,
    "lng": 2.3522
  }
}
```

**Durée**: 5 secondes

---

### Test 6: Test Frontend - Affichage des Détails

```bash
# Démarrer le frontend si pas déjà fait
cd apps/frontend
npm run dev
```

**Étapes**:
1. Ouvrir http://localhost:5173/materials
2. Cliquer sur un matériau assigné à un site
3. Vérifier l'affichage:
   - ✅ Nom du site (ex: "Chantier Nord Paris")
   - ✅ Adresse du site (ex: "123 Rue de la Paix, 75001 Paris")
   - ✅ Coordonnées GPS (ex: "48.85660, 2.35220")
   - ✅ Widget météo (si coordonnées présentes)

**Durée**: 1 minute

---

## 🎯 CHECKLIST RAPIDE

Cochez au fur et à mesure:

- [ ] ✅ Test 1: Compilation TypeScript réussie
- [ ] ✅ Test 2: Vérification automatique passée (10/10)
- [ ] ✅ Test 3: Service démarre sans erreur
- [ ] ✅ Test 4: API retourne les matériaux avec infos de site
- [ ] ✅ Test 5: API retourne les détails avec infos de site
- [ ] ✅ Test 6: Frontend affiche nom, adresse et GPS

---

## 🐛 DÉPANNAGE RAPIDE

### Problème: Compilation échoue

**Solution**:
```bash
cd apps/backend/materials-service
rm -rf node_modules dist
npm install
npm run build
```

---

### Problème: Service ne démarre pas

**Solution**:
```bash
# Vérifier que MongoDB est démarré
# Vérifier le fichier .env
cd apps/backend/materials-service
cat .env | grep MONGODB_URI
```

---

### Problème: Pas d'infos de site dans l'API

**Solution**:
```bash
# Vérifier que la collection 'sites' existe dans MongoDB
# Vérifier les logs du service:
cd apps/backend/materials-service
npm start
# Chercher: "✅ Connexion MongoDB sites établie"
```

---

### Problème: Frontend n'affiche pas les infos de site

**Solution**:
```bash
# Vérifier que l'API retourne bien les infos
curl http://localhost:3002/api/materials/{materialId} | jq '.siteName'

# Si l'API retourne les infos mais pas le frontend:
cd apps/frontend
rm -rf node_modules .next
npm install
npm run dev
```

---

## 📊 RÉSULTATS ATTENDUS

### ✅ Tous les tests passent

Si tous les tests passent, vous devriez voir:

1. **Compilation**: Exit Code: 0
2. **Vérification**: 10/10 checks passés
3. **Service**: Démarre sur le port 3002
4. **API**: Retourne `siteName`, `siteAddress`, `siteCoordinates`
5. **Frontend**: Affiche nom, adresse et GPS du site

**Statut**: ✅ **PRÊT POUR LA PRODUCTION**

---

### ⚠️ Certains tests échouent

Si certains tests échouent:

1. Vérifier les logs d'erreur
2. Consulter la section "Dépannage rapide"
3. Exécuter le script de vérification:
   ```bash
   node verify-materials-fixes.cjs
   ```
4. Consulter `VERIFICATION_COMPLETE_MATERIALS.md` pour plus de détails

---

## 📞 AIDE SUPPLÉMENTAIRE

### Documentation Complète
- `VERIFICATION_COMPLETE_MATERIALS.md` - Documentation détaillée
- `FINAL_STATUS_MATERIALS.md` - Statut final et checklist
- `CORRECTIONS_SITE_INFO_MATERIALS.md` - Corrections appliquées
- `CORRECTIONS_COMPLETES_MATERIALS.md` - Toutes les corrections

### Scripts de Vérification
- `verify-materials-fixes.cjs` - Vérification automatique (10 checks)
- `diagnostic-complet.js` - Diagnostic complet du système

---

**Temps total estimé**: 5-10 minutes  
**Difficulté**: Facile  
**Prérequis**: Node.js, MongoDB, npm

---

**Bonne chance!** 🚀
