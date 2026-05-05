# Variables d'environnement à configurer sur Vercel

Aller dans : Vercel Dashboard → ton projet → Settings → Environment Variables

## Variables à ajouter (toutes les environnements : Production + Preview + Development)

```
VITE_AUTH_API_URL=https://smartsite-user-authentication.onrender.com

VITE_API_GATEWAY_URL=https://smartsite-api-gateway.onrender.com

VITE_GESTION_SITE_URL=https://smartsite-api-gateway.onrender.com/sites

VITE_GESTION_PROJECTS_URL=https://smartsite-api-gateway.onrender.com/projects

VITE_PLANNING_URL=https://smartsite-api-gateway.onrender.com/planning

VITE_INCIDENT_URL=https://incident-management-q3g2.onrender.com

VITE_RESOURCE_OPTIMIZATION_URL=https://resource-optimization-m21a.onrender.com/api

VITE_GESTION_SUPPLIERS_URL=https://smartsite-api-gateway.onrender.com/suppliers

VITE_MATERIALS_URL=https://smartsite-api-gateway.onrender.com/materials

VITE_SOCKET_URL=https://smartsite-api-gateway.onrender.com
```

## ⚠️ Important : Redéployer après avoir ajouté les variables

Après avoir ajouté toutes les variables sur Vercel, déclencher un nouveau déploiement :
Deployments → ... → Redeploy

## Variables d'environnement à configurer sur Render (API Gateway)

Dans le service `smartsite-api-gateway` sur Render → Environment :

```
GESTION_PLANING_URL=https://smartsite-planning.onrender.com
NOTIFICATION_SERVICE_URL=https://smartsite-notification.onrender.com
GESTION_SITE_URL=https://smartsite-gestion-site.onrender.com
GESTION_PROJECTS_URL=https://smartsite-gestion-projects-latest.onrender.com
RESOURCE_OPTIMIZATION_URL=https://resource-optimization-m21a.onrender.com
INCIDENT_URL=https://incident-management-q3g2.onrender.com
USER_AUTHENTICATION_URL=https://smartsite-user-authentication.onrender.com
```

## URLs manquantes (à compléter quand tu les auras)

- `VIDEOCALL_SERVICE_URL` → URL Render du service videocall
- `GESTION_SUPPLIERS_URL` → URL Render du service gestion-suppliers
- `MATERIALS_SERVICE_URL` → URL Render du service materials-service
- `VITE_PAYMENT_URL` → URL Render du service paiement + `/api/payments`
