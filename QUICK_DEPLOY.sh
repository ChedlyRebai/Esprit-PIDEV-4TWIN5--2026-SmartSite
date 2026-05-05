#!/bin/bash

# 🚀 Script de déploiement rapide - Corrections MaterialDetails

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║         🚀 DÉPLOIEMENT RAPIDE - CORRECTIONS FINALES           ║"
echo "║                                                                ║"
echo "║              GPS + Localisation + Statut Commande             ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Compiler le backend
echo -e "${BLUE}1️⃣  Compilation du backend...${NC}"
cd apps/backend/materials-service
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend compilé avec succès${NC}"
else
    echo -e "${YELLOW}❌ Erreur lors de la compilation du backend${NC}"
    exit 1
fi
cd ../../..
echo ""

# 2. Compiler le frontend
echo -e "${BLUE}2️⃣  Compilation du frontend...${NC}"
cd apps/frontend
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend compilé avec succès${NC}"
else
    echo -e "${YELLOW}❌ Erreur lors de la compilation du frontend${NC}"
    exit 1
fi
cd ../..
echo ""

# 3. Afficher les instructions de démarrage
echo -e "${BLUE}3️⃣  Instructions de démarrage:${NC}"
echo ""
echo -e "${YELLOW}Terminal 1 - Service des sites:${NC}"
echo "cd apps/backend/gestion-site && npm run start:dev"
echo ""
echo -e "${YELLOW}Terminal 2 - Service materials:${NC}"
echo "cd apps/backend/materials-service && npm run start:dev"
echo ""
echo -e "${YELLOW}Terminal 3 - Frontend:${NC}"
echo "cd apps/frontend && npm run dev"
echo ""

# 4. Afficher le résumé
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}║              ✅ COMPILATION RÉUSSIE                           ║${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}║  Démarrez les services dans 3 terminaux différents            ║${NC}"
echo -e "${GREEN}║  Puis ouvrez http://localhost:5173 dans votre navigateur      ║${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}║  Vérifiez que:                                                ║${NC}"
echo -e "${GREEN}║  ✓ Le nom du site s'affiche                                   ║${NC}"
echo -e "${GREEN}║  ✓ Les coordonnées GPS s'affichent                            ║${NC}"
echo -e "${GREEN}║  ✓ La localisation s'affiche                                  ║${NC}"
echo -e "${GREEN}║  ✓ Le statut de commande s'affiche                            ║${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
