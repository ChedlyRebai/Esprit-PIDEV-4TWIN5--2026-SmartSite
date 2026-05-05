# 🧪 Tests de Vérification - Corrections Material Service

## Prérequis

Avant de commencer les tests, assurez-vous que:
- ✅ Les services backend sont démarrés (`npm run start:dev`)
- ✅ Le frontend est démarré (`npm run dev`)
- ✅ MongoDB est en cours d'exécution
- ✅ Les variables d'environnement sont configurées

---

## 🔍 Test #1: Prédictions IA

### Objectif
Vérifier que les prédictions affichent des données réelles et que le badge de rupture fonctionne.

### Étapes

**1. Test Backend (API)**
```bash
# Vérifier que l'endpoint retourne des données
curl http://localhost:3002/api/materials/predictions | jq

# Résultat attendu: Array de prédictions avec:
# - materialId, materialName
# - currentStock, predictedStock
# - hoursToOutOfStock, hoursToLowStock
# - status: 'safe' | 'warning' | 'critical'
# - consumptionRate (calculé depuis MaterialFlowLog)
```

**2. Test Frontend (UI)**
```
1. Ouvrir: http://localhost:5173/materials/stock-predictions
2. Vérifier que la liste des prédictions s'affiche
3. Chercher un matériau avec status='critical'
4. Vérifier la présence du badge rouge "RUPTURE IMMINENTE"
5. Vérifier que le badge clignote (animate-pulse)
6. Vérifier l'affichage de l'heure de rupture
```

**3. Vérification des Données**
```bash
# Vérifier qu'il y a des mouvements de stock en base
curl http://localhost:3002/api/material-flow/enriched?limit=10 | jq

# Si pas de données, créer un mouvement de test:
curl -X POST http://localhost:3002/api/material-flow \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "MATERIAL_ID",
    "siteId": "SITE_ID",
    "type": "OUT",
    "quantity": 50,
    "reason": "Test consommation"
  }'
```

### ✅ Critères de Succès
- [ ] Les prédictions affichent des données réelles (pas de valeurs aléatoires)
- [ ] Le badge "RUPTURE IMMINENTE" apparaît pour hoursToOutOfStock < 24
- [ ] Le badge clignote (animation pulse)
- [ ] L'heure de rupture est affichée correctement
- [ ] Le taux de consommation est calculé depuis MaterialFlowLog

---

## 🔍 Test #2: Flow Log

### Objectif
Vérifier que les mouvements de stock s'affichent et que les filtres fonctionnent.

### Étapes

**1. Test Backend (API)**
```bash
# Vérifier que l'endpoint retourne des données
curl http://localhost:3002/api/material-flow/enriched?limit=10 | jq

# Tester avec filtres de date
curl "http://localhost:3002/api/material-flow/enriched?startDate=2024-01-01&endDate=2024-12-31" | jq

# Tester avec filtre par type
curl "http://localhost:3002/api/material-flow/enriched?type=OUT" | jq
```

**2. Test Frontend (UI)**
```
1. Ouvrir: http://localhost:5173/materials/flow-log
2. Vérifier que les mouvements s'affichent
3. Vérifier les colonnes:
   - Type (IN/OUT avec icônes)
   - Quantité
   - Date/Heure
   - Matériau (nom + code)
   - Site
   - Utilisateur
   - Stock avant → Stock après
4. Tester le filtre "Tous"
5. Tester le filtre "Entrées" (bouton vert)
6. Tester le filtre "Sorties" (bouton rouge)
7. Tester le filtre "Anomalies" (bouton jaune)
```

**3. Test Filtres de Date**
```
1. Sélectionner une date de début (ex: 01/01/2024)
2. Sélectionner une date de fin (ex: 31/12/2024)
3. Vérifier que seuls les mouvements dans cette plage s'affichent
4. Cliquer sur "Réinitialiser"
5. Vérifier que tous les mouvements réapparaissent
```

**4. Test Statistiques**
```
1. Vérifier l'affichage des cartes de statistiques:
   - Total Entrées (vert)
   - Total Sorties (rouge)
   - Anomalies (orange)
   - Journaux (violet)
2. Vérifier que les chiffres correspondent aux données affichées
```

### ✅ Critères de Succès
- [ ] Les mouvements s'affichent correctement
- [ ] Les filtres par type fonctionnent (IN/OUT/Anomalies)
- [ ] Les filtres de date fonctionnent
- [ ] Le bouton "Réinitialiser" efface les filtres
- [ ] Les statistiques sont correctes
- [ ] Les noms de matériau, site, utilisateur sont affichés (enriched data)

---

## 🔍 Test #3: Chat - Détection d'Émotion

### Objectif
Vérifier que l'indicateur d'émotion fonctionne en temps réel.

### Étapes

**1. Préparation**
```
1. Ouvrir: http://localhost:5173/materials (ou page avec chat)
2. Ouvrir le chat de livraison
3. Vérifier que l'indicateur d'émotion est visible dans le header
4. État initial devrait être: 🟢 "Calme"
```

**2. Test Messages Positifs**
```
Envoyer les messages suivants et vérifier le badge:

Message: "Merci beaucoup!"
→ Attendu: 🟢 "Calme" (vert)

Message: "Excellent travail! 😊"
→ Attendu: 🟢 "Calme" (vert)

Message: "Parfait, merci! 👍"
→ Attendu: 🟢 "Calme" (vert)
```

**3. Test Messages Négatifs**
```
Envoyer les messages suivants et vérifier le badge:

Message: "C'est inacceptable!"
→ Attendu: 🔴 "Conflit" (rouge, clignotant)

Message: "Je suis très mécontent 😡"
→ Attendu: 🔴 "Conflit" (rouge, clignotant)

Message: "Ça suffit maintenant!"
→ Attendu: 🔴 "Conflit" (rouge, clignotant)
```

**4. Test Emojis**
```
Envoyer uniquement des emojis:

Message: "😊"
→ Attendu: 🟢 "Calme"

Message: "😡"
→ Attendu: 🔴 "Conflit"

Message: "🤬"
→ Attendu: 🔴 "Conflit"
```

**5. Vérification Backend**
```bash
# Vérifier les logs du backend
# Devrait afficher: "📨 Message sent to room order-XXX: [message] [CALME/CONFLIT]"
```

### ✅ Critères de Succès
- [ ] L'indicateur d'émotion est visible dans le header du chat
- [ ] Badge vert 🟢 "Calme" pour messages positifs
- [ ] Badge rouge 🔴 "Conflit" pour messages négatifs
- [ ] Le badge clignote (animate-pulse) en cas de conflit
- [ ] Les emojis sont détectés correctement
- [ ] Pas de chargements répétitifs (utilise WebSocket)
- [ ] L'émotion se met à jour en temps réel

---

## 🔍 Test #4: Génération de Rapport IA

### Objectif
Vérifier que le bouton génère et envoie un rapport complet par email.

### Étapes

**1. Test Backend (API)**
```bash
# Tester l'endpoint directement
curl -X POST http://localhost:3002/api/materials/reports/daily/send \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' | jq

# Résultat attendu:
# {
#   "success": true,
#   "message": "Rapport quotidien envoyé avec succès à test@example.com",
#   "timestamp": "2024-XX-XX..."
# }
```

**2. Test Frontend (UI)**
```
1. Ouvrir: http://localhost:5173/materials
2. Chercher le bouton "Générer Rapport IA" (violet, dans la toolbar)
3. Cliquer sur le bouton
4. Vérifier que le dialog s'ouvre
5. Vérifier le contenu du dialog:
   - Titre: "Générer Rapport Quotidien IA"
   - Champ email
   - Liste des éléments inclus dans le rapport
   - Boutons "Annuler" et "Générer et Envoyer"
```

**3. Test Génération**
```
1. Saisir une adresse email valide (ex: votre email)
2. Cliquer sur "Générer et Envoyer"
3. Vérifier l'affichage du loader "Génération..."
4. Attendre la confirmation (icône verte ✓)
5. Vérifier le message: "Rapport envoyé avec succès !"
6. Le dialog devrait se fermer automatiquement après 2 secondes
```

**4. Vérification Email**
```
Si vous utilisez Ethereal Email (test):
1. Aller sur: https://ethereal.email/messages
2. Se connecter avec les identifiants du .env
3. Vérifier la réception de l'email
4. Ouvrir l'email et vérifier le contenu HTML:
   - Résumé en chiffres (matériaux actifs, stock bas, ruptures, expirants)
   - Tableau des matériaux en stock bas
   - Tableau des matériaux en rupture
   - Tableau des matériaux expirants
   - Tableau des anomalies détectées
   - Recommandations urgentes
   - Actions recommandées
```

**5. Test Validation**
```
1. Essayer de générer sans saisir d'email
   → Attendu: Message d'erreur "Veuillez saisir une adresse email valide"

2. Essayer avec un email invalide (ex: "test")
   → Attendu: Message d'erreur "Veuillez saisir une adresse email valide"

3. Essayer avec un email valide
   → Attendu: Génération et envoi réussis
```

### ✅ Critères de Succès
- [ ] Le bouton "Générer Rapport IA" est visible dans la toolbar
- [ ] Le dialog s'ouvre correctement
- [ ] La validation de l'email fonctionne
- [ ] Le rapport est généré et envoyé
- [ ] L'email est reçu avec le contenu HTML complet
- [ ] Le rapport inclut toutes les sections attendues
- [ ] Le message de confirmation s'affiche
- [ ] Le dialog se ferme automatiquement

---

## 🔧 Dépannage

### Problème: Les prédictions n'affichent rien
```bash
# Vérifier qu'il y a des matériaux en base
curl http://localhost:3002/api/materials | jq '.data | length'

# Vérifier qu'il y a des mouvements de stock
curl http://localhost:3002/api/material-flow/enriched | jq '.data | length'

# Si pas de données, créer des données de test
# (voir scripts de seed dans le projet)
```

### Problème: Le Flow Log est vide
```bash
# Vérifier l'URL de l'API
# Devrait être: /api/material-flow (pas /api/flows)

# Vérifier dans la console du navigateur (F12)
# Chercher les erreurs réseau

# Vérifier que le backend répond
curl http://localhost:3002/api/material-flow/enriched
```

### Problème: L'indicateur d'émotion ne change pas
```bash
# Vérifier que le WebSocket est connecté
# Dans la console du navigateur:
# Devrait afficher: "Connected to chat service"

# Vérifier les logs du backend
# Devrait afficher: "📨 Message sent to room..."

# Vérifier que AiMessageAnalyzerService est actif
# Logs backend: "🔍 Analyzing message: ..."
```

### Problème: Le rapport n'est pas envoyé
```bash
# Vérifier les variables d'environnement SMTP
echo $SMTP_HOST
echo $SMTP_USER
echo $SMTP_PASS

# Vérifier que le service email est configuré
# Logs backend: "✅ Rapport quotidien envoyé à..."

# Si utilisation d'Ethereal Email:
# Vérifier sur https://ethereal.email/messages
```

---

## 📊 Checklist Complète

### Bug #1 - Prédictions IA
- [ ] Endpoint `/api/materials/predictions` fonctionne
- [ ] Les prédictions affichent des données réelles
- [ ] Badge "RUPTURE IMMINENTE" visible pour matériaux critiques
- [ ] Badge clignote (animate-pulse)
- [ ] Heure de rupture affichée
- [ ] Taux de consommation calculé depuis MaterialFlowLog

### Bug #2 - Flow Log
- [ ] Endpoint `/api/material-flow/enriched` fonctionne
- [ ] Les mouvements s'affichent
- [ ] Filtre "Tous" fonctionne
- [ ] Filtre "Entrées" fonctionne
- [ ] Filtre "Sorties" fonctionne
- [ ] Filtre "Anomalies" fonctionne
- [ ] Filtres de date fonctionnent
- [ ] Bouton "Réinitialiser" fonctionne
- [ ] Statistiques affichées correctement
- [ ] Noms enrichis (matériau, site, utilisateur) affichés

### Bug #3 - Chat Émotion
- [ ] Indicateur d'émotion visible dans le header
- [ ] Badge vert 🟢 pour messages positifs
- [ ] Badge rouge 🔴 pour messages négatifs
- [ ] Badge clignote en cas de conflit
- [ ] Emojis détectés correctement
- [ ] Pas de chargements répétitifs
- [ ] Mise à jour en temps réel

### Bug #4 - Rapport IA
- [ ] Bouton "Générer Rapport IA" visible
- [ ] Dialog s'ouvre correctement
- [ ] Validation email fonctionne
- [ ] Rapport généré et envoyé
- [ ] Email reçu avec contenu HTML
- [ ] Toutes les sections présentes dans le rapport
- [ ] Message de confirmation affiché
- [ ] Dialog se ferme automatiquement

---

## 🎯 Résultat Attendu

**Tous les tests doivent passer ✅**

Si un test échoue:
1. Vérifier les logs du backend
2. Vérifier la console du navigateur (F12)
3. Vérifier les variables d'environnement
4. Consulter la section "Dépannage" ci-dessus

---

## 📝 Rapport de Test

Après avoir effectué tous les tests, remplir ce rapport:

```
Date: _______________
Testeur: _______________

Bug #1 - Prédictions IA: ☐ PASS ☐ FAIL
Bug #2 - Flow Log: ☐ PASS ☐ FAIL
Bug #3 - Chat Émotion: ☐ PASS ☐ FAIL
Bug #4 - Rapport IA: ☐ PASS ☐ FAIL

Commentaires:
_________________________________
_________________________________
_________________________________

Bugs trouvés:
_________________________________
_________________________________
_________________________________
```

---

**Bonne chance avec les tests ! 🚀**
