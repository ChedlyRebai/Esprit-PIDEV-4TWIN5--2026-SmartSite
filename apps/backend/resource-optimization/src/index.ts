// Export all modules
export * from './app.module';
export * from './main';

// Data Collection
export * from './modules/data-collection/data-collection.module';
export * from './modules/data-collection/data-collection.service';
export * from './modules/data-collection/data-collection.controller';

// Resource Analysis
export * from './modules/resource-analysis/resource-analysis.module';
export * from './modules/resource-analysis/resource-analysis.service';
export * from './modules/resource-analysis/resource-analysis.controller';

// Recommendation Engine
export * from './modules/recommendation/recommendation.module';
export { RecommendationService, CreateRecommendationDto, UpdateRecommendationStatusDto } from './modules/recommendation/recommendation.service';
export * from './modules/recommendation/recommendation.controller';

// Alert System
export * from './modules/alert/alert.module';
export * from './modules/alert/alert.service';
export * from './modules/alert/alert.controller';

// Reporting
export * from './modules/reporting/reporting.module';
export * from './modules/reporting/reporting.service';
export * from './modules/reporting/reporting.controller';

// Schemas
export * from './schemas/equipment.schema';
export * from './schemas/worker.schema';
export * from './schemas/energy-consumption.schema';
export * from './schemas/alert.schema';
export * from './schemas/recommendation.schema';
export * from './schemas/usage-data.schema';

// DTOs
export * from './dto/equipment.dto';
export * from './dto/worker.dto';
export * from './dto/energy-consumption.dto';
export * from './dto/alert.dto';
