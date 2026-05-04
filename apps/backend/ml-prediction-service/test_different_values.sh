#!/bin/bash

echo "🧪 Testing Different Values for Each Material"
echo "=============================================="
echo ""

# Test 1: Dataset Statistics
echo "📋 Test 1: Dataset Statistics"
echo "------------------------------"
curl -s http://localhost:8000/datasets/stats | jq '{
  stock_avg_consumption: .stock_prediction.avg_consumption,
  stock_median_consumption: .stock_prediction.median_consumption,
  anomaly_avg_expected: .anomaly_detection.avg_expected_consumption,
  anomaly_avg_actual: .anomaly_detection.avg_actual_consumption
}'
echo ""
echo ""

# Test 2: Specific Material Consumption (Ciment)
echo "📋 Test 2: Ciment Portland Consumption from Dataset"
echo "----------------------------------------------------"
curl -s http://localhost:8000/datasets/material-consumption/Ciment | jq '.'
echo ""
echo ""

# Test 3: Specific Material Consumption (Sable)
echo "📋 Test 3: Sable Consumption from Dataset"
echo "------------------------------------------"
curl -s http://localhost:8000/datasets/material-consumption/Sable | jq '.'
echo ""
echo ""

# Test 4: Specific Material Consumption (Béton)
echo "📋 Test 4: Béton Consumption from Dataset"
echo "------------------------------------------"
curl -s http://localhost:8000/datasets/material-consumption/Béton | jq '.'
echo ""
echo ""

# Test 5: Prediction for Ciment (high stock)
echo "📋 Test 5: Prediction for Ciment (High Stock)"
echo "----------------------------------------------"
curl -s -X POST http://localhost:8000/predict/stock \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "MAT001",
    "material_name": "Ciment Portland",
    "current_stock": 1000,
    "minimum_stock": 100,
    "consumption_rate": 13,
    "days_to_predict": 7
  }' | jq '{
    material_name,
    consumption_original: "13/day",
    days_until_stockout,
    confidence,
    status
  }'
echo ""
echo ""

# Test 6: Prediction for Sable (low consumption)
echo "📋 Test 6: Prediction for Sable (Low Consumption)"
echo "--------------------------------------------------"
curl -s -X POST http://localhost:8000/predict/stock \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "MAT002",
    "material_name": "Sable",
    "current_stock": 50,
    "minimum_stock": 10,
    "consumption_rate": 1,
    "days_to_predict": 7
  }' | jq '{
    material_name,
    consumption_original: "1/day",
    days_until_stockout,
    confidence,
    status
  }'
echo ""
echo ""

# Test 7: Prediction for Béton (critical stock)
echo "📋 Test 7: Prediction for Béton (Critical Stock)"
echo "-------------------------------------------------"
curl -s -X POST http://localhost:8000/predict/stock \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "MAT003",
    "material_name": "Béton",
    "current_stock": 10,
    "minimum_stock": 20,
    "consumption_rate": 15,
    "days_to_predict": 7
  }' | jq '{
    material_name,
    consumption_original: "15/day",
    current_stock,
    days_until_stockout,
    confidence,
    status
  }'
echo ""
echo ""

# Test 8: Prediction with zero consumption
echo "📋 Test 8: Prediction with Zero Consumption"
echo "--------------------------------------------"
curl -s -X POST http://localhost:8000/predict/stock \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "MAT004",
    "material_name": "Gravier",
    "current_stock": 100,
    "minimum_stock": 20,
    "consumption_rate": 0,
    "days_to_predict": 7
  }' | jq '{
    material_name,
    consumption_original: "0/day",
    confidence,
    status,
    message
  }'
echo ""
echo ""

echo "✅ Tests completed!"
echo ""
echo "🔍 Vérifications:"
echo "   - Chaque matériau a une consommation différente"
echo "   - La confidence varie selon la situation:"
echo "     • 0.30 pour consumption = 0"
echo "     • 0.95 pour stock critique"
echo "     • 0.85 pour situation normale"
echo "   - Les valeurs sont ajustées par le dataset ML"
echo ""
echo "📊 Vérifier les logs FastAPI pour voir:"
echo "   - Consumption Rate (ML-adjusted)"
echo "   - Consumption Rate (original)"
echo ""
