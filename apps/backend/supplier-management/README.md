# Supplier Management Microservice

Ce microservice gère les fournisseurs (suppliers) pour SmartSite.

## Fonctionnalités

- CRUD complet des fournisseurs
- Validation des champs (code 6 chiffres, email unique, etc.)
- Soft delete (is_active)
- Authentification JWT (compatible avec user-authentication)

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env` :

```env
PORT=3005
MONGODB_URI=mongodb://localhost:27017/smartsite
JWT_SECRET=votre_secret_jwt_ici
```

**Important** : Le `JWT_SECRET` doit être le même que dans `user-authentication` pour que les tokens soient valides.

## Développement

```bash
npm run start:dev
```

Le service tourne sur http://localhost:3005

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/suppliers` | Créer un fournisseur |
| GET | `/suppliers` | Lister tous les fournisseurs |
| GET | `/suppliers/:id` | Récupérer un fournisseur |
| PATCH | `/suppliers/:id` | Modifier un fournisseur |
| DELETE | `/suppliers/:id` | Désactiver un fournisseur (soft delete) |
| POST | `/suppliers/:id/reactivate` | Réactiver un fournisseur |

## Validation

- **name** : requis, max 100 caractères
- **code** : requis, exactement 6 chiffres, unique
- **email** : requis, format email valide, unique
- **phone** : requis, max 20 caractères
- **address** : requise, max 200 caractères

Champs read-only (auto-générés) :
- `quality_score` : score qualité (0-10)
- `avg_delivery_days` : délai moyen de livraison

## Test avec cURL

```bash
# Créer un fournisseur
curl -X POST http://localhost:3005/suppliers \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Supplier",
    "code": "123456",
    "email": "test@supplier.com",
    "phone": "+216 12 345 678",
    "address": "123 Test Street"
  }'
```

## Intégration Frontend

Le frontend pointe vers `http://localhost:3005` dans `supplier.action.ts`.
