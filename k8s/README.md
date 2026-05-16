# Kubernetes manifests for SmartSite microservices

Files added:

- `namespace.yaml` — Namespace `smartsite`.
- `videocall-deployment.yaml` — Deployment + Service for the videocall backend.
- `user-auth-deployment.yaml` — Deployment + Service for user-authentication (replace image).
- `gestion-planing-deployment.yaml` — Deployment + Service for planning (replace image).

Quick start (replace image names and secret values before applying):

```bash
# create namespace
kubectl apply -f k8s/namespace.yaml

# create secrets (replace values)
kubectl create secret generic videocall-secret --from-literal=MONGO_URI='<your-mongo-uri>' -n smartsite
kubectl create secret generic user-auth-secret --from-literal=JWT_SECRET='<your-jwt-secret>' -n smartsite
kubectl create secret generic gestion-planing-secret --from-literal=DATABASE_URL='<your-db-url>' -n smartsite

# deploy services
kubectl apply -f k8s/videocall-deployment.yaml
kubectl apply -f k8s/user-auth-deployment.yaml
kubectl apply -f k8s/gestion-planing-deployment.yaml
```

Notes:
- Replace `image:` fields with your registry/image tags if you push images to a registry.
- Add Ingress or Service type `LoadBalancer` if you need external access.
- Add health probes or resource limits as needed for production.
