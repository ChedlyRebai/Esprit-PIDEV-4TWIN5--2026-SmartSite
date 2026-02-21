export enum IncidentType {
  MATERIEL = "materiel",
  ENVIRONNEMENT = "environnement",
  PERSONNEL = "personnel",
}

export enum IncidentDegree {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export class Incident {
  id: string;
  type: IncidentType;
  degree: IncidentDegree;
  title: string;
  description?: string | null;
  reportedAt: string;
  reportedBy?: string | null;
}
