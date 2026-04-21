# SmartSite - Documentation Technique Complète

## Vue d'Ensemble du Projet

SmartSite est une plateforme de gestion智能化 de chantier de construction développée avec une architecture microservices. Elle intègre des fonctionnalités d'intelligence artificielle pour l'optimisation des ressources et un chatbot intelligent pour l'assistance.

---

## Architecture des Microservices

Le projet comprend **9 microservices**:

| Port | Service | Description |
|------|---------|-------------|
| 3000 | user-authentication | Authentification, utilisateurs, rôles, permissions |
| 3001 | gestion-site | Gestion des sites de construction |
| 3002 | gestion-planing | Planification des tâches et jalons |
| 3003 | materials-service | Gestion des matériaux et commandes |
| 3004 | resource-optimization | Optimisation intelligente des ressources (IA) |
| 3005 | gestion-fournisseurs | Gestion des fournisseurs |
| 3006 | paiement | Paiements et-factures (Stripe) |
| 3007 | notification | Notifications |
| 3008 | incident-management | Gestion des incidents |

---

## 1. User Authentication Service (Port 3000)

### Modules

- **UsersModule** - Gestion des utilisateurs
- **TeamsModule** - Gestion des équipes
- **RolesModule** - Gestion des rôles
- **PermissionsModule** - Gestion des permissions
- **SuppliersModule** - Gestion des fournisseurs
- **SuppliersMaterialsModule** - Relations fournisseurs-matériaux
- **StaticModule** - Données statiques
- **EmailModule** - Envoi d'emails
- **CatalogModule** - Catalogue de matériaux
- **ChatbotModule** - Chatbot IA (multi-langue)
- **AuditLogsModule** - Journal d'audit
- **AuthModule** - Authentification JWT

### Fonctionnalités

#### 1.1 Gestion des Utilisateurs
- Création, modification, suppression d'utilisateurs
- Attribution de rôles et permissions
- Gestion des statuts (actif/inactif)
- Suivi des activités via audit logs

#### 1.2 Gestion des Équipes
- Création d'équipes de travail
- Assignation des membres aux équipes
- Liens site-équipe
- Gestion des responsables d'équipe

#### 1.3 Gestion des Rôles et Permissions
- Rôles prédéfinis: Admin, Manager, Worker, Viewer
- Permissions granulaires par fonctionnalité
- Système de contrôle d'accès

#### 1.4 Fournisseurs
- Catalogue des fournisseurs
- Évaluations des fournisseurs
- Gestion des matériaux par fournisseur

#### 1.5 Catalogue
- Catalogue centralisé de matériaux
- Catégorisation des articles
- Gestion des prix

### Partie IA/ML - Chatbot Intelligent 🤖

#### Architecture du Chatbot

```typescript
// Fichiers clés:
// - chatbot.service.ts (1005 lignes)
// - chatbot.controller.ts
// - chatbot.module.ts
// - entities/chatbot-conversation.entity.ts
```

#### Fonctionnalités IA du Chatbot

1. **Traitement du Language Naturel (NLP)**
   - Détection d'intention (intent detection)
   - Système de patterns pour requêtes fréquentes
   - Fallback intelligent pour requêtes non reconnues

2. **FAQ Intelligentes**
   - Catégories: création de site, gestion d'équipe, sécurité
   - Réponses multi-langues (EN, FR, AR)
   - Recherche contextuelle

3. **Analyse d'Images** 📷
   - Intégration avec **Imagga API** (tags d'images)
   - Support **Google Cloud Vision** (optionnel)
   - Extraction de labels et descriptions
   - Analyse de sécurité (filtrage contenu)

4. **Traitement Vocal** 🎤
   - Placeholder pour traitement de messages vocaux
   - Transcription

5. **Gestion de Conversation**
   - Conservation de l'historique
   - Suggestions contextuelles
   - Quick replies dynamiques

#### Flux du Chatbot

```
Message utilisateur
       ↓
Détection FAQ prioritaire → Recherche dans FAQ DB
       ↓ (sinon)
Détection d'intention (NLP)
       ↓
Exécution action (si applicable)
       ↓
Génération réponse multi-langue
       ↓
Retour avec suggestions
```

#### APIs d'Analyse d'Images

| Provider | Utilisation | Configuration |
|----------|------------|----------------|
| Imagga | Tags principaux | `IMAGGA_API_KEY`, `IMAGGA_API_SECRET` |
| Google Cloud Vision | Analyse avancée | `GOOGLE_CLOUD_VISION_API_KEY` |

#### Intentions supportées

- `greeting` - Salutations
- `get_users` - Liste utilisateurs
- `get_teams` - Liste équipes
- `get_roles` - Liste rôles
- `fallback` - Requête non reconnue

---

## 2. Gestion Site Service (Port 3001)

### Modules

- **AppModule** principal

### Fonctionnalités

- Gestion des sites de construction
- Informations des sites (nom, adresse, coordonnées GPS)
- Budget et timeline par site
- Assignation des équipes aux sites
- Suivi de l'avancement

---

## 3. Gestion Planning Service (Port 3002)

### Modules

- **TaskModule** - Gestion des tâches
- **TaskStageModule** - Étapes des tâches
- **MilestoneModule** - Jalons
- **AuthModule** - Authentification JWT

### Fonctionnalités

#### 3.1 Gestion des Tâches
- Création de tâches avec propriétés:
  - Titre, description
  - Priorité (urgent, high, medium, low)
  - Statut (pending, in_progress, completed)
  - Dates de début et fin
  - Budget
  - Assignation (membreunique ou équipe)
  - Sous-tâches
  - PiècesJointes

#### 3.2 Étapes de Tâches
- Définition des étapes de travail
- Tracking d'avancement
- Statuts personnalisés

#### 3.3 Jalons (Milestones)
- Création de jalons majeurs
- Association aux tâches
- Suivi de progression
- Dates d'échéance

---

## 4. Materials Service (Port 3003)

### Modules

- **MaterialsModule** - Gestion des matériaux
- **ChatModule** - Chat temps réel (WebSocket)

### Fonctionnalités

- Gestion du stock de matériaux
- Suivi des niveaux d'inventaire
- Alertes de stock bas
- Commandes de matériaux
- Historique des mouvements
- **Chat en temps réel** pour la communication d'équipe

### Chat en Temps Réel 💬

Architecture WebSocket pour:
- Messages instantanés entre équipes
- Notifications de proximité
- Alerts de matériaux

---

## 5. Resource Optimization Service (Port 3004) -🏆 CŒUR IA

### Modules

- **ResourceAnalysisModule** - Analyse des ressources
- **ReportingModule** - Rapports
- **RecommendationModule** - Système de recommandations
- **ExternalDataModule** - Données externes
- **DataCollectionModule** - Collecte de données
- **AlertModule** - Système d'alertes
- **AIModule** - Moteur IA principal

### Fonctionnalités

#### 5.1 Analyse des Ressources

```typescript
// Schemas surveillés:
// - Equipment (équipements)
// - Worker (ouvriers)
// - EnergyConsumption (consommation énergie)
```

- **Détection d'équipements sous-utilisés** (< 20% utilisation)
- **Analyse de consommation d'énergie**
  - Détection des pics de consommation
  - Calcul des émissions CO2
  - Gestion des déchets
- **Productivité des travailleurs**
  - Scoring de productivité
  - Calcul des coûts horaire
  - Répartition efficacité (high/medium/low)

#### 5.2 Rapports

- Rapports d'analyse complets
- Métriques de performance
- Intégration données externes

#### 5.3 Système de Recommandations

- Enregistrement des recommandations
- Cycle de vie: pending → approved → implemented
- Tracking des économies réalisées
- Réduction CO2 estimée
- Analyse avant/après

---

## 🧠 Partie IA/ML - Moteur d'Optimisation

### Architecture IA

#### Fichier principal: `ai-recommendation.service.ts`

```typescript
// Méthodes principales:
- generateRecommendations()     // Génération principale
- analyzeProjectData()        // Analyse des données projet
- analyzeTaskDistribution()  // Répartition des tâches
- analyzeBudgetUsage()       // Utilisation du budget
- analyzeTimeline()          // Analyse des délais
- analyzeResources()        // Analyse des ressources
```

### Types de Recommandations IA

| Type | Description |
|------|-------------|
| `budget` | Optimisation budget |
| `task_distribution` | Répartition des tâches |
| `timeline` | Gestion des délais |
| `resource_allocation` | Allocation des ressources |
| `individual_task_management` | Gestion individuelle |

### Algorithmes Implémentés

#### 1. Analyse de Répartition des Tâches

```typescript
// Calcul:
// - Distribution parcentage par tâche
// - Charge de travail par membre
// - Moyenne de charge
// - Détection surcharge/sous-charge
//   • overloadedMembers: charge > moyenne * 1.5
//   • underloadedMembers: charge < moyenne * 0.5
```

#### 2. Analyse Budgétaire

```typescript
// Simulation:
// - Coût par tâche selon priorité
//   • urgent: 1.5x
//   • high: 1.2x
//   • other: 1x
// - Détection dépassement бюджет
// - calculated overrun_percentage
```

#### 3. Analyse des Délais

```typescript
// Métriques:
// - Jours jusqu'échéance
// - Détection tâches en retard
// - Détection tâches urgentes (<= 3 jours)
// - Moyenne jours restants
```

#### 4. Analyse des Ressources

```typescript
// Métriques:
// - ratio tâches/membre
// - Détection manque personnel
// - Détection surcharge
// - Gap de compétences
```

### Recommandations Individuelles

Pour chaque membre d'équipe:
- **Tâches assignées** - Vérification
- **Charge haute priorité** - Alerte si > 3
- **Tâches en retard** - Priorité urgente
- **Durée moyenne** - Suggestion optimisation (max 7 jours)
- **Équilibre complexité** - Mix tâches easy/dures

### Scoring et Priorisation

```typescript
const priorities = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
};
// Tri décroissant des recommandations
```

### Flux de Génération

```
1. Réception données projet (site, tasks, teams, budget)
       ↓
2. Analyse multi-dimensionnelle
   - taskAnalysis
   - budgetAnalysis
   - timelineAnalysis
   - resourceAnalysis
       ↓
3. Génération recommandations par type
       ↓
4. Fusion et tri par priorité
       ↓
5. Fallback si erreur
```

### Métriques de Performance

#### Captured Metrics (avant/après)

```typescript
interface Metrics {
  budget: {
    total: number;
    spent: number;
    remaining: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    avgDuration: number;
  };
  teams: {
    total: number;
    totalMembers: number;
    avgWorkload: number;
  };
  efficiency: {
    taskCompletionRate: number;
    budgetUtilization: number;
    teamProductivity: number;
  };
}
```

#### Améliorations Calculées

| Type | Métriques |
|------|---------|
| budget | budgetSavings, budgetUtilizationImprovement |
| task_distribution | workloadBalanceImprovement, productivityImprovement |
| timeline | overdueTasksReduction, completionRateImprovement |
| individual | taskDurationImprovement, personalEfficiencyImprovement |

---

## 6. Gestion Fournisseurs Service (Port 3005)

### Modules

- **FournisseursModule** - Gestion des fournisseurs
- **ArticlesModule** - Gestion des articles
- **PrixArticlesModule** - Gestion des prix

### Fonctionnalités

- CRUD fournisseurs
- Gestion catalogue articles
- Historique des prix
- Comparaison de prix
- Données fournisseurs multiples

---

## 7. Paiement Service (Port 3006)

### Modules

- **PaiementModule** - Service principal
- **StripeModule** - Intégration Stripe
- **FactureModule** - Gestion des factures

### Fonctionnalités

#### 7.1 Paiements Stripe

- Intégration Stripe API
- Création de payment intents
- Traitement des paiements
- Webhooks Stripe

#### 7.2 Gestion des Factures

- Génération automatique de factures
- Suivi des paiements
- Statuts: pending, paid, overdue

#### 7.3 Authentification

- JWT Guard
- Roles Guard (admin, worker, manager)

---

## 8. Notification Service (Port 3007)

### Modules

- **NotificationModule** - Envoyeur de notifications

### Fonctionnalités

- Notifications multi-canaux
- Notifications de projet
- Alerts de deadline
- Alertes de sécurité

---

## 9. Incident Management Service (Port 3008)

### Modules

- **IncidentsModule** - Gestion des incidents

### Fonctionnalités

- Création d'incidents
- Typologie d'incidents
- Sévérité: low, medium, high, critical
- Statut: open, in_progress, resolved, closed
- Assignation à des utilisateurs
- Rapports photos
- Suivi地理ographique

---

## Schéma d'Intégration des Services

```
┌──────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React/Vite)                    │
└──────────────────────┬─────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
┌──────────────┐ ┌────────────┐ ┌──────────────┐
│   Port 3000 │ │ Port 3001 │ │  Port 3002  │
│   (Auth)   │ │  (Site)   │ │  (Planning) │
└──────────────┘ └────────────┘ └──────────────┘
        │              │              │
        └──────────────┼──────────────┘
                     ↓
┌──────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Port 3003   │ │ Port 3004 │ │ Port 3005 │ │ Port 3006 │
│ (Materials) │ │(Optimiz. IA)│ │(Fournis.)│ │(Payment) │
└──────────────┘ └────────────┘ └────────────┘ └────────────┘
                              │
        ┌───────────────────────┼───────────────────────┐
        ↓                       ↓                       ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Port 3007   │ │  Port 3008  │ │   WebSocket  │
│(Notif.)     │ │(Incidents) │ │   (Chat)    │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## Base de Données

Architecture MongoDB avec collections par service:

### user-authentication
- users
- teams
- roles
- permissions
- suppliers
- supplier_materials
- catalog_items
- chatbot_conversations
- audit_logs
- static_data

### gestion-site
- sites
- site_teams
- site_equipment

### gestion-planing
- tasks
- task_stages
- milestones

### materials-service
- materials
- material_orders
- alerts
- chat_messages

### resource-optimization
- recommendations
- equipment
- workers
- energy_consumption
- alerts

### gestion-fournisseurs
- fournisseurs
- prix_articles

### paiement
- payments
- factures

### incident-management
- incidents

---

## Technologies Utilisées

| Catégorie | Technologies |
|-----------|-------------|
| Backend | NestJS, Node.js, TypeScript |
| Database | MongoDB, Mongoose |
| Auth | JWT, Passport |
| IA/ML | Algorithmes analytiques (en mémoire), APIs externes |
| Images | Imagga API, Google Cloud Vision |
| Paiement | Stripe API |
| Real-time | WebSocket (Socket.io) |
| Frontend | React, Vite, TypeScript |
| Charts | Recharts, Chart.js |

---

## Configuration Environnement (.env)

```env
# Auth Service
JWT_SECRET=votre_secret_jwt
JWT_EXPIRATION=86400

# MongoDB
MONGO_AUTH=mongodb://localhost:27017/auth

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Chatbot Image Analysis
IMAGGA_API_KEY=...
IMAGGA_API_SECRET=...
GOOGLE_CLOUD_VISION_API_KEY=...

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...

# Services URLs
GESTION_SITE_URL=http://localhost:3001
GESTION_PLANNING_URL=http://localhost:3002
```

---

## Points d'API Principaux

### Resource Optimization (IA)

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/recommendations` | Générer recommandations IA |
| GET | `/resource-analysis/:siteId` | Analyse complète |
| GET | `/reporting/:siteId` | Rapports |
| GET | `/recommendations` | Liste recommandations |
| POST | `/recommendations/:id/approve` | Approuver |
| POST | `/recommendations/:id/implement` | Implémenter |
| GET | `/recommendations/:id/analytics` | Analytics |

### Chatbot (IA)

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chatbot/message` | Envoyer message |
| POST | `/chatbot/analyze-image` | Analyser image |
| POST | `/chatbot/voice` | Traiter audio |
| GET | `/chatbot/conversations` | Historique |
| POST | `/chatbot/feedback` | FeedBack |

---

## Résumé Partie IA/ML

### 1. 🧠 Chatbot Intelligent (User Auth Service)

- **NLP**: Détection d'intentions
- **FAQ**:-base de connaissances
- **Images**: Analyse via Imagga/Google Vision
- **Multi-langue**: EN, FR, AR
- **Conversation**: Gestion上下文

### 2. 🎯 Moteur de Recommandations (Resource Optimization)

- **Analyse multi-dimensionnelle**:
  - Budget
  - Tâches
  - Ressources
  - Délais
- **Recommandations intelligentes**:
  - Optimisation budget
  - Équilibre charge
  - Gestion délais
  - Recommandations individuelles
- **Analytics** avant/après :
  - Économies réalisées
  - Productivité
  - Réduction CO2
- **Métriques**:
  - Task completion rate
  - Budget utilization
  - Team productivity

### 3. 🔍 Analyse d'Équipements et Ressources

- Détection équipements sous-utilisés
- Analyse consommation énergie
- Scoring productivité travailleurs
- Calcul impact environnemental

---

## Glossaire

| Terme | Définition |
|-------|-------------|
| Microservice | Architecture分布式 |
| Intent | Intention utilisateur (NLP) |
| Recommendation | Suggestion IA |
| Analytics | Analyse métriques |
| WebSocket | Communication temps réel |
| JWT | JSON Web Token (auth) |
| milestone | Jalon de projet |
| task stage | Étape de tâche |

---

*Document généré automatiquement - SmartSite Project*
*Dernière mise à jour: 2026-04-19*