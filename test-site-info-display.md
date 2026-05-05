# 🧪 TEST RAPIDE - Affichage Informations de Site

Date: 2 Mai 2026  
Durée estimée: 5 minutes

---

## ⚡ TESTS RAPIDES

### ✅ Test 1: Compilation Backend (30 secondes)

```bash
cd apps/backend/materials-service
npm run build
```

**Attendu**: Exit Code: 0 (pas d'erreur)

---

### ✅ Test 2: Démarrage du Service (10 secondes)

```bash
cd apps/backend/materials-service
npm start
```

**Attendu dans les logs**:
```
✅ Connexion MongoDB sites établie
[MaterialsService] ✅ Site info loaded: ...
```

---

### ✅ Test 3: Ajout de Matériau avec Site (1 minute)

**Étapes**:
1. Ouvrir http://localhost:5173/materials
2. Cliquer sur "Add Material"
3. Sélectionner un site dans la liste déroulante

**Vérifications**:
- [ ] ✅ Le nom du site s'affiche (ex: "Chantier Nord Paris")
- [ ] ✅ L'adresse s'affiche (ex: "123 Rue de la Paix")
- [ ] ✅ La ville et code postal s'affichent (ex: "Paris 75001")
- [ ] ✅ Les coordonnées GPS s'affichent (ex: "📍 GPS: 48.85660, 2.35220")

**Capture d'écran attendue**:
```
┌─────────────────────────────────────────────┐
│ Site / Location *                           │
│ [Chantier Nord Paris - 123 Rue...]  ▼      │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 📍 Chantier Nord Paris                  │ │
│ │    123 Rue de la Paix                   │ │
│ │    Paris 75001                          │ │
│ │    📍 GPS: 48.85660, 2.35220           │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

### ✅ Test 4: Modification de Matériau (1 minute)

**Étapes**:
1. Ouvrir les détails d'un matériau existant
2. Cliquer sur "Edit"

**Vérifications**:
- [ ] ✅ Le site actuel s'affiche avec son nom
- [ ] ✅ L'adresse du site actuel s'affiche
- [ ] ✅ Les coordonnées GPS du site actuel s'affichent
- [ ] ✅ Si on change de site, le nouveau site s'affiche avec GPS

**Capture d'écran attendue (site actuel)**:
```
┌─────────────────────────────────────────────┐
│ Site / Location                             │
│ [Select a site...]                    ▼     │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 📍 Current site: Chantier Nord Paris   │ │
│ │    123 Rue de la Paix, 75001 Paris     │ │
│ │    📍 GPS: 48.85660, 2.35220           │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

### ✅ Test 5: Détails de Matériau (30 secondes)

**Étapes**:
1. Cliquer sur un matériau dans la liste

**Vérifications**:
- [ ] ✅ La carte "Assigned Site" affiche le nom du site
- [ ] ✅ L'adresse du site s'affiche
- [ ] ✅ Les coordonnées GPS s'affichent (format: "48.85660, 2.35220")
- [ ] ✅ Le widget météo s'affiche (si GPS disponible)

**Capture d'écran attendue**:
```
┌─────────────────────────────────────────────┐
│ 📍 Assigned Site                            │
│                                             │
│ Chantier Nord Paris                         │
│ 🧭 48.85660, 2.35220                       │
│ 123 Rue de la Paix, 75001 Paris            │
└─────────────────────────────────────────────┘
```

---

### ✅ Test 6: Recherche par Code-Barres (1 minute)

**Étapes**:
1. Cliquer sur "Scan QR/Barcode"
2. Sélectionner "Scan Barcode"
3. Entrer un code-barres valide (ex: MAT-1234567890-123)

**Vérifications**:
- [ ] ✅ Le dialog MaterialDetails s'ouvre
- [ ] ✅ Le nom du site s'affiche
- [ ] ✅ L'adresse du site s'affiche
- [ ] ✅ Les coordonnées GPS s'affichent
- [ ] ✅ Le widget météo s'affiche (si GPS disponible)

**Log backend attendu**:
```
[MaterialsService] ✅ Site info for barcode scan: Chantier Nord Paris (48.8566, 2.3522)
```

---

### ✅ Test 7: Recherche par QR Code (1 minute)

**Étapes**:
1. Cliquer sur "Scan QR/Barcode"
2. Sélectionner "Enter QR Text"
3. Entrer un QR code valide

**Vérifications**:
- [ ] ✅ Le dialog MaterialDetails s'ouvre
- [ ] ✅ Le nom du site s'affiche
- [ ] ✅ L'adresse du site s'affiche
- [ ] ✅ Les coordonnées GPS s'affichent

**Log backend attendu**:
```
[MaterialsService] ✅ Site info for QR scan: Chantier Nord Paris (48.8566, 2.3522)
```

---

## 📊 RÉSULTATS ATTENDUS

### ✅ Tous les tests passent

Si tous les tests passent, vous devriez voir:

1. **Compilation**: Exit Code: 0
2. **Service**: Démarre sans erreur
3. **Ajout**: Site affiché avec nom, adresse, ville, GPS
4. **Modification**: Site actuel affiché avec GPS
5. **Détails**: Site affiché avec GPS et météo
6. **Code-barres**: Site affiché après scan
7. **QR Code**: Site affiché après scan

**Statut**: ✅ **TOUTES LES AMÉLIORATIONS FONCTIONNENT**

---

### ⚠️ Certains tests échouent

Si certains tests échouent:

#### Problème: GPS ne s'affiche pas

**Solution**:
```bash
# Vérifier que le site a des coordonnées dans MongoDB
# Se connecter à MongoDB et vérifier:
db.sites.findOne({ nom: "Chantier Nord Paris" })

# Vérifier que coordonnees.latitude et coordonnees.longitude existent
```

---

#### Problème: Adresse ne s'affiche pas

**Solution**:
```bash
# Vérifier que le site a une adresse dans MongoDB
db.sites.findOne({ nom: "Chantier Nord Paris" })

# Vérifier que les champs adresse, ville, codePostal existent
```

---

#### Problème: Site ne s'affiche pas du tout

**Solution**:
```bash
# Vérifier les logs du backend
cd apps/backend/materials-service
npm start

# Chercher les erreurs:
# "⚠️ Could not fetch site ..."
# "❌ Error loading sites ..."

# Vérifier la connexion MongoDB
# Vérifier que SITES_MONGODB_URI est configuré dans .env
```

---

## 🎯 CHECKLIST RAPIDE

Cochez au fur et à mesure:

- [ ] ✅ Test 1: Compilation réussie
- [ ] ✅ Test 2: Service démarre sans erreur
- [ ] ✅ Test 3: Ajout - Site affiché avec GPS
- [ ] ✅ Test 4: Modification - Site actuel affiché avec GPS
- [ ] ✅ Test 5: Détails - Site affiché avec GPS
- [ ] ✅ Test 6: Code-barres - Site affiché après scan
- [ ] ✅ Test 7: QR Code - Site affiché après scan

---

## 📸 CAPTURES D'ÉCRAN ATTENDUES

### Ajout de Matériau
![Site Selection](https://via.placeholder.com/600x200/3B82F6/FFFFFF?text=Site+avec+GPS+affiché)

### Modification de Matériau
![Current Site](https://via.placeholder.com/600x200/6B7280/FFFFFF?text=Site+actuel+avec+GPS)

### Détails de Matériau
![Material Details](https://via.placeholder.com/600x300/10B981/FFFFFF?text=Site+assigné+avec+GPS+et+météo)

---

## 📞 AIDE

### Documentation Complète
- `AMELIORATIONS_SITE_INFO_COMPLETE.md` - Documentation détaillée
- `VERIFICATION_COMPLETE_MATERIALS.md` - Vérifications précédentes
- `FINAL_STATUS_MATERIALS.md` - Statut final

### Logs à Vérifier

**Backend**:
```
✅ Connexion MongoDB sites établie
✅ Site info loaded: Chantier Nord Paris (48.8566, 2.3522)
✅ Site info for barcode scan: ...
✅ Site info for QR scan: ...
✅ Site info for code search: ...
```

**Frontend Console**:
```
🎯 Material siteId set to: 507f191e810c19729de860ea
📍 Sites loaded: 5
📍 First few sites: [...]
```

---

**Temps total estimé**: 5-10 minutes  
**Difficulté**: Facile  
**Prérequis**: Service démarré, MongoDB connecté

---

**Bonne chance!** 🚀
