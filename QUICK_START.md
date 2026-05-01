# ⚡ DÉMARRAGE RAPIDE - 3 ÉTAPES

## 🎯 Objectif

Démarrer le système de prédictions IA en 3 étapes simples.

## ✅ Pré-requis

- ✅ MongoDB démarré
- ✅ Node.js installé
- ✅ Dépendances installées (`npm install` dans chaque service)

## 🚀 3 Étapes

### 1️⃣ Démarrer Materials Service

**Ouvrir un terminal** et exécuter:

```bash
cd apps/backend/materials-service
npm start
```

**✅ Attendre de voir**:
```
[Nest] INFO Materials Service listening on port 3009
```

**❌ Si erreur de compilation**:
```bash
npm run build
npm start
```

---

### 2️⃣ Démarrer Frontend

**Ouvrir un NOUVEAU terminal** et exécuter:

```bash
cd apps/frontend
npm run dev
```

**✅ Attendre de voir**:
```
VITE v5.x.x  ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

### 3️⃣ Tester dans le Navigateur

1. Ouvrir: `http://localhost:5173`
2. Aller sur: **Materials**
3. Vérifier:
   - ✅ Les matériaux s'affichent
   - ✅ Les prédictions IA s'affichent
   - ✅ Format correct: `🚨 Aujourd'hui 14:30` ou `✅ Mercredi 16:00`

---

## 🔍 Vérification Rapide

### Test Backend

```bash
curl http://localhost:3009/api/materials
```

**✅ Devrait retourner**: JSON avec liste des matériaux

### Test Prédictions

```bash
curl http://localhost:3009/api/materials/predictions/all
```

**✅ Devrait retourner**: JSON avec prédictions

---

## 🚨 Dépannage Express

### Problème: "Port already in use"

**Solution**:
```bash
# Windows
netstat -ano | findstr :3009
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3009 | xargs kill -9
```

### Problème: "Cannot find module"

**Solution**:
```bash
cd apps/backend/materials-service
rm -rf node_modules
npm install
npm start
```

### Problème: "ECONNREFUSED"

**Solution**:
1. Vérifier que materials-service tourne sur port 3009
2. Redémarrer le frontend:
   ```bash
   cd apps/frontend
   # Ctrl+C pour arrêter
   npm run dev
   ```

### Problème: "Invalid Date" ou "NaN"

**Cause**: Pas de données dans MaterialFlowLog

**Solution**: Le système utilise un taux par défaut. Pour ajouter des données:
1. Aller sur page "Material Flow Log"
2. Ajouter des entrées/sorties manuellement

---

## 📊 Vérification Automatique

### Windows (PowerShell)

```powershell
.\check-system.ps1
```

### Linux/Mac (Bash)

```bash
bash check-system.sh
```

---

## 🎯 Résultat Attendu

### Dans le Tableau Materials

| Matériau | Stock | Prédiction IA |
|----------|-------|---------------|
| Ciment | 150 | 🚨 Aujourd'hui 14:30<br>Dans 8h |
| Sable | 500 | ⚠️ Demain 09:15<br>Dans 1j 5h |
| Gravier | 1000 | ✅ Mercredi 16:00<br>Dans 3j 12h |

### Au Survol (Tooltip)

```
Ciment Portland
─────────────────────────
Stock actuel: 150 unités
Consommation: 2.5 unités/h
Stock prédit (24h): 90 unités
─────────────────────────
Rupture prévue: Mercredi 29 avril 14:30
Temps restant: 0j 8h
─────────────────────────
📦 Commander: 300 unités
```

---

## ✅ Checklist Rapide

- [ ] Materials Service démarré (port 3009)
- [ ] Frontend démarré (port 5173)
- [ ] Page Materials accessible
- [ ] Matériaux affichés
- [ ] Prédictions affichées
- [ ] Format correct (pas de "Invalid Date")
- [ ] Tooltip fonctionne au survol
- [ ] Bouton "Commander" ouvre le dialog

---

## 📚 Documentation Complète

Pour plus de détails:

- **RESTART_GUIDE.md** - Guide détaillé de redémarrage
- **FINAL_SUMMARY.md** - Résumé complet des corrections
- **PROXY_FIX_COMPLETE.md** - Détails de la correction du proxy

---

## 🆘 Besoin d'Aide ?

Si un problème persiste:

1. Vérifier les logs du materials-service
2. Vérifier la console du navigateur (F12)
3. Exécuter le script de vérification (`check-system.ps1` ou `check-system.sh`)
4. Consulter `RESTART_GUIDE.md` pour le dépannage détaillé

---

**Date**: 29 avril 2026  
**Status**: ✅ PRÊT À DÉMARRER  
**Temps estimé**: 2-3 minutes
