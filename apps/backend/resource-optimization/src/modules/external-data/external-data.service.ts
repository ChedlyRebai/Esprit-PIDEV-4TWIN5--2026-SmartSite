import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface SiteData {
  _id: string;
  nom: string;
  localisation: string;
  description?: string;
  status: string;
  budget: number;
  dateDebut: Date;
  dateFin?: Date;
  isActif: boolean;
  teamIds: string[];
}

export interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  siteIds?: string[];
  isActif: boolean;
}

export interface TaskData {
  _id: string;
  title: string;
  status: string;
  priority: string;
  assignedTo?: string;
  siteId?: string;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
}

export interface MilestoneData {
  _id: string;
  title: string;
  status: string;
  siteId: string;
  startDate: Date;
  dueDate: Date;
  completedAt?: Date;
}

export interface ExternalDataResponse {
  site: SiteData | null;
  teams: UserData[];
  tasks: TaskData[];
  milestones: MilestoneData[];
  siteStats: {
    totalBudget: number;
    teamSize: number;
    activeTasks: number;
    completedTasks: number;
    pendingMilestones: number;
  };
}

@Injectable()
export class ExternalDataService {
  private readonly logger = new Logger(ExternalDataService.name);
  
  private readonly GESTION_SITE_URL: string;
  private readonly AUTH_API_URL: string;
  private readonly PLANNING_URL: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.GESTION_SITE_URL = this.configService.get('GESTION_SITE_URL') || 'http://localhost:3001/api';
    this.AUTH_API_URL = this.configService.get('AUTH_API_URL') || 'http://localhost:3000';
    this.PLANNING_URL = this.configService.get('PLANNING_URL') || 'http://localhost:3002';
  }

  async getSiteData(siteId: string): Promise<SiteData | null> {
    if (!siteId) return null;
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.GESTION_SITE_URL}/gestion-sites/${siteId}`)
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch site ${siteId}: ${error.message}`);
      return null;
    }
  }

  async getSiteTeams(siteId: string): Promise<UserData[]> {
    if (!siteId) return [];
    
    try {
      const response = await firstValueFrom(
        this.httpService.get<UserData[]>(`${this.GESTION_SITE_URL}/gestion-sites/${siteId}/teams`)
      );
      return response.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch teams for site ${siteId}: ${error.message}`);
      return [];
    }
  }

  async getSiteTasks(siteId: string): Promise<TaskData[]> {
    if (!siteId) return [];
    
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ data: TaskData[] }>(`${this.PLANNING_URL}/task?siteId=${siteId}&limit=100`)
      );
      return response.data?.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch tasks for site ${siteId}: ${error.message}`);
      return [];
    }
  }

  async getSiteMilestones(siteId: string): Promise<MilestoneData[]> {
    if (!siteId) return [];
    
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ data: MilestoneData[] }>(`${this.PLANNING_URL}/milestone?siteId=${siteId}&limit=100`)
      );
      return response.data?.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch milestones for site ${siteId}: ${error.message}`);
      return [];
    }
  }

  async getAllSiteData(siteId: string): Promise<ExternalDataResponse> {
    const [site, teams, tasks, milestones] = await Promise.all([
      this.getSiteData(siteId),
      this.getSiteTeams(siteId),
      this.getSiteTasks(siteId),
      this.getSiteMilestones(siteId),
    ]);

    const activeTasks = tasks.filter(t => t.status === 'in_progress').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingMilestones = milestones.filter(m => m.status !== 'completed').length;

    return {
      site,
      teams,
      tasks,
      milestones,
      siteStats: {
        totalBudget: site?.budget || 0,
        teamSize: teams.length,
        activeTasks,
        completedTasks,
        pendingMilestones,
      },
    };
  }

  async getUsers(): Promise<UserData[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<UserData[]>(`${this.AUTH_API_URL}/users`)
      );
      return response.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch users: ${error.message}`);
      return [];
    }
  }
}
