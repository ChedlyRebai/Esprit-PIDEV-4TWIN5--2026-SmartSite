#!/bin/bash

echo "🚀 Déploiement de SmartSite sur Kubernetes (Minikube)"
echo "======================================================"

# Vérifier que Minikube est démarré
echo "📋 Vérification de Minikube..."
minikube status || {
    echo "❌ Minikube n'est pas démarré. Démarrage..."
    minikube start --driver=docker
}

echo ""
echo "📦 Déploiement de MongoDB..."
kubectl apply -f k8s/mongodb-deployment.yaml

echo ""
echo "📦 Déploiement de ML Prediction Service..."
kubectl apply -f k8s/ml-prediction-service-deployment.yaml

echo ""
echo "📦 Déploiement de Materials Service..."
kubectl apply -f k8s/materials-service-deployment.yaml

echo ""
echo "📦 Déploiement du Frontend..."
kubectl apply -f k8s/frontend-deployment.yaml

echo ""
echo "📊 Déploiement de Prometheus..."
kubectl apply -f k8s/prometheus-config.yaml

echo ""
echo "📊 Déploiement de Grafana..."
kubectl apply -f k8s/grafana-deployment.yaml

echo ""
echo "⏳ Attente du démarrage des pods (30 secondes)..."
sleep 30

echo ""
echo "✅ Statut des déploiements :"
kubectl get deployments

echo ""
echo "✅ Statut des pods :"
kubectl get pods

echo ""
echo "✅ Statut des services :"
kubectl get services

echo ""
echo "🌐 URLs d'accès :"
echo "   Frontend:    $(minikube service frontend --url)"
echo "   Materials:   $(minikube service materials-service --url)"
echo "   Prometheus:  $(minikube service prometheus --url)"
echo "   Grafana:     $(minikube service grafana --url)"

echo ""
echo "🎉 Déploiement terminé !"
echo ""
echo "📝 Commandes utiles :"
echo "   - Voir les logs d'un pod : kubectl logs <pod-name>"
echo "   - Accéder à un service : minikube service <service-name>"
echo "   - Dashboard Kubernetes : minikube dashboard"
