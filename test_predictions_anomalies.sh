#!/bin/bash

echo "=========================================="
echo "🧪 TEST COMPLET: Prédictions et Anomalies"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Vérifier que FastAPI est en cours d'exécution
echo "📡 Test 1: Vérification FastAPI"
echo "----------------------------------------"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ FastAPI est en cours d'exécution${NC}"
else
    echo -e "${RED}❌ FastAPI n'est PAS en cours d'exécution${NC}"
    echo "   Démarrez-le avec: cd apps/backend/ml-prediction-service && python main.py"
    exit 1
fi
echo ""

# Test 2: Vérifier que Materials Service est en cours d'exécution
echo "📡 Test 2: Vérification Materials Service"
echo "----------------------------------------"
if curl -s http://localhost:3002/api/materials/dashboard > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Materials Service est en cours d'exécution${NC}"
else
    echo -e "${RED}❌ Materials Service n'est PAS en cours d'exécution${NC}"
    echo "   Démarrez-le avec: cd apps/backend/materials-service && npm run start:dev"
    exit 1
fi
echo ""

# Test 3: Prédictions de rupture de stock
echo "🔮 Test 3: Prédictions de Rupture de Stock"
echo "----------------------------------------"
PREDICTIONS=$(curl -s http://localhost:3002/api/materials/predictions/all)

if [ -z "$PREDICTIONS" ]; then
    echo -e "${RED}❌ Aucune prédiction reçue${NC}"
else
    PRED_COUNT=$(echo "$PREDICTIONS" | jq '. | length' 2>/dev/null)
    if [ "$PRED_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ $PRED_COUNT prédictions reçues${NC}"
        echo ""
        echo "📊 Échantillon des prédictions:"
        echo "$PREDICTIONS" | jq '.[0:3] | .[] | {
            name: .materialName,
            consumption: .consumptionRate,
            confidence: .confidence,
            status: .status,
            days_until_stockout: (.hoursToOutOfStock / 24 | floor)
        }' 2>/dev/null
        
        # Vérifier que les consommations sont différentes
        echo ""
        echo "🔍 Vérification: Consommations uniques"
        UNIQUE_CONSUMPTIONS=$(echo "$PREDICTIONS" | jq '[.[].consumptionRate] | unique | length' 2>/dev/null)
        TOTAL_MATERIALS=$(echo "$PREDICTIONS" | jq '. | length' 2>/dev/null)
        
        if [ "$UNIQUE_CONSUMPTIONS" -gt 1 ]; then
            echo -e "${GREEN}✅ $UNIQUE_CONSUMPTIONS valeurs de consommation différentes sur $TOTAL_MATERIALS matériaux${NC}"
        else
            echo -e "${YELLOW}⚠️  Toutes les consommations sont identiques${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Aucune prédiction disponible${NC}"
    fi
fi
echo ""

# Test 4: Détection d'anomalies
echo "🔍 Test 4: Détection d'Anomalies (Vol/Gaspillage)"
echo "----------------------------------------"
ANOMALIES=$(curl -s http://localhost:3002/api/materials/anomalies/detect)

if [ -z "$ANOMALIES" ]; then
    echo -e "${RED}❌ Aucune anomalie reçue${NC}"
else
    SUCCESS=$(echo "$ANOMALIES" | jq -r '.success' 2>/dev/null)
    
    if [ "$SUCCESS" = "true" ]; then
        TOTAL=$(echo "$ANOMALIES" | jq -r '.total_materials' 2>/dev/null)
        DETECTED=$(echo "$ANOMALIES" | jq -r '.anomalies_detected' 2>/dev/null)
        THEFT=$(echo "$ANOMALIES" | jq '.theft_risk | length' 2>/dev/null)
        WASTE=$(echo "$ANOMALIES" | jq '.waste_risk | length' 2>/dev/null)
        OVER=$(echo "$ANOMALIES" | jq '.over_consumption | length' 2>/dev/null)
        
        echo -e "${GREEN}✅ Détection d'anomalies réussie${NC}"
        echo "   ├─ Matériaux analysés: $TOTAL"
        echo "   ├─ Anomalies détectées: $DETECTED"
        echo "   ├─ 🚨 Risques de vol: $THEFT"
        echo "   ├─ 📉 Risques de gaspillage: $WASTE"
        echo "   └─ 📊 Surconsommations: $OVER"
        
        if [ "$THEFT" -gt 0 ]; then
            echo ""
            echo "🚨 Exemple de risque de vol:"
            echo "$ANOMALIES" | jq '.theft_risk[0] | {
                material: .material_name,
                current: .current_consumption,
                average: .average_consumption,
                deviation: .deviation_percentage,
                severity: .severity
            }' 2>/dev/null
        fi
        
        if [ "$WASTE" -gt 0 ]; then
            echo ""
            echo "📉 Exemple de risque de gaspillage:"
            echo "$ANOMALIES" | jq '.waste_risk[0] | {
                material: .material_name,
                current: .current_consumption,
                average: .average_consumption,
                deviation: .deviation_percentage,
                severity: .severity
            }' 2>/dev/null
        fi
    else
        echo -e "${RED}❌ Échec de la détection d'anomalies${NC}"
        echo "$ANOMALIES" | jq '.' 2>/dev/null
    fi
fi
echo ""

# Test 5: Statistiques des datasets
echo "📊 Test 5: Statistiques des Datasets"
echo "----------------------------------------"
STATS=$(curl -s http://localhost:8000/datasets/stats)

if [ -z "$STATS" ]; then
    echo -e "${RED}❌ Impossible de récupérer les statistiques${NC}"
else
    echo -e "${GREEN}✅ Statistiques récupérées${NC}"
    echo ""
    echo "📈 Stock Prediction Dataset:"
    echo "$STATS" | jq '.stock_prediction | {
        total_records,
        materials: (.materials | length),
        avg_consumption,
        max_consumption,
        min_consumption
    }' 2>/dev/null
    
    echo ""
    echo "🔍 Anomaly Detection Dataset:"
    echo "$STATS" | jq '.anomaly_detection | {
        total_records,
        materials: (.materials | length),
        anomaly_count,
        anomaly_percentage
    }' 2>/dev/null
fi
echo ""

# Résumé final
echo "=========================================="
echo "📋 RÉSUMÉ DES TESTS"
echo "=========================================="
echo ""

# Compter les succès
TESTS_PASSED=0
TESTS_TOTAL=5

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    ((TESTS_PASSED++))
fi

if curl -s http://localhost:3002/api/materials/dashboard > /dev/null 2>&1; then
    ((TESTS_PASSED++))
fi

if [ ! -z "$PREDICTIONS" ] && [ "$PRED_COUNT" -gt 0 ]; then
    ((TESTS_PASSED++))
fi

if [ "$SUCCESS" = "true" ]; then
    ((TESTS_PASSED++))
fi

if [ ! -z "$STATS" ]; then
    ((TESTS_PASSED++))
fi

echo "Tests réussis: $TESTS_PASSED/$TESTS_TOTAL"
echo ""

if [ $TESTS_PASSED -eq $TESTS_TOTAL ]; then
    echo -e "${GREEN}✅ TOUS LES TESTS SONT PASSÉS!${NC}"
    echo ""
    echo "🎉 Le système fonctionne correctement:"
    echo "   ✅ FastAPI ML Service opérationnel"
    echo "   ✅ Materials Service opérationnel"
    echo "   ✅ Prédictions de rupture de stock fonctionnelles"
    echo "   ✅ Détection d'anomalies fonctionnelle"
    echo "   ✅ Datasets chargés et entraînés"
else
    echo -e "${YELLOW}⚠️  CERTAINS TESTS ONT ÉCHOUÉ${NC}"
    echo ""
    echo "Vérifiez:"
    echo "   1. FastAPI est démarré (port 8000)"
    echo "   2. Materials Service est démarré (port 3002)"
    echo "   3. Les datasets sont présents dans materials-service/"
fi
echo ""
echo "=========================================="
