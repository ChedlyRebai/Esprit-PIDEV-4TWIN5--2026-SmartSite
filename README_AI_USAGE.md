# AI Usage - SmartSite Platform

## Purpose
This document explains how Artificial Intelligence tools were used during the SmartSite Platform project across frontend, backend microservices, debugging, documentation, and testing workflows.

## 1) AI Tools Used

### Development assistants
- GitHub Copilot (VS Code)
  - Used for code suggestions, refactoring support, bug-fix drafts, test scaffolding, and documentation drafting.
- GitHub Copilot Chat (Agent mode)
  - Used for repository exploration, implementation planning, and structured updates to documentation files.
- Kiro
  - Used for AI-assisted coding workflows, implementation drafts, and productivity support during feature delivery.
- Claude
  - Used for technical writing support, code review suggestions, and structured reasoning on complex implementation tasks.

### Runtime AI services integrated in the product
- Groq API (OpenAI-compatible endpoint)
  - Used in chat/assistant modules in multiple microservices.
- OpenAI Node SDK
  - Client library used to call OpenAI-compatible APIs (including Groq endpoint).
- Google Generative AI SDK (`@google/generative-ai`)
  - Included in backend services for AI-based assistant features.
- TensorFlow.js (`@tensorflow/tfjs`)
  - Used in `materials-service` for stock prediction and anomaly-oriented ML logic.

## 2) What AI Was Used For

### A) Code generation and implementation
- Creating/accelerating service methods and controllers in NestJS microservices.
- Drafting React component logic and API integration code.
- Generating boilerplate for DTOs, schemas, and typed interfaces.

### B) Debugging and bug fixing
- Investigating endpoint mismatches and integration issues.
- Proposing fixes for data-flow problems between frontend and backend services.
- Producing correction notes and iterative fix summaries.

### C) Documentation and technical writing
- Drafting architecture summaries, implementation notes, and correction reports.
- Structuring runbooks, quick-test guides, and deployment checklists.

### D) Testing support
- Generating test ideas and test scripts for API and behavior verification.
- Assisting with edge-case enumeration for flows such as materials, weather, and history.

### E) Product AI features (end-user facing)
- Conversational assistants in several microservices.
- Stock/consumption prediction workflows in materials management.
- Recommendation and optimization assistance in resource optimization.

## 3) LLMs and Agents (Explicit)

### LLMs used in the project (runtime)
- LLaMA 3.3 70B Versatile (via Groq API)
- OpenAI-compatible chat models (through OpenAI SDK integration)

### AI/ML engines used in the project (runtime)
- TensorFlow.js models for prediction and anomaly-related logic

### Development-time AI agents/tools
- GitHub Copilot inline completion
- GitHub Copilot Chat (agent workflow in VS Code)
- Kiro assistant workflows
- Claude assistant workflows

### Additional LLMs used during development support
- Claude models (Anthropic)

### Agent used to prepare this README
- GitHub Copilot coding agent powered by GPT-5.3-Codex
- Explore subagent for read-only repository mapping

## 4) Prompt Catalog by Microservice

Below is a service-by-service prompt catalog used as reference during implementation, debugging, testing, and documentation.

### API Gateway
- "Génère un endpoint d'agrégation NestJS dans api-gateway pour combiner données site, projet et incidents, avec gestion des timeouts et erreurs partielles."
- "Propose un middleware de traçabilité (request-id) pour l'api-gateway avec logs structurés et propagation vers les microservices."
- "Crée une stratégie de retry/backoff pour les appels inter-services et ajoute un fallback propre si un service distant est indisponible."

### User Authentication
- "Génère les DTO et validations pour login/register avec contraintes fortes sur email et mot de passe."
- "Refactorise le module JWT/Passport pour supporter rôles et permissions (RBAC) avec guards NestJS clairs."
- "Crée des tests unitaires pour auth service: succès login, mot de passe invalide, token expiré, accès interdit."

### Gestion-Site
- "Génère un service CRUD complet pour les sites avec pagination, filtres, tri, et validation des coordonnées GPS."
- "Debug l'endpoint des sites qui retourne des coordonnées incohérentes et propose le correctif backend + frontend."
- "Crée une suite de tests e2e pour création, mise à jour, suppression et recherche avancée des sites."

### Gestion-Projects
- "Propose un controller NestJS pour la gestion des projets avec statuts, budget, dates et validation métier."
- "Ajoute un assistant chat projet basé sur Groq/OpenAI-compatible pour répondre sur planning et budget."
- "Crée un prompt système métier pour orienter les réponses IA sur le suivi de projet SmartSite."

### Gestion-Planing
- "Génère les endpoints planning pour tâches, jalons, dépendances et conflits de calendrier."
- "Crée une logique de détection de conflits de planning (ressource, date, charge) avec messages d'alerte."
- "Propose des tests d'intégration pour vérifier les scénarios de replanification et notifications associées."

### Materials-Service
- "Génère une méthode de prédiction de stock avec TensorFlow.js à partir de l'historique de consommation."
- "Crée la logique d'analyse d'anomalies de consommation avec classification normal/warning/critical."
- "Propose des tests pour les flux IN/OUT/ADJUSTMENT/DAMAGE/RESERVE et vérifie la cohérence du stock final."

### Gestion-Suppliers / Gestion-Fournisseurs
- "Génère les endpoints fournisseurs avec scoring, filtres multicritères et recherche géographique."
- "Crée la logique de notation fournisseur basée sur qualité, délai, coût et conformité."
- "Propose une stratégie de fusion/dédoublonnage fournisseur quand deux enregistrements semblent identiques."

### Incident-Management
- "Génère le workflow incident: création, affectation, escalade, résolution, clôture avec historique d'actions."
- "Crée un système de priorisation automatique des incidents selon impact, urgence et sécurité."
- "Rédige les tests des transitions d'état incident avec vérification des règles métier et permissions."

### Notification
- "Génère une stratégie de notifications multicanales (email/SMS/in-app) avec templates et retries."
- "Propose l'intégration Kafka consumer pour traiter les événements incident, planning et stock bas."
- "Crée des tests de robustesse notification pour échec SMTP, doublons d'événements et idempotence."

### Resource-Optimization
- "Propose un moteur de recommandations pour optimiser allocation ressources, coûts et délais."
- "Génère une logique d'alerte dépassement budget avec seuils configurables et suggestions correctives."
- "Crée un prompt d'assistant IA orienté optimisation énergétique et réduction d'empreinte CO2."

### Paiement
- "Génère les endpoints de paiement sécurisés avec validation des montants, statuts et transactions."
- "Propose un workflow Stripe avec gestion webhooks, succès/échec et journalisation audit."
- "Crée des tests pour les cas paiement accepté, refusé, remboursé et timeout de confirmation."

### Videocall
- "Génère le module d'appel vidéo avec création de session, participants, permissions et logs."
- "Propose la gestion de reconnexion automatique et états réseau faibles pour appels vidéo."
- "Crée des tests de scénario pour rejoindre/quitter appel, coupure réseau et reprise de session."

### Cross-Microservices Prompts
- "Analyse les dépendances entre microservices et génère une matrice claire des APIs consommées par service."
- "Crée une checklist de validation avant release couvrant auth, incidents, notifications, paiements et matériaux."
- "Rédige un plan de tests de non-régression inter-services après modification d'un endpoint partagé."

## 5) How AI Was Added in the App

AI was added in SmartSite with a repeatable pattern that combines runtime LLM calls and local ML logic.

### Standard integration pattern
1. Add the AI SDK dependency in the service package.
2. Configure API credentials and model name in `.env`.
3. Create a NestJS service that instantiates the AI client.
4. Define a service-specific system prompt so the assistant stays on domain.
5. Expose a controller endpoint such as `POST /chat/message` or a prediction endpoint.
6. Add fallback behavior when the AI provider is unavailable.
7. Write tests for success, failure, and edge-case responses.

### Runtime implementation style
- LLM services use the OpenAI Node SDK with a Groq-compatible `baseURL`.
- Each service keeps its own domain prompt instead of using one generic assistant.
- Response limits and temperature are configured per service to control quality and consistency.
- Materials service combines AI chat with TensorFlow.js ML prediction instead of relying only on LLMs.
- Notifications and downstream services consume AI-triggered events when needed.

### Environment variables used for AI
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `OPENAI_API_KEY` when an OpenAI-compatible provider is required
- service-specific database and integration URLs

## 6) Microservice AI Details

### API Gateway
- Role: entry point and request routing across the platform.
- AI usage: no dedicated model logic; it supports AI-enabled services by routing requests and aggregating responses.
- Value added by AI: easier access to downstream assistants and prediction endpoints through a single entry point.

### User Authentication
- Role: login, registration, JWT, roles, and permissions.
- AI usage: assistant/chat support for platform guidance and user-oriented help.
- Value added by AI: domain-aware assistance for users managing roles, permissions, and access-related questions.

### Gestion-Site
- Role: site CRUD, geolocation, and site-level management.
- AI usage: guidance can be added around site data interpretation, validation, and operational support.
- Value added by AI: helps reduce manual reasoning for site-related workflows and supports data-quality corrections.

### Gestion-Projects
- Role: project planning, budgets, timelines, and tracking.
- AI usage: chat assistant powered by an OpenAI-compatible client.
- Value added by AI: generates project-oriented guidance for planning, budget explanations, and next-step suggestions.

### Gestion-Planing
- Role: planning, schedules, and task coordination.
- AI usage: assistant support for planning scenarios and schedule interpretation.
- Value added by AI: helps users reason about task dependencies and planning conflicts.

### Materials-Service
- Role: material stock, consumption, alerts, and forecasting.
- AI usage: strongest AI module in the app.
- Value added by AI:
  - TensorFlow.js stock prediction
  - anomaly detection on consumption patterns
  - AI message analysis for sentiment/emotion/toxicity
  - smart recommendations and auto-order suggestions

### Gestion-Suppliers / Gestion-Fournisseurs
- Role: supplier data, comparison, and supplier-related workflows.
- AI usage: intelligent supplier assistance and, in parts of the repo, risk-oriented prediction support.
- Value added by AI: helps rank suppliers, interpret risk, and support delivery or sourcing decisions.

### Incident-Management
- Role: incident reporting, assignment, escalation, and closure.
- AI usage: chat assistance for incident understanding and response guidance.
- Value added by AI: improves incident triage, user guidance, and operational response drafting.

### Notification
- Role: notifications, event delivery, and alert propagation.
- AI usage: AI-assisted alert text or event enrichment can be applied before sending messages.
- Value added by AI: helps produce clearer alert content and supports event-driven communication.

### Resource-Optimization
- Role: resource allocation, optimization, planning support, and recommendation logic.
- AI usage: assistant + optimization support.
- Value added by AI: suggests better use of labor, equipment, energy, and budget with adaptive recommendations.

### Paiement
- Role: payment processing and transaction management.
- AI usage: assistant support for payment-related guidance and operational explanations.
- Value added by AI: improves support for payment flows and clarifies transaction states.

### Videocall
- Role: real-time communication and meeting support.
- AI usage: assistant support for collaboration-related scenarios.
- Value added by AI: can help users understand call features and related workflows.

### Services Without Direct AI Models
- Gestion-Fournisseurs: focused on supplier management without a dedicated model in the core flow.
- Gestion-Site: primarily CRUD and operational management.
- API Gateway: routing layer without its own model.
- Some utility scripts and deployment files do not include AI logic.

### What Makes the AI Integration Work
- AI is not centralized in one huge service; it is placed where it creates the most value.
- Each assistant uses a prompt that matches its business domain.
- ML and LLM responsibilities are separated: TensorFlow.js for forecasting, Groq/OpenAI-compatible chat for conversation.
- Services fall back safely when AI is unavailable, so the app remains usable.
- The repository documents corrections, tests, and summaries so AI-assisted work stays traceable.

## 7) Evidence in Repository (Key References)

- Root architecture and stack summary: `README.md`
- Full platform documentation (AI/ML section): `docs/SMARTSITE_PLATFORM_DOCUMENTATION.md`
- Groq/OpenAI-compatible chat implementation example: `apps/backend/gestion-projects/src/chat/chat.service.ts`
- Backend dependencies with AI SDKs:
  - `apps/backend/gestion-projects/package.json`
  - `apps/backend/resource-optimization/package.json`
  - `apps/backend/materials-service/package.json`
- Backend improvement notes mentioning OpenAI/Groq fallback logic: `BACKEND_IMPROVEMENTS_SUMMARY.md`

## 8) Governance and Human Validation
- AI outputs were treated as draft proposals.
- Final decisions, code merges, and production behavior validation remained human-reviewed.
- Functional validation was done through service tests and manual scenario checks before acceptance.

### Review workflow followed by the team
- Step 1: Generate a first draft (code/doc/test idea) with AI assistance.
- Step 2: Manually review logic, naming, architecture fit, and security impact.
- Step 3: Run local checks (build/lint/tests) and execute critical manual scenarios.
- Step 4: Apply corrections, then request peer/team validation before final merge.

### Quality and reliability checks
- API behavior was verified against expected request/response contracts.
- Sensitive paths (authentication, authorization, payments, notifications) were validated with extra caution.
- Regression risk was reduced through targeted re-tests after each important correction.
- AI suggestions that conflicted with project conventions were rewritten manually.

### Data and security considerations
- No AI suggestion was accepted directly into production without review.
- Environment variables and secrets were kept in configuration files and not hardcoded from AI output.
- Outputs that could introduce insecure patterns were rejected or rewritten.

### Traceability and accountability
- Major AI-assisted changes were accompanied by update notes or summary documents in the repository.
- Final accountability for architecture and business logic remained with the human development team.

## 9) Scope Note
This README documents AI usage observed from repository content and development workflow. If your team also used external tools (for example ChatGPT or Claude outside this repo), add them to Sections 1, 3, and 4 with exact models and prompt samples used.
