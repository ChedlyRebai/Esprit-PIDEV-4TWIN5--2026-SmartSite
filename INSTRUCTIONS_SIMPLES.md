# 🎯 INSTRUCTIONS SIMPLES

## LE PROBLÈME

Vous voyez "Non assigné" partout ❌

## LA CAUSE

Le service utilise l'ancien code ❌

## LA SOLUTION

Redémarrer le service ✅

---

## 🚀 MÉTHODE 1: Script Automatique (RECOMMANDÉ)

### Ouvrez PowerShell et exécutez :

```powershell
.\REDEMARRER_SERVICE.ps1
```

**C'est tout ! Le script fait tout automatiquement. ✅**

---

## 🔧 MÉTHODE 2: Manuel

### Étape 1: Arrêter le Service

**Trouvez le terminal où le service tourne et appuyez sur :**

```
Ctrl + C
```

**OU exécutez dans PowerShell :**

```powershell
$conn = Get-NetTCPConnection -LocalPort 3009 -ErrorAction SilentlyContinue
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

### Étape 2: Redémarrer

**Dans un terminal :**

```bash
cd apps/backend/materials-service
npm run start:dev
```

### Étape 3: Attendre

**Vous DEVEZ voir :**

```
🚀 Materials Service démarré avec succès !
```

### Étape 4: Rafraîchir le Frontend

**Ouvrez :**

```
http://localhost:5173/materials
```

**Appuyez sur F5**

---

## ✅ RÉSULTAT

Au lieu de "Non assigné", vous verrez :

- ✅ site1
- ✅ site2
- ✅ site3
- ✅ site4

---

## 📞 AIDE

**Si ça ne marche toujours pas :**

1. Vérifiez que vous avez bien vu le message "🚀 Materials Service démarré"
2. Testez l'API : `curl http://localhost:3009/api/materials/expiring?days=30`
3. Cherchez `"siteName"` dans la réponse
4. Si `"siteName"` est présent → Rafraîchissez le frontend (F5)
5. Si `"siteName"` est absent → Le service n'a pas redémarré correctement

---

**C'EST TOUT ! 🎉**
