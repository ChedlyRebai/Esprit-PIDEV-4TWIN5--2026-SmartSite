# 🎯 COMMENCEZ ICI !

## ✅ Problème Résolu

Le système de prédictions IA a été **entièrement corrigé** et est **prêt à démarrer**.

**Problème principal**: Erreur `ECONNREFUSED` - Le frontend ne pouvait pas communiquer avec le backend.

**Solution**: Proxy Vite corrigé pour pointer vers le bon port (3009).

---

## 🚀 DÉMARRAGE EN 3 ÉTAPES

### 1️⃣ Démarrer Materials Service

**Ouvrir un terminal** et exécuter:

```bash
cd apps/backend/materials-service
npm start
```

**✅ Attendre**: `Materials Service listening on port 3009`

---

### 2️⃣ Démarrer Frontend

**Ouvrir un NOUVEAU terminal** et exécuter:

```bash
cd apps/frontend
npm run dev
```

**✅ Attendre**: `Local: http://localhost:5173/`

---

### 3️⃣ Tester

1. Ouvrir: `http://localhost:5173`
2. Aller sur: **Materials**
3. Vérifier: Les prédictions s'affichent correctement

---

## 📚 Documentation Complète

| Document | Description | Temps |
|----------|-------------|-------|
| **[QUICK_START.md](QUICK_START.md)** ⭐ | Démarrage rapide | 3 min |
| **[RESTART_GUIDE.md](RESTART_GUIDE.md)** | Guide détaillé | 15 min |
| **[FINAL_SUMMARY.md](FINAL_SUMMARY.md)** | Résumé complet | 20 min |
| **[INDEX.md](INDEX.md)** | Navigation | 5 min |

---

## 🔍 Vérification Rapide

**Tester les endpoints**:

```bash
# Test Materials Service
curl http://localhost:3009/api/materials

# Test Prédictions
curl http://localhost:3009/api/materials/predictions/all
```

**Exécuter le script de vérification**:

```powershell
# Windows
.\check-system.ps1

# Linux/Mac
bash check-system.sh
```

---

## 🎯 Résultat Attendu

### Dans le Tableau Materials

```
┌─────────────┬────────┬──────────────────────────┐
│ Matériau    │ Stock  │ Prédiction IA            │
├─────────────┼────────┼──────────────────────────┤
│ Ciment      │ 150    │ 🚨 Aujourd'hui 14:30     │
│             │        │ Dans 8h                  │
├─────────────┼────────┼──────────────────────────┤
│ Sable       │ 500    │ ⚠️ Demain 09:15          │
│             │        │ Dans 1j 5h               │
├─────────────┼────────┼──────────────────────────┤
│ Gravier     │ 1000   │ ✅ Mercredi 16:00        │
│             │        │ Dans 3j 12h              │
└─────────────┴────────┴──────────────────────────┘
```

---

## 🚨 Dépannage Express

### Problème: "Port already in use"

```bash
# Windows
netstat -ano | findstr :3009
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3009 | xargs kill -9
```

### Problème: "ECONNREFUSED"

1. Vérifier que materials-service tourne sur port 3009
2. Redémarrer le frontend (Ctrl+C puis `npm run dev`)

### Problème: "Invalid Date" ou "NaN"

**Cause**: Pas de données dans MaterialFlowLog  
**Solution**: Le système utilise un taux par défaut

---

## ✅ Checklist

- [ ] Materials Service démarré (port 3009)
- [ ] Frontend démarré (port 5173)
- [ ] Page Materials accessible
- [ ] Prédictions affichées correctement
- [ ] Format correct (pas de "Invalid Date")

---

## 📞 Besoin d'Aide ?

1. **Démarrage rapide**: [QUICK_START.md](QUICK_START.md)
2. **Dépannage détaillé**: [RESTART_GUIDE.md](RESTART_GUIDE.md)
3. **Vérification auto**: `check-system.ps1` ou `check-system.sh`
4. **Documentation complète**: [INDEX.md](INDEX.md)

---

## 🎉 C'est Parti !

**Suivez les 3 étapes ci-dessus et vous êtes prêt !**

**Temps estimé**: 2-3 minutes

---

**Date**: 29 avril 2026  
**Status**: ✅ PRÊT À DÉMARRER
