#!/bin/bash

echo "=========================================="
echo "🧪 TEST: Vérification des Valeurs de Consommation"
echo "=========================================="
echo ""

echo "📊 Test 1: Récupération des prédictions"
echo "----------------------------------------"
curl -s http://localhost:3002/api/materials/predictions/all | jq '.[] | {
  name: .materialName,
  consumption: .consumptionRate,
  confidence: .confidence,
  status: .status
}' | head -20

echo ""
echo "=========================================="
echo "🔍 Test 2: Détection des Anomalies"
echo "=========================================="
echo ""

curl -s http://localhost:3002/api/materials/anomalies/detect | jq '{
  total_materials: .total_materials,
  anomalies_detected: .anomalies_detected,
  critical_anomalies: .critical_anomalies,
  theft_risk_count: (.theft_risk | length),
  waste_risk_count: (.waste_risk | length),
  over_consumption_count: (.over_consumption | length),
  theft_risk: .theft_risk[0:3],
  waste_risk: .waste_risk[0:3]
}'

echo ""
echo "=========================================="
echo "📈 Test 3: Statistiques du Dataset"
echo "=========================================="
echo ""

curl -s http://localhost:8000/datasets/stats | jq '{
  stock_prediction: {
    total_records: .stock_prediction.total_records,
    materials: .stock_prediction.materials,
    avg_consumption: .stock_prediction.avg_consumption,
    max_consumption: .stock_prediction.max_consumption,
    min_consumption: .stock_prediction.min_consumption
  },
  anomaly_detection: {
    total_records: .anomaly_detection.total_records,
    anomaly_count: .anomaly_detection.anomaly_count,
    anomaly_percentage: .anomaly_detection.anomaly_percentage
  }
}'

echo ""
echo "=========================================="
echo "✅ Tests Terminés"
echo "=========================================="
echo ""
echo "Vérifications:"
echo "1. ✓ Chaque matériau doit avoir une consommation DIFFÉRENTE"
echo "2. ✓ Confidence doit varier (30%, 85%, 95%)"
echo "3. ✓ Anomalies doivent être classées (theft, waste, over-consumption)"
echo "4. ✓ Dataset doit contenir plusieurs matériaux différents"
echo ""
