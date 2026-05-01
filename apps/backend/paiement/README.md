# Microservice Paiement - SmartSite

Service de gestion des paiements pour la plateforme SmartSite.

## 🚀 Démarrage

### Prérequis
- Node.js 20+
- MongoDB
- npm ou yarn

### Installation
```bash
npm install
```

### Configuration
Créer un fichier `.env` avec les variables suivantes:
```env
PORT=3008
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smartsite-paiement
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### Développement
```bash
npm run start:dev
```

### Tests
```bash
# Tests unitaires
npm test

# Tests avec coverage
npm run test:cov

# Tests en mode watch
npm run test:watch
```

### Build
```bash
npm run build
```

### Production
```bash
npm run start:prod
```

## 🐳 Docker

### Build de l'image
```bash
docker build -t smartsite-paiement .
```

### Lancer le container
```bash
docker run -d \
  --name paiement \
  -p 3008:3008 \
  -e MONGODB_URI="mongodb://host.docker.internal:27017/smartsite-paiement" \
  smartsite-paiement
```

## 📊 CI/CD

### Pipeline CI (Jenkinsfile)
- Checkout du code
- Installation des dépendances
- Tests unitaires avec coverage
- Build
- Analyse SonarQube
- Quality Gate
- Déclenchement du CD

### Pipeline CD (Jenkinsfile-CD)
- Checkout du code
- Build de l'image Docker
- Push sur Docker Hub
- Déploiement du container

### Credentials Jenkins requis
- `docker-hub-credentials`: Identifiants Docker Hub (username/password)
- `mongodb-uri`: URI de connexion MongoDB

## 🔗 API Endpoints

Le service expose les endpoints suivants:
- `POST /paiement` - Créer un paiement
- `GET /paiement/:id` - Récupérer un paiement
- `GET /paiement` - Lister les paiements
- `PUT /paiement/:id` - Mettre à jour un paiement
- `DELETE /paiement/:id` - Supprimer un paiement

## 📝 Port
Le service écoute sur le port **3008**
