import { GestionSiteService, PaginatedResult } from './gestion-site.service';
import { CreateSiteDto, UpdateSiteDto } from './dto';
export declare class GestionSiteController {
    private readonly gestionSiteService;
    constructor(gestionSiteService: GestionSiteService);
    create(createSiteDto: CreateSiteDto): Promise<import("./entities").Site>;
    findAll(page: number, limit: number, nom?: string, localisation?: string, estActif?: string, status?: string, budgetMin?: string, budgetMax?: string): Promise<PaginatedResult<any>>;
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
    getTotalBudget(): Promise<{
        totalBudget: number;
    }>;
    findActiveSites(): Promise<import("./entities").Site[]>;
    findById(id: string): Promise<import("./entities").Site>;
    findByName(nom: string): Promise<import("./entities").Site[]>;
    findByLocalisation(localisation: string): Promise<import("./entities").Site[]>;
    update(id: string, updateSiteDto: UpdateSiteDto): Promise<import("./entities").Site>;
    softDelete(id: string): Promise<import("./entities").Site>;
    restore(id: string): Promise<import("./entities").Site>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
