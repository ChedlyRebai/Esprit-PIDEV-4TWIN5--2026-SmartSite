# TODO: English Translation

## 📝 Overview

The user requested that all text in the Materials Service be translated to English. This has **NOT** been done yet and needs to be completed.

---

## 🎯 Files Requiring Translation

### Backend - Materials Service

#### 1. Controllers
- `apps/backend/materials-service/src/materials/materials.controller.ts`
  - Log messages (console.log, this.logger.log)
  - Error messages
  - Success messages

#### 2. Services
- `apps/backend/materials-service/src/materials/services/stock-prediction.service.ts`
  - Log messages
  - Error messages
  - Prediction messages (message field)

- `apps/backend/materials-service/src/materials/services/ml-training.service.ts`
  - Log messages
  - Error messages
  - Training status messages

- `apps/backend/materials-service/src/materials/services/auto-ml-prediction.service.ts`
  - Log messages
  - Error messages

- `apps/backend/materials-service/src/materials/services/material-flow.service.ts`
  - Log messages
  - Anomaly messages
  - Error messages

- `apps/backend/materials-service/src/materials/services/daily-report.service.ts`
  - Email content
  - Report messages

#### 3. Controllers
- `apps/backend/materials-service/src/materials/controllers/material-flow.controller.ts`
  - Comments
  - Error messages

#### 4. Gateways
- `apps/backend/materials-service/src/chat/chat.gateway.ts`
  - Log messages
  - Chat messages
  - Error messages

---

### Frontend

#### 1. Pages
- `apps/frontend/src/app/pages/materials/Materials.tsx`
  - Button labels
  - Table headers
  - Status badges
  - Toast messages
  - Dialog titles
  - Placeholder text
  - Tooltip content

#### 2. Components
- `apps/frontend/src/app/components/materials/DailyReportButton.tsx`
  - Button text
  - Toast messages

- `apps/frontend/src/app/components/materials/TruckArrivalPaymentDialog.tsx`
  - Dialog title
  - Button labels
  - Messages

- `apps/frontend/src/app/components/materials/AnomalyAlert.tsx`
  - Alert messages
  - Button labels

#### 3. Services
- `apps/frontend/src/services/materialService.ts`
  - Error messages
  - Console logs

- `apps/frontend/src/services/materialFlowService.ts`
  - Error messages
  - Console logs

---

## 📋 Translation Examples

### Backend Examples

#### Before (French)
```typescript
this.logger.log('🚀 Démarrage entraînement automatique avec test.csv');
this.logger.log(`📊 ${materialIds.length} matériaux trouvés dans test.csv`);
this.logger.log(`✅ Modèle entraîné pour ${materialId}: ${result.modelPath}`);
this.logger.error(`❌ Erreur entraînement ${materialId}: ${error.message}`);
```

#### After (English)
```typescript
this.logger.log('🚀 Starting automatic training with test.csv');
this.logger.log(`📊 ${materialIds.length} materials found in test.csv`);
this.logger.log(`✅ Model trained for ${materialId}: ${result.modelPath}`);
this.logger.error(`❌ Training error ${materialId}: ${error.message}`);
```

### Frontend Examples

#### Before (French)
```typescript
toast.success('Matériau supprimé');
toast.error('Échec suppression');
<Badge variant="destructive">Rupture</Badge>
<Badge variant="secondary">Stock bas</Badge>
```

#### After (English)
```typescript
toast.success('Material deleted');
toast.error('Deletion failed');
<Badge variant="destructive">Out of stock</Badge>
<Badge variant="secondary">Low stock</Badge>
```

---

## 🔍 Search Patterns

Use these patterns to find French text:

### Backend
```bash
# Find French log messages
grep -r "logger.log.*'" apps/backend/materials-service/src/

# Find French error messages
grep -r "throw new.*Error.*'" apps/backend/materials-service/src/

# Find French toast messages
grep -r "message:.*'" apps/backend/materials-service/src/
```

### Frontend
```bash
# Find French toast messages
grep -r "toast\." apps/frontend/src/app/pages/materials/

# Find French button labels
grep -r "Button.*>" apps/frontend/src/app/pages/materials/

# Find French badge text
grep -r "Badge.*>" apps/frontend/src/app/pages/materials/
```

---

## 📊 Translation Checklist

### Backend - Materials Service
- [ ] materials.controller.ts - All log messages
- [ ] stock-prediction.service.ts - All log and prediction messages
- [ ] ml-training.service.ts - All log and error messages
- [ ] auto-ml-prediction.service.ts - All log messages
- [ ] material-flow.service.ts - All log and anomaly messages
- [ ] daily-report.service.ts - Email content and messages
- [ ] material-flow.controller.ts - Comments and errors
- [ ] chat.gateway.ts - All messages

### Frontend - Materials
- [ ] Materials.tsx - All UI text
- [ ] DailyReportButton.tsx - Button and messages
- [ ] TruckArrivalPaymentDialog.tsx - Dialog content
- [ ] AnomalyAlert.tsx - Alert messages
- [ ] materialService.ts - Error messages
- [ ] materialFlowService.ts - Error messages

---

## 🎯 Priority Order

1. **High Priority** (User-facing)
   - Frontend UI text (buttons, labels, badges)
   - Toast messages
   - Dialog content
   - Error messages shown to users

2. **Medium Priority** (Developer-facing)
   - Backend log messages
   - Console errors
   - API response messages

3. **Low Priority** (Internal)
   - Code comments
   - Internal variable names

---

## 🚀 How to Translate

### Option 1: Manual Translation
1. Open each file
2. Find French text
3. Replace with English equivalent
4. Test to ensure nothing breaks

### Option 2: Automated Search & Replace
```bash
# Example: Replace common phrases
find apps/backend/materials-service -type f -name "*.ts" -exec sed -i 's/Erreur/Error/g' {} +
find apps/backend/materials-service -type f -name "*.ts" -exec sed -i 's/Succès/Success/g' {} +
```

### Option 3: Use Translation Tool
1. Extract all French strings
2. Use translation service (Google Translate, DeepL)
3. Replace in files
4. Review and test

---

## ⚠️ Important Notes

1. **Don't translate**:
   - Variable names
   - Function names
   - File names
   - Database field names
   - API endpoint paths

2. **Do translate**:
   - User-facing messages
   - Log messages
   - Error messages
   - Toast notifications
   - Button labels
   - Dialog content

3. **Test after translation**:
   - All features still work
   - No broken UI
   - Messages make sense in context

---

## 📝 Translation Reference

### Common Phrases

| French | English |
|--------|---------|
| Matériau | Material |
| Stock | Stock |
| Rupture | Out of stock |
| Stock bas | Low stock |
| Prédiction | Prediction |
| Consommation | Consumption |
| Entrée | Entry / In |
| Sortie | Exit / Out |
| Fournisseur | Supplier |
| Site | Site |
| Erreur | Error |
| Succès | Success |
| Échec | Failure |
| Chargement | Loading |
| Enregistrement | Recording |
| Suppression | Deletion |
| Modification | Update |
| Création | Creation |
| Recherche | Search |
| Filtrer | Filter |
| Exporter | Export |
| Importer | Import |
| Télécharger | Download |
| Envoyer | Send |
| Annuler | Cancel |
| Confirmer | Confirm |
| Fermer | Close |
| Ouvrir | Open |

### Status Messages

| French | English |
|--------|---------|
| En cours | In progress |
| Terminé | Completed |
| En attente | Pending |
| Échoué | Failed |
| Réussi | Successful |

### Time Expressions

| French | English |
|--------|---------|
| Aujourd'hui | Today |
| Demain | Tomorrow |
| Hier | Yesterday |
| Lundi | Monday |
| Mardi | Tuesday |
| Mercredi | Wednesday |
| Jeudi | Thursday |
| Vendredi | Friday |
| Samedi | Saturday |
| Dimanche | Sunday |

---

## ✅ Completion Criteria

- [ ] All user-facing text in English
- [ ] All log messages in English
- [ ] All error messages in English
- [ ] All toast notifications in English
- [ ] All button labels in English
- [ ] All dialog content in English
- [ ] All API response messages in English
- [ ] Tests pass after translation
- [ ] UI looks correct with English text
- [ ] No French text visible to users

---

**Status**: ⏳ Not started
**Estimated Time**: 2-3 hours
**Priority**: Medium (user requested)
**Blocker**: No (system works with French text)
