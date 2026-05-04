# 🚀 TESTER MAINTENANT

## ✅ TOUT EST PRÊT!

### Ce qui a été fait:
1. ✅ Sites ont GPS (33.8439, 9.4001)
2. ✅ 5 matériaux de test créés
3. ✅ Backend retourne GPS
4. ✅ Frontend affiche GPS partout
5. ✅ Supplier Rating ne s'affiche qu'une seule fois

---

## 🎯 TESTS À FAIRE

### 1. Ouvrir l'application
```
http://localhost:3000/materials
```

### 2. Vérifier GPS dans tableau
Vous devriez voir pour chaque matériau:
```
Site: site1
📍 GPS: 33.8439, 9.4001
```

### 3. Cliquer sur "Details"
Vous devriez voir:
```
🧭 GPS Coordinates:
📍 33.843900, 9.400100
```

### 4. Cliquer sur "Add" ou "Edit"
Sélectionner un site → GPS s'affiche:
```
📍 site1
   📍 GPS: 33.84390, 9.40010
```

### 5. Tester Supplier Rating
- Le dialog s'affiche (si 30% consommé)
- Fermer le dialog (X)
- Recharger la page
- ✅ Le dialog ne s'affiche **PAS** à nouveau

---

## 🐛 SI PROBLÈME

### GPS ne s'affiche pas
```bash
# Vérifier les matériaux
node check-sites-gps.cjs

# Si aucun matériau, créer
node creer-materiaux-test.cjs
```

### Supplier Rating s'affiche encore
```javascript
// Console navigateur (F12)
sessionStorage.clear()
localStorage.removeItem('ignoredSupplierRatings')
location.reload()
```

---

## 📋 MATÉRIAUX DE TEST CRÉÉS

1. **Ciment Portland** (CIM001) - 100 bags
2. **Fer à Béton 12mm** (FER012) - 500 kg
3. **Sable Fin** (SAB001) - 50 m³
4. **Gravier 15/25** (GRA001) - 30 m³
5. **Brique Rouge** (BRI001) - 1000 pieces

Tous avec GPS: **33.8439, 9.4001**

---

**Status**: ✅ Prêt à tester!  
**URL**: http://localhost:3000/materials  
**GPS**: 33.8439, 9.4001
