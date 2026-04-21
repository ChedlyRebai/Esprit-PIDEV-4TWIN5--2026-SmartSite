# SmartSite Platform - Documentation Technique

## Table des Matières
1. [Vue d'Ensemble du Projet](#1-vue-densemble-du-projet)
2. [Architecture des Microservices](#2-architecture-des-microservices)
3. [每个 Microservice Détailé](#3-chaque-microservice-détaillé)
4. [Fonctionnalités ML/AI](#4-fonctionnalités-mlai)
5. [Frontend](#5-frontend)
6. [Communication Inter-Services](#6-communication-inter-services)
7. [Base de Données](#7-base-de-données)
8. [API Endpoints](#8-api-endpoints)
9. [Installation et Démarrage](#9-installation-et-démarrage)
10. [Sécurité](#10-sécurité)

---

# 1. Vue d'Ensemble du Projet

## 1.1 Description
**SmartSite** est une plateforme complète de gestion de chantier construction utilisant une architecture microservices avec:
- **9 backend services** (NestJS)
- **1 frontend** (React + Vite)
- **Base de données**: MongoDB (locale)
- **ML/AI**: TensorFlow.js pour prédictions de stock

## 1.2 Architecture Globale
```
                    ┌─────────────────────────────────────┐
                    │         Frontend (React)            │
                    │   http://localhost:5173              │
                    └──────────────┬──────────────────────┘
                                   │
               ┌─────────────────┼─────────────────┼─────────────────┐
               │                 │                 │                 │
        ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
        │  Auth API  │  │  Resource   │  │  Planning   │
        │ :3000     │  │  Opt :3007  │  │  :3002     │
        └──────▲──────┘  └──────▲──────┘  └──────▲──────┘
               │                 │                 │
        ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐
        │  MongoDB    │  │  MongoDB    │  │  MongoDB   │
        │ :27017     │  │ :27017     │  │ :27017    │
        └───────────┘  └───────────┘  └───────────┘
```

## 1.3 Ports des Services
| Service | Port | Description |
|---------|-----|------------|
| user-authentication | 3000 | Auth, Users, RBAC |
| resource-optimization | 3007 | Ressources, AI |
| gestion-site | 3001 | Gestion chantiers |
| gestion-planing | 3002 | Planning, Gantt |
| materials-service | 3002 | Stock, ML prédictions |
| gestion-fournisseurs | 3005 | Fournisseurs |
| notification | 3004 | Notifications |
| incident-management | 3003 | Incidents |
| paiement | 3007 | Paiements (Stripe) |

---

# 2. Architecture des Microservices

## 2.1 Liste des Services Backend
```
apps/backend/
├── user-authentication/      # Auth + Users + RBAC + Chatbot
├── resource-optimization/    # Resource optimization + AI
├── gestion-site/            # Construction sites
├── gestion-planing/          # Planning + Gantt + Kanban
├── materials-service/        # Materials + ML/TensorFlow
├── gestion-fournisseurs/    # Suppliers
├── notification/           # Push notifications
├── incident-management/    # Incidents
└─�� paiement/              # Payments + Stripe
```

## 2.2 Stack Technologique
| Catégorie | Technologie |
|-----------|------------|
| Backend Framework | NestJS 11 |
| Frontend | React 18 + Vite 6 |
| Database | MongoDB + Mongoose |
| Auth | JWT + Passport |
| ML/AI | TensorFlow.js |
| Real-time | WebSocket (Socket.io) |
| Messaging | Apache Kafka |
| Payments | Stripe |
| Styling | Tailwind CSS + Radix UI |
| State | Zustand + TanStack Query |

---

# 3. Chaque Microservice Détaillé

## 3.1 USER-AUTHENTICATION (Port 3000)

### Description
Service central d'authentification et gestion des utilisateurs avec système RBAC (Role-Based Access Control).

### Modules
```
src/
├── auth/                    # JWT authentication
│   ├── auth.controller.ts  # /auth/login, /auth/register
│   ├── auth.service.ts
│   └── strategies/        # JWT strategy
├── users/                  # User management
│   ├── users.controller.ts
│   └── users.service.ts
├── roles/                  # Role management
├── permissions/           # Permissions system
├── teams/                 # Team management
├── suppliers/             # Supplier CRUD
├── suppliers-materials/    # Supplier-Material mapping
├── catalog/              # Product catalog
├── chatbot/              # AI chatbot
├── statics/              # Statistics
├── audit-logs/            # Audit logging
└── email/                 # Email service
```

### Fonctionnalités
- ✅ Inscription/Connexion JWT
- ✅ Approbation utilisateurs (workflow)
- ✅ Roles: admin, director, project_manager, worker, client
- ✅ Permissions granulaires
- ✅ Gestion équipes
- ✅ Catalogue produits
- ✅ Évaluation fournisseurs
- ✅ Chatbot AI (Google Cloud Vision)
- ✅ Audit logs
- ✅ Envoi emails (Nodemailer)

### Schemas MongoDB
- User, Role, Permission, Team, Supplier, CatalogItem, AuditLog

### API Endpoints Principaux
```
POST   /auth/login                # Connexion
POST   /auth/register           # Inscription
POST   /auth/approve-user/:id   # Approuver utilisateur
GET    /users                 # Liste utilisateurs
GET    /users/me              # Profil actuel
GET    /roles                # Liste roles
GET    /teams               # Liste équipes
POST   /teams/:id/members     # Ajouter membre
GET    /suppliers           # Liste fournisseurs
POST   /chatbot/message    # Message chatbot
```

---

## 3.2 RESOURCE-OPTIMIZATION (Port 3007)

### Description
Moteur d'optimisation des ressources avec système de recommandations AI et analytique.

### Modules
```
src/
├── schemas/                    # MongoDB schemas
│   ├── equipment.schema.ts     # Équipements
│   ├── worker.schema.ts       # Travailleurs
│   ├── energy-consumption.schema.ts
│   ├── alert.schema.ts        # Alertes
│   └── recommendation.schema.ts
├── modules/
│   ├── data-collection/      # CRUD données
│   │   ├── data-collection.controller.ts
│   │   └── data-collection.service.ts
│   ├── resource-analysis/    # Analyse ressources
│   │   ├── resource-analysis.controller.ts
│   │   └── resource-analysis.service.ts
│   ├── recommendation/         # Moteur recommandations AI
│   │   ├── recommendation.controller.ts
│   │   └── recommendation.service.ts
│   ├── alert/               # Système alertes
│   │   ├── alert.controller.ts
│   │   └── alert.service.ts
│   ├── reporting/          # Rapports analytics
│   │   ├── reporting.controller.ts
│   │   └── reporting.service.ts
│   └── external-data/      # API externes
└── ai/
    └── ai-recommendation.service.ts  # Logique AI
```

### Fonctionnalités
- ✅ CRUD Equipements/Travailleurs
- ✅ Tracking consommation énergie
- ✅ Détection équipements inactivity (<20%)
- ✅ Analyse pics énergétiques
- ✅ Calcul productivité travailleurs
- ✅ Génération automatique recommandations
- ✅ 5 catégories: Energie, Equipements, Travailleurs, Planification, Environnement
- ✅ Scoring confiance (0-100%)
- ✅ Estimations économies (€) et CO2 (kg)
- ✅ Système alertes (5 types, 4 niveaux sévérité)
- ✅ Rapports: Performance, Environnement, Financier
- ✅ API données externes (gestion-site)

### Catégories de Recommandations
1. **Énergie**: Optimisation consommation
2. **Équipements**: Maintenance préventive
3. **Travailleurs**: Productivité
4. **Planification**: Ressources
5. **Environnement**: Impact écologique

### Niveaux de Sévérité
- CRITICAL, HIGH, MEDIUM, LOW

### API Endpoints
```
# Data Collection
POST   /data-collection/equipment
GET    /data-collection/equipment/:siteId
POST   /data-collection/worker
POST   /data-collection/energy-consumption

# Resource Analysis
GET    /resource-analysis/idle-equipment/:siteId
GET    /resource-analysis/energy-consumption/:siteId
GET    /resource-analysis/worker-productivity/:siteId
GET    /resource-analysis/full-analysis/:siteId

# Recommendations
POST   /recommendations/generate/:siteId
GET    /recommendations/:siteId
PUT    /recommendations/:id/status  # approve/implement

# Alerts
POST   /alerts/generate/:siteId
GET    /alerts/:siteId
GET    /alerts/unread/:siteId
PUT    /alerts/:id/read
PUT    /alerts/:id/resolve

# Reporting
GET    /reports/dashboard/:siteId
GET    /reports/performance/:siteId
GET    /reports/environmental/:siteId
GET    /reports/financial/:siteId
```

---

## 3.3 GESTION-SITE (Port 3001)

### Description
Gestion des chantiers de construction avec statistiques et localisation.

### Modules
```
src/
├── sites/
│   ├── sites.controller.ts
│   └── sites.service.ts
└── projects/
    ├── projects.controller.ts
    └── projects.service.ts
```

### Fonctionnalités
- ✅ CRUD Sites
- ✅ Statistiques dashboard
- ✅ Budget tracking
- ✅ Recherche géographique
- ✅ Soft delete avec restauration
- ✅ Projects management

### API Endpoints
```
POST   /sites              # Créer site
GET    /sites              # Liste sites
GET    /sites/:id          # Détail site
PUT    /sites/:id          # Modifier site
DELETE /sites/:id          # Supprimer (soft)
GET    /sites/stats        # Statistiques
GET    /projects          # Projets
```

---

## 3.4 GESTION-PLANING (Port 3002)

### Description
Planification de projets avec support Kanban et Gantt.

### Modules
```
src/
├── task/
│   ├── task.controller.ts
│   └── task.service.ts
├── task-stage/
│   ├── task-stage.controller.ts
│   └── task-stage.service.ts
├── milestone/
│   ├── milestone.controller.ts
│   └── milestone.service.ts
└── auth/
    └── auth.middleware.ts
```

### Fonctionnalités
- ✅ Tâches (CRUD)
- ✅ Colonnes/Kanban stages
- ✅ Milestones
- ✅ Support Gantt chart
- ✅ Drag-drop dates
- ✅ Kafka pour events async

### API Endpoints
```
POST   /tasks
GET    /tasks
PUT    /tasks/:id
DELETE /tasks/:id
PUT    /tasks/:id/move        # Move entre stages
GET    /milestones
POST   /milestones
GET    /task-stages          # Colonnes Kanban
```

---

## 3.5 MATERIALS-SERVICE (Port 3002) ⭐ ML/AI

### Description
Gestion des matériaux avec **TensorFlow.js pour prédictions de stock**. Le service le plus avancé.

### Modules
```
src/
├── materials/
│   ├── materials.controller.ts
│   ├── materials.service.ts
│   ├── materials.module.ts
│   ├── schemas/
│   ���   ���── material.schema.ts
│   │   ├── order.schema.ts
│   │   └── site-material.schema.ts
│   ├── services/
│   │   ├── stock-prediction.service.ts    # Mathematical
│   │   └── ml-training.service.ts       # TensorFlow.js
│   ├── dto/
│   │   └── historical-data.dto.ts
│   └── qrcode/
│       └── qrcode.controller.ts
```

### Fonctionnalités
- ✅ CRUD Matériaux
- ✅ Gestion stock par site
- ✅ Codes QR / Barcodes
- ✅ Alertes stock bas
- ✅ Tracking expiration
- ✅ Historique mouvements
- ✅ Import/Export Excel
- ✅ Génération PDF
- ✅ **ML: Prédiction depletion stock**
- ✅ **ML: Training modèle CSV**
- ✅ **ML: Forecasting**
- ✅ WebSocket real-time

### ML/AI - TensorFlow.js Implementation

#### Modèle 1: StockPredictionService
```typescript
// Prédiction mathématique basée sur consommation
- Taux consommation = quantityconsumed / hours
- Stock final = stock initial - (taux × heures)
- Heures until OOS = currentStock / consommationRate
```

#### Modèle 2: MLTrainingService (TensorFlow.js)
```typescript
// Réseau neuronal pour prédiction temporelle
- Architecture: Sequential with Dense layers
- Input: Historical stock data (timestamps, quantities)
- Output: Predicted stock level
- Training: CSV upload avec historical data
- Prediction: Heures jusqu'à épuisement
```

#### Training Data Format (CSV)
```csv
date,hour,stock_quantity
2024-01-01,08:00,150
2024-01-01,09:00,145
2024-01-01,10:00,130
...
```

#### ML Endpoints
```
GET    /materials/prediction/all      # Toutes prédictions
GET    /materials/:id/prediction     # Prédiction unique
POST   /materials/:id/train         # Entraîner modèle CSV
POST   /materials/:id/upload-csv     # Upload CSV training
GET    /materials/:id/model-info     # Info modèle
GET    /materials/:id/has-model     # Vérifier modèle
```

### API Endpoints
```
POST   /materials
GET    /materials
GET    /materials/:id
PUT    /materials/:id
DELETE /materials/:id
GET    /materials/site/:siteId    # Par site
POST   /materials/transfer      # Transfert stock
GET    /materials/alerts       # Low stock alerts
GET    /materials/export      # Export Excel
POST   /materials/import      # Import Excel
GET    /materials/qr/:qr     # Lookup QR
POST   /qr/generate          # Generate QR
```

---

## 3.6 GESTION-FOURNISSEURS (Port 3005)

### Description
Gestion des fournisseurs et articles.

### Modules
```
src/
├── fournisseurs/
│   ├── fournisseurs.controller.ts
│   └── fournisseurs.service.ts
├── articles/
│   ├── articles.controller.ts
│   └── articles.service.ts
└── prix-articles/
    ├── prix-articles.controller.ts
    └── prix-articles.service.ts
```

### Fonctionnalités
- ✅ CRUD Fournisseurs
- ✅ Catalogue articles
- ✅ Prix par fournisseur
- ✅ Catégories filtering
- ✅ Stock monitoring

### API Endpoints
```
GET    /fournisseurs
POST   /fournisseurs
GET    /articles
POST   /articles
GET    /prix-articles
POST   /prix-articles
```

---

## 3.7 NOTIFICATION (Port 3004)

### Description
Système de notifications utilisateur.

### Modules
```
src/
├── notification/
│   ├── notification.controller.ts
│   └── notification.service.ts
└── auth/
    └── auth.middleware.ts
```

### Fonctionnalités
- ✅ Notifications push
- ✅ Read/Unread status
- ✅ Compteur non-lues
- ✅ Filtrage par utilisateur

### API Endpoints
```
POST   /notifications
GET    /notifications
GET    /notifications/unread
PUT   /notifications/:id/read
DELETE /notifications/:id
```

---

## 3.8 INCIDENT-MANAGEMENT (Port 3003)

### Description
Gestion des incidents de chantier.

### Modules
```
src/
└── incidents/
    ├── incidents.controller.ts
    └── incidents.service.ts
```

### Fonctionnalités
- ✅ Création incidents
- ✅ Tracking statut
- ✅ Catégorisation

### API Endpoints
```
POST   /incidents
GET    /incidents
GET    /incidents/:id
PUT    /incidents/:id
DELETE /incidents/:id
```

---

## 3.9 PAIEMENT (Port 3007)

### Description
Paiements avec intégration Stripe.

### Modules
```
src/
├── paiement/
│   ├── paiement.controller.ts
│   └── paiement.service.ts
├── stripe/
│   ├── stripe.controller.ts
│   └── stripe.service.ts
├── facture/
│   ├── facture.controller.ts
│   └── facture.service.ts
└── auth/
    └── auth.middleware.ts
```

### Fonctionnalités
- ✅ Création paiements
- ✅ Intégration Stripe
- ✅ Factures PDF
- ✅ Tracking par site
- ✅ Rôle-based access (accountant, admin)

### API Endpoints
```
POST   /paiements
GET    /paiements
GET    /paiements/site/:siteId
POST   /stripe/create-payment
POST   /stripe/confirm
GET    /factures
POST   /factures/generate
```

---

# 4. Fonctionnalités ML/AI

## 4.1 Materials-Service: Stock Prediction

### Architecture ML
```
┌─────────────────────────────────────────────┐
│         ML Training Pipeline               │
├─────────────────────────────────────────────┤
│  1. CSV Upload (historical data)           │
│         ↓                                 │
│  2. Data Parsing (date, hour, quantity)   │
│         ↓                                 │
│  3. TensorFlow.js Model Creation         │
│     - Input: [time]                      │
│     - Dense layers                      │
│     - Output: [predicted_stock]          │
│         ↓                                 │
│  4. Training (100 epochs)                │
│         ↓                                 │
│  5. Model Save (in-memory)               │
│         ↓                                 │
│  6. Prediction → Hours to OOS           │
└─────────────────────────────────────────────┘
```

### Modèles Implémentés

#### Model A: Mathematical (StockPredictionService)
```typescript
// Fallback sans ML
calculateDepletionTime(stock, rate) {
  hours = stock / rate
  return hours
}
```

#### Model B: TensorFlow.js (MLTrainingService)
```typescript
// Réseau neuronal
const model = tf.sequential()
model.add(tf.layers.dense({
  units: 32,
  inputShape: [1],
  activation: 'relu'
}))
model.add(tf.layers.dense({ units: 1 }))
model.compile({ loss: 'meanSquaredError' })

// Training
await model.fit(xTrain, yTrain, { epochs: 100 })

// Prediction
const prediction = model.predict(input)
```

### Données Training
- Format: CSV avec historique des niveaux de stock
- Colonnes: date, hour, stock_quantity
- Fréquence: Horaire recommandée

---

## 4.2 Resource-Optimization: AI Recommendations

### Logique de Recommandations
```typescript
interface Recommendation {
  title: string
  description: string
  category: 'energy' | 'equipment' | 'worker' | 'planning' | 'environment'
  priority: 1-10
  confidence: 0-100
  estimatedSavings: number      // euros
  estimatedCO2Reduction: number // kg
  actions: string[]
  status: 'pending' | 'approved' | 'implemented'
}
```

### Génération Automatique
1. Analyse données existantes
2. Détection anomalies (idle equipment, energy spikes)
3. Scoring confiance basé sur données dispo
4. Génération recommandations priorisées

---

## 4.3 Chatbot: User-Authentication

### Fonctionnalités
- Analyse d'images (Google Cloud Vision)
- Réponses intelligentes
- Commandes vocales

---

# 5. Frontend

## 5.1 Structure
```
apps/frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Main app
│   │   ├── routes.tsx          # Routing
│   │   ├── store/              # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   └── themeStore.ts
│   │   └── action/             # API actions
│   ├── features/
│   │   └── resource-optimization/
│   │       ├── pages/
│   │       ├── components/
│   │       └── hooks/
│   ├── components/
│   │   ├── ui/                # Radix UI components
│   │   └── layout/             # Layouts
│   ├── services/               # API services
│   └── lib/                  # API clients
└── package.json
```

## 5.2 Pages Principales

| Page | Route | Service |
|------|-------|----------|
| Login | /login | user-auth |
| Dashboard | /dashboard | - |
| Sites | /sites | gestion-site |
| Planning | /planning | gestion-planing |
| Gantt | /gantt | gestion-planing |
| Materials | /materials | materials-svc |
| Forecast | /materials/forecast | materials-svc (ML) |
| Suppliers | /suppliers | gestion-fourn |
| Payments | /payments | paiement |
| Resource Opt | /resource-optimization | resource-opt |
| Alerts | /resource-optimization/:siteId | resource-opt |
| Incidents | /incidents | incident-mgmt |
| Notifications | /notifications | notification |

## 5.3 Technologies Frontend

| Catégorie | Librairie |
|-----------|-----------|
| Framework | React 18 |
| Build | Vite 6 |
| Routing | React Router 7 |
| State | Zustand |
| Data Fetching | TanStack Query 5 |
| Forms | React Hook Form + Zod |
| UI | MUI + Radix UI |
| Icons | Lucide React |
| Charts | Recharts |
| Gantt | @svar-ui/react-gantt |
| Maps | Leaflet + React-Leaflet |
| Payments | Stripe |
| PDF | jspdf |
| Animations | Motion |

---

# 6. Communication Inter-Services

## 6.1 Patterns
- **REST**: Toutes les APIs synchrones
- **Kafka**: gestion-planing, notification (async)
- **WebSocket**: materials-service (real-time)

## 6.2 URLs
```
user-authentication:  http://localhost:3000
resource-optimization: http://localhost:3007
gestion-site:         http://localhost:3001
gestion-planing:     http://localhost:3002
materials-service:   http://localhost:3002
gestion-fournisseurs: http://localhost:3005
notification:        http://localhost:3004
incident-management: http://localhost:3003
paiement:            http://localhost:3007
```

---

# 7. Base de Données

## 7.1 Configuration
- **Host**: localhost:27017
- **Database**: smartsite
- **ORM**: Mongoose

## 7.2 Collections par Service
```
user-authentication:
  - users, roles, permissions, teams
  - suppliers, catalogitems
  - auditlogs

resource-optimization:
  - equipment, workers
  - energyconsumptions
  - alerts, recommendations

gestion-site:
  - sites, projects

gestion-planing:
  - tasks, taskstages, milestones

materials-service:
  - materials, orders, site-materials

gestion-fournisseurs:
  - fournisseurs, articles

notification:
  - notifications

incident-management:
  - incidents

paiement:
  - paiements, factures
```

---

# 8. API Endpoints

## 8.1 Auth Service (3000)
```
POST   /auth/login
POST   /auth/register
POST   /auth/logout
POST   /auth/approve-user/:userId
POST   /auth/reject-user/:userId

GET    /users
POST   /users
GET    /users/:id
PUT    /users/:id
DELETE /users/:id
GET    /users/me
PUT    /users/me/password
GET    /users/pending
GET    /users/clients

GET    /roles
POST   /roles
GET    /roles/:id
PUT    /roles/:id
DELETE /roles/:id

GET    /teams
POST   /teams
GET    /teams/:id
POST   /teams/:teamId/members/:memberId
DELETE /teams/:teamId/members/:memberId

GET    /suppliers
POST   /suppliers
GET    /suppliers/:id

GET    /catalog
POST   /catalog

POST   /chatbot/message
POST   /chatbot/voice
POST   /chatbot/analyze-image

GET    /stats
GET    /audit-logs
```

## 8.2 Resource Optimization (3007)
```
# Data Collection
POST   /data-collection/equipment
GET    /data-collection/equipment/:siteId
GET    /data-collection/equipment/item/:id
PUT    /data-collection/equipment/:id
DELETE /data-collection/equipment/:id

POST   /data-collection/worker
GET    /data-collection/worker/:siteId

POST   /data-collection/energy-consumption
GET    /data-collection/energy-consumption/:siteId

# Resource Analysis
GET    /resource-analysis/idle-equipment/:siteId
GET    /resource-analysis/energy-consumption/:siteId
GET    /resource-analysis/worker-productivity/:siteId
GET    /resource-analysis/resource-costs/:siteId
GET    /resource-analysis/full-analysis/:siteId

# Recommendations
POST   /recommendations/generate/:siteId
GET    /recommendations
GET    /recommendations/:siteId
GET    /recommendations/site/:siteId/summary
GET    /recommendations/site/:siteId/savings
PUT    /recommendations/:id/status
GET    /recommendations/:id/analytics
GET    /recommendations/site/:siteId/analytics

# Alerts
POST   /alerts/generate/:siteId
GET    /alerts/:siteId
GET    /alerts/unread/:siteId
GET    /alerts/critical/:siteId
GET    /alerts/:siteId/summary
PUT    /alerts/:id/read
PUT    /alerts/:id/resolve
DELETE /alerts/:siteId/cleanup

# Reporting
GET    /reports/performance/:siteId
GET    /reports/environmental/:siteId
GET    /reports/financial/:siteId
GET    /reports/dashboard/:siteId
GET    /reports/export/:siteId
```

## 8.3 Materials Service (3002) - ML Endpoints
```
# CRUD
POST   /materials
GET    /materials
GET    /materials/:id
PUT    /materials/:id
DELETE /materials/:id

# Stock
GET    /materials/site/:siteId
POST   /materials/transfer

# Alerts
GET    /materials/alerts
GET    /materials/low-stock

# ML Prediction ⭐
GET    /materials/prediction/all
GET    /materials/:id/prediction
POST   /materials/:id/train
POST   /materials/:id/upload-csv
GET    /materials/:id/model-info
GET    /materials/:id/has-model

# Import/Export
GET    /materials/export
POST   /materials/import

# QR Code
GET    /materials/qr/:qrCode
POST   /qr/generate
```

---

# 9. Installation et Démarrage

## 9.1 Prérequis
- Node.js 18+
- MongoDB (local ou Atlas)
- npm ou yarn

## 9.2 Backend

### Installer Dependencies
```bash
cd apps/backend/user-authentication
npm install

cd apps/backend/resource-optimization
npm install

# Répéter pour chaque service...
```

### Configurer Environment
```bash
# Copier .env.example vers .env
cp .env.example .env

# Pour user-authentication/.env:
MONGODB_URI=mongodb://localhost:27017/smartsite
PORT=3000
```

### Démarrer Services
```bash
# Terminal 1
cd apps/backend/user-authentication
npm start

# Terminal 2
cd apps/backend/resource-optimization
npm start

# Terminal 3
cd apps/backend/materials-service
npm start

# etc...
```

## 9.3 Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

## 9.4 URLs
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Auth API | http://localhost:3000 |
| Resource API | http://localhost:3007 |
| Materials | http://localhost:3002 |

---

# 10. Sécurité

## 10.1 Authentication
- JWT (JSON Web Tokens)
- Passport.js strategies
- bcrypt pour password hashing

## 10.2 Authorization
- RBAC (Role-Based Access Control)
- Permissions granulaires
- Middleware JWT sur routes sensibles

## 10.3 API Security
- CORS configuré
- Rate limiting (optionnel)
- Input validation (class-validator)

---

# Annexe: Diagrammes Architecture

## Architecture Complète
```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vite)                    │
│  ┌──────────────────────────────────────────────┐    │
│  │  React 18 + TanStack Query + Zustand         │    │
│  │  + Radix UI + Recharts + Leaflet            │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────┬─────────────────────────────────┘
                     │ HTTP REST
     ┌───────────────┼───────────────┼───────────────┐
     │               │               │               │
┌────▼────┐   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
│  Auth   │   │Resource│  │Materials│  │Planning│
│  :3000 │   │ :3007 │  │  :3002 │  │  :3002 │
└────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
     │              │            │            │
┌────┴────┐  ┌──┴────┐  ┌──┴────┐  ┌──┴────┐
│ MongoDB  │  │MongoDB│  │MongoDB│  │MongoDB│
└─────────┘  └───────┘  └───────┘  └───────┘
```

## ML Pipeline
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ CSV Data   │────▶│TensorFlow │────▶│ Predict   │
│ Upload    │     │   JS     │     │   OOS     │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                    ┌─────┴─────┐
                    │  Model   │
                    │ Storage │
                    └─────────┘
```

---

*Document généré automatiquement*
*Dernière mise à jour: 2026-04-18*