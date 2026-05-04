#!/bin/bash

# Script de redémarrage du Materials Service
# Usage: ./restart-materials-service.sh

echo "🔄 Redémarrage du Materials Service..."

# 1. Trouver et arrêter le processus actuel
echo ""
echo "1️⃣ Recherche du processus materials-service..."

# Trouver le PID du processus materials-service
PID=$(ps aux | grep "materials-service" | grep -v grep | awk '{print $2}' | head -1)

if [ ! -z "$PID" ]; then
    echo "   ⏹️  Arrêt du processus PID $PID..."
    kill -9 $PID 2>/dev/null
    echo "   ✅ Processus arrêté"
    sleep 2
else
    echo "   ℹ️  Aucun processus materials-service en cours"
fi

# 2. Redémarrer le service
echo ""
echo "2️⃣ Démarrage du service..."
cd apps/backend/materials-service

echo "   📦 Vérification des dépendances..."
if [ ! -d "node_modules" ]; then
    echo "   📥 Installation des dépendances..."
    npm install
fi

echo ""
echo "   🚀 Lancement de npm run start:dev..."
echo "   ⚠️  Le service va démarrer en arrière-plan"
echo "   ⚠️  Utilisez 'npm run start:dev' pour voir les logs"

npm run start:dev &

echo ""
echo "✅ Service redémarré!"
echo "📊 PID du nouveau processus: $!"
echo "🌐 Le service devrait être disponible sur http://localhost:3009"

cd ../../..
