# 🚨 Amélioration de la Détection de Vol et Gaspillage

**Date:** 1er Mai 2026  
**Module:** Materials Service - Gestion des Flux  
**Objectif:** Détecter automatiquement les risques de vol et gaspillage en analysant les flux d'entrée/sortie

---

## 📋 Résumé des Modifications

### ✨ Nouvelle Fonctionnalité
Analyse avancée des flux de matériaux pour détecter les anomalies critiques basées sur le ratio entrée/sortie et identifier les risques de vol ou gaspillage par chantier et par matériau.

---

## 🔧 Modifications Backend

### 1. Service: `material-flow.service.ts`

#### Nouvelle Méthode: `analyzeFlowAnomalies()`

**Localisation:** `apps/backend/materials-service/src/materials/services/material-flow.service.ts`

**Fonctionnalités:**
- ✅ Analyse des flux sur une période configurable (7, 14, 30, 60, 90 jours)
- ✅ Calcul du ratio sortie/entrée pour chaque matériau
- ✅ Détection automatique des anomalies critiques
- ✅ Classification par niveau de risque (CRITICAL, HIGH, MEDIUM, LOW)
- ✅ Regroupement par site et par matériau
- ✅ Statistiques détaillées (entrées, sorties, flux net)

**Critères de Détection:**

```typescript
// CRITIQUE: Sorties > 200% des entrées
if (outInRatio > 2) {
  riskLevel = 'CRITICAL';
  message = '🚨 RISQUE CRITIQUE DE VOL/GASPILLAGE';
}

// ÉLEVÉ: Sorties > 150% des entrées
else if (outInRatio > 1.5) {
  riskLevel = 'HIGH';
  message = '⚠️ RISQUE ÉLEVÉ';
}

// MOYEN: Sorties excessives détectées
else {
  riskLevel = 'MEDIUM';
  message = '⚠️ Sorties excessives détectées';
}
```

**Retour de la Méthode:**

```typescript
{
  summary: {
    totalMaterials: number;
    materialsWithAnomalies: number;
    criticalAnomalies: number;
    warningAnomalies: number;
    totalExcessiveOut: number;
    totalExcessiveIn: number;
  };
  anomaliesBySite: Array<{
    siteId: string;
    siteName: string;
    totalAnomalies: number;
    criticalCount: number;
    warningCount: number;
    materials: Array<{
      materialId: string;
      materialName: string;
      materialCode: string;
      totalIn: number;
      totalOut: number;
      netFlow: number;
      anomalyType: AnomalyType;
      anomalyCount: number;
      riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      riskReason: string;
      lastAnomaly: Date;
    }>;
  }>;
}
```

### 2. Contrôleur: `material-flow.controller.ts`

**Nouveau Endpoint:**

```typescript
GET /api/material-flow/analyze-anomalies?siteId=...&days=30
```

**Paramètres:**
- `siteId` (optionnel): Filtrer par site spécifique
- `days` (optionnel, défaut: 30): Période d'analyse en jours

**Exemple de Requête:**

```bash
# Analyser tous les sites sur 30 jours
GET /api/material-flow/analyze-anomalies?days=30

# Analyser un site spécifique sur 60 jours
GET /api/material-flow/analyze-anomalies?siteId=507f1f77bcf86cd799439011&days=60
```

---

## 🎨 Modifications Frontend

### 1. Nouveau Composant: `FlowAnomalyAnalysis.tsx`

**Localisation:** `apps/frontend/src/app/pages/materials/FlowAnomalyAnalysis.tsx`

**Fonctionnalités:**

#### 📊 Cartes de Résumé
- **Anomalies Critiques:** Nombre d'anomalies avec risque de vol/gaspillage
- **Alertes:** Anomalies nécessitant attention
- **Matériaux Analysés:** Total avec nombre d'anomalies

#### 📈 Statistiques de Flux
- **Sorties Excessives:** Nombre de matériaux avec sorties anormales
- **Entrées Excessives:** Nombre de matériaux avec entrées anormales

#### 🗺️ Analyse par Site
Pour chaque site avec anomalies:
- Nom du site
- Nombre d'anomalies critiques et d'alertes
- Liste des matériaux avec anomalies

#### 📦 Détails par Matériau
Pour chaque matériau avec anomalie:
- **Badge de Risque:** CRITIQUE, ÉLEVÉ, MOYEN, FAIBLE
- **Message d'Alerte:** Description du risque détecté
- **Statistiques de Flux:**
  - Entrées totales
  - Sorties totales
  - Flux net (entrées - sorties)
- **Ratio Sortie/Entrée:** Visualisation en pourcentage avec barre de progression
- **Détails d'Anomalie:** Nombre et date de dernière anomalie

#### 🎨 Codes Couleur
- 🔴 **CRITIQUE:** Fond rouge, bordure rouge (ratio > 200%)
- 🟠 **ÉLEVÉ:** Fond orange, bordure orange (ratio > 150%)
- 🟡 **MOYEN:** Fond jaune, bordure jaune (sorties excessives)
- 🔵 **FAIBLE:** Fond bleu, bordure bleue (anomalies mineures)

### 2. Service: `materialFlowService.ts`

**Nouvelle Méthode:**

```typescript
async analyzeFlowAnomalies(siteId?: string, days: number = 30): Promise<any>
```

### 3. Nouvelle Route

**Route ajoutée:** `/materials/flow-anomaly-analysis`

**Navigation:**
```
Materials → Flow Anomaly Analysis
```

---

## 📊 Exemples d'Utilisation

### Scénario 1: Détection de Vol

**Situation:**
- Matériau: Ciment
- Entrées: 100 sacs
- Sorties: 250 sacs
- Ratio: 250%

**Résultat:**
```
🚨 RISQUE CRITIQUE DE VOL/GASPILLAGE
Sorties (250) sont 250% supérieures aux entrées (100)
5 anomalies détectées
```

**Action Recommandée:**
- Vérifier les bons de sortie
- Contrôler les stocks physiques
- Enquêter sur les mouvements suspects

### Scénario 2: Gaspillage Détecté

**Situation:**
- Matériau: Peinture
- Entrées: 50 litres
- Sorties: 85 litres
- Ratio: 170%

**Résultat:**
```
⚠️ RISQUE ÉLEVÉ
Sorties (85) dépassent les entrées (50) de 70%
3 anomalies détectées
```

**Action Recommandée:**
- Vérifier l'utilisation réelle
- Former les équipes sur l'utilisation optimale
- Contrôler les pertes

### Scénario 3: Flux Normal

**Situation:**
- Matériau: Briques
- Entrées: 1000 unités
- Sorties: 950 unités
- Ratio: 95%

**Résultat:**
```
✅ Aucune anomalie détectée
Flux normal
```

---

## 🔍 Analyse Détaillée

### Algorithme de Détection

```typescript
// 1. Récupérer tous les flux sur la période
const flows = await getFlowsForPeriod(days);

// 2. Agréger par site et matériau
const aggregated = groupBySiteAndMaterial(flows);

// 3. Calculer les totaux
for (const material of aggregated) {
  const totalIn = sumFlows(material, ['IN', 'RETURN']);
  const totalOut = sumFlows(material, ['OUT', 'DAMAGE']);
  const netFlow = totalIn - totalOut;
  
  // 4. Calculer le ratio
  const ratio = totalIn > 0 ? totalOut / totalIn : totalOut;
  
  // 5. Déterminer le niveau de risque
  if (ratio > 2.0) {
    riskLevel = 'CRITICAL';
  } else if (ratio > 1.5) {
    riskLevel = 'HIGH';
  } else if (ratio > 1.2) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }
}
```

### Intégration avec l'Historique

Tous les flux sont automatiquement enregistrés dans `ConsumptionHistory` avec:
- Type de flux (IN, OUT, etc.)
- Type d'anomalie détecté
- Sévérité de l'anomalie
- Stock avant/après
- Référence au flux source

---

## 🎯 Avantages

### Pour les Gestionnaires
- ✅ **Visibilité Complète:** Vue d'ensemble des anomalies par site
- ✅ **Priorisation:** Focus sur les anomalies critiques
- ✅ **Traçabilité:** Historique complet des flux
- ✅ **Alertes Automatiques:** Détection en temps réel

### Pour les Contrôleurs
- ✅ **Analyse Détaillée:** Ratio entrée/sortie par matériau
- ✅ **Identification Rapide:** Matériaux à risque mis en évidence
- ✅ **Données Chiffrées:** Statistiques précises pour enquête
- ✅ **Historique:** Suivi des anomalies dans le temps

### Pour la Direction
- ✅ **Réduction des Pertes:** Détection précoce du vol/gaspillage
- ✅ **Économies:** Optimisation de l'utilisation des matériaux
- ✅ **Conformité:** Traçabilité complète des mouvements
- ✅ **Reporting:** Statistiques et analyses détaillées

---

## 📱 Interface Utilisateur

### Page d'Analyse

```
┌─────────────────────────────────────────────────────────┐
│  Analyse des Anomalies de Flux                          │
│  Détection des risques de vol et gaspillage             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Période: 30 jours ▼]              [🔄 Actualiser]    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ 🚨 CRITIQUES │  │ ⚠️ ALERTES   │  │ 📦 MATÉRIAUX │ │
│  │      5       │  │      12      │  │      45      │ │
│  │ Vol/Gaspill. │  │ Attention    │  │ Analysés     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📍 Chantier Nord                                       │
│  🚨 2 critiques  ⚠️ 5 alertes                          │
│                                                          │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🚨 CRITIQUE - Ciment                             │  │
│  │                                                   │  │
│  │ 🚨 RISQUE CRITIQUE DE VOL/GASPILLAGE            │  │
│  │ Sorties (250) sont 250% supérieures aux         │  │
│  │ entrées (100). 5 anomalies détectées.           │  │
│  │                                                   │  │
│  │ ┌─────────┐  ┌─────────┐  ┌─────────┐          │  │
│  │ │ ⬇️ 100  │  │ ⬆️ 250  │  │ 📉 -150 │          │  │
│  │ │ Entrées │  │ Sorties │  │ Net     │          │  │
│  │ └─────────┘  └─────────┘  └─────────┘          │  │
│  │                                                   │  │
│  │ Ratio Sortie/Entrée: 250%                       │  │
│  │ ████████████████████████████████ 250%           │  │
│  │                                                   │  │
│  │ ℹ️ 5 anomalies • Dernière: 30/04/2026          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Tests

### Test 1: Détection de Vol Critique

```typescript
// Données de test
const flows = [
  { type: 'IN', quantity: 100, date: '2026-04-01' },
  { type: 'OUT', quantity: 250, date: '2026-04-15' },
];

// Résultat attendu
expect(analysis.summary.criticalAnomalies).toBe(1);
expect(material.riskLevel).toBe('CRITICAL');
expect(material.totalOut / material.totalIn).toBeGreaterThan(2);
```

### Test 2: Flux Normal

```typescript
// Données de test
const flows = [
  { type: 'IN', quantity: 100, date: '2026-04-01' },
  { type: 'OUT', quantity: 95, date: '2026-04-15' },
];

// Résultat attendu
expect(analysis.summary.criticalAnomalies).toBe(0);
expect(material.riskLevel).toBe('LOW');
```

### Test 3: Analyse Multi-Sites

```typescript
// Données de test
const sites = ['site1', 'site2', 'site3'];

// Résultat attendu
expect(analysis.anomaliesBySite.length).toBe(3);
expect(analysis.anomaliesBySite[0].materials.length).toBeGreaterThan(0);
```

---

## 📝 Configuration

### Variables d'Environnement

Aucune nouvelle variable requise. Utilise la configuration existante.

### Paramètres Ajustables

Dans `material-flow.service.ts`:

```typescript
// Seuil de déviation maximum (30% par défaut)
private readonly MAX_DEVIATION_PERCENT = 30;

// Consommation par défaut (10 unités/jour)
private readonly DEFAULT_CONSUMPTION_RATE = 10;
```

---

## 🚀 Déploiement

### Étapes

1. **Backend:**
   ```bash
   cd apps/backend/materials-service
   npm install
   npm run build
   npm run start
   ```

2. **Frontend:**
   ```bash
   cd apps/frontend
   npm install
   npm run build
   ```

3. **Vérification:**
   - Accéder à `/materials/flow-anomaly-analysis`
   - Vérifier l'affichage des anomalies
   - Tester les filtres de période

---

## 📚 Documentation API

### Endpoint: Analyser les Anomalies

**URL:** `GET /api/material-flow/analyze-anomalies`

**Paramètres de Requête:**
- `siteId` (string, optionnel): ID du site à analyser
- `days` (number, optionnel, défaut: 30): Période d'analyse en jours

**Réponse:**

```json
{
  "summary": {
    "totalMaterials": 45,
    "materialsWithAnomalies": 12,
    "criticalAnomalies": 5,
    "warningAnomalies": 7,
    "totalExcessiveOut": 5,
    "totalExcessiveIn": 2
  },
  "anomaliesBySite": [
    {
      "siteId": "507f1f77bcf86cd799439011",
      "siteName": "Chantier Nord",
      "totalAnomalies": 12,
      "criticalCount": 2,
      "warningCount": 5,
      "materials": [
        {
          "materialId": "507f1f77bcf86cd799439012",
          "materialName": "Ciment",
          "materialCode": "CIM-001",
          "totalIn": 100,
          "totalOut": 250,
          "netFlow": -150,
          "anomalyType": "EXCESSIVE_OUT",
          "anomalyCount": 5,
          "riskLevel": "CRITICAL",
          "riskReason": "🚨 RISQUE CRITIQUE DE VOL/GASPILLAGE: Sorties (250) sont 250% supérieures aux entrées (100). 5 anomalies détectées.",
          "lastAnomaly": "2026-04-30T10:30:00.000Z"
        }
      ]
    }
  ]
}
```

**Codes de Statut:**
- `200`: Succès
- `400`: Paramètres invalides
- `500`: Erreur serveur

---

## 🔐 Sécurité

### Contrôles d'Accès
- ✅ Authentification JWT requise
- ✅ Rôles: ADMIN, MANAGER, CONTROLLER
- ✅ Filtrage par site selon les permissions

### Audit
- ✅ Tous les accès sont loggés
- ✅ Traçabilité complète des consultations
- ✅ Historique des anomalies détectées

---

## 📈 Métriques

### KPIs Suivis
- Nombre d'anomalies critiques par mois
- Taux de détection de vol/gaspillage
- Temps moyen de résolution
- Économies réalisées

### Reporting
- Rapport hebdomadaire automatique
- Alertes en temps réel pour anomalies critiques
- Dashboard de suivi des tendances

---

## 🎓 Formation

### Pour les Utilisateurs
1. Accéder à la page d'analyse
2. Sélectionner la période d'analyse
3. Identifier les anomalies critiques (rouge)
4. Consulter les détails par matériau
5. Prendre les actions correctives

### Pour les Administrateurs
1. Configurer les seuils de détection
2. Paramétrer les alertes email
3. Gérer les permissions d'accès
4. Analyser les rapports

---

## 🐛 Dépannage

### Problème: Aucune anomalie détectée

**Solution:**
- Vérifier qu'il y a des flux enregistrés
- Augmenter la période d'analyse
- Vérifier les seuils de détection

### Problème: Trop d'anomalies

**Solution:**
- Ajuster `MAX_DEVIATION_PERCENT`
- Vérifier la qualité des données
- Filtrer par site spécifique

---

## 📞 Support

**Contact:** support@smartsite.com  
**Documentation:** https://docs.smartsite.com/flow-anomaly-detection  
**Issues:** https://github.com/smartsite/issues

---

## ✅ Checklist de Déploiement

- [ ] Backend déployé et testé
- [ ] Frontend déployé et testé
- [ ] Route ajoutée et accessible
- [ ] Tests unitaires passés
- [ ] Tests d'intégration passés
- [ ] Documentation mise à jour
- [ ] Formation des utilisateurs effectuée
- [ ] Monitoring activé
- [ ] Alertes configurées

---

**Version:** 1.0.0  
**Date de Création:** 1er Mai 2026  
**Dernière Mise à Jour:** 1er Mai 2026  
**Auteur:** Équipe SmartSite
