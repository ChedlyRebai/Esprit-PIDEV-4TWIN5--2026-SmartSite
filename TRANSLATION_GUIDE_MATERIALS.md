# 🌍 Guide de Traduction - Materials Service Frontend

## Vue d'ensemble

Ce guide fournit les traductions systématiques pour transformer l'interface du service Materials du français vers l'anglais.

---

## 📋 Dictionnaire de Traduction

### Termes Généraux

```typescript
// Matériaux et Stock
"Matériau" → "Material"
"Matériaux" → "Materials"
"Stock" → "Stock" / "Inventory"
"Quantité" → "Quantity"
"Disponible" → "Available"
"Réservé" → "Reserved"
"Consommé" → "Consumed"
"Restant" → "Remaining"

// États de Stock
"En stock" → "In Stock"
"Stock faible" → "Low Stock"
"Rupture de stock" → "Out of Stock"
"Stock critique" → "Critical Stock"
"Stock optimal" → "Optimal Stock"
"Seuil minimum" → "Minimum Threshold"
"Seuil maximum" → "Maximum Threshold"

// Actions
"Ajouter" → "Add"
"Modifier" → "Edit"
"Supprimer" → "Delete"
"Enregistrer" → "Save"
"Annuler" → "Cancel"
"Confirmer" → "Confirm"
"Rechercher" → "Search"
"Filtrer" → "Filter"
"Trier" → "Sort"
"Exporter" → "Export"
"Importer" → "Import"
"Actualiser" → "Refresh"
"Télécharger" → "Download"
"Scanner" → "Scan"
"Générer" → "Generate"

// Navigation
"Retour" → "Back"
"Suivant" → "Next"
"Précédent" → "Previous"
"Voir les détails" → "View Details"
"Voir plus" → "View More"
"Fermer" → "Close"
"Ouvrir" → "Open"

// Chantier et Sites
"Chantier" → "Construction Site" / "Site"
"Site" → "Site"
"Adresse" → "Address"
"Localisation" → "Location"
"Coordonnées" → "Coordinates"
"Ville" → "City"
"Région" → "Region"

// Fournisseurs et Commandes
"Fournisseur" → "Supplier"
"Fournisseurs" → "Suppliers"
"Commande" → "Order"
"Commandes" → "Orders"
"Livraison" → "Delivery"
"Livraisons" → "Deliveries"
"Bon de commande" → "Purchase Order"
"Facture" → "Invoice"
"Prix" → "Price"
"Coût" → "Cost"
"Total" → "Total"
"Sous-total" → "Subtotal"

// Prédictions et IA
"Prédiction" → "Prediction"
"Prédictions" → "Predictions"
"Intelligence Artificielle" → "Artificial Intelligence"
"Apprentissage automatique" → "Machine Learning"
"Modèle" → "Model"
"Entraînement" → "Training"
"Précision" → "Accuracy"
"Confiance" → "Confidence"
"Recommandation" → "Recommendation"
"Recommandations" → "Recommendations"

// Alertes et Anomalies
"Alerte" → "Alert"
"Alertes" → "Alerts"
"Anomalie" → "Anomaly"
"Anomalies" → "Anomalies"
"Avertissement" → "Warning"
"Erreur" → "Error"
"Succès" → "Success"
"Information" → "Information"
"Critique" → "Critical"
"Normal" → "Normal"

// Météo
"Météo" → "Weather"
"Température" → "Temperature"
"Humidité" → "Humidity"
"Vent" → "Wind"
"Conditions" → "Conditions"
"Ensoleillé" → "Sunny"
"Nuageux" → "Cloudy"
"Pluvieux" → "Rainy"
"Neigeux" → "Snowy"
"Orageux" → "Stormy"
"Venteux" → "Windy"

// Temps et Dates
"Aujourd'hui" → "Today"
"Hier" → "Yesterday"
"Demain" → "Tomorrow"
"Cette semaine" → "This Week"
"Ce mois" → "This Month"
"Date" → "Date"
"Heure" → "Time"
"Durée" → "Duration"
"Délai" → "Deadline"

// Statistiques et Rapports
"Statistiques" → "Statistics"
"Rapport" → "Report"
"Rapports" → "Reports"
"Tableau de bord" → "Dashboard"
"Graphique" → "Chart"
"Historique" → "History"
"Tendance" → "Trend"
"Analyse" → "Analysis"
"Résumé" → "Summary"

// Consommation
"Consommation" → "Consumption"
"Consommé" → "Consumed"
"Taux de consommation" → "Consumption Rate"
"Historique de consommation" → "Consumption History"
"Suivi de consommation" → "Consumption Tracking"

// Paiement
"Paiement" → "Payment"
"Payer" → "Pay"
"Montant" → "Amount"
"Carte bancaire" → "Credit Card"
"Espèces" → "Cash"
"Virement" → "Bank Transfer"
"Payé" → "Paid"
"En attente" → "Pending"
"Remboursement" → "Refund"
```

---

## 🔄 Patterns de Remplacement

### Messages Toast

```typescript
// Succès
toast.success("Matériau créé avec succès")
→ toast.success("Material created successfully")

toast.success("Matériau mis à jour")
→ toast.success("Material updated successfully")

toast.success("Matériau supprimé")
→ toast.success("Material deleted successfully")

toast.success("Commande créée avec succès")
→ toast.success("Order created successfully")

toast.success("Stock mis à jour")
→ toast.success("Stock updated successfully")

// Erreurs
toast.error("Erreur lors de la création du matériau")
→ toast.error("Error creating material")

toast.error("Erreur lors de la mise à jour")
→ toast.error("Error updating material")

toast.error("Erreur lors de la suppression")
→ toast.error("Error deleting material")

toast.error("Impossible de charger les données")
→ toast.error("Unable to load data")

// Avertissements
toast.warning("Stock faible détecté")
→ toast.warning("Low stock detected")

toast.warning("Veuillez remplir tous les champs")
→ toast.warning("Please fill in all fields")

toast.warning("Quantité insuffisante")
→ toast.warning("Insufficient quantity")

// Informations
toast.info("Chargement en cours...")
→ toast.info("Loading...")

toast.info("Données actualisées")
→ toast.info("Data refreshed")
```

### Titres de Cartes et Sections

```typescript
// Tableaux de bord
"Tableau de bord des matériaux" → "Materials Dashboard"
"Statistiques générales" → "General Statistics"
"Vue d'ensemble" → "Overview"
"Résumé" → "Summary"

// Listes
"Liste des matériaux" → "Materials List"
"Liste des commandes" → "Orders List"
"Liste des alertes" → "Alerts List"
"Historique" → "History"

// Détails
"Détails du matériau" → "Material Details"
"Informations générales" → "General Information"
"Informations de stock" → "Stock Information"
"Historique des mouvements" → "Movement History"

// Prédictions
"Prédictions de stock" → "Stock Predictions"
"Prédiction avancée" → "Advanced Prediction"
"Analyse prédictive" → "Predictive Analysis"
"Recommandations IA" → "AI Recommendations"

// Météo
"Météo du chantier" → "Site Weather"
"Conditions météorologiques" → "Weather Conditions"
"Impact météo" → "Weather Impact"

// Consommation
"Suivi de consommation" → "Consumption Tracking"
"Consommation par site" → "Consumption by Site"
"Historique de consommation" → "Consumption History"
"Rapport de consommation" → "Consumption Report"
```

### Labels de Formulaires

```typescript
// Champs de base
"Nom" → "Name"
"Code" → "Code"
"Description" → "Description"
"Catégorie" → "Category"
"Unité" → "Unit"
"Prix unitaire" → "Unit Price"

// Stock
"Quantité" → "Quantity"
"Quantité actuelle" → "Current Quantity"
"Quantité initiale" → "Initial Quantity"
"Stock minimum" → "Minimum Stock"
"Stock maximum" → "Maximum Stock"
"Seuil de réapprovisionnement" → "Reorder Point"

// Localisation
"Emplacement" → "Location"
"Entrepôt" → "Warehouse"
"Zone" → "Zone"
"Allée" → "Aisle"
"Étagère" → "Shelf"

// Fournisseur
"Fournisseur" → "Supplier"
"Nom du fournisseur" → "Supplier Name"
"Contact" → "Contact"
"Téléphone" → "Phone"
"Email" → "Email"
"Adresse" → "Address"

// Dates
"Date de création" → "Creation Date"
"Date de modification" → "Modification Date"
"Date d'expiration" → "Expiration Date"
"Date de livraison" → "Delivery Date"
"Date de commande" → "Order Date"

// Notes
"Notes" → "Notes"
"Commentaires" → "Comments"
"Remarques" → "Remarks"
"Raison" → "Reason"
```

### Boutons

```typescript
// Actions principales
"Ajouter un matériau" → "Add Material"
"Créer une commande" → "Create Order"
"Enregistrer" → "Save"
"Enregistrer les modifications" → "Save Changes"
"Annuler" → "Cancel"
"Supprimer" → "Delete"
"Confirmer la suppression" → "Confirm Deletion"

// Actions secondaires
"Voir les détails" → "View Details"
"Modifier" → "Edit"
"Dupliquer" → "Duplicate"
"Exporter" → "Export"
"Importer" → "Import"
"Actualiser" → "Refresh"
"Télécharger" → "Download"

// Scanner et QR
"Scanner QR Code" → "Scan QR Code"
"Générer QR Code" → "Generate QR Code"
"Scanner depuis fichier" → "Scan from File"
"Scanner depuis caméra" → "Scan from Camera"

// Prédictions
"Générer prédiction" → "Generate Prediction"
"Entraîner modèle" → "Train Model"
"Voir prédictions" → "View Predictions"
"Actualiser prédictions" → "Refresh Predictions"

// Paiement
"Payer maintenant" → "Pay Now"
"Payer par carte" → "Pay by Card"
"Payer en espèces" → "Pay Cash"
"Confirmer le paiement" → "Confirm Payment"
```

### Messages de Confirmation

```typescript
// Suppression
"Êtes-vous sûr de vouloir supprimer ce matériau ?"
→ "Are you sure you want to delete this material?"

"Cette action est irréversible."
→ "This action cannot be undone."

"Supprimer définitivement"
→ "Delete Permanently"

// Validation
"Veuillez remplir tous les champs obligatoires"
→ "Please fill in all required fields"

"Veuillez sélectionner au moins un élément"
→ "Please select at least one item"

"Veuillez vérifier les informations saisies"
→ "Please verify the entered information"

// Succès
"Opération réussie"
→ "Operation successful"

"Modifications enregistrées"
→ "Changes saved"

"Données synchronisées"
→ "Data synchronized"
```

### États et Statuts

```typescript
// Stock
"En stock" → "In Stock"
"Stock faible" → "Low Stock"
"Rupture de stock" → "Out of Stock"
"Stock critique" → "Critical Stock"
"Stock optimal" → "Optimal Stock"

// Commandes
"En attente" → "Pending"
"En cours" → "In Progress"
"Livré" → "Delivered"
"Annulé" → "Cancelled"
"Confirmé" → "Confirmed"

// Prédictions
"Sûr" → "Safe"
"Avertissement" → "Warning"
"Critique" → "Critical"
"Urgent" → "Urgent"

// Paiement
"Payé" → "Paid"
"Non payé" → "Unpaid"
"Partiellement payé" → "Partially Paid"
"Remboursé" → "Refunded"
```

### Placeholders

```typescript
// Recherche
"Rechercher un matériau..." → "Search material..."
"Rechercher par nom, code..." → "Search by name, code..."
"Filtrer par catégorie..." → "Filter by category..."

// Formulaires
"Entrez le nom du matériau" → "Enter material name"
"Entrez la quantité" → "Enter quantity"
"Sélectionnez une catégorie" → "Select a category"
"Sélectionnez un fournisseur" → "Select a supplier"
"Sélectionnez un site" → "Select a site"

// Notes
"Ajoutez des notes..." → "Add notes..."
"Commentaires optionnels..." → "Optional comments..."
"Raison de la modification..." → "Reason for change..."
```

---

## 🎯 Exemples de Traduction Complète

### Exemple 1: Card Title

```typescript
// AVANT
<CardTitle className="text-lg">
  📦 Gestion des Matériaux
</CardTitle>

// APRÈS
<CardTitle className="text-lg">
  📦 Materials Management
</CardTitle>
```

### Exemple 2: Button avec Toast

```typescript
// AVANT
<Button onClick={handleSave}>
  Enregistrer les modifications
</Button>

const handleSave = async () => {
  try {
    await materialService.update(id, data);
    toast.success("Matériau mis à jour avec succès");
  } catch (error) {
    toast.error("Erreur lors de la mise à jour");
  }
};

// APRÈS
<Button onClick={handleSave}>
  Save Changes
</Button>

const handleSave = async () => {
  try {
    await materialService.update(id, data);
    toast.success("Material updated successfully");
  } catch (error) {
    toast.error("Error updating material");
  }
};
```

### Exemple 3: Form Labels

```typescript
// AVANT
<div className="space-y-4">
  <div>
    <label>Nom du matériau</label>
    <Input placeholder="Entrez le nom" />
  </div>
  <div>
    <label>Quantité disponible</label>
    <Input type="number" placeholder="Entrez la quantité" />
  </div>
  <div>
    <label>Catégorie</label>
    <Select placeholder="Sélectionnez une catégorie" />
  </div>
</div>

// APRÈS
<div className="space-y-4">
  <div>
    <label>Material Name</label>
    <Input placeholder="Enter name" />
  </div>
  <div>
    <label>Available Quantity</label>
    <Input type="number" placeholder="Enter quantity" />
  </div>
  <div>
    <label>Category</label>
    <Select placeholder="Select a category" />
  </div>
</div>
```

### Exemple 4: Status Badge

```typescript
// AVANT
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'safe':
      return <Badge variant="success">Sûr</Badge>;
    case 'warning':
      return <Badge variant="warning">Avertissement</Badge>;
    case 'critical':
      return <Badge variant="destructive">Critique</Badge>;
    default:
      return <Badge>Inconnu</Badge>;
  }
};

// APRÈS
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'safe':
      return <Badge variant="success">Safe</Badge>;
    case 'warning':
      return <Badge variant="warning">Warning</Badge>;
    case 'critical':
      return <Badge variant="destructive">Critical</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
};
```

### Exemple 5: Loading State

```typescript
// AVANT
{loading ? (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 animate-spin" />
    <span className="ml-2">Chargement des matériaux...</span>
  </div>
) : (
  <MaterialsList materials={materials} />
)}

// APRÈS
{loading ? (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 animate-spin" />
    <span className="ml-2">Loading materials...</span>
  </div>
) : (
  <MaterialsList materials={materials} />
)}
```

---

## 🚀 Processus de Traduction Recommandé

### Étape 1: Préparer l'environnement
```bash
# Créer une branche pour la traduction
git checkout -b feature/translate-materials-frontend

# Sauvegarder les fichiers originaux
cp -r apps/frontend/src/app/pages/materials apps/frontend/src/app/pages/materials.backup
```

### Étape 2: Traduire par ordre de priorité

1. **Fichiers principaux** (haute priorité)
   - Materials.tsx
   - MaterialDetails.tsx
   - MaterialForm.tsx
   - DashboardStats.tsx

2. **Composants réutilisables** (priorité moyenne)
   - MaterialWeatherWidget.tsx
   - AIPredictionWidget.tsx
   - AnomalyAlert.tsx

3. **Dialogues et modales** (priorité moyenne)
   - CreateOrderDialog.tsx
   - PaymentDialog.tsx
   - SupplierRatingDialog.tsx

4. **Pages spécialisées** (priorité basse)
   - MaterialMLTraining.tsx
   - ConsumptionAIReport.tsx
   - OrderMap.tsx

### Étape 3: Tester après chaque fichier
```bash
# Vérifier que l'application compile
npm run build

# Tester l'interface
npm run dev
```

### Étape 4: Valider et commiter
```bash
git add .
git commit -m "feat: translate materials frontend to English"
git push origin feature/translate-materials-frontend
```

---

## ✅ Checklist de Validation

Après traduction, vérifier:

- [ ] Tous les textes visibles sont en anglais
- [ ] Les messages toast sont traduits
- [ ] Les labels de formulaires sont traduits
- [ ] Les placeholders sont traduits
- [ ] Les titres de cartes sont traduits
- [ ] Les boutons sont traduits
- [ ] Les messages d'erreur sont traduits
- [ ] Les tooltips sont traduits
- [ ] Les confirmations sont traduites
- [ ] Les statuts/badges sont traduits
- [ ] L'application compile sans erreur
- [ ] L'interface fonctionne correctement
- [ ] Aucun texte français résiduel

---

## 📞 Support

Pour toute question sur la traduction:
1. Consulter ce guide
2. Vérifier les exemples fournis
3. Tester dans l'interface
4. Demander une revue de code

---

**Dernière mise à jour**: 2026-04-29
**Version**: 1.0.0
