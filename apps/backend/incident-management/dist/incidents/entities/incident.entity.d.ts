export declare enum IncidentType {
    MATERIEL = "materiel",
    ENVIRONNEMENT = "environnement",
    PERSONNEL = "personnel"
}
export declare enum IncidentDegree {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export declare class Incident {
    id: string;
    type: IncidentType;
    degree: IncidentDegree;
    title: string;
    description?: string | null;
    reportedAt: string;
    reportedBy?: string | null;
}
