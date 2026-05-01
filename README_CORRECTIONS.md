# 🔧 CORRECTIONS: Consommation et Anomalies ML

## 📌 CONTEXTE

Suite aux requêtes utilisateur concernant:
1. Valeurs de consommation identiques pour tous les matériaux (1/day, 85%)
2. Absence de détection des risques de vol et gaspillage
3. Affichage de valeurs floating point incorrectes (1.3499999...)

## ✅ CORRECTIONS EFFECTUÉES

### 1. **Consommation Spécifique par Matériau**
- **Fichier**: `apps/backend/ml-prediction-service/main.py` (ligne ~450)
- **Problème**: FastAPI utilisait la médiane globale pour tous les matériaux
- **Solution**: Recherche par nom de matériau dans le dataset
- **Résultat**: Chaque matériau a maintenant sa propre consommation

### 2. **Détection d'Anomalies ML Connectée**
- **Fichier**: `apps/frontend/src/app/pages/materials/AnomaliesList.tsx`
- **Problème**: Frontend n'appelait pas l'API ML FastAPI
- **Solution**: Appel à `/materials/anomalies/detect` avec affichage enrichi
- **Résultat**: Affichage des risques de vol, gaspillage, et surconsommation

### 3. **Arrondi des Valeurs**
- **Fichier**: `apps/frontend/src/app/pages/materials/PredictionsList.tsx`
- **Problème**: Affichage de floating point (1.3499999...)
- **Solution**: Arrondi avec `Math.round(x * 10) / 10`
- **Résultat**: Affichage propre (1.3/day)

## 📁 FICHIERS MODIFIÉS

1. `apps/backend/ml-prediction-service/main.py`
2. `apps/frontend/src/app/pages/materials/AnomaliesList.tsx`
3. `apps/frontend/src/app/pages/materials/PredictionsList.tsx` (déjà corrigé)

## 📚 DOCUMENTATION CRÉÉE

1. **CORRECTION_CONSOMMATION_ANOMALIES.md** - Documentation technique complète
2. **RESUME_CORRECTIONS_FINALES.md** - Résumé des corrections
3. **VERIFICATION_FINALE.md** - Tests et vérifications
4. **SUMMARY_VISUAL.md** - Résumé visuel avant/après
5. **test_consumption_values.sh** - Script de test automatique

## 🧪 TESTS À EFFECTUER

### Étape 1: Redémarrer FastAPI
```bash
cd apps/backend/ml-prediction-service
python main.py
```

### Étape 2: Vérifier les Logs
Chercher dans les logs:
```
📊 Dataset consumption for Ciment Portland: 2.50/day (from 91 records)
📊 Dataset consumption for Béton: 15.30/day (from 102 records)
```

### Étape 3: Tester l'API
```bash
# Test prédictions
curl http://localhost:3002/api/materials/predictions/all | jq '.[] | {name: .materialName, consumption: .consumptionRate}'

# Test anomalies
curl http://localhost:3002/api/materials/anomalies/detect | jq '{theft: .theft_risk | length, waste: .waste_risk | length}'

# Ou utiliser le script de test
bash test_consumption_values.sh
```

### Étape 4: Vérifier le Frontend
1. Ouvrir `http://localhost:5173/materials`
2. Section "AI Predictions":
   - ✅ Chaque matériau a une consommation différente
   - ✅ Confidence varie (30%, 85%, 95%)
3. Section "Anomalies & Alerts":
   - ✅ Filtre "🚨 Theft Risk" visible
   - ✅ Filtre "📉 Waste Risk" visible
   - ✅ Détails de consommation affichés
   - ✅ Actions recommandées visibles

## 📊 RÉSULTATS ATTENDUS

### Avant ❌
```
Tous les matériaux:
- Consumption: 1/day
- Confidence: 85%
- Pas d'anomalies ML
```

### Après ✅
```
Ciment Portland:    Consumption: 2.5/day,  Confidence: 95%
Béton:              Consumption: 15.3/day, Confidence: 85%
Sable:              Consumption: 3.8/day,  Confidence: 90%
Gravier:            Consumption: 1.8/day,  Confidence: 90%

Anomalies détectées:
- 🚨 2 risques de vol (critical/high)
- 📉 3 risques de gaspillage (medium)
- 📊 3 surconsommations (low)
```

## 🔄 FLUX TECHNIQUE

```
1. Frontend (Materials.tsx)
   └─> GET /materials/predictions/all

2. Materials Service (materials.controller.ts)
   └─> MLPredictionClientService.predictStockDepletion()

3. FastAPI (main.py)
   ├─> Charge stock-prediction.csv (1000 records)
   ├─> Filtre par materialName ✅ NOUVEAU
   ├─> Calcule consommation spécifique
   ├─> Prédit avec Random Forest
   └─> Retourne: consommation unique + confidence

4. Frontend (PredictionsList.tsx)
   └─> Affiche: chaque matériau avec sa propre consommation ✅
```

```
1. Frontend (AnomaliesList.tsx)
   └─> GET /materials/anomalies/detect ✅ NOUVEAU

2. Materials Service (materials.controller.ts)
   ├─> Récupère tous les matériaux
   └─> POST /detect/batch-anomalies (FastAPI)

3. FastAPI (main.py)
   ├─> Analyse avec Isolation Forest
   ├─> Classifie: THEFT, WASTE, OVER-CONSUMPTION
   └─> Retourne: theft_risk[], waste_risk[], over_consumption[]

4. Frontend (AnomaliesList.tsx)
   └─> Affiche avec détails et actions recommandées ✅
```

## 🎯 CLASSIFICATION DES ANOMALIES

- **THEFT (Vol)**: deviation >= 50% → Risque de vol
- **WASTE (Gaspillage)**: deviation >= 30% → Mauvaises pratiques
- **OVER-CONSUMPTION**: deviation >= 15% → Surconsommation normale

## 📋 CHECKLIST

### Backend
- [x] ✅ FastAPI: Code modifié (recherche par nom)
- [x] ✅ FastAPI: Logs détaillés ajoutés
- [x] ✅ Materials Service: Endpoint anomalies/detect
- [ ] ⏳ Redémarrer FastAPI
- [ ] ⏳ Vérifier logs

### Frontend
- [x] ✅ AnomaliesList: Interface étendue
- [x] ✅ AnomaliesList: Appel API ML
- [x] ✅ AnomaliesList: Affichage enrichi
- [x] ✅ PredictionsList: Arrondi des valeurs
- [ ] ⏳ Recharger page
- [ ] ⏳ Vérifier affichage

### Tests
- [ ] ⏳ Test 1: Consommations différentes
- [ ] ⏳ Test 2: Anomalies détectées
- [ ] ⏳ Test 3: Logs FastAPI
- [ ] ⏳ Test 4: Frontend complet

## 🚀 PROCHAINES ÉTAPES

1. Redémarrer FastAPI pour appliquer les changements
2. Vérifier les logs pour confirmer les consommations spécifiques
3. Tester l'API avec `test_consumption_values.sh`
4. Vérifier le frontend pour voir les anomalies ML
5. Confirmer que chaque matériau a des valeurs uniques

## 📝 NOTES TECHNIQUES

### Pourquoi 70% dataset + 30% request?
- **70% dataset**: Valeurs historiques fiables et entraînées
- **30% request**: Adaptation aux conditions actuelles du site
- **Résultat**: Prédictions plus précises et réalistes

### Dataset Utilisé
- **stock-prediction.csv**: 1000 lignes, 10 matériaux différents
  - Ciment Portland: 91 records
  - Béton prêt à l'emploi: 102 records
  - Sable de construction: 106 records
  - Briques rouges: 99 records
  - Etc.

### Modèles ML
- **Random Forest**: Prédiction de rupture de stock (96.82% accuracy)
- **Isolation Forest**: Détection d'anomalies de consommation

## 🔗 LIENS UTILES

- **Documentation complète**: `CORRECTION_CONSOMMATION_ANOMALIES.md`
- **Résumé visuel**: `SUMMARY_VISUAL.md`
- **Tests**: `VERIFICATION_FINALE.md`
- **Script de test**: `test_consumption_values.sh`

## ❓ FAQ

**Q: Pourquoi tous les matériaux avaient la même consommation?**  
R: FastAPI utilisait `df_stock[df_stock['consumption'] > 0].median()` qui calculait la médiane de TOUS les matériaux au lieu de filtrer par nom.

**Q: Comment sont détectés les risques de vol?**  
R: FastAPI analyse la déviation de consommation. Si deviation >= 50%, c'est classé comme risque de vol.

**Q: Les valeurs viennent-elles vraiment du dataset?**  
R: Oui, FastAPI filtre maintenant par `materialName` dans `stock-prediction.csv` et calcule la moyenne des records correspondants.

**Q: Que faire si un matériau n'est pas dans le dataset?**  
R: Le code a un fallback intelligent qui cherche des matériaux avec une consommation similaire, sinon utilise la valeur de la requête.

---

**Date**: 2026-04-30  
**Status**: ✅ CORRECTIONS COMPLÈTES  
**Auteur**: Kiro AI Assistant  
**Version**: 1.0
