# 🧪 GUIDE DE TEST RAPIDE

## 🎯 3 MODIFICATIONS À TESTER

---

## 1️⃣ FILTRAGE DES MATÉRIAUX PAR SITE

### Comment tester:
1. Ouvrir l'interface frontend
2. Aller dans **"Site Consumption Tracking"**
3. Sélectionner un site dans le dropdown (ex: "sitedowntunisia")
4. Cliquer sur **"Add Material"**

### ✅ Résultat attendu:
- Seuls les matériaux assignés à ce site apparaissent dans la liste
- Si vous changez de site, la liste change

### ❌ Avant:
- Tous les matériaux étaient affichés, peu importe le site

---

## 2️⃣ AI REPORT SIMPLIFIÉ

### Comment tester:
1. Aller dans **"Site Consumption Tracking"**
2. Cliquer sur **"AI Report"**
3. Attendre la génération du rapport

### ✅ Résultat attendu:

**Si consommation normale:**
```
╔════════════════════════════════════════════════╗
║  ✅ ÉTAT NORMAL DE CONSOMMATION               ║
║                                                ║
║  La consommation est dans les limites normales ║
║  Déviation: +5.2%                              ║
╚════════════════════════════════════════════════╝
```

**Si consommation excessive:**
```
╔════════════════════════════════════════════════╗
║  🚨 RISQUE DE VOL OU GASPILLAGE               ║
║                                                ║
║  Consommation anormalement élevée détectée     ║
║  Déviation: +45.8%                             ║
╚════════════════════════════════════════════════╝
```

### ❌ Avant:
- Affichait "AI Recommendations (3)"
- Affichait toutes les alertes (INFO, WARNING, etc.)
- Interface complexe avec trop d'informations

### ✅ Maintenant:
- Affiche seulement: Normal ou Risque
- Pas de recommendations
- Seulement les alertes critiques

---

## 3️⃣ MATERIAL FLOW LOG - TEST MANUEL

### Comment tester:

#### Option A: Script Interactif (Recommandé)
```bash
node test-material-flow-manual.cjs
```

**Étapes**:
1. Choisir un matériau (ex: 1 pour Ciment Portland)
2. Choisir le type de mouvement:
   - 1 = IN (Entrée)
   - 2 = OUT (Sortie)
   - 3 = DAMAGE (Endommagé)
3. Entrer la quantité (ex: 50)
4. Entrer la raison (ex: "Utilisation chantier")

**Exemple**:
```
Choisir un matériau (1-10): 1
Choisir le type (1-6): 2
Entrer la quantité: 80
Entrer la raison: Test sortie excessive

✅ Flow log créé
🚨 ANOMALIE: EXCESSIVE_OUT
   Sortie excessive détectée! Quantité: 80 unités
   Normale: 20 unités/jour
   Déviation: 300%
   RISQUE DE VOL OU GASPILLAGE!
```

#### Option B: Script Automatique
```bash
node test-flow-log-system.cjs
```
- Crée automatiquement 6 flow logs avec 1 anomalie

### ✅ Vérifier dans l'interface:

1. **Ouvrir MaterialDetails** pour le matériau testé
2. **Vérifier "Movement Summary"**:
   ```
   Total Entries: 150
   Total Exits: 120
   Net Balance: +30
   Anomalies: 1
   ```

3. **Vérifier "Recent Movements"**:
   - Les flow logs apparaissent avec détails
   - Les anomalies ont un badge rouge "⚠️ Anomaly"
   - Le message d'anomalie est affiché

---

## 📊 VÉRIFICATION COMPLÈTE

### Checklist:

#### SiteConsumptionTracker
- [ ] Sélectionner un site
- [ ] Cliquer "Add Material"
- [ ] Vérifier que seuls les matériaux du site apparaissent
- [ ] Changer de site
- [ ] Vérifier que la liste change

#### AI Report
- [ ] Cliquer "AI Report"
- [ ] Vérifier l'affichage: Normal ou Risque
- [ ] Vérifier qu'il n'y a pas de "AI Recommendations"
- [ ] Vérifier que seules les alertes critiques sont affichées

#### Flow Logs
- [ ] Exécuter `node test-material-flow-manual.cjs`
- [ ] Créer un mouvement OUT avec quantité élevée (ex: 80)
- [ ] Vérifier que l'anomalie est détectée
- [ ] Ouvrir MaterialDetails dans l'interface
- [ ] Vérifier que le flow log apparaît
- [ ] Vérifier que l'anomalie est visible (badge rouge)

---

## 🎯 TESTS RAPIDES (5 MINUTES)

### Test 1: Filtrage (1 min)
```
1. Ouvrir Site Consumption Tracking
2. Sélectionner "sitedowntunisia"
3. Cliquer "Add Material"
4. ✅ Vérifier: Seuls les matériaux de ce site
```

### Test 2: AI Report (2 min)
```
1. Cliquer "AI Report"
2. Attendre génération
3. ✅ Vérifier: "État Normal" ou "Risque"
4. ✅ Vérifier: Pas de "AI Recommendations"
```

### Test 3: Flow Log (2 min)
```
1. Exécuter: node test-material-flow-manual.cjs
2. Choisir matériau: 1
3. Choisir type: 2 (OUT)
4. Quantité: 80
5. ✅ Vérifier: Anomalie détectée
```

---

## 🐛 PROBLÈMES POSSIBLES

### Problème 1: Pas de matériaux dans la liste
**Cause**: Aucun matériau assigné au site sélectionné
**Solution**: Assigner des matériaux au site d'abord

### Problème 2: AI Report ne génère pas
**Cause**: Pas de données de consommation
**Solution**: Créer des flow logs d'abord avec le script

### Problème 3: Flow logs n'apparaissent pas
**Cause**: MongoDB non connecté ou collection vide
**Solution**: Vérifier la connexion MongoDB et exécuter le script de test

---

## 📁 SCRIPTS DISPONIBLES

### Tests Automatiques
```bash
# Test complet du système
node test-complete-system.cjs

# Créer des flow logs automatiquement
node test-flow-log-system.cjs

# Vérifier les flow logs
node verify-flow-logs.cjs

# Tester la mise à jour des matériaux
node test-material-update.cjs
```

### Test Manuel (Nouveau)
```bash
# Interface interactive pour créer des flow logs
node test-material-flow-manual.cjs
```

---

## 🎉 RÉSULTAT FINAL

Si tous les tests passent:

```
╔════════════════════════════════════════════════╗
║                                                ║
║     ✅ TOUS LES TESTS RÉUSSIS ✅              ║
║                                                ║
║  1. Filtrage par site: WORKING                ║
║  2. AI Report simplifié: WORKING              ║
║  3. Flow logs: WORKING                        ║
║                                                ║
║  🚀 SYSTÈME PRÊT POUR PRODUCTION              ║
║                                                ║
╚════════════════════════════════════════════════╝
```

---

**Date**: 3 Mai 2026
**Version**: 1.1.0
**Temps estimé**: 5-10 minutes
