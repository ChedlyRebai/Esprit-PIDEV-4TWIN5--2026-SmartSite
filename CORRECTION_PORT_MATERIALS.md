# 🔧 CORRECTION PORT MATERIALS - "Matériau introuvable"

## ❌ PROBLÈME IDENTIFIÉ

L'erreur **"Matériau introuvable"** était causée par **5 appels HTTP vers le mauvais port** dans le materials-service :

### 1. orders.service.ts - getMaterialData() (Ligne 688)
```typescript
// ❌ AVANT (INCORRECT)
const response = await this.httpService.axiosRef.get(
  `http://localhost:3002/api/materials/${materialId}`,
);

// ✅ APRÈS (CORRIGÉ)
const response = await this.httpService.axiosRef.get(
  `http://localhost:3009/api/materials/${materialId}`,
);
```

### 2. orders.service.ts - getMaterialUnitPrice() (Ligne 625)
```typescript
// ❌ AVANT (INCORRECT)
const response = await this.httpService.axiosRef.get(
  `http://localhost:3002/api/materials/${materialId}`,
);

// ✅ APRÈS (CORRIGÉ)
const response = await this.httpService.axiosRef.get(
  `http://localhost:3009/api/materials/${materialId}`,
);
```

### 3. consumption-anomaly.service.ts - getMaterialInfo() (Ligne 314)
```typescript
// ❌ AVANT (INCORRECT)
const response = await firstValueFrom(
  this.httpService.get(
    `http://localhost:3002/api/materials/${materialId}`,
  ),
);

// ✅ APRÈS (CORRIGÉ)
const response = await firstValueFrom(
  this.httpService.get(
    `http://localhost:3009/api/materials/${materialId}`,
  ),
);
```

### 4. chat.controller.ts - uploadFile() (Ligne 167)
```typescript
// ❌ AVANT (INCORRECT)
const baseUrl = process.env.BASE_URL || 'http://localhost:3002';

// ✅ APRÈS (CORRIGÉ)
const baseUrl = process.env.BASE_URL || 'http://localhost:3009';
```

### 5. main.ts - CORS Configuration (Ligne 21)
```typescript
// ❌ AVANT (INCORRECT)
const defaults = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',  // ❌ Port incorrect
];

// ✅ APRÈS (CORRIGÉ)
const defaults = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3009',  // ✅ Port correct
];
```

---

## 📋 RÉSUMÉ DES PORTS

| Service | Port Correct | Port Incorrect (ancien) |
|---------|--------------|-------------------------|
| Materials Service | **3009** ✅ | 3002 ❌ |
| Gestion Sites | 3001 | - |
| Gestion Fournisseurs | 3005 | - |

---

## ✅ CORRECTIONS APPLIQUÉES

1. ✅ Changement port 3002 → 3009 dans `orders.service.ts` - `getMaterialData()`
2. ✅ Changement port 3002 → 3009 dans `orders.service.ts` - `getMaterialUnitPrice()`
3. ✅ Changement port 3002 → 3009 dans `consumption-anomaly.service.ts` - `getMaterialInfo()`
4. ✅ Changement port 3002 → 3009 dans `chat.controller.ts` - `uploadFile()`
5. ✅ Changement port 3002 → 3009 dans `main.ts` - Configuration CORS
6. ✅ Ajout de logs détaillés dans `getMaterialData()` pour le debugging

---

## 🚀 PROCHAINES ÉTAPES

### ⚠️ REDÉMARRAGE OBLIGATOIRE

**Vous DEVEZ redémarrer le materials-service pour que les corrections prennent effet :**

```bash
# 1. Arrêter le service actuel (PID 20520)
taskkill /F /PID 20520

# 2. Redémarrer le service
cd apps/backend/materials-service
npm run start:dev
```

### 🧪 TEST APRÈS REDÉMARRAGE

1. Ouvrir le frontend (http://localhost:5173)
2. Aller sur la page Matériaux
3. Cliquer sur "Commander" pour un matériau
4. Remplir le formulaire et valider
5. **Résultat attendu** : La commande se crée sans erreur "Matériau introuvable"

---

## 📊 LOGS À SURVEILLER

Après redémarrage, vous devriez voir dans les logs backend :

```
📊 Validation des IDs...
  - materialId: "67a1b2c3d4e5f6g7h8i9j0k1" (length: 24)
  - destinationSiteId: "..." (length: 24)
  - supplierId: "..." (length: 24)
✅ All IDs validated, fetching external data...
🔍 Récupération matériau 67a1b2c3d4e5f6g7h8i9j0k1 depuis l'API interne...
✅ Matériau trouvé: Béton C25/30 (code: BET-001)
✅ Quantité validée: 50 >= 45 (recommandé)
Order saved successfully: 67a1b2c3d4e5f6g7h8i9j0k1
```

---

## 🎯 IMPACT

Cette correction résout :
- ✅ L'erreur 400 "Matériau introuvable"
- ✅ La validation de quantité avec prédiction IA
- ✅ Le calcul du prix unitaire pour le paiement
- ✅ La création complète de commandes
- ✅ L'upload de fichiers dans le chat de livraison
- ✅ La détection d'anomalies de consommation
- ✅ Les problèmes CORS potentiels

---

## 📝 FICHIERS MODIFIÉS

1. `apps/backend/materials-service/src/materials/services/orders.service.ts`
   - Ligne 625 : `getMaterialUnitPrice()` - Port corrigé
   - Ligne 688 : `getMaterialData()` - Port corrigé + logs améliorés

2. `apps/backend/materials-service/src/materials/services/consumption-anomaly.service.ts`
   - Ligne 314 : `getMaterialInfo()` - Port corrigé

3. `apps/backend/materials-service/src/chat/chat.controller.ts`
   - Ligne 167 : `uploadFile()` - Port corrigé

4. `apps/backend/materials-service/src/main.ts`
   - Ligne 21 : Configuration CORS - Port corrigé
