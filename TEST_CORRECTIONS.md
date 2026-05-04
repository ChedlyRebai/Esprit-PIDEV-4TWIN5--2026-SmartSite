# 🧪 GUIDE DE TEST - 3 CORRECTIONS

## ✅ Corrections Appliquées

1. **Rapport d'Analyse IA** - Logique simplifiée
2. **Prédictions ML** - Valeurs correctes récupérées
3. **Bouton Commander** - Quantité recommandée affichée

---

## 🧪 TEST 1: Prédictions ML dans le Tableau

### Objectif
Vérifier que les prédictions ML affichent les bonnes valeurs dans le tableau Materials.

### Étapes

1. **Démarrer les services**:
   ```bash
   # Terminal 1: Materials Service
   cd apps/backend/materials-service
   npm start
   
   # Terminal 2: Frontend
   cd apps/frontend
   npm run dev
   ```

2. **Ouvrir l'application**:
   - Navigateur: `http://localhost:5173`
   - Aller sur: **Materials**

3. **Vérifier les prédictions**:
   - Regarder la colonne "Rupture prévue"
   - Vérifier le format:
     - `🚨 Aujourd'hui 14:30` (< 24h)
     - `⚠️ Demain 09:15` (24-48h)
     - `✅ Mercredi 16:00` (> 48h)

4. **Vérifier le tooltip**:
   - Survoler une prédiction
   - Vérifier les informations:
     - Stock actuel
     - Consommation horaire
     - Stock prédit (24h)
     - Date/heure de rupture
     - Quantité recommandée

### Résultat Attendu

✅ **Prédictions affichées correctement**:
- Format clair avec emojis
- Date/heure exacte
- Pas de "Invalid Date" ou "NaN"
- Tooltip détaillé au survol

❌ **Si problème**:
- Vérifier que materials-service tourne sur port 3009
- Vérifier les logs dans la console (F12)
- Vérifier l'appel API: `GET /api/materials/predictions/all`

---

## 🧪 TEST 2: Bouton Commander - Quantité Recommandée

### Objectif
Vérifier que le bouton "Commander" récupère et affiche la quantité recommandée par l'IA.

### Étapes

1. **Trouver un matériau en stock bas**:
   - Chercher un matériau avec badge "Stock bas" (jaune)
   - Ou un matériau avec badge "Rupture" (rouge)

2. **Cliquer sur "Commander"**:
   - Bouton jaune: "🚚 Commander"
   - Bouton rouge: "⚠️ Urgent"

3. **Vérifier le dialog**:
   - Dialog "Nouvelle commande" s'ouvre
   - Section "Quantité à commander" visible

4. **Vérifier la recommandation IA**:
   - Encadré bleu-indigo avec icône 🧠
   - Texte: "IA recommande: X unités"
   - Champ quantité pré-rempli avec X

5. **Tester la validation**:
   - Réduire la quantité en dessous de la recommandation
   - Cliquer "Créer la commande"
   - Vérifier le message d'erreur

### Résultat Attendu

✅ **Quantité recommandée affichée**:
```
┌─────────────────────────────────────────────┐
│ 🧠 IA recommande: 150 unités                │
│ ⚠️ Quantité minimale calculée selon la     │
│    consommation et le stock de sécurité     │
└─────────────────────────────────────────────┘
```

✅ **Champ pré-rempli**: Quantité = 150

✅ **Validation stricte**:
- Si quantité < 150 → Erreur
- Message: "❌ Quantité insuffisante!"
- Détails: Minimum recommandé vs saisi

❌ **Si problème**:
- Vérifier l'appel API: `GET /api/materials/${id}/prediction`
- Vérifier les logs: "📊 Prédiction chargée: Quantité recommandée = X"
- Vérifier que `recommendedOrderQuantity` est défini

---

## 🧪 TEST 3: Rapport d'Analyse IA - Messages Simplifiés

### Objectif
Vérifier que les messages du rapport IA sont concis et clairs.

### Étapes

1. **Cliquer sur "Générer Rapport IA"**:
   - Bouton violet en haut à droite
   - Dialog "Générer Rapport Quotidien IA" s'ouvre

2. **Vérifier le texte du dialog**:
   - Description: "Générez un rapport complet avec analyse IA des stocks et recommandations."
   - Liste des inclusions (4 items)

3. **Saisir un email**:
   - Email valide: `test@example.com`
   - Cliquer "Générer et Envoyer"

4. **Vérifier le toast**:
   - Message: "✅ Rapport envoyé à test@example.com"
   - Durée: 2 secondes
   - Dialog se ferme automatiquement

### Résultat Attendu

✅ **Textes simplifiés**:

**Description**:
```
Générez un rapport complet avec analyse IA des stocks et recommandations.
```

**Liste des inclusions**:
```
📊 Le rapport inclut:
• Matériaux en stock bas et rupture
• Matériaux expirant prochainement
• Anomalies détectées (24h)
• Recommandations de commande
```

✅ **Toast de succès**:
```
✅ Rapport envoyé à test@example.com
```

❌ **Si problème**:
- Vérifier l'appel API: `POST /api/materials/reports/daily/send`
- Vérifier les logs backend
- Vérifier la configuration email dans `.env`

---

## 🧪 TEST 4: Validation Complète

### Scénario Complet

1. **Ouvrir Materials**
2. **Vérifier les prédictions** dans le tableau
3. **Cliquer "Commander"** sur un matériau
4. **Vérifier la quantité recommandée**
5. **Essayer de commander moins** → Erreur
6. **Commander la quantité recommandée** → Succès
7. **Générer un rapport IA** → Email envoyé

### Checklist

- [ ] Prédictions affichées correctement
- [ ] Format date/heure correct
- [ ] Tooltip détaillé au survol
- [ ] Bouton "Commander" fonctionne
- [ ] Quantité recommandée affichée
- [ ] Champ pré-rempli automatiquement
- [ ] Validation empêche commande insuffisante
- [ ] Message d'erreur clair
- [ ] Rapport IA génère et envoie
- [ ] Toast de succès affiché

---

## 📊 Logs à Vérifier

### Console Navigateur (F12)

**Chargement des prédictions**:
```
✅ X prédictions chargées
📤 Mapped prediction: hoursToOutOfStock=X, consumptionRate=X
```

**Chargement de la quantité recommandée**:
```
📊 Prédiction chargée: Quantité recommandée = 150
```

**Création de commande**:
```
📤 Order data: { materialId, quantity, ... }
✅ Order created: { _id, ... }
```

### Terminal Materials Service

**Génération des prédictions**:
```
[Nest] INFO [MaterialsController] 📊 Génération de prédictions pour X matériaux
[Nest] INFO [StockPredictionService] 📊 Recherche consommation pour matériau...
[Nest] INFO [StockPredictionService] 📊 Taux calculé depuis historique: X unités/h
```

**Prédiction individuelle**:
```
[Nest] INFO [MaterialsController] 📊 Prédiction pour matériau X
[Nest] INFO [StockPredictionService] ✅ Prédiction générée: hoursToOutOfStock=X
```

---

## 🚨 Dépannage

### Problème: Quantité recommandée = 0

**Cause**: Pas de données dans MaterialFlowLog

**Solution**:
1. Aller sur "Material Flow Log"
2. Ajouter des sorties manuellement
3. Recharger les prédictions

### Problème: Endpoint 404

**Cause**: Proxy Vite mal configuré

**Solution**:
1. Vérifier `apps/frontend/vite.config.ts`
2. Vérifier que `/api/materials` pointe vers `localhost:3009`
3. Redémarrer le frontend

### Problème: Validation ne fonctionne pas

**Cause**: `recommendedQuantity` non défini

**Solution**:
1. Vérifier les logs: "📊 Prédiction chargée: Quantité recommandée = X"
2. Vérifier l'appel API dans Network (F12)
3. Vérifier que le backend retourne `recommendedOrderQuantity`

---

## ✅ Résultat Final

Si tous les tests passent:

- ✅ Prédictions ML affichent les bonnes valeurs
- ✅ Bouton "Commander" récupère la quantité recommandée
- ✅ Validation empêche les commandes insuffisantes
- ✅ Rapport IA génère et envoie correctement
- ✅ Messages simplifiés et clairs

**Temps de test estimé**: 10-15 minutes

---

**Date**: 29 avril 2026  
**Status**: ✅ PRÊT À TESTER  
**Documentation**: CORRECTIONS_FINALES.md
