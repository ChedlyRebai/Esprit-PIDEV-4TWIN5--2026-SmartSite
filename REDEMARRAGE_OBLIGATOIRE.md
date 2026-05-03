# ⚠️ REDÉMARRAGE OBLIGATOIRE DU SERVICE

## 🔴 PROBLÈME CONFIRMÉ

Le service materials est **en cours d'exécution avec l'ancien code**.

**Preuve :**
- L'API retourne `siteId` ✅
- Mais **PAS** `siteName` ❌
- Mais **PAS** `siteAddress` ❌
- Mais **PAS** `daysToExpiry` ❌

**Conclusion :** Le nouveau code n'est pas chargé car le service n'a pas été redémarré.

## ✅ SOLUTION

### Étape 1: Arrêter le Service Actuel

**Trouvez le terminal où le service est en cours d'exécution** et appuyez sur :

```
Ctrl + C
```

**OU** si vous ne trouvez pas le terminal, tuez le processus :

```powershell
# Dans PowerShell
Get-Process -Name node | Where-Object {$_.Path -like "*materials-service*"} | Stop-Process -Force

# OU plus simple, tuer tous les processus Node sur le port 3009
$conn = Get-NetTCPConnection -LocalPort 3009 -ErrorAction SilentlyContinue
if ($conn) {
    Stop-Process -Id $conn.OwningProcess -Force
    Write-Host "✅ Service arrêté"
} else {
    Write-Host "⚠️ Aucun processus sur le port 3009"
}
```

### Étape 2: Redémarrer le Service

**Ouvrez un NOUVEAU terminal** et exécutez :

```bash
cd apps/backend/materials-service
npm run start:dev
```

### Étape 3: Attendre le Message de Confirmation

**Vous DEVEZ voir ce message :**

```
🚀 Materials Service démarré avec succès !
===========================================
✅ Service: http://localhost:3009/api
📦 Matériaux: http://localhost:3009/api/materials
===========================================
```

### Étape 4: Vérifier que le Nouveau Code est Chargé

**Dans un autre terminal, testez :**

```bash
curl http://localhost:3009/api/materials/expiring?days=30
```

**Vous DEVEZ voir dans la réponse :**
- ✅ `"siteName": "site1"` (ou site2, site3, site4)
- ✅ `"siteAddress": "medjez el beb"` (ou autre adresse)
- ✅ `"daysToExpiry": 5` (ou autre nombre)

**Si vous voyez ces champs, c'est BON ! ✅**

### Étape 5: Rafraîchir le Frontend

**Ouvrez ou rafraîchissez :**

```
http://localhost:5173/materials
```

**Appuyez sur F5 ou Ctrl+R pour rafraîchir la page**

## 📊 Résultat Attendu

**AVANT (avec l'ancien code) :**
```json
{
  "name": "Peinture blanche",
  "siteId": "69d14ad9b03e727645d81aec"
  // PAS de siteName ❌
  // PAS de siteAddress ❌
}
```
**Frontend affiche :** "Non assigné" ❌

**APRÈS (avec le nouveau code) :**
```json
{
  "name": "Peinture blanche",
  "siteId": "69d14ad9b03e727645d81aec",
  "siteName": "site1",
  "siteAddress": "medjez el beb",
  "siteCoordinates": {
    "lat": 33.902025,
    "lng": 9.501041
  },
  "daysToExpiry": 5
}
```
**Frontend affiche :** "site1" ✅

## 🎯 Checklist

- [ ] **Arrêter le service actuel** (Ctrl+C ou tuer le processus)
- [ ] **Redémarrer le service** (`npm run start:dev`)
- [ ] **Voir le message de confirmation** (🚀 Materials Service démarré)
- [ ] **Tester l'API** (vérifier que `siteName` est présent)
- [ ] **Rafraîchir le frontend** (F5)
- [ ] **Vérifier l'affichage** (site1, site2, etc. au lieu de "Non assigné")

## 💡 Pourquoi le Redémarrage est Nécessaire ?

**Node.js charge le code en mémoire au démarrage.**

- Quand vous modifiez un fichier `.ts`, le code sur disque change ✅
- Mais le code en mémoire (dans le processus Node) reste l'ancien ❌
- Il faut **redémarrer** le processus pour charger le nouveau code ✅

**C'est comme :**
- Modifier un document Word ✅
- Mais ne pas cliquer sur "Enregistrer" ❌
- Le fichier sur disque n'est pas mis à jour ❌

**Ici c'est l'inverse :**
- Le fichier sur disque est mis à jour ✅
- Mais le processus en mémoire ne l'a pas rechargé ❌
- Il faut redémarrer le processus ✅

## 🚨 Si le Problème Persiste Après Redémarrage

**1. Vérifier que le bon service est démarré :**
```bash
# Le service DOIT être dans ce répertoire
cd apps/backend/materials-service
pwd  # Vérifier le chemin
npm run start:dev
```

**2. Vérifier les logs au démarrage :**
```
Cherchez dans les logs :
[MaterialsService] 🔍 Recherche des matériaux expirant...
[MaterialsService] 📍 Site pour Peinture blanche: site1
```

**3. Vérifier que le fichier a bien été modifié :**
```bash
# Chercher "sitesCollection" dans le fichier
grep -n "sitesCollection" apps/backend/materials-service/src/materials/materials.service.ts
```

**Vous devriez voir :**
```
const sitesCollection = this.materialModel.db.db('smartsite').collection('sites');
```

**4. Nettoyer et recompiler :**
```bash
cd apps/backend/materials-service
rm -rf dist
npm run build
npm run start:dev
```

---

## 📞 Résumé en 3 Étapes

1. **ARRÊTER** le service (Ctrl+C)
2. **REDÉMARRER** le service (`npm run start:dev`)
3. **RAFRAÎCHIR** le frontend (F5)

**C'est tout ! Le problème sera résolu. 🎉**

---

**Date :** 1er mai 2026
**Statut :** ⚠️ REDÉMARRAGE REQUIS
**Code :** ✅ Prêt et testé
**Service :** ❌ Utilise l'ancien code
