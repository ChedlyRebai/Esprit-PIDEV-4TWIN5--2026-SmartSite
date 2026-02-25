import { Model, Connection } from 'mongoose';
import { Site } from './entities/site.entity';
import { CreateSiteDto, UpdateSiteDto } from './dto';
export interface SiteFilters {
    nom?: string;
    localisation?: string;
    estActif?: boolean;
    budgetMin?: number;
    budgetMax?: number;
    status?: string;
}
export interface PaginationOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class GestionSiteService {
    private siteModel;
    private connection;
    private readonly logger;
    constructor(siteModel: Model<Site>, connection: Connection);
    create(createSiteDto: CreateSiteDto, userId?: string): Promise<Site>;
    findAll(filters?: SiteFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Site>>;
    findById(id: string): Promise<Site>;
    findByName(nom: string): Promise<Site[]>;
    findByLocalisation(localisation: string): Promise<Site[]>;
    findActiveSites(): Promise<Site[]>;
    update(id: string, updateSiteDto: UpdateSiteDto, userId?: string): Promise<Site>;
    softDelete(id: string): Promise<Site>;
    remove(id: string): Promise<{
        message: string;
    }>;
    restore(id: string): Promise<Site>;
    getStatistics(): Promise<{
        total: number;
        active: number;
        inactive: number;
        totalBudget: number;
        averageBudget: number;
        byLocalisation: {
            localisation: string;
            count: number;
        }[];
    }>;
    getTotalBudget(): Promise<number>;
}
