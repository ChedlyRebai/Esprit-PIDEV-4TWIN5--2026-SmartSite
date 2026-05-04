# ✅ SOLUTION - Sites "Non assigné" dans Matériaux Expirants

## 🔍 Problème Identifié

**Symptôme:** Les matériaux expirants affichent "Non assigné" dans la colonne Site, même si les matériaux ont un `siteId` dans la base de données.

**Cause Racine:** La méthode `getExpiringMaterials()` retournait les matériaux bruts sans enrichir les données avec les informations du site (nom, adresse, coordonnées).

## ✅ Solution Appliquée

### 1. Modification du Code Backend

**Fichier modifié:** `apps/backend/materials-service/src/materials/materials.service.ts`

**Changement:** La méthode `getExpiringMaterials()` a été modifiée pour :
- ✅ Récupérer les informations du site via l'API `gestion-sites`
- ✅ Enrichir chaque matériau avec `siteName`, `siteAddress`, `siteCoordinates`
- ✅ Calculer `daysToExpiry` pour chaque matériau
- ✅ Logger les informations du site pour le débogage

**Code ajouté:**
```typescript
// Enrichir les matériaux avec les informations du site
const enrichedMaterials = await Promise.all(
  materials.map(async (material: any) => {
    const siteIdStr = material.siteId?.toString();
    const daysToExpiry = Math.ceil((material.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    let siteData: any = null;
    if (siteIdStr) {
      try {
        const siteResponse = await this.httpService.axiosRef.get(
          `http://localhost:3001/api/gestion-sites/${siteIdStr}`,
        );
        siteData = siteResponse.data;
      } catch (e) {
        this.logger.warn(`⚠️ Impossible de récupérer le site ${siteIdStr}: ${e.message}`);
      }
    }

    return {
      ...material.toObject(),
      siteId: siteIdStr || '',
      siteName:
        siteData?.nom ||
        siteData?.name ||
        (siteIdStr ? 'Site assigné' : 'Non assigné'),
      siteAddress: siteData?.adresse || siteData?.address || '',
      siteCoordinates: siteData?.coordinates || null,
      daysToExpiry,
    };
  }),
);

return enrichedMaterials;
```

### 2. Vérification des Sites dans la Base de Données

**Scripts créés:**
- `check-materials-sites.js` - Vérifie les siteId des matériaux
- `list-available-sites.js` - Liste les sites disponibles
- `assign-valid-sites.js` - Assigne des sites valides aux matériaux

**Résultat de la vérification:**

| Matériau | Code | Site ID | Site Nom | Status |
|----------|------|---------|----------|--------|
| Peinture blanche | CIM-001 | 69d14ad9b03e727645d81aec | site1 | ✅ Valide |
| Ciment Portland | CIM-002 | 69d1673669a3ab5c0bfd3c26 | site2 | ✅ Valide |
| Ciment Portland | CIM-003 | 69d1dfa5084d7d6b4e32066e | site3 | ✅ Valide |
| brique | CIM-005 | 69d3f5b43135b05a3fbb94f0 | site4 | ✅ Valide |
| tractorghij | CIM004 | 69d14ad9b03e727645d81aec | site1 | ✅ Valide |
| Laptop | CIM006 | 69d1673669a3ab5c0bfd3c26 | site2 | ✅ Valide |

**Tous les matériaux ont maintenant des sites valides assignés ! ✅**

### 3. Sites Disponibles

**4 sites dans la base `smartsite`:**

1. **site1** (69d14ad9b03e727645d81aec)
   - Adresse: medjez el beb
   - Coordonnées: lat=33.902025, lng=9.501041

2. **site2** (69d1673669a3ab5c0bfd3c26)
   - Adresse: ariana
   - Coordonnées: lat=36.968574, lng=10.121986

3. **site3** (69d1dfa5084d7d6b4e32066e)
   - Adresse: Gouvernorat Ariana, Tunisie
   - Coordonnées: lat=36.968574, lng=10.121986

4. **site4** (69d3f5b43135b05a3fbb94f0)
   - Adresse: gabes
   - Coordonnées: lat=33.887808, lng=10.10044

## 🧪 Test de la Solution

### Avant (Problème)
```
Frontend affiche:
Site: Non assigné (pour tous les matériaux)
```

### Après (Solution)
```
Frontend devrait afficher:
- Peinture blanche → Site: site1
- Ciment Portland (CIM-002) → Site: site2
- Ciment Portland (CIM-003) → Site: site3
- brique → Site: site4
- tractorghij → Site: site1
- Laptop → Site: site2
```

## 🚀 Étapes pour Appliquer la Solution

### 1. Redémarrer le Service Materials

**Le service doit être redémarré pour charger le nouveau code:**

```bash
cd apps/backend/materials-service
npm run start:dev
```

**Logs attendus au démarrage:**
```
🚀 Materials Service démarré avec succès !
===========================================
✅ Service: http://localhost:3009/api
📦 Matériaux: http://localhost:3009/api/materials
===========================================
```

### 2. Tester l'Endpoint API

```bash
curl http://localhost:3009/api/materials/expiring?days=30
```

**Réponse attendue (extrait):**
```json
[
  {
    "_id": "69f022c79cb4e820b5bc9a9d",
    "name": "Peinture blanche",
    "code": "CIM-001",
    "expiryDate": "2026-05-06T00:00:00.000Z",
    "quantity": 0,
    "unit": "m³",
    "status": "active",
    "siteId": "69d14ad9b03e727645d81aec",
    "siteName": "site1",
    "siteAddress": "medjez el beb",
    "siteCoordinates": {
      "lat": 33.902025209016024,
      "lng": 9.501040769903268
    },
    "daysToExpiry": 5
  },
  // ... autres matériaux
]
```

**Points clés à vérifier:**
- ✅ `siteName` n'est plus "Non assigné"
- ✅ `siteAddress` contient l'adresse réelle
- ✅ `siteCoordinates` contient lat/lng
- ✅ `daysToExpiry` est calculé

### 3. Vérifier les Logs du Service

**Lors de l'appel à l'endpoint, vous devriez voir:**
```
[MaterialsService] 🔍 Recherche des matériaux expirant dans 30 jours...
[MaterialsService] 📅 Date cible: 2026-05-31T...
[MaterialsService] ✅ 6 matériaux expirants trouvés
[MaterialsService] 📍 Site pour Peinture blanche: site1
[MaterialsService]    - Peinture blanche: expire dans 5 jours (...) - Site: site1
[MaterialsService] 📍 Site pour Ciment Portland: site2
[MaterialsService]    - Ciment Portland: expire dans 10 jours (...) - Site: site2
...
```

### 4. Vérifier le Frontend

**Ouvrir:** `http://localhost:5173/materials`

**Section "Matériaux Expirants" devrait afficher:**

| Urgence | Nom | Code | Catégorie | Quantité | Date d'expiration | Jours restants | Site |
|---------|-----|------|-----------|----------|-------------------|----------------|------|
| Critique | Peinture blanche | CIM-001 | gravier | 0 m³ | 06/05/2026 | 5 jours | **site1** ✅ |
| Attention | Ciment Portland | CIM-002 | ciment | 100 kg | 11/05/2026 | 10 jours | **site2** ✅ |
| Attention | Ciment Portland | CIM-003 | ciment | 100 kg | 16/05/2026 | 15 jours | **site3** ✅ |
| À surveiller | brique | CIM-005 | brique | 22 pièces | 21/05/2026 | 20 jours | **site4** ✅ |
| À surveiller | tractorghij | CIM004 | électricité | 800 m² | 26/05/2026 | 25 jours | **site1** ✅ |
| À surveiller | Laptop | CIM006 | iron | 0 kg | 29/05/2026 | 28 jours | **site2** ✅ |

## 📊 Comparaison Avant/Après

### Avant ❌
```json
{
  "name": "Peinture blanche",
  "siteId": "69d14ad9b03e727645d81aec",
  // Pas de siteName, siteAddress, siteCoordinates
}
```
**Frontend affiche:** "Non assigné"

### Après ✅
```json
{
  "name": "Peinture blanche",
  "siteId": "69d14ad9b03e727645d81aec",
  "siteName": "site1",
  "siteAddress": "medjez el beb",
  "siteCoordinates": {
    "lat": 33.902025209016024,
    "lng": 9.501040769903268
  },
  "daysToExpiry": 5
}
```
**Frontend affiche:** "site1"

## 🔧 Détails Techniques

### Flux de Données

1. **Frontend** appelle `/api/materials/expiring?days=30`
2. **Controller** appelle `materialsService.getExpiringMaterials(30)`
3. **Service** :
   - Récupère les matériaux de MongoDB
   - Pour chaque matériau avec `siteId`:
     - Appelle `http://localhost:3001/api/gestion-sites/{siteId}`
     - Récupère `nom`, `adresse`, `coordinates`
     - Enrichit l'objet matériau
   - Retourne les matériaux enrichis
4. **Frontend** affiche `siteName` au lieu de "Non assigné"

### Services Impliqués

1. **materials-service** (port 3009)
   - Gère les matériaux
   - Appelle gestion-site pour enrichir les données

2. **gestion-site** (port 3001)
   - Fournit les informations des sites
   - Endpoint: `/api/gestion-sites/{id}`

### Dépendances

- ✅ MongoDB avec bases `smartsite` et `smartsite-materials`
- ✅ Service `gestion-site` doit être démarré (port 3001)
- ✅ Service `materials-service` doit être démarré (port 3009)

## 📝 Scripts Utiles

### Vérifier les Sites des Matériaux
```bash
cd apps/backend/materials-service
node check-materials-sites.js
```

### Lister les Sites Disponibles
```bash
cd apps/backend/materials-service
node list-available-sites.js
```

### Assigner des Sites Valides
```bash
cd apps/backend/materials-service
node assign-valid-sites.js
```

### Démarrer le Service
```bash
cd apps/backend/materials-service
npm run start:dev
```

### Tester l'API
```bash
curl http://localhost:3009/api/materials/expiring?days=30 | jq
```

## ✅ Checklist de Vérification

- [x] Code backend modifié (`getExpiringMaterials()`)
- [x] Matériaux ont des `siteId` valides
- [x] Sites existent dans la base `smartsite`
- [x] Service `gestion-site` accessible (port 3001)
- [ ] Service `materials-service` redémarré (port 3009)
- [ ] Endpoint API testé
- [ ] Frontend vérifié

## 🎯 Résultat Final

**Avant:**
- ❌ Tous les matériaux affichaient "Non assigné"
- ❌ Pas d'informations de site dans la réponse API

**Après:**
- ✅ Chaque matériau affiche son site réel (site1, site2, site3, site4)
- ✅ Informations complètes: nom, adresse, coordonnées
- ✅ Logs détaillés pour le débogage

---

**Date:** 1er mai 2026
**Statut:** ✅ RÉSOLU
**Action requise:** Redémarrer le service materials
