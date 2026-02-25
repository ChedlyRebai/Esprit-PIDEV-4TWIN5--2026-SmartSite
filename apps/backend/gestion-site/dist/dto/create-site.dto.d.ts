export declare class CreateSiteDto {
    nom: string;
    adresse: string;
    localisation: string;
    budget: number;
    description?: string;
    estActif: boolean;
    area?: number;
    status?: string;
    progress?: number;
    workStartDate?: string;
    workEndDate?: string;
    projectId?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}
export declare class UpdateSiteDto {
    nom?: string;
    adresse?: string;
    localisation?: string;
    budget?: number;
    description?: string;
    estActif?: boolean;
    area?: number;
    status?: string;
    progress?: number;
    workStartDate?: string;
    workEndDate?: string;
    projectId?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}
