#!/bin/bash

echo "🧪 Testing FastAPI ML Values"
echo "=============================="
echo ""

# Test 1: Health Check
echo "📋 Test 1: Health Check"
echo "------------------------"
curl -s http://localhost:8000/health | jq '.'
echo ""
echo ""

# Test 2: Dataset Statistics
echo "📋 Test 2: Dataset Statistics"
echo "------------------------------"
curl -s http://localhost:8000/datasets/stats | jq '.'
echo ""
echo ""

# Test 3: Stock Prediction with Clean Values
echo "📋 Test 3: Stock Prediction (Clean Values)"
echo "-------------------------------------------"
curl -s -X POST http://localhost:8000/predict/stock \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "MAT001",
    "material_name": "Ciment Portland",
    "current_stock": 100,
    "minimum_stock": 20,
    "consumption_rate": 5,
    "days_to_predict": 7
  }' | jq '{
    material_name,
    current_stock,
    predicted_stock_in_days,
    days_until_stockout,
    recommended_order_quantity,
    confidence,
    status
  }'
echo ""
echo ""

# Test 4: Stock Prediction with Decimal Consumption
echo "📋 Test 4: Stock Prediction (Decimal Consumption)"
echo "--------------------------------------------------"
curl -s -X POST http://localhost:8000/predict/stock \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "MAT002",
    "material_name": "Sable",
    "current_stock": 50,
    "minimum_stock": 10,
    "consumption_rate": 1.35,
    "days_to_predict": 7
  }' | jq '{
    material_name,
    current_stock,
    predicted_stock_in_days,
    days_until_stockout,
    consumption_rate: "1.35/day",
    status
  }'
echo ""
echo ""

# Test 5: Critical Stock
echo "📋 Test 5: Critical Stock Prediction"
echo "-------------------------------------"
curl -s -X POST http://localhost:8000/predict/stock \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "MAT003",
    "material_name": "Gravier",
    "current_stock": 10,
    "minimum_stock": 20,
    "consumption_rate": 8,
    "days_to_predict": 7
  }' | jq '{
    material_name,
    current_stock,
    days_until_stockout,
    status,
    message
  }'
echo ""
echo ""

echo "✅ Tests completed!"
echo ""
echo "🔍 Vérifications:"
echo "   - Les valeurs sont arrondies (pas de 15 décimales)"
echo "   - predicted_stock_in_days est correct"
echo "   - days_until_stockout est arrondi à 1 décimale"
echo "   - recommended_order_quantity est un entier"
echo "   - confidence est 0.85 (85%)"
echo ""
