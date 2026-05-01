#!/bin/bash

echo "🧪 Test de Configuration Email - Materials Service"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
MATERIALS_SERVICE_URL="http://localhost:3009"
TEST_EMAIL="jamar.wisoky@ethereal.email"

echo "📋 Configuration:"
echo "   Service URL: $MATERIALS_SERVICE_URL"
echo "   Test Email: $TEST_EMAIL"
echo ""

# Test 1: Vérifier que le service est accessible
echo "1️⃣  Test: Service Materials accessible..."
if curl -s -o /dev/null -w "%{http_code}" "$MATERIALS_SERVICE_URL/api/materials/dashboard" | grep -q "200\|401"; then
    echo -e "   ${GREEN}✅ Service accessible${NC}"
else
    echo -e "   ${RED}❌ Service non accessible${NC}"
    echo "   💡 Démarrez le service avec: cd apps/backend/materials-service && npm run start:dev"
    exit 1
fi
echo ""

# Test 2: Test d'envoi d'email d'alerte
echo "2️⃣  Test: Envoi email d'alerte d'anomalie..."
RESPONSE=$(curl -s -X POST "$MATERIALS_SERVICE_URL/api/materials/email/test" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"materialName\":\"Ciment Test\"}")

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Email d'alerte envoyé avec succès${NC}"
    MESSAGE_URL=$(echo "$RESPONSE" | grep -o 'https://ethereal.email/message/[^"]*' | head -1)
    if [ ! -z "$MESSAGE_URL" ]; then
        echo "   🔗 Prévisualisation: $MESSAGE_URL"
    fi
else
    echo -e "   ${RED}❌ Échec de l'envoi de l'email d'alerte${NC}"
    echo "   Réponse: $RESPONSE"
fi
echo ""

# Test 3: Test d'envoi de rapport quotidien
echo "3️⃣  Test: Envoi rapport quotidien..."
RESPONSE=$(curl -s -X POST "$MATERIALS_SERVICE_URL/api/materials/reports/daily/send" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Rapport quotidien envoyé avec succès${NC}"
else
    echo -e "   ${RED}❌ Échec de l'envoi du rapport quotidien${NC}"
    echo "   Réponse: $RESPONSE"
fi
echo ""

# Instructions finales
echo "=================================================="
echo "📬 Vérification des emails:"
echo ""
echo "1. Allez sur: https://ethereal.email/messages"
echo "2. Connectez-vous avec:"
echo "   Username: jamar.wisoky@ethereal.email"
echo "   Password: ppg5A4AUcaFHWFP3DY"
echo "3. Vous devriez voir 2 emails:"
echo "   - 🚨 Alerte Anomalie Stock"
echo "   - 📊 Rapport quotidien matériaux"
echo ""
echo "=================================================="
