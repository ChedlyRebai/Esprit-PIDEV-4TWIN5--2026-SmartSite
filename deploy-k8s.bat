@echo off
echo ========================================
echo Deploiement de SmartSite sur Kubernetes
echo ========================================
echo.

echo Verification de Minikube...
minikube status
if errorlevel 1 (
    echo Demarrage de Minikube...
    minikube start --driver=docker
)

echo.
echo Deploiement de MongoDB...
kubectl apply -f k8s/mongodb-deployment.yaml

echo.
echo Deploiement de ML Prediction Service...
kubectl apply -f k8s/ml-prediction-service-deployment.yaml

echo.
echo Deploiement de Materials Service...
kubectl apply -f k8s/materials-service-deployment.yaml

echo.
echo Deploiement du Frontend...
kubectl apply -f k8s/frontend-deployment.yaml

echo.
echo Deploiement de Prometheus...
kubectl apply -f k8s/prometheus-config.yaml

echo.
echo Deploiement de Grafana...
kubectl apply -f k8s/grafana-deployment.yaml

echo.
echo Attente du demarrage des pods (30 secondes)...
timeout /t 30 /nobreak

echo.
echo Statut des deployments:
kubectl get deployments

echo.
echo Statut des pods:
kubectl get pods

echo.
echo Statut des services:
kubectl get services

echo.
echo URLs d'acces:
echo    Frontend:    minikube service frontend --url
echo    Materials:   minikube service materials-service --url
echo    Prometheus:  minikube service prometheus --url
echo    Grafana:     minikube service grafana --url

echo.
echo Deploiement termine!
pause
