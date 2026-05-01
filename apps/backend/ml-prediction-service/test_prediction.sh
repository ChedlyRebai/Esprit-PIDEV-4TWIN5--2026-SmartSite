#!/bin/bash

echo "🧪 Testing FastAPI ML Prediction Service"
echo "========================================"
echo ""

# Test 1: Health Check
echo "📋 Test 1: Health Check"
echo "------------------------"
curl -s http://localhost:8000/health | jq '.'
echo ""
echo ""

# Test 2: Stock Prediction
echo "📋 Test 2: Stock Prediction"
echo "----------------------------"
curl -s -X POST http://localhost:8000/predict/stock \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "test123",
    "material_name": "Ciment Portland",
    "current_stock": 100,
    "minimum_stock": 20,
    "consumption_rate": 5,
    "days_to_predict": 7
  }' | jq '.'
echo ""
echo ""

# Test 3: Critical Stock Prediction
echo "📋 Test 3: Critical Stock (Low Stock)"
echo "--------------------------------------"
curl -s -X POST http://localhost:8000/predict/stock \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "test456",
    "material_name": "Sable",
    "current_stock": 10,
    "minimum_stock": 20,
    "consumption_rate": 8,
    "days_to_predict": 7
  }' | jq '.'
echo ""
echo ""

# Test 4: Consumption Anomaly Detection
echo "📋 Test 4: Consumption Anomaly Detection"
echo "-----------------------------------------"
curl -s -X POST http://localhost:8000/predict/consumption-anomaly \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "test789",
    "material_name": "Gravier",
    "current_consumption": 150,
    "average_consumption": 100,
    "std_consumption": 10
  }' | jq '.'
echo ""
echo ""

echo "✅ Tests completed!"
echo ""
echo "🔍 Check the FastAPI terminal for detailed logs showing:"
echo "   - 🔮 [FASTAPI] STOCK PREDICTION REQUEST"
echo "   - 🎯 [FASTAPI] PREDICTION RESULT"
echo ""
