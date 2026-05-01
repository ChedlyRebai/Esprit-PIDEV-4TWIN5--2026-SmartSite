# 🎨 Guide d'Affichage Frontend - Prédictions FastAPI

## 🎯 Ce Que Vous Devez Voir dans le Frontend

### Page: http://localhost:5173/materials

---

## 📊 Section "AI Predictions"

### Exemple 1: Stock Safe (Normal)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🧠 AI Predictions                          [All (5)] [Critical (0)] [Warning (1)] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🟢 Ciment Portland                                    [Safe]   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Current stock: 100        Consumption: 5/day              │ │
│  │ Predicted stock (7d): 65  Confidence: 85%                 │ │
│  │                                                             │ │
│  │ 🚨 Stockout in: 18d 12h                                   │ │
│  │ 📦 Order: 130 units                                       │ │
│  │                                                             │ │
│  │ 🤖 FastAPI ML: ✅ Stock level is healthy.                │ │
│  │    Estimated 18.5 days until reorder needed.              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Valeurs Clés:**
- ✅ Current stock: **100** (valeur réelle du matériau)
- ✅ Consumption: **5/day** (valeur réelle, PAS par heure)
- ✅ Predicted stock (7d): **65** (calculé par FastAPI)
- ✅ Confidence: **85%** (du modèle ML FastAPI)
- ✅ Stockout in: **18d 12h** (444 heures = 18.5 jours de FastAPI)
- ✅ Order: **130 units** (recommandé par FastAPI)
- ✅ Message: **de FastAPI** avec préfixe "🤖 FastAPI ML:"

---

### Exemple 2: Stock Warning

```
┌─────────────────────────────────────────────────────────────────┐
│  🟡 Sable                                            [Warning]  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Current stock: 50         Consumption: 10/day             │ │
│  │ Predicted stock (7d): -20 Confidence: 85%                 │ │
│  │                                                             │ │
│  │ 🚨 Stockout in: 4d 19h                                    │ │
│  │ 📦 Order: 280 units                                       │ │
│  │                                                             │ │
│  │ 🤖 FastAPI ML: ⚡ WARNING: Stock will be depleted in     │ │
│  │    4.8 days. Order soon.                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Valeurs Clés:**
- ✅ Status: **Warning** (jaune)
- ✅ Stockout in: **4d 19h** (115 heures = 4.8 jours)
- ✅ Predicted stock négatif: **-20** (rupture avant 7 jours)

---

### Exemple 3: Stock Critical (Imminent)

```
┌─────────────────────────────────────────────────────────────────┐
│  🔴 Gravier                                         [Critical]  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Current stock: 10         Consumption: 8/day              │ │
│  │ Predicted stock (7d): -46 Confidence: 85%                 │ │
│  │                                                             │ │
│  │ 🚨 Stockout in: 1d 5h  ⚠️ IMMINENT STOCKOUT              │ │
│  │ 📦 Order: 250 units                                       │ │
│  │                                                             │ │
│  │ 🤖 FastAPI ML: ⚠️ URGENT: Stock will be depleted in      │ │
│  │    1.2 days. Immediate order required!                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Valeurs Clés:**
- ✅ Status: **Critical** (rouge)
- ✅ Badge animé: **⚠️ IMMINENT STOCKOUT**
- ✅ Stockout in: **1d 5h** (29 heures = 1.2 jours)
- ✅ Message urgent de FastAPI

---

## 🎨 Codes Couleur

### Status Badges:
- 🟢 **Safe** (vert): > 10 jours avant rupture
- 🟡 **Warning** (jaune): 2-10 jours avant rupture
- 🔴 **Critical** (rouge): < 2 jours avant rupture

### Alerts:
- **< 48h:** Badge rouge animé "IMMINENT STOCKOUT"
- **< 72h:** Texte en rouge gras
- **> 72h:** Texte en gris normal

---

## 📱 Console Browser

### Logs Attendus:
```javascript
🔮 Fetching all predictions from /predictions/all
✅ 5 predictions loaded from FastAPI ML service
```

### ❌ NE DOIT PAS Apparaître:
```javascript
❌ 🔮 Fetching all predictions... (répété infiniment)
❌ Error loading predictions
❌ Using default values
```

---

## 🔍 Détails des Valeurs

### 1. Current Stock
- **Source:** Base de données MongoDB
- **Format:** Nombre entier
- **Exemple:** 100

### 2. Consumption
- **Source:** Base de données MongoDB
- **Format:** X/day (par jour, PAS par heure)
- **Exemple:** 5/day

### 3. Predicted Stock (7d)
- **Source:** FastAPI ML (predicted_stock_in_days)
- **Calcul:** current_stock - (consumption_rate * 7)
- **Format:** Nombre entier
- **Exemple:** 65

### 4. Confidence
- **Source:** FastAPI ML (confidence)
- **Format:** Pourcentage
- **Valeur:** 85% (du modèle Random Forest)
- **Exemple:** 85%

### 5. Stockout in
- **Source:** FastAPI ML (days_until_stockout)
- **Conversion:** jours → heures (x24)
- **Format:** Xd Yh
- **Exemple:** 18d 12h (18.5 jours = 444 heures)

### 6. Order Quantity
- **Source:** FastAPI ML (recommended_order_quantity)
- **Calcul:** (consumption_rate * 30) + minimum_stock - current_stock
- **Format:** X units
- **Exemple:** 130 units

### 7. Message
- **Source:** FastAPI ML (message)
- **Format:** Texte avec préfixe "🤖 FastAPI ML:"
- **Exemple:** "✅ Stock level is healthy. Estimated 18.5 days until reorder needed."

---

## 📊 Comparaison Avant/Après

### ❌ AVANT (Valeurs Incorrectes):
```
Current stock: 100
Consumption: 0.2/h  ← INCORRECT (devrait être par jour)
Predicted stock: 100  ← INCORRECT (valeur par défaut)
Confidence: 50%  ← INCORRECT (valeur par défaut)
Stockout in: 999h  ← INCORRECT (valeur par défaut)
Order: 200 units  ← INCORRECT (calcul local)
Message: "Generic message"  ← INCORRECT (pas de FastAPI)
```

### ✅ APRÈS (Valeurs FastAPI):
```
Current stock: 100  ✅
Consumption: 5/day  ✅ (par jour)
Predicted stock: 65  ✅ (de FastAPI)
Confidence: 85%  ✅ (du modèle ML)
Stockout in: 18d 12h  ✅ (de FastAPI)
Order: 130 units  ✅ (de FastAPI)
Message: "🤖 FastAPI ML: ✅ Stock level is healthy..."  ✅
```

---

## 🧪 Test Visuel Rapide

### Ouvrez le frontend et vérifiez:

1. **Section "AI Predictions" existe** ✅
2. **Cartes de prédiction affichées** ✅
3. **Badges de status colorés** (vert/jaune/rouge) ✅
4. **Consommation en /day** (pas /h) ✅
5. **Confidence à 85%** (pas 50%) ✅
6. **Jours avant rupture réalistes** (pas 999h) ✅
7. **Message avec préfixe "🤖 FastAPI ML:"** ✅
8. **Pas de boucle infinie dans la console** ✅

---

## 🎯 Résultat Attendu

Si tout fonctionne:
- ✅ Toutes les valeurs viennent de FastAPI ML
- ✅ Aucune valeur par défaut (999, 50%, etc.)
- ✅ Aucun calcul local dans le frontend
- ✅ Messages de FastAPI affichés
- ✅ Confidence du modèle ML (85%)
- ✅ Recommandations de FastAPI

---

**Status:** ✅ GUIDE COMPLET
**Date:** 2026-04-30
**Objectif:** Afficher les vraies valeurs de FastAPI ML dans le frontend
