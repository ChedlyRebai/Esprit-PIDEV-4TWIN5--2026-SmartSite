# ✅ Production Deployment Checklist

## Phase 1: Préparation (Jour 1)

### Configuration & Sécurité
- [ ] Copier `.env.example` → `.env`
- [ ] Définir `MONGODB_URI` production
- [ ] Générer `JWT_SECRET` (openssl rand -hex 32)
- [ ] Définir `NODE_ENV=production`
- [ ] Configurer `CORS_ORIGIN` correct
- [ ] Enabled HTTPS/SSL

### Dépendances
- [ ] `npm install` sans `--save-dev`
- [ ] `npm audit fix` (résoudre vulnérabilités)
- [ ] Tester `npm run build`
- [ ] Tester `node dist/main.js`

### Base de données
- [ ] MongoDB production déployée
- [ ] Connection string testée
- [ ] Authentification MongoDB activée
- [ ] Backups configurés
- [ ] Indexes créés:
  ```js
  db.equipment.createIndex({ siteId: 1 })
  db.worker.createIndex({ siteId: 1 })
  db.energyconsumption.createIndex({ siteId: 1, dateLogged: 1 })
  db.recommendation.createIndex({ siteId: 1, status: 1 })
  db.alert.createIndex({ siteId: 1, severity: 1 })
  ```

### Tests
- [ ] `npm run test` réussi
- [ ] `npm run test:cov` > 70%
- [ ] `npm run test:e2e` réussi
- [ ] `npm run lint` no errors

---

## Phase 2: Docker & Containerization (Jour 1-2)

### Dockerfile
- [ ] Créer `Dockerfile`
- [ ] Image de base: `node:18-alpine`
- [ ] Build layer et run layer séparés
- [ ] Exposer port 3007
- [ ] Définir healthcheck

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3007/api', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3007

CMD ["node", "dist/main.js"]
```

### Docker Compose (Development)
- [ ] Fichier `docker-compose.yml` avec:
  - MongoDB
  - Service NestJS
  - Networks & volumes
  - Env vars

### Build & Test
- [ ] `docker build -t smartsite/resource-optimization:1.0.0 .`
- [ ] `docker run -p 3007:3007 smartsite/resource-optimization:1.0.0`
- [ ] Tester: `curl http://localhost:3007/api/health` (ajouter endpoint)

---

## Phase 3: Kubernetes (Jour 2-3)

### Manifests
- [ ] Créer `k8s/namespace.yaml`
- [ ] Créer `k8s/secret.yaml` (env vars)
- [ ] Créer `k8s/configmap.yaml` (config)
- [ ] Créer `k8s/deployment.yaml`
- [ ] Créer `k8s/service.yaml`
- [ ] Créer `k8s/ingress.yaml` (optional)

### Deployment YAML template
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: resource-optimization
  namespace: smartsite
spec:
  replicas: 3
  selector:
    matchLabels:
      app: resource-optimization
  template:
    metadata:
      labels:
        app: resource-optimization
    spec:
      containers:
      - name: resource-optimization
        image: smartsite/resource-optimization:1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3007
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: uri
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3007
          initialDelaySeconds: 10
          periodSeconds: 30
```

### Deploy
- [ ] `kubectl create namespace smartsite`
- [ ] `kubectl apply -f k8s/secret.yaml`
- [ ] `kubectl apply -f k8s/configmap.yaml`
- [ ] `kubectl apply -f k8s/deployment.yaml`
- [ ] `kubectl apply -f k8s/service.yaml`
- [ ] `kubectl apply -f k8s/ingress.yaml`
- [ ] Vérifier: `kubectl get pods -n smartsite`

### Monitoring
- [ ] Configurer Prometheus scraping
- [ ] Configurer Grafana dashboards
- [ ] Configurer alerts (PagerDuty)

---

## Phase 4: Node.js Optimization (Jour 3)

### Process Manager (PM2 ou systemd)

**PM2:**
- [ ] `npm install -g pm2`
- [ ] Créer `ecosystem.config.js`
- [ ] `pm2 start ecosystem.config.js`
- [ ] `pm2 save`

```js
module.exports = {
  apps: [{
    name: 'resource-optimization',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3007
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### Environment
- [ ] Définir `NODE_ENV=production`
- [ ] Définir `LOG_LEVEL=info`
- [ ] Désactiver sourcemaps en prod
- [ ] Optimiser: `npm rebuild`

### Performance
- [ ] Ajouter compression middleware
- [ ] Activer HTTP/2
- [ ] Configurer caching headers
- [ ] Minifier JavaScript

---

## Phase 5: Monitoring & Logging (Jour 3-4)

### Logging centralisé
- [ ] Configurer ELK Stack OU CloudWatch OU Datadog
- [ ] JSON structured logs
- [ ] Log rotation (Winston ou Bunyan)
- [ ] Archivage 30 jours

```typescript
// logs.ts
import * as winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Métriques APM
- [ ] Configurer New Relic OU Datadog OU Dynatrace
- [ ] Tracer les requêtes
- [ ] Monitorer performance DB
- [ ] Alertes sur seuils

### Alertes
- [ ] CPU > 80% pendant 5 min → Alert
- [ ] Mémoire > 90% → Alert
- [ ] Error rate > 5% → Alert
- [ ] Response time > 2s → Alert
- [ ] DB connection failed → Alert CRITICAL

---

## Phase 6: Sécurité (Jour 4)

### API Security
- [ ] JWT authentication en place
- [ ] Rate limiting (express-rate-limit)
- [ ] Input validation (class-validator)
- [ ] SQL/Injection prevention (N/A pour MongoDB)
- [ ] CORS configured correctly

```typescript
import * as rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Infrastructure Security
- [ ] Firewall rules configured
- [ ] Only ports 80, 443, 3007 open
- [ ] SSH key added to CI/CD
- [ ] Secrets managed (HashiCorp Vault)
- [ ] SSL/TLS certificates (Let's Encrypt)

### Code Security
- [ ] `npm audit` ✅
- [ ] Dependency updates regular
- [ ] Secrets not in git
- [ ] `.gitignore` includes:
  - node_modules/
  - .env
  - dist/
  - *.log
  - .DS_Store

### Database Security
- [ ] MongoDB authentication enabled
- [ ] Network firewall for DB
- [ ] Automated backups
- [ ] Encryption at rest
- [ ] User roles (read-only vs admin)

---

## Phase 7: CI/CD Pipeline (Jour 4-5)

### GitHub Actions (ou GitLab CI)

```yaml
name: Deploy Resource Optimization

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: |
          cd apps/backend/resource-optimization
          npm install
      
      - name: Run tests
        run: npm run test:cov
      
      - name: Build Docker image
        run: docker build -t smartsite/resource-optimization:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          docker login -u ${{ secrets.DOCKER_USER }} -p ${{ secrets.DOCKER_PASS }}
          docker push smartsite/resource-optimization:${{ github.sha }}
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/resource-optimization \
            resource-optimization=smartsite/resource-optimization:${{ github.sha }} \
            -n smartsite
```

### Pre-commit hooks
- [ ] Configurer husky
- [ ] Linting check
- [ ] Prevent secrets commit

---

## Phase 8: Documentation (Jour 5)

### API Documentation
- [ ] Swagger/OpenAPI setup
- [ ] All endpoints documented
- [ ] Example requests/responses
- [ ] Error codes documented

```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Resource Optimization API')
  .setDescription('Intelligent resource optimization system')
  .setVersion('1.0.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### Runbooks
- [ ] How to scale service
- [ ] How to rollback
- [ ] How to query logs
- [ ] How to create backups
- [ ] How to handle incidents

### Handoff
- [ ] Training for ops team
- [ ] Training for backend developers
- [ ] Training for directeurs (frontend users)
- [ ] Documentation in wiki

---

## Phase 9: Load Testing (Optional - Jour 6)

### Performance testing
- [ ] Load test con 100 users concurrents
- [ ] Check response times < 2s
- [ ] Check error rate < 1%
- [ ] Check DB query performance

```bash
# Using Apache JMeter or wrk
wrk -t12 -c100 -d30s http://localhost:3007/api/reports/dashboard/site-001
```

### Stress testing
- [ ] Gradual ramp up to 1000 users
- [ ] Identify breaking point
- [ ] Document limits

---

## Phase 10: Go Live (Jour 7)

### Pre-launch
- [ ] All security checks ✅
- [ ] All tests passing ✅
- [ ] Documentation complete ✅
- [ ] Team trained ✅
- [ ] Rollback plan ready ✅
- [ ] Incident response plan ready ✅

### Launch
- [ ] Blue-green deployment
- [ ] Canary release (5% traffic)
- [ ] Monitor for 24h
- [ ] Scale to 100% if healthy
- [ ] Update status page

### Post-launch
- [ ] Daily monitoring first week
- [ ] Weekly reviews month 1
- [ ] Bug fixes prioritized
- [ ] Performance optimizations
- [ ] User feedback collection

---

## Final Checklist ✅

- [ ] Backend running in production
- [ ] All API endpoints responding
- [ ] Database backed up
- [ ] Monitoring active
- [ ] Logging centralized
- [ ] Alerting working
- [ ] CI/CD automated
- [ ] Team trained
- [ ] Documentation complete
- [ ] Performance acceptable
- [ ] Security approved
- [ ] Disaster recovery plan ready

---

## Health Check Commands

```bash
# Service health
curl -i http://resource-optimization:3007/api/health

# Database connectivity
curl -i http://resource-optimization:3007/api/data-collection/equipment/test-site

# API responsiveness
time curl -w "\n%{time_total}s elapsed\n" http://resource-optimization:3007/api/reports/dashboard/test-site

# Load average
kubectl top pod -n smartsite

# Logs
kubectl logs -f deployment/resource-optimization -n smartsite

# Events
kubectl describe deployment resource-optimization -n smartsite
```

---

*Production Deployment Guide v1.0*  
*Last Updated: 2024-01-15*  
*Estimated Time: 5-7 days for full deployment*
