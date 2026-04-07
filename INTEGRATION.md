# Intégration du Resource Optimization Service

## 📋 Checklist d'intégration

- [x] Backend service créé (NestJS)
- [x] Modules implémentés (5 modules)
- [x] Endpoints API configurés (25+ endpoints)
- [x] Schemas MongoDB définis
- [x] Frontend dashboard créé (React)
- [x] Hooks personnalisés implémentés
- [x] Documentation complète rédigée
- [ ] Tests unitaires à compléter
- [ ] Tests E2E à compléter
- [ ] Déploiement Docker
- [ ] CI/CD pipeline

---

## 🔗 Intégration avec les autres services

### 1. Ajouter la route au API Gateway

Dans votre API Gateway principal:

```typescript
// src/gateway.module.ts
@Module({
  imports: [
    HttpModule,
  ],
})
export class GatewayModule {
  constructor(private httpService: HttpService) {}

  // Router vers Resource Optimization
  @Get('/api/optimization*')
  async proxyOptimization(@Req() req: Request) {
    const targetUrl = `http://localhost:3007${req.url}`;
    return this.httpService.get(targetUrl).toPromise();
  }
}
```

### 2. Intégrer le dashboard dans le menu principal

```tsx
// apps/frontend/src/app/layout.tsx
import ResourceOptimizationLink from '@/features/resource-optimization/components/ResourceOptimizationLink';

function Layout() {
  return (
    <nav>
      <ResourceOptimizationLink />
      {/* Autres liens */}
    </nav>
  );
}
```

### 3. Synchroniser les utilisateurs avec l'authentification

```typescript
// apps/backend/resource-optimization/src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret',
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

### 4. Intégrer Kafka pour les événements

```typescript
// src/modules/alert/alert.service.ts (ajout)
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class AlertService {
  constructor(
    private kafkaClient: ClientKafka,
  ) {}

  async createAlert(alert: any) {
    // Envoyer un événement Kafka
    this.kafkaClient.emit('alerts.created', alert);
    return alert;
  }
}
```

---

## 🧪 Tests unitaires

### Data Collection Service

```typescript
// src/modules/data-collection/data-collection.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DataCollectionService } from './data-collection.service';
import { Equipment } from '@/schemas/equipment.schema';

describe('DataCollectionService', () => {
  let service: DataCollectionService;
  let mockEquipmentModel: any;

  beforeEach(async () => {
    mockEquipmentModel = {
      find: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      findById: jest.fn().mockReturnThis(),
      findByIdAndUpdate: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataCollectionService,
        {
          provide: getModelToken(Equipment.name),
          useValue: mockEquipmentModel,
        },
      ],
    }).compile();

    service = module.get<DataCollectionService>(DataCollectionService);
  });

  describe('getAllEquipment', () => {
    it('should return all equipment for a site', async () => {
      const siteId = 'test-site';
      const mockEquipment = [
        { deviceName: 'Excavator', siteId, type: 'excavator' },
      ];

      mockEquipmentModel.find.mockReturnValue(mockEquipmentModel);
      mockEquipmentModel.exec.mockResolvedValue(mockEquipment);

      const result = await service.getAllEquipment(siteId);

      expect(result).toEqual(mockEquipment);
      expect(mockEquipmentModel.find).toHaveBeenCalledWith({ siteId });
    });
  });
});
```

### Resource Analysis Service

```typescript
// src/modules/resource-analysis/resource-analysis.service.spec.ts
describe('ResourceAnalysisService', () => {
  let service: ResourceAnalysisService;

  describe('detectIdleEquipment', () => {
    it('should detect equipment with low utilization', async () => {
      const siteId = 'test-site';
      // Mock data
      const result = await service.detectIdleEquipment(siteId);
      
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('utilizationRate');
        expect(result[0].utilizationRate).toBeLessThan(20);
      }
    });
  });

  describe('analyzeEnergyConsumption', () => {
    it('should identify peak consumption periods', async () => {
      const siteId = 'test-site';
      const result = await service.analyzeEnergyConsumption(siteId);
      
      expect(result).toHaveProperty('peakPeriods');
      expect(result).toHaveProperty('averageDailyConsumption');
      expect(typeof result.averageDailyConsumption).toBe('number');
    });
  });
});
```

### Recommendation Engine

```typescript
// src/modules/recommendation/recommendation.service.spec.ts
describe('RecommendationService', () => {
  let service: RecommendationService;

  describe('generateRecommendations', () => {
    it('should generate recommendations based on analysis', async () => {
      const siteId = 'test-site';
      const recommendations = await service.generateRecommendations(siteId);
      
      expect(Array.isArray(recommendations)).toBe(true);
      recommendations.forEach((rec) => {
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('estimatedSavings');
        expect(rec).toHaveProperty('priority');
      });
    });
  });
});
```

---

## 🐳 Docker Integration

### Dockerfile pour le service

```dockerfile
# apps/backend/resource-optimization/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3007

CMD ["node", "dist/main.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  resource-optimization:
    build:
      context: ./apps/backend/resource-optimization
      dockerfile: Dockerfile
    ports:
      - "3007:3007"
    environment:
      MONGODB_URI: mongodb://mongo:27017/smartsite-optimization
      NODE_ENV: production
    depends_on:
      - mongo
    networks:
      - smartsite

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - smartsite

networks:
  smartsite:

volumes:
  mongo-data:
```

---

## 📊 Métriques de performance

### Endpoints critiques à monitorer

1. `POST /recommendations/generate/:siteId` - Temps: < 2s
2. `GET /reports/dashboard/:siteId` - Temps: < 1s
3. `POST /alerts/generate/:siteId` - Temps: < 1s

### Benchmarks cibles

- Génération recommandations: **< 2 secondes**
- Réponse dashboard: **< 1 seconde**
- Génération alertes: **< 1 seconde**
- Mémoire service: **< 200 MB**

---

## 🔐 Sécurité

### Authentification (À implémenter)

```typescript
// src/auth/auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Usage dans controller:
@UseGuards(JwtAuthGuard)
@Post('recommendations/generate/:siteId')
generateRecommendations(@Param('siteId') siteId: string) {
  // ...
}
```

### CORS

```typescript
// src/main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(','),
  credentials: true,
});
```

### Rate Limiting (À ajouter)

```typescript
import { RateLimitGuard } from '@nestjs/throttler';

@UseGuards(RateLimitGuard)
@Post('recommendations/generate/:siteId')
generateRecommendations() { }
```

---

## 📈 Monitoring & Logging

### Structure logs recommandée

```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('ResourceOptimization');

logger.log('Recommendations generated', { siteId, count: 5 });
logger.warn('High idle equipment detected', { idle: 3 });
logger.error('Database connection failed', error);
```

### Dashboard de monitoring (À mettre en place)

- Logs centralisés: ELK Stack ou CloudWatch
- APM: Datadog ou New Relic
- Alertes: PagerDuty

---

## 🚀 Déploiement

### Production checklist

- [ ] Variables d'environnement configurées
- [ ] Secrets gérés (JWT, DB password)
- [ ] Logs centralisés
- [ ] Monitoring en place
- [ ] Auto-scaling configuré
- [ ] Backup BD configuré
- [ ] CDN pour assets frontend
- [ ] SSL/TLS activé

### Kubernetes deployment

```yaml
# k8s/resource-optimization-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: resource-optimization
spec:
  replicas: 2
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
        image: smartsite/resource-optimization:latest
        ports:
        - containerPort: 3007
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: uri
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
```

---

## 📞 Support

Pour les questions d'intégration:
- Consultez le README.md principal
- Vérifiez les logs du service
- Testez les endpoints avec Postman
- Contactez l'équipe: optimization@smartsite.fr
