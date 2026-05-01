# 🧪 Guide de Tests Complet - Material Service
## Tests de Validation des 7 Bugs Corrigés

**Date**: 29 Avril 2026  
**Version**: 2.0.0

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration de l'Environnement](#configuration-de-lenvironnement)
3. [Tests Bug #1: Prédiction IA](#tests-bug-1-prédiction-ia)
4. [Tests Bug #2: Flow Log](#tests-bug-2-flow-log)
5. [Tests Bug #3: Détection Émotion](#tests-bug-3-détection-émotion)
6. [Tests Bug #4: Rapport Quotidien](#tests-bug-4-rapport-quotidien)
7. [Tests Bug #5: Rapport Analyse IA](#tests-bug-5-rapport-analyse-ia)
8. [Tests Bug #6: Dialog Paiement](#tests-bug-6-dialog-paiement)
9. [Tests Bug #7: Dialog Notation](#tests-bug-7-dialog-notation)
10. [Tests d'Intégration](#tests-dintégration)

---

## Prérequis

### Services Requis
```bash
# Vérifier que tous les services sont démarrés
✅ MongoDB (port 27017)
✅ Material Service Backend (port 3005)
✅ Frontend (port 5173)
✅ Payment Service (port 3008) - optionnel
```

### Outils de Test
```bash
# Installer les outils
npm install -g newman  # Pour tests API
npm install -g artillery  # Pour tests de charge
```

### Données de Test
```bash
# Créer des données de test
curl -X POST http://localhost:3005/api/materials/seed-test-data
```

---

## Configuration de l'Environnement

### 1. Variables d'Environnement
```bash
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/materials-db
PORT=3005
NODE_ENV=development
AI_SERVICE_URL=http://localhost:3010
PAYMENT_API_URL=http://localhost:3008/api/payments
```

### 2. Démarrage des Services
```bash
# Terminal 1: Backend
cd apps/backend/materials-service
npm run start:dev

# Terminal 2: Frontend
cd apps/frontend
npm run dev

# Terminal 3: MongoDB
mongod --dbpath ./data/db
```

---

## Tests Bug #1: Prédiction IA

### Test 1.1: Endpoint Backend
```bash
# Test: Récupérer toutes les prédictions
curl -X GET http://localhost:3005/api/materials/predictions

# Résultat attendu:
# Status: 200 OK
# Body: Array de prédictions avec:
# - materialId
# - materialName
# - currentStock
# - averageDailyConsumption
# - predictedOutOfStockDate
# - hoursToOutOfStock
# - status (OK, WARNING, CRITICAL)
```

### Test 1.2: Affichage Frontend
```
1. Ouvrir http://localhost:5173/materials
2. Cliquer sur l'onglet "Prédictions IA"
3. Vérifier:
   ✅ Liste des matériaux affichée
   ✅ Colonnes: Matériau, Stock Actuel, Consommation Moyenne, Date Rupture, Heures Restantes, Statut
   ✅ Badge "RUPTURE IMMINENTE" clignotant pour hoursToOutOfStock < 24
   ✅ Couleurs appropriées (vert=OK, orange=WARNING, rouge=CRITICAL)
```

### Test 1.3: Badge Rupture Imminente
```
1. Créer un matériau avec stock faible:
   curl -X POST http://localhost:3005/api/materials \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Rupture",
       "code": "TEST-001",
       "stockExistant": 10,
       "stockMin": 50,
       "stockMax": 200
     }'

2. Créer des mouvements de sortie pour simuler consommation rapide
3. Actualiser la page des prédictions
4. Vérifier:
   ✅ Badge "RUPTURE IMMINENTE" visible et clignotant
   ✅ Couleur rouge
   ✅ Animation pulse
```

**Résultat Attendu**: ✅ PASS

---

## Tests Bug #2: Flow Log

### Test 2.1: Endpoint Backend
```bash
# Test: Récupérer tous les mouvements
curl -X GET http://localhost:3005/api/material-flow

# Résultat attendu:
# Status: 200 OK
# Body: Array de mouvements avec:
# - materialId
# - materialName
# - type (ENTREE, SORTIE, AJUSTEMENT)
# - quantity
# - date
# - reason
```

### Test 2.2: Filtres de Date
```bash
# Test: Filtrer par date
curl -X GET "http://localhost:3005/api/material-flow?startDate=2026-04-01&endDate=2026-04-29"

# Résultat attendu:
# Status: 200 OK
# Body: Mouvements filtrés entre les dates spécifiées
```

### Test 2.3: Affichage Frontend
```
1. Ouvrir http://localhost:5173/materials
2. Cliquer sur l'onglet "Historique des Mouvements"
3. Vérifier:
   ✅ Liste des mouvements affichée
   ✅ Sélecteurs de date (Date début, Date fin)
   ✅ Bouton "Réinitialiser"
   ✅ Colonnes: Date, Matériau, Type, Quantité, Raison
   ✅ Couleurs: vert=ENTREE, rouge=SORTIE, bleu=AJUSTEMENT
```

### Test 2.4: Filtrage Interactif
```
1. Sélectionner une date de début (ex: 01/04/2026)
2. Sélectionner une date de fin (ex: 15/04/2026)
3. Vérifier:
   ✅ Liste filtrée automatiquement
   ✅ Seuls les mouvements dans la période affichés
4. Cliquer sur "Réinitialiser"
5. Vérifier:
   ✅ Filtres effacés
   ✅ Tous les mouvements affichés
```

**Résultat Attendu**: ✅ PASS

---

## Tests Bug #3: Détection Émotion

### Test 3.1: Backend AI Analyzer
```bash
# Test: Analyser un message positif
curl -X POST http://localhost:3005/api/chat/analyze-message \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Merci beaucoup! Tout va bien 😊",
    "senderRole": "site"
  }'

# Résultat attendu:
# {
#   "emotion": "CALME",
#   "sentiment": "POSITIF",
#   "confidence": 0.95,
#   "allow_send": true,
#   "status": "OK"
# }

# Test: Analyser un message négatif
curl -X POST http://localhost:3005/api/chat/analyze-message \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Je suis très en colère! 😡 C\'est inacceptable!",
    "senderRole": "supplier"
  }'

# Résultat attendu:
# {
#   "emotion": "CONFLIT",
#   "sentiment": "NEGATIF",
#   "confidence": 0.92,
#   "allow_send": false,
#   "status": "BLOCKED"
# }
```

### Test 3.2: Indicateur Visuel Frontend
```
1. Ouvrir http://localhost:5173/materials/chat
2. Rejoindre une conversation
3. Vérifier l'indicateur initial:
   ✅ Badge 🟢 "Calme" visible
   ✅ Couleur verte
   ✅ Pas d'animation

4. Envoyer un message positif: "Merci! 😊"
5. Vérifier:
   ✅ Badge reste 🟢 "Calme"

6. Envoyer un message négatif: "Je suis furieux! 😡"
7. Vérifier:
   ✅ Badge change en 🔴 "Conflit"
   ✅ Couleur rouge
   ✅ Animation pulse (clignotant)
```

### Test 3.3: Événements WebSocket
```javascript
// Dans la console du navigateur
chatSocket.on('messageAnalysis', (data) => {
  console.log('Analyse:', data.analysis);
  // Vérifier: emotion, sentiment, confidence, status
});

chatSocket.on('roomEmotionUpdate', (data) => {
  console.log('Émotion room:', data.emotion);
  // Vérifier: CALME ou CONFLIT
});
```

**Résultat Attendu**: ✅ PASS

---

## Tests Bug #4: Rapport Quotidien

### Test 4.1: Endpoint Backend
```bash
# Test: Générer et envoyer rapport
curl -X POST http://localhost:3005/api/materials/reports/daily/send \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'

# Résultat attendu:
# Status: 200 OK
# {
#   "success": true,
#   "message": "Rapport quotidien envoyé à test@example.com",
#   "reportDate": "2026-04-29"
# }
```

### Test 4.2: Bouton Frontend
```
1. Ouvrir http://localhost:5173/materials
2. Vérifier:
   ✅ Bouton "📊 Rapport Quotidien" visible dans la toolbar
3. Cliquer sur le bouton
4. Vérifier:
   ✅ Dialog s'ouvre
   ✅ Titre: "Générer Rapport Quotidien IA"
   ✅ Champ email visible
5. Entrer un email: test@example.com
6. Cliquer sur "Envoyer le Rapport"
7. Vérifier:
   ✅ Indicateur de chargement
   ✅ Message de succès: "Rapport envoyé avec succès!"
   ✅ Dialog se ferme
```

### Test 4.3: Validation Email
```
1. Ouvrir le dialog de rapport
2. Entrer un email invalide: "test"
3. Cliquer sur "Envoyer"
4. Vérifier:
   ✅ Message d'erreur: "Email invalide"
5. Entrer un email valide: test@example.com
6. Vérifier:
   ✅ Envoi réussi
```

**Résultat Attendu**: ✅ PASS

---

## Tests Bug #5: Rapport Analyse IA

### Test 5.1: Synchronisation des Données
```bash
# Test: Synchroniser ConsumptionHistory depuis MaterialFlowLog
curl -X POST http://localhost:3005/api/consumption-history/sync

# Résultat attendu:
# Status: 200 OK
# {
#   "success": true,
#   "recordsCreated": 150,
#   "message": "Synchronisation terminée"
# }
```

### Test 5.2: Génération Rapport
```bash
# Test: Générer rapport d'analyse
curl -X POST http://localhost:3005/api/materials/consumption-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "MATERIAL_ID",
    "startDate": "2026-04-01",
    "endDate": "2026-04-29"
  }'

# Résultat attendu:
# Status: 200 OK
# {
#   "materialName": "Ciment",
#   "period": { "start": "2026-04-01", "end": "2026-04-29" },
#   "totalConsumption": 500,
#   "averageDailyConsumption": 17.86,
#   "peakConsumptionDay": "2026-04-15",
#   "trends": [...],
#   "recommendations": [...]
# }
```

### Test 5.3: Dialog Frontend
```
1. Ouvrir http://localhost:5173/materials
2. Sélectionner un matériau
3. Cliquer sur "📊 Rapport IA"
4. Vérifier:
   ✅ Dialog s'ouvre
   ✅ Sélecteurs de date visibles
   ✅ Bouton "Générer le Rapport"

5. Si erreur "Aucune donnée":
   ✅ Message d'erreur clair
   ✅ Section d'aide visible avec prérequis
   ✅ Bouton "Synchroniser les données" visible

6. Cliquer sur "Synchroniser les données"
7. Vérifier:
   ✅ Indicateur de chargement
   ✅ Message de succès
   ✅ Bouton "Réessayer" visible

8. Cliquer sur "Réessayer"
9. Vérifier:
   ✅ Rapport généré avec succès
   ✅ Graphiques affichés
   ✅ Recommandations visibles
```

**Résultat Attendu**: ✅ PASS

---

## Tests Bug #6: Dialog Paiement

### Test 6.1: Événement WebSocket
```javascript
// Dans la console du navigateur (côté fournisseur)
chatSocket.emit('truckArrived', {
  orderId: 'ORDER_ID',
  materialName: 'Ciment',
  supplierName: 'Fournisseur A',
  amount: 5000,
  siteId: 'SITE_ID'
});

// Vérifier dans la console (côté chantier):
// - Événement 'openPaymentDialog' reçu
// - Dialog s'ouvre automatiquement
```

### Test 6.2: Endpoint Création Paiement
```bash
# Test: Créer un paiement en espèces
curl -X POST http://localhost:3005/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "SITE_ID",
    "amount": 5000,
    "paymentMethod": "cash",
    "description": "Paiement livraison ciment"
  }'

# Résultat attendu:
# {
#   "success": true,
#   "paymentId": "PAYMENT_ID",
#   "status": "completed",
#   "amount": 5000,
#   "paymentMethod": "cash",
#   "message": "Paiement en espèces enregistré avec succès"
# }

# Test: Créer un paiement par carte
curl -X POST http://localhost:3005/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "SITE_ID",
    "amount": 5000,
    "paymentMethod": "card",
    "description": "Paiement livraison ciment"
  }'

# Résultat attendu:
# {
#   "success": true,
#   "paymentId": "PAYMENT_ID",
#   "status": "pending",
#   "amount": 5000,
#   "paymentMethod": "card",
#   "clientSecret": "pi_xxx_secret_xxx",
#   "message": "Paiement par carte initié..."
# }
```

### Test 6.3: Dialog Frontend
```
1. Ouvrir http://localhost:5173/materials/chat (en tant que works_manager)
2. Simuler arrivée camion (via console ou backend)
3. Vérifier:
   ✅ Dialog s'ouvre automatiquement
   ✅ Titre: "🚚 Camion Arrivé - Paiement Requis"
   ✅ Montant affiché correctement
   ✅ Détails commande visibles

4. Sélectionner "Espèces"
5. Vérifier:
   ✅ Radio button sélectionné
   ✅ Icône 💵 visible
6. Cliquer sur "Confirmer le paiement"
7. Vérifier:
   ✅ Indicateur de chargement
   ✅ Message de succès
   ✅ Vue change pour upload facture

8. Retour et sélectionner "Carte bancaire"
9. Vérifier:
   ✅ Radio button sélectionné
   ✅ Icône 💳 visible
10. Cliquer sur "Confirmer le paiement"
11. Vérifier:
    ✅ Message: "Paiement par carte initié..."
```

### Test 6.4: Upload Facture
```
1. Après paiement réussi
2. Vérifier:
   ✅ Zone d'upload visible
   ✅ Texte: "Télécharger la facture (optionnel)"
3. Cliquer sur zone d'upload
4. Sélectionner un fichier PDF
5. Vérifier:
   ✅ Indicateur de chargement
   ✅ Nom du fichier affiché
   ✅ Icône ✅ verte
   ✅ Message de succès

6. Essayer un fichier trop gros (>5MB)
7. Vérifier:
   ✅ Message d'erreur: "Fichier trop volumineux"

8. Essayer un format non supporté (.txt)
9. Vérifier:
   ✅ Message d'erreur: "Format non supporté"
```

**Résultat Attendu**: ✅ PASS

---

## Tests Bug #7: Dialog Notation

### Test 7.1: Endpoint Should Show
```bash
# Test: Vérifier si dialog doit être affiché
curl "http://localhost:3005/api/supplier-ratings/should-show/MATERIAL_ID?userId=USER_ID"

# Résultat attendu (consommation > 30%, pas encore noté):
# {
#   "shouldShow": true,
#   "consumptionPercentage": 45,
#   "material": { ... }
# }

# Résultat attendu (déjà noté):
# {
#   "shouldShow": false,
#   "consumptionPercentage": 45,
#   "reason": "Déjà noté par cet utilisateur"
# }

# Résultat attendu (consommation < 30%):
# {
#   "shouldShow": false,
#   "consumptionPercentage": 25,
#   "reason": "Consommation insuffisante (< 30%)"
# }
```

### Test 7.2: Endpoint Mark Shown
```bash
# Test: Marquer dialog comme affiché
curl -X POST http://localhost:3005/api/supplier-ratings/mark-shown \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "MATERIAL_ID",
    "userId": "USER_ID"
  }'

# Résultat attendu:
# {
#   "success": true
# }

# Vérifier que dialog ne s'affiche plus dans les 24h
curl "http://localhost:3005/api/supplier-ratings/should-show/MATERIAL_ID?userId=USER_ID"

# Résultat attendu:
# {
#   "shouldShow": false,
#   "consumptionPercentage": 45,
#   "reason": "Dialog déjà affiché dans les 24h"
# }
```

### Test 7.3: Hook Frontend
```
1. Ouvrir http://localhost:5173/materials
2. Créer un matériau avec consommation > 30%
3. Actualiser la page
4. Vérifier:
   ✅ Dialog de notation s'affiche automatiquement
   ✅ Pourcentage de consommation affiché
   ✅ Nom du matériau correct
   ✅ Formulaire de notation visible

5. Fermer le dialog sans noter
6. Actualiser la page
7. Vérifier:
   ✅ Dialog ne s'affiche PAS (marqué comme affiché)

8. Attendre 24h (ou modifier la date en base)
9. Actualiser la page
10. Vérifier:
    ✅ Dialog s'affiche à nouveau

11. Soumettre une notation
12. Actualiser la page
13. Vérifier:
    ✅ Dialog ne s'affiche PLUS (déjà noté)
```

### Test 7.4: Logique de Décision
```
Scénario 1: Consommation 25%
✅ Dialog ne s'affiche pas
✅ Raison: "Consommation insuffisante"

Scénario 2: Consommation 45%, première fois
✅ Dialog s'affiche
✅ Marqué comme affiché automatiquement

Scénario 3: Consommation 45%, dialog affiché il y a 12h
✅ Dialog ne s'affiche pas
✅ Raison: "Dialog déjà affiché dans les 24h"

Scénario 4: Consommation 45%, déjà noté
✅ Dialog ne s'affiche pas
✅ Raison: "Déjà noté par cet utilisateur"

Scénario 5: Consommation 45%, dialog affiché il y a 25h
✅ Dialog s'affiche à nouveau
```

**Résultat Attendu**: ✅ PASS

---

## Tests d'Intégration

### Test I1: Flux Complet Livraison avec Paiement
```
1. Créer une commande
2. Mettre en statut "in_transit"
3. Ouvrir le chat de livraison
4. Simuler arrivée camion (événement WebSocket)
5. Vérifier:
   ✅ Message système dans le chat
   ✅ Dialog de paiement s'ouvre
6. Effectuer le paiement
7. Vérifier:
   ✅ Paiement enregistré en base
   ✅ Option upload facture disponible
8. Upload facture
9. Vérifier:
   ✅ Facture sauvegardée
   ✅ Livraison peut être finalisée
```

### Test I2: Flux Complet Notation Fournisseur
```
1. Créer un matériau
2. Créer des mouvements de sortie (consommation > 30%)
3. Actualiser la page matériaux
4. Vérifier:
   ✅ Dialog de notation s'affiche
5. Soumettre une notation positive
6. Vérifier:
   ✅ Notation enregistrée en base
   ✅ Dialog ne s'affiche plus
7. Consulter les statistiques fournisseur
8. Vérifier:
   ✅ Notation visible dans les stats
```

### Test I3: Flux Complet Rapport IA
```
1. Créer des mouvements de stock sur 7 jours
2. Synchroniser les données de consommation
3. Générer un rapport d'analyse IA
4. Vérifier:
   ✅ Rapport généré avec données réelles
   ✅ Graphiques affichés
   ✅ Recommandations pertinentes
5. Générer un rapport quotidien
6. Vérifier:
   ✅ Email envoyé
   ✅ Rapport contient toutes les sections
```

---

## 📊 Résultats Attendus

| Test | Statut | Temps Moyen |
|------|--------|-------------|
| Bug #1: Prédiction IA | ✅ PASS | ~2 min |
| Bug #2: Flow Log | ✅ PASS | ~2 min |
| Bug #3: Détection Émotion | ✅ PASS | ~3 min |
| Bug #4: Rapport Quotidien | ✅ PASS | ~2 min |
| Bug #5: Rapport Analyse IA | ✅ PASS | ~3 min |
| Bug #6: Dialog Paiement | ✅ PASS | ~4 min |
| Bug #7: Dialog Notation | ✅ PASS | ~3 min |
| Tests d'Intégration | ✅ PASS | ~10 min |

**Temps Total**: ~30 minutes

---

## 🐛 Troubleshooting

### Problème: Prédictions ne s'affichent pas
```bash
# Vérifier que le service IA est démarré
curl http://localhost:3010/health

# Vérifier les logs backend
tail -f apps/backend/materials-service/logs/app.log

# Vérifier les données en base
mongo materials-db
db.materials.find().pretty()
```

### Problème: Flow Log vide
```bash
# Vérifier l'URL dans le service
# Doit être: /api/material-flow (pas /api/flows)

# Créer des données de test
curl -X POST http://localhost:3005/api/material-flow/seed
```

### Problème: WebSocket ne se connecte pas
```bash
# Vérifier CORS dans chat.gateway.ts
# Vérifier que le port frontend est dans la liste

# Tester la connexion
wscat -c ws://localhost:3005/chat
```

### Problème: Paiement échoue
```bash
# Vérifier que le service de paiement est démarré
curl http://localhost:3008/health

# Vérifier les variables d'environnement
echo $PAYMENT_API_URL
```

---

## ✅ Checklist Finale

- [ ] Tous les services démarrés
- [ ] Données de test créées
- [ ] Bug #1 testé et validé
- [ ] Bug #2 testé et validé
- [ ] Bug #3 testé et validé
- [ ] Bug #4 testé et validé
- [ ] Bug #5 testé et validé
- [ ] Bug #6 testé et validé
- [ ] Bug #7 testé et validé
- [ ] Tests d'intégration passés
- [ ] Aucune régression détectée
- [ ] Documentation à jour

---

**Guide créé le**: 29 Avril 2026  
**Version**: 2.0.0  
**Statut**: ✅ COMPLET
