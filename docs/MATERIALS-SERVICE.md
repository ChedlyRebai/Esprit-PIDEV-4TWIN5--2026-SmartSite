# Materials Service - Documentation Complète

## Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Architecture Technique](#2-architecture-technique)
3. [Entités et Schémas de Données](#3-entités-et-schémas-de-données)
4. [Gestion des Matériaux](#4-gestion-des-matériaux)
5. [Gestion des Commandes](#5-gestion-des-commandes)
6. [Système de Paiement](#6-système-de-paiement)
7. [Service de Chat](#7-service-de-chat)
8. [ML/AI - Prédiction de Stock](#8-mlai---prédiction-de-stock)
9. [WebSocket en Temps Réel](#9-websocket-en-temps-réel)
10. [API Endpoints Référence](#10-api-endpoints-référence)
11. [Intégrations Externes](#11-intégrations-externes)

---

## 1. Vue d'Ensemble

### 1.1 Description du Service

Le **Materials Service** est un microservice NestJS complet dédié à la gestion des matériaux de construction sur un chantier SmartSite. Il orchestrel'ensemble du cycle de vie des matériaux : inventaire, commandes, paiements, communicationet intelligence artificielle pour la prédiction des stocks.

### 1.2 Informations de Connexion

| Paramètre | Valeur |
|-----------|-------|
| **Port** | 3002 |
| **Base URL** | `http://localhost:3002/api` |
| **Database** | MongoDB (`smartsite-materials`) |
| **Prefixe API** | `/api` |
| **WebSocket** | Socket.io (namespace `/materials`) |

### 1.3 Caractéristiques Principales

| Caractéristique | Description |
|----------------|-------------|
| **Type** | NestJS Microservice |
| **Base de données** | MongoDB (Mongoose) |
| **Temps réel** | WebSocket (Socket.io) |
| **IA/ML** | TensorFlow.js |
| **Stockage fichiers** | Multer (uploads) |
| **Cache** | cache-manager |
| **Scheduler** | @nestjs/schedule |

### 1.4 Architecture des Données

```
┌─────────────────────────────────────────────────────────────────┐
│                 MATERIALS-SERVICE (Port 3002)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   Materials      │    │   MaterialOrders │                   │
│  │   - Stock        │    │   - Tracking     │                   │
│  │   - QR Codes     │    │   - Payment      │                   │
│  │   - Alerts      │    │   - Delivery    │                   │
│  └──────────────────┘    └──────────────────┘                   │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   Chat           │    │   ML/AI         │                   │
│  │   - Messages    │    │   - Prediction │                   │
│  │   - Files       │    │   - Training   │                   │
│  │   - Location    │    │   - Forecasting│                   │
│  └──────────────────┘    └──────────────────┘                   │
│                                                                  │
│  ┌──────────────────────────────────────────┐                   │
│  │   External Services (via HTTP)            │                   │
│  │   - Sites Service (3001)                 │                   │
│  │   - Payment Service (3007)               │                   │
│  │   - Fournisseurs Service (3005)           │                   │
│  └──────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Technique

### 2.1 Structure des Fichiers

```
apps/backend/materials-service/
├── src/
│   ├── main.ts                          # Point d'entréeBootstrap
│   ├── app.module.ts                  # Module racine
│   ├── materials/                    # Module principal
│   │   ├── materials.module.ts       # Module NestJS
│   │   ├── materials.controller.ts  # Controller REST
│   │   ├── materials.service.ts     # Service principal
│   │   ├── materials.gateway.ts     # WebSocket Gateway
│   │   ├── qrcode.controller.ts    # Génération QR
│   │   ├── orders.controller.ts  # Commandes livraison
│   │   ├── site-materials.controller.ts
│   │   ├── entities/
│   │   │   ├── material.entity.ts         # Schéma Material
│   │   │   └── material-order.entity.ts # Schéma Commande
│   │   ├── dto/
│   │   │   ├── create-material.dto.ts
│   │   │   ├── update-material.dto.ts
│   │   │   ├── material-query.dto.ts
│   │   │   ├── order.dto.ts
│   │   │   ├── historical-data.dto.ts
│   │   │   └── bulk-import.dto.ts
│   │   ├── interfaces/
│   │   │   └── material.interface.ts
│   │   └── services/
│   │       ├── orders.service.ts           # Commandes
│   │       ├── site-materials.service.ts # Stock par site
│   │       ├── import-export.service.ts # Excel/PDF
│   │       ├── websocket.service.ts     # WebSocket
│   │       ├── stock-prediction.service.ts # ML TensorFlow
│   │       └── ml-training.service.ts  # ML Training
│   ├── chat/                        # Module Chat
│   │   ├── chat.module.ts
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts
│   │   ├── chat.gateway.ts
│   │   ├── entities/
│   │   │   └── chat-message.entity.ts
│   │   └── dto/
│   │       └── chat.dto.ts
│   ├── payment/                   # Module Paiement
│   │   ├── payment.module.ts
│   │   └── payment.service.ts
│   └── common/utils/            # Utilitaires
│       ├── qr-generator.util.ts
│       └── qr-scanner.util.ts
```

### 2.2 Technologies Utilisées

| Catégorie | Technologie |
|-----------|-------------|
| **Framework** | NestJS v11 |
| **Database** | MongoDB + Mongoose |
| **WebSocket** | Socket.io (@nestjs/websockets) |
| **ML/AI** | TensorFlow.js |
| **Cache** | cache-manager |
| **HTTP Client** | Axios (@nestjs/axios) |
| **Scheduler** | @nestjs/schedule |
| **Config** | @nestjs/config |
| **Validation** | class-validator |

### 2.3 Configuration (.env)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/smartsite-materials

# Port
PORT=3002

# External APIs
PAYMENT_API_URL=http://localhost:3007/api/payments
FACTURE_API_URL=http://localhost:3007/api/factures
STRIPE_API_URL=http://localhost:3007/api/payments/stripe/create-payment-intent

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

---

## 3. Entités et Schémas de Données

### 3.1 Material

L'entité **Material** représente un matériau de construction avec toutes ses informations.

```typescript
@Schema({ timestamps: true })
export class Material extends Document {
  // ==================== IDENTIFICATION ====================
  @Prop({ required: true })
  name: string;       // Nom (ex: "Ciment CEM I 42.5")

  @Prop({ required: true, unique: true })
  code: string;       // Code unique (ex: "MAT-CIMENT-001")

  @Prop({ required: true })
  category: string;  // Catégorie (ex: "Béton")

  @Prop({ required: true })
  unit: string;      // Unité (ex: "sac", "tonne", "m")

  // ==================== STOCK ====================
  @Prop({ required: true, min: 0 })
  quantity: number;   // Quantité actuelle

  @Prop({ required: true, min: 0 })
  minimumStock: number;  // Seuil minimum (alerte)

  @Prop({ required: true, min: 0 })
  maximumStock: number;  // Capacité maximum

  @Prop({ required: true, min: 0 })
  reorderPoint: number;  // Point commande auto

  // ==================== QUALITÉ ====================
  @Prop({ type: Number, min: 0, max: 1 })
  qualityGrade: number;  // Grade qualité (0-1)

  @Prop({ type: Number, default: 1 })
  consumptionRate: number;  // Taux consommation/h

  // ==================== LOCALISATION ====================
  @Prop({ type: String })
  location: string;   // Emplacement physique

  @Prop({ type: String })
  barcode: string;  // Code-barres

  @Prop({ type: String })
  qrCode: string;   // QR code (Base64)

  @Prop({ type: String })
  qrCodeImage: string;  // Chemin fichier QR

  // ==================== DATES ====================
  @Prop({ type: Date })
  expiryDate: Date;   // Date expiration

  @Prop({ type: Date })
  lastOrdered: Date;  // Dernière commande

  @Prop({ type: Date })
  lastReceived: Date;  // Dernière réception

  @Prop({ type: Date })
  lastCountDate: Date;  // Dernier inventaire

  // ==================== STATUT ====================
  @Prop({ type: String, enum: ['active', 'discontinued', 'obsolete'] })
  status: string;

  @Prop({ type: Number, default: 0 })
  reservedQuantity: number;  // Réservé

  @Prop({ type: Number, default: 0 })
  damagedQuantity: number;  // Endommagé

  @Prop({ type: Number, default: 0 })
  reorderCount: number;  // Nbr commandes auto

  // ==================== RELATIONS ====================
  @Prop({ type: Types.ObjectId, ref: 'Site' })
  siteId: Types.ObjectId;  // Site principal

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Site' }] })
  assignedSites: Types.ObjectId[];  // Sites assignés

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Fournisseur' }] })
  preferredSuppliers: Types.ObjectId[];  // Fournisseurs préférés

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;  // Créateur

  // ==================== MÉTADONNÉES ====================
  @Prop({ type: String })
  manufacturer: string;  // Fabricant

  @Prop({ type: Object })
  specifications: Record<string, any>;  // Spécifications

  @Prop({ type: Object })
  priceHistory: Record<string, number>;  // Historique prix

  @Prop({ type: [String] })
  images: string[];  // Images
}
```

**Index MongoDB :**
```javascript
{ name: 'text', code: 'text' }  // Recherche texte
{ category: 1 }               // Index catégorie
{ status: 1 }                 // Index statut
{ assignedSites: 1 }            // Index sites
{ siteId: 1 }                  // Index site
```

### 3.2 MaterialSiteStock

Pour gérer le stock par site :

```typescript
@Schema({ timestamps: true })
export class MaterialSiteStock extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
  materialId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Site', required: true })
  siteId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  reorderPoint: number;

  @Prop({ required: true, min: 0 })
  minimumStock: number;

  @Prop({ required: true, min: 0 })
  maximumStock: number;

  @Prop({ type: Date })
  lastUpdated: Date;
}
```

### 3.3 MaterialOrder

L'entité **MaterialOrder** représente une commande de matériau avec suivi delivraison.

```typescript
export enum OrderStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  DELAYED = 'delayed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class MaterialOrder extends Document {
  // ==================== IDENTIFICATION ====================
  @Prop({ required: true })
  orderNumber: string;      // "ORD-{timestamp}-{random}"

  @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
  materialId: Types.ObjectId;

  @Prop({ required: true })
  materialName: string;

  @Prop({ required: true })
  materialCode: string;

  @Prop({ required: true, min: 0 })
  quantity: number;

  // ==================== DESTINATION ====================
  @Prop({ type: Types.ObjectId, ref: 'Site', required: true })
  destinationSiteId: Types.ObjectId;

  @Prop({ required: true })
  destinationSiteName: string;

  @Prop({ required: true })
  destinationAddress: string;

  @Prop({ type: Object, required: true })
  destinationCoordinates: { lat: number; lng: number };

  // ==================== FOURNISSEUR ====================
  @Prop({ type: Types.ObjectId, ref: 'Fournisseur', required: true })
  supplierId: Types.ObjectId;

  @Prop({ required: true })
  supplierName: string;

  @Prop({ required: true })
  supplierAddress: string;

  @Prop({ type: Object, required: true })
  supplierCoordinates: { lat: number; lng: number };

  // ==================== SUIVI LIVRAISON ====================
  @Prop({ type: Number, default: 0 })
  estimatedDurationMinutes: number;

  @Prop({ type: Number, default: 0 })
  remainingTimeMinutes: number;

  @Prop({ type: Object })
  currentPosition: { lat: number; lng: number };

  @Prop({ type: Number, default: 0 })
  progress: number;  // 0-100%

  @Prop({ type: String, enum: OrderStatus })
  status: OrderStatus;

  // ==================== HORAIRES ====================
  @Prop({ type: Date })
  scheduledDeparture: Date;

  @Prop({ type: Date })
  scheduledArrival: Date;

  @Prop({ type: Date })
  actualDeparture: Date;

  @Prop({ type: Date })
  actualArrival: Date;

  // ==================== PAIEMENT ====================
  @Prop({ type: String })
  paymentId?: string;

  @Prop({ type: Number })
  paymentAmount?: number;

  @Prop({ type: String })
  paymentMethod?: 'cash' | 'card';

  @Prop({ type: String })
  paymentStatus?: string;

  // ==================== MÉTADONNÉES ====================
  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: String })
  notes: string;
}
```

**Index MongoDB :**
```javascript
{ orderNumber: 1 }           // Unique
{ status: 1 }                // Index statut
{ destinationSiteId: 1 }    // Index destination
{ supplierId: 1 }          // Index fournisseur
```

### 3.4 ChatMessage

```typescript
@Schema({ timestamps: true })
export class ChatMessage extends Document {
  @Prop({ required: true })
  id: string;  // UUID

  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  senderId: string;

  @Prop({ required: true })
  senderName: string;

  @Prop({ required: true })
  senderRole: 'site' | 'supplier' | 'system';

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, enum: ['text', 'image', 'video', 'voice', 'location', 'arrival_confirmation', 'notification'] })
  type: string;

  @Prop({ type: String })
  fileUrl?: string;

  @Prop({ type: Object })
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileUrl?: string;
    audioUrl?: string;
    duration?: number;
  };

  @Prop({ type: Object })
  location?: { lat: number; lng: number; address?: string };

  @Prop({ type: [String], default: [] })
  readBy: string[];
}
```

---

## 4. Gestion des Matériaux

### 4.1 Opérations CRUD

| Opération | Endpoint | Description |
|-----------|----------|-------------|
| **CREATE** | `POST /materials` | Créer un matériau |
| **READ ALL** | `GET /materials` | Liste paginée |
| **READ ONE** | `GET /materials/:id` | Détails matériau |
| **UPDATE** | `PUT /materials/:id` | Modifier matériau |
| **DELETE** | `DELETE /materials/:id` | Supprimer matériau |
| **BULK CREATE** | `POST /materials/bulk` | Création multiple |

### 4.2 Opérations de Stock

Le service gère quatre types d'opérations :

```typescript
enum StockOperation {
  'add'      // Réapprovisionnement (+quantity)
  'remove'   // Retrait utilisation (-quantity)
  'reserve'  // Réservation projet (+reservedQuantity)
  'damage'   // Endommagé (-quantity + damagedQuantity++)
}
```

### 4.3 Interface StockMovement

```typescript
interface StockMovement {
  materialId: string;
  quantity: number;
  type: 'in' | 'out' | 'adjustment' | 'damage' | 'return' | 'reserve';
  date: Date;
  userId: string;
  projectId?: string;
  reason?: string;
  previousStock: number;
  newStock: number;
}
```

### 4.4 Seuils de Stock

| Seuil | Description | Action |
|-------|-------------|--------|
| `minimumStock` | Stock minimum | Alerte |
| `reorderPoint` | Point de commande | Déclenche commande auto |
| `maximumStock` | Stock maximum | Limite capacité |

### 4.5 QR Code et Barcode

**Génération automatique lors de la création :**
- QR code image (PNG/Base64)
- Barcode (`MAT-{timestamp}-{random}`)

```typescript
// Données stockées dans QR :
{
  "id": "...",
  "code": "MAT-CIMENT-001",
  "name": "Ciment CEM I 42.5"
}
```

**Endpoints QR :**
| Méthode | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/materials/:id/generate-qr` | Générer QR |
| **POST** | `/materials/scan-qr` | Scanner image |
| **POST** | `/materials/scan-qr-text` | Scanner texte |
| **GET** | `/materials/search/qrcode/:qrCode` | Rechercher QR |
| **GET** | `/materials/search/barcode/:barcode` | Rechercher barcode |

### 4.6 Dashboard et Alertes

**Statistiques Dashboard :**
```typescript
interface DashboardStats {
  totalMaterials: number;
  lowStockCount: number;
  outOfStockCount: number;
  healthyStockCount: number;
  categoryStats: { _id: string; count: number; totalQuantity: number }[];
  recentMovements: StockMovement[];
  timestamp: Date;
}
```

**Alertes de Stock :**
```typescript
interface StockAlert {
  materialId: string;
  materialName: string;
  currentQuantity: number;
  threshold: number;
  type: 'low_stock' | 'out_of_stock' | 'expiring' | 'overstock';
  severity: 'low' | 'medium' | 'high';
  message: string;
  date: Date;
  expiryDate?: Date;
}
```

**Types d'alertes :**
| Type | Condition | Sévérité |
|------|-----------|----------|
| **low_stock** | quantity ≤ reorderPoint | medium |
| **out_of_stock** | quantity = 0 | high |
| **expiring** | expiryDate ≤ 30 jours | medium/high |
| **overstock** | quantity > maximumStock | low |

**Tâche Cron (vérification horaire) :**
```typescript
@Cron('0 * * * *')
async checkLowStock() {
  // Vérifie les stocks bas et émet alertes WebSocket
}
```

### 4.7 Import/Export

| Format | Import | Export |
|--------|--------|---------|
| **Excel** | `POST /materials/import/excel` | `POST /materials/export/excel` |
| **PDF** | - | `POST /materials/export/pdf` |

---

## 5. Gestion des Commandes

### 5.1 Cycle de Vie d'une Commande

```
┌──────────┐    ┌────────────┐    ┌───────────┐    ┌──────────┐
│ PENDING  │───▶│ IN_TRANSIT │───▶│DELIVERED │───▶│ CLOSED   │
└──────────┘    └────────────┘    └───────────┘    └──────────┘
     │                  │
     │                  ▼
     │           ┌──────────┐
     └─────────▶│ DELAYED  │
               └──────────┘
                    │
                    ▼
             ┌────────────┐
             │ CANCELLED │
             └────────────┘
```

### 5.2 Suivi de Livraison en Temps Réel

**Calcul de progression (Formule Haversine) :**

```typescript
// Distance totale: supplier → destination
// Progression: distance_parcourue / distance_totale * 100

private calculateDistance(point1, point2): number {
  const R = 6371; // Rayon Terre (km)
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  const a = sin²(dLat/2) + cos(lat1) * cos(lat2) * sin²(dLng/2);
  const c = 2 * atan2(√a, √(1-a));
  return R * c; // Distance en km
}

private calculateProgress(start, end, current): number {
  const totalDistance = calculateDistance(start, end);
  const traveledDistance = calculateDistance(start, current);
  if (totalDistance === 0) return 100;
  return Math.min(100, Math.max(0, (traveledDistance / totalDistance) * 100));
}

private calculateRemainingTime(totalMinutes, progress): number {
  return Math.max(0, totalMinutes * (1 - progress / 100));
}
```

### 5.3 Endpoints Commandes

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/orders` | Créer commande |
| **GET** | `/orders` | Liste commandes |
| **GET** | `/orders/active` | Commandes actives |
| **GET** | `/orders/:id` | Détails commande |
| **PUT** | `/orders/:id/status` | Modifier statut |
| **PUT** | `/orders/:id/progress` | Update position |
| **POST** | `/orders/:id/simulate` | Simuler livraison |

### 5.4 Flux de Commande

```
Controller: POST /orders
    ↓
OrdersService.createOrder()
    ↓
Validate IDs (material, site, supplier)
    ↓
Fetch external data (site, supplier info)
    ↓
Calculate route (supplier → destination)
    ↓
Save MaterialOrder
    ↓
WebSocket: emitOrderUpdate() + emitDeliveryProgress()
    ↓
Response: MaterialOrder
```

---

## 6. Système de Paiement

### 6.1 Vue d'Ensemble

Le service de paiement s'intègre avec une API externe (port 3007) pour gérer :
- Les paiements en espèces (cash)
- Les paiements par carte (Stripe)
- La génération de factures

### 6.2 Flux de Paiement

```
COMMANDE LIVRÉE
      │
      ▼
┌─────────────────┐
│ Paiement Initiale│───▶ cash → "completed"
└─────────────────┘
      │
      ▼ (card)
┌─────────────────────────┐
│ Stripe PaymentIntent   │───▶ "pending"
└─────────────────────────┘
      │
      ▼ Confirmation
┌─────────────────────────┐
│ Paiement Confirmé      │───▶ "completed"
└─────────────────────────┘
      │
      ▼ Génération
┌─────────────────────────┐
│ FACTURE                │
└─────────────────────────┘
```

### 6.3 Endpoints Paiement

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/orders/:id/payment` | Initier paiement |
| **POST** | `/orders/:id/payment/confirm` | Confirmer paiement |
| **GET** | `/orders/:id/payment/status` | Statut paiement |
| **POST** | `/orders/:id/invoice` | Générer facture |

### 6.4 Méthodes PaymentService

| Méthode | Description |
|--------|-------------|
| `createPayment()` | Crée un paiement |
| `confirmCardPayment()` | Confirme paiement Stripe |
| `getPaymentStatus()` | Récupère le statut |
| `generateInvoice()` | Génère la facture |

---

## 7. Service de Chat

### 7.1 Architecture

Le chat permet la communication entre :
- **Site** (chantier)
- **Fournisseur**
- **Système** (notifications automatisées)

### 7.2 Types de Messages

```typescript
enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  VOICE = 'voice',
  LOCATION = 'location',
  ARRIVAL_CONFIRMATION = 'arrival_confirmation',
  NOTIFICATION = 'notification',
  SYSTEM = 'system',
}
```

### 7.3 Endpoints Chat

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/chat/health` | Health check |
| **GET** | `/chat/messages/:orderId` | Messages commande |
| **POST** | `/chat/messages` | Envoyer message |
| **GET** | `/chat/unread/:orderId/:userType` | Non-lus |
| **POST** | `/chat/messages/read` | Marquer lu |
| **POST** | `/chat/upload` | Upload fichier |
| **POST** | `/chat/upload-voice` | Upload vocal |
| **POST** | `/chat/location` | Partager localisation |
| **POST** | `/chat/arrival-confirmation` | Confirmer arrivée |

### 7.4 Stockage des Fichiers

```
uploads/
├── qrcodes/     # QR codes générés
├── chat/        # Fichiers chat
├── voice/       # Messages vocaux
├── imports/     # Importations
└── materials/  # Images matériaux
```

---

## 8. ML/AI - Prédiction de Stock

### 8.1 Vue d'Ensemble du Système ML

Le materials-service intègre **deux systèmes ML** pour l'optimisation des stocks :

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTÈME ML/AI                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────┐    ┌────────────────────────────┐  │
│  │  StockPredictionService   │    │    MLTrainingService    │  │
│  │  (TensorFlow.js)       │    │    (TensorFlow.js)    │  │
│  ├────────────────────────────┤    ├────────────────────────────┤  │
│  │  - Modèle synthétique   │    │  - Données réelles CSV │  │
│  │  - Linear Regression │    │  - Training         │  │
│  │  - Fallback default│    │  - Précision élevée│  │
│  └────────────────────────────┘    └────────────────────────────┘  │
│                                                                  │
│  UTILISATION:                                                   │
│  1. Upload CSV historique                                     │
│  2. Entraîner le modèle                                         │
│  3. Prédire le stock                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 StockPredictionService

Ce service utilise TensorFlow.js pour prédire l'épuisement du stock avec un modèle de régression linéaire.

#### Architecture du Modèle

```typescript
// Sequential Model
model = tf.sequential({
  layers: [
    tf.layers.dense({ inputShape: [1], units: 32, activation: 'relu' }),
    tf.layers.dense({ units: 16, activation: 'relu' }),
    tf.layers.dense({ units: 8, activation: 'relu' }),
    tf.layers.dense({ units: 1, activation: 'linear' }),
  ]
});

// Configuration
model.compile({
  optimizer: tf.train.adam(0.01),
  loss: 'meanSquaredError',
});
```

#### Pourquoi Linear Regression?

| Avantage | Description |
|---------|-------------|
| Simple | Consommation généralement linéaire |
| Rapide | Entraînement minimal |
| Interprétable | Facile à comprendre |
| Léger | Ressources minimales |

#### Méthode de Prédiction

```typescript
async predictStockDepletion(
  materialId: string,
  materialName: string,
  currentStock: number,
  minimumStock: number,
  maximumStock: number,
  reorderPoint: number,
  consumptionRate: number
): Promise<StockPredictionResult>
```

#### Résultat de Prédiction

```typescript
interface StockPredictionResult {
  materialId: string;
  materialName: string;
  currentStock: number;
  predictedStock: number;
  consumptionRate: number;
  minimumStock: number;
  reorderPoint: number;
  maximumStock: number;
  hoursToLowStock: number;
  hoursToOutOfStock: number;
  status: 'safe' | 'warning' | 'critical';
  recommendedOrderQuantity: number;
  predictionModelUsed: boolean;
  confidence: number;
  simulationData: { hour: number; stock: number }[];
  message: string;
}
```

#### Détermination du Statut

| Heures avant rupture | Statut | Message |
|---------------------|--------|---------|
| >= 72h (3 jours) | `safe` | ✅ Stock sécurisé |
| 24-72h | `warning` | ⚠️ Alerte! Stock faible |
| < 24h | `critical` | 🚨 CRITIQUE! Rupture imminente |

#### Configuration du Modèle

```typescript
const LEARNING_RATE = 0.01;
const EPOCHS = 50;
const BATCH_SIZE = 32;
```

### 8.3 MLTrainingService

Ce service permet d'entraîner des modèles personnalisés avec des données historiques réelles.

#### Format CSV Attendu

Le fichier CSV doit contenir :

```csv
hour,stock,consumption,project
2026-04-01 08:00,100,5,A
2026-04-01 09:00,95,5,A
2026-04-01 10:00,90,5,A
2026-04-01 11:00,85,5,B
```

| Colonne | Description | Requis |
|--------|-------------|-------|
| **hour** | Horodatage | ✅ Oui |
| **stock** | Niveau de stock | ✅ Oui |
| **consumption** | Consommation | ✅ Oui |
| **project** | Projet associé | Non |

#### Processus d'Entraînement

```typescript
// 1. Parser le CSV
parseCSV(csvContent: string, materialId: string): ParsedHistoricalData

// 2. Entraîner le modèle
trainModel(materialId, materialName, currentStock, reorderPoint): TrainingResult

// 3. Prédire
predictStock(materialId, hoursAhead, currentStock, reorderPoint): PredictionResult
```

#### Architecture du Modèle Entraîné

```typescript
model = tf.sequential({
  layers: [
    tf.layers.dense({ inputShape: [2], units: 32, activation: 'relu' }),
    tf.layers.dense({ units: 16, activation: 'relu' }),
    tf.layers.dense({ units: 8, activation: 'relu' }),
    tf.layers.dense({ units: 1, activation: 'linear' }),
  ]
});

// Input: [hour_index, project_encoding]
// Output: stock prédit
```

#### Interfaces Training

```typescript
interface TrainingResult {
  materialId: string;
  success: boolean;
  epochs: number;
  loss: number;
  accuracy: number;
  sampleSize: number;
  trainedAt: Date;
}

interface PredictionResult {
  materialId: string;
  materialName: string;
  currentStock: number;
  predictedStock: number;
  hoursToLowStock: number;
  hoursToOutOfStock: number;
  consumptionRate: number;
  modelTrained: boolean;
  confidence: number;
  status: 'safe' | 'warning' | 'critical';
  trainingDataAvailable: boolean;
  message: string;
}
```

### 8.4 Endpoints ML

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/materials/:id/upload-csv` | Upload CSV historique |
| **POST** | `/materials/:id/train` | Entraîner modèle |
| **GET** | `/materials/:id/predict` | Prédire stock |
| **GET** | `/materials/:id/model-info` | Info modèle |

### 8.5 Comparaison des Systèmes

| Caractéristique | StockPredictionService | MLTrainingService |
|---------------|---------------------|------------------|
| **Type** | Linear Regression | Dense Neural Network |
| **Input** | Taux consommation | Données historiques |
| **Données** | Simulé | CSV upload utilisateur |
| **Complexité** | Faible | Moyenne |
| **Entraînement** | Auto | Manuel |
| **Usage** | Default/fallback | Précision élevée |

### 8.6 Limites et Considérations

#### Limitations Actuelles

| Limitation | Description |
|------------|-------------|
| **Données synthétiques** | StockPredictionService utilise des données simulées |
| **Consommation linéaire** | Assume taux constant |
| **Pas de saisonnalité** | Ignore les variations saisonnières |
| **Pas de facteurs externes** | Ignore météo, délais, etc. |

#### Améliorations Futures Suggérées

1. **Données réelles** : Collecter consommation réelle par projet
2. **Séries temporelles** : Utiliser LSTM pour capturer patterns
3. **Facteurs externes** : Intégrer météo, calendrier
4. **Multi-matériaux** : Modèle pour dépendances entre matériaux

---

## 9. WebSocket en Temps Réel

### 9.1 MaterialsGateway (`/materials`)

#### Configuration

```typescript
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
  namespace: 'materials',
})
```

#### Événements Émis

| Événement | Description | Données |
|-----------|-------------|---------|
| `stockUpdated` | Mise à jour stock | { materialId, movement } |
| `globalStockUpdate` | Update global | { materialId, movement, timestamp } |
| `materialCreated` | Matériau créé | { material } |
| `materialUpdated` | Matériau modifié | { material } |
| `materialDeleted` | Matériau supprimé | { id } |
| `stockAlert` | Alerte stock | { alert } |
| `criticalAlert` | Alerte critique | { alert } |
| `orderProgressUpdate` | Progression commande | { orderId, progress } |
| `deliveryNotification` | Notification livraison | { notification } |
| `locationUpdated` | Update localisation | { materialId, location } |

#### Événements Reçus

| Événement | Handler |
|-----------|---------|
| `subscribeToMaterial` | S'abonner à un matériau |
| `unsubscribeFromMaterial` | Se désabonner |

### 9.2 ChatGateway (`/chat`)

#### Événements Entrants

```typescript
// Rejoindre une salle (order)
@SubscribeMessage('joinRoom')
handleJoinRoom({ orderId, userId, userName, role })

// Envoyer message
@SubscribeMessage('sendMessage')
handleSendMessage({ orderId, senderId, senderName, senderRole, content, type })

// Message vocal
@SubscribeMessage('sendVoiceMessage')
handleSendVoiceMessage({ orderId, senderId, senderName, senderRole, duration })

// Localisation
@SubscribeMessage('sendLocation')
handleSendLocation({ orderId, senderId, senderName, senderRole, location })

// En train d'écrire
@SubscribeMessage('typing')
handleTyping({ orderId, userId, userName, isTyping })

// Marquer comme lu
@SubscribeMessage('markAsRead')
handleMarkAsRead({ orderId, userId })

// Nombre de messages non lus
@SubscribeMessage('getUnreadCount')
handleGetUnreadCount({ orderId, userId })
```

#### Événements Sortants

```typescript
// Salle
client.emit('joinedRoom', { roomId, orderId, participants })
client.to(roomId).emit('userJoined', { userId, userName, role })
client.to(roomId).emit('userLeft', { userId, userName })

// Messages
client.emit('messageHistory', lastMessages)
client.to(roomId).emit('newMessage', message)

// Localisation
client.to(roomId).emit('locationUpdate', { orderId, location })
client.to(roomId).emit('deliveryProgress', { orderId, progress, location })
client.to(roomId).emit('arrivalNotification', { orderId, supplierName })

// Statut de saisie
client.to(roomId).emit('userTyping', { userId, userName, isTyping })
```

### 9.3 Rooms WebSocket

- `materials-room` - Toutes les mises à jour
- `material-{id}` - Updates spécifiques matériau
- `order-{id}` - Updates spécifiques commande
- `managers-room` - Alertes critiques

---

## 10. API Endpoints Référence

### 10.1 Materials (`/api/materials`)

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/materials` | Créer matériau |
| **GET** | `/materials` | Liste paginée |
| **GET** | `/materials/dashboard` | Statistiques |
| **GET** | `/materials/alerts` | Liste alertes |
| **GET** | `/materials/low-stock` | Matériaux stock bas |
| **GET** | `/materials/forecast/:id` | Prévision stock |
| **GET** | `/materials/movements/:id` | Historique mouvements |
| **GET** | `/materials/prediction/all` | Toutes prédictions |
| **GET** | `/materials/:id` | Détails matériau |
| **PUT** | `/materials/:id` | Modifier matériau |
| **PUT** | `/materials/:id/stock` | Mettre à jour stock |
| **DELETE** | `/materials/:id` | Supprimer |
| **POST** | `/materials/:id/reorder` | Commander auto |
| **GET** | `/materials/search/barcode/:barcode` | Recherche barcode |
| **GET** | `/materials/search/qrcode/:qrCode` | Recherche QR |
| **POST** | `/materials/bulk` | Création en masse |
| **POST** | `/materials/scan-qr` | Scanner QR image |
| **POST** | `/materials/scan-qr-text` | Scanner QR texte |
| **POST** | `/materials/:id/generate-qr` | Générer QR |
| **POST** | `/materials/:id/images` | Upload image |
| **POST** | `/materials/import/excel` | Import Excel |
| **POST** | `/materials/export/excel` | Export Excel |
| **POST** | `/materials/export/pdf` | Export PDF |

### 10.2 ML Endpoints (`/api/materials`)

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/materials/:id/upload-csv` | Upload CSV historique |
| **POST** | `/materials/:id/train` | Entraîner modèle |
| **GET** | `/materials/:id/predict` | Prédire stock |
| **GET** | `/materials/:id/model-info` | Info modèle |

### 10.3 Orders (`/api/orders`)

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/orders` | Créer commande |
| **GET** | `/orders` | Liste commandes |
| **GET** | `/orders/active` | Commandes actives |
| **GET** | `/orders/:id` | Détails commande |
| **PUT** | `/orders/:id/status` | Modifier statut |
| **PUT** | `/orders/:id/progress` | Update progression |
| **POST** | `/orders/:id/simulate` | Simuler livraison |
| **POST** | `/orders/:id/payment` | Initier paiement |
| **POST** | `/orders/:id/payment/confirm` | Confirmer paiement |
| **GET** | `/orders/:id/payment/status` | Statut paiement |
| **POST** | `/orders/:id/invoice` | Générer facture |

### 10.4 Chat (`/api/chat`)

| Méthode | Endpoint | Description |
|--------|-------------|
| **GET** | `/chat/health` | Health check |
| **GET** | `/chat/messages/:orderId` | Messages commande |
| **POST** | `/chat/messages` | Envoyer message |
| **GET** | `/chat/unread/:orderId/:userType` | Non-lus |
| **POST** | `/chat/messages/read` | Marquer lu |
| **POST** | `/chat/upload` | Upload fichier |
| **POST** | `/chat/upload-voice` | Upload vocal |
| **POST** | `/chat/location` | Partager localisation |
| **POST** | `/chat/arrival-confirmation` | Confirmer arrivée |

### 10.5 Site Materials (`/api/site-materials`)

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/site-materials/:siteId` | Matériaux par site |
| **POST** | `/site-materials` | Créer avec site |

---

## 11. Intégrations Externes

### 11.1 Services Appelés

| Service | Port | Endpoints Utilisés |
|--------|------|--------------------|
| **Sites** | 3001 | `/api/gestion-sites/:id` |
| **Payment** | 3007 | `/api/payments`, `/api/factures` |
| **Fournisseurs** | 3005 | `/fournisseurs/:id` |

### 11.2 Fallback

Si un service externe n'est pas disponible, le service utilise des valeurs par défaut :

```typescript
// Site
defaultSite = {
  nom: 'Chantier',
  adresse: 'Adresse inconnue',
  coordinates: { lat: 0, lng: 0 }
};

// Fournisseur
defaultSupplier = {
  nom: 'Fournisseur',
  adresse: 'Adresse inconnue',
  coordinates: { lat: 0, lng: 0 }
};

// Matériau (prix par défaut)
defaultPrice = 100;
```

---

## Annexes

### A. Dépendances Package.json

```json
{
  "@nestjs/common": "^11.0.1",
  "@nestjs/core": "^11.0.1",
  "@nestjs/mongoose": "^11.0.4",
  "@nestjs/platform-express": "^11.1.17",
  "@nestjs/websockets": "^11.0.0",
  "@nestjs/config": "^4.0.3",
  "@nestjs/schedule": "^11.0.0",
  "@nestjs/cache-manager": "^11.0.0",
  "@nestjs/axios": "^4.0.0",
  "@tensorflow/tfjs": "^4.22.0",
  "mongoose": "^9.3.1",
  "socket.io": "^4.7.0",
  "qrcode": "^1.5.3",
  "uuid": "^9.0.0"
}
```

### B. Codes d'Erreur Courants

| Code | Message | Cause |
|------|---------|-------|
| 400 | ID invalide | ObjectId mal formaté |
| 400 | Stock insuffisant | quantity > disponible |
| 404 | Matériau non trouvé | ID inexistant |
| 400 | Code existe déjà | Doublon code |
| 400 | CSV invalide | Mauvais format |

### C. Bonnes Pratiques

1. **Upload CSV** :Toujours uploader données avant d'entraîner
2. **Monitoring** : Surveiller les alertes de stock bas
3. **QR Codes** : Scanner régulièrement pour suivi
4. **Paiements** : Toujours attendre confirmation
5. **Consommation rate** : Mettre à jour régulièrement

---

*Document généré automatiquement - Materials Service*
*Dernière mise à jour: 2026-04-20*
*Version 1.1*