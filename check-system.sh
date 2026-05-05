#!/bin/bash

# Script de vérification du système de prédictions
# Usage: bash check-system.sh

echo "🔍 VÉRIFICATION DU SYSTÈME DE PRÉDICTIONS"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de test
test_endpoint() {
    local url=$1
    local name=$2
    
    echo -n "Testing $name... "
    
    if curl -s -f -o /dev/null "$url"; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# 1. Vérifier MongoDB
echo "1️⃣ Vérification MongoDB"
echo "----------------------"
if command -v mongosh &> /dev/null; then
    echo -e "${GREEN}✅ mongosh installé${NC}"
    
    # Tester la connexion
    if mongosh --quiet --eval "db.version()" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MongoDB connecté${NC}"
    else
        echo -e "${RED}❌ MongoDB non connecté${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ mongosh non trouvé (optionnel)${NC}"
fi
echo ""

# 2. Vérifier Materials Service
echo "2️⃣ Vérification Materials Service (port 3009)"
echo "--------------------------------------------"
test_endpoint "http://localhost:3009/api/materials" "GET /api/materials"
test_endpoint "http://localhost:3009/api/materials/predictions/all" "GET /api/materials/predictions/all"
test_endpoint "http://localhost:3009/api/material-flow" "GET /api/material-flow"
echo ""

# 3. Vérifier API Gateway (optionnel)
echo "3️⃣ Vérification API Gateway (port 9001)"
echo "---------------------------------------"
if curl -s -f -o /dev/null "http://localhost:9001"; then
    echo -e "${GREEN}✅ API Gateway accessible${NC}"
    test_endpoint "http://localhost:9001/materials" "GET /materials (via gateway)"
else
    echo -e "${YELLOW}⚠️ API Gateway non démarré (optionnel)${NC}"
fi
echo ""

# 4. Vérifier Frontend
echo "4️⃣ Vérification Frontend (port 5173)"
echo "------------------------------------"
if curl -s -f -o /dev/null "http://localhost:5173"; then
    echo -e "${GREEN}✅ Frontend accessible${NC}"
else
    echo -e "${RED}❌ Frontend non accessible${NC}"
fi
echo ""

# 5. Vérifier les fichiers de configuration
echo "5️⃣ Vérification Configuration"
echo "-----------------------------"

# Vérifier vite.config.ts
if grep -q "localhost:3009" apps/frontend/vite.config.ts 2>/dev/null; then
    echo -e "${GREEN}✅ Proxy Vite configuré (port 3009)${NC}"
else
    echo -e "${RED}❌ Proxy Vite mal configuré${NC}"
fi

# Vérifier .env materials-service
if grep -q "PORT=3009" apps/backend/materials-service/.env 2>/dev/null; then
    echo -e "${GREEN}✅ Materials Service configuré (port 3009)${NC}"
else
    echo -e "${RED}❌ Materials Service mal configuré${NC}"
fi

# Vérifier package.json
if grep -q "@tensorflow/tfjs" apps/backend/materials-service/package.json 2>/dev/null; then
    echo -e "${GREEN}✅ TensorFlow.js installé${NC}"
else
    echo -e "${RED}❌ TensorFlow.js manquant${NC}"
fi
echo ""

# 6. Résumé
echo "📊 RÉSUMÉ"
echo "========="
echo ""
echo "Services requis:"
echo "  - MongoDB: Vérifier manuellement"
echo "  - Materials Service (port 3009): Requis"
echo "  - Frontend (port 5173): Requis"
echo ""
echo "Services optionnels:"
echo "  - API Gateway (port 9001): Optionnel"
echo ""
echo "Configuration:"
echo "  - Proxy Vite: Doit pointer vers localhost:3009"
echo "  - Materials Service: Doit écouter sur port 3009"
echo "  - TensorFlow.js: Doit être @tensorflow/tfjs (pas tfjs-node)"
echo ""
echo "Pour démarrer les services:"
echo "  1. cd apps/backend/materials-service && npm start"
echo "  2. cd apps/frontend && npm run dev"
echo ""
echo "Pour plus d'informations, voir:"
echo "  - RESTART_GUIDE.md"
echo "  - FINAL_SUMMARY.md"
echo ""
