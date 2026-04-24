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
  projectId?: string;
  dateDebut: Date;
  dateFin?: Date;
  isActif: boolean;
  teamIds: string[];
}

export interface ProjectData {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  status: string;
  priority?: string;
  budget?: number;
  actualCost?: number;
  startDate?: Date;
  endDate?: Date;
  progress?: number;
  siteCount?: number;
  clientName?: string;
}

export interface ProjectSiteData {
  id: string;
  name: string;
  localisation?: string;
  budget?: number;
  status?: string;
  progress?: number;
  teamIds?: string[];
  projectId?: string;
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

export interface ProjectContextResponse {
  project: ProjectData | null;
  sites: ProjectSiteData[];
  site: SiteData | null;
  teams: UserData[];
  tasks: TaskData[];
  milestones: MilestoneData[];
  projectStats: {
    totalBudget: number;
    totalSitesBudget: number;
    taskCount: number;
    completedTasks: number;
    pendingMilestones: number;
  };
  siteStats?: ExternalDataResponse['siteStats'];
}

@Injectable()
export class ExternalDataService {
  private readonly logger = new Logger(ExternalDataService.name);
  
  private readonly GESTION_SITE_URL: string;
  private readonly GESTION_PROJECT_URL: string;
  private readonly AUTH_API_URL: string;
  private readonly PLANNING_URL: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.GESTION_SITE_URL = this.configService.get('GESTION_SITE_URL') || 'http://localhost:3001/api';
    this.GESTION_PROJECT_URL = this.configService.get('GESTION_PROJECT_URL') || 'http://localhost:3003/api';
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

  async getProjectData(projectId: string): Promise<ProjectData | null> {
    if (!projectId) return null;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.GESTION_PROJECT_URL}/projects/${projectId}`)
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch project ${projectId}: ${error.message}`);
      return null;
    }
  }

  async getProjectSites(projectId: string): Promise<ProjectSiteData[]> {
    if (!projectId) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.GESTION_SITE_URL}/gestion-sites?projectId=${projectId}&limit=200`)
      );
      const payload = response.data?.data || response.data || [];
      return (payload || []).map((site: any) => ({
        id: site._id || site.id,
        name: site.nom || site.name,
        localisation: site.localisation,
        budget: site.budget || 0,
        status: site.status,
        progress: site.progress || 0,
        teamIds: site.teamIds || [],
        projectId: site.projectId,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch sites for project ${projectId}: ${error.message}`);
      return [];
    }
  }

  async getProjectTasks(projectId: string): Promise<TaskData[]> {
    if (!projectId) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get<TaskData[]>(`${this.PLANNING_URL}/task/gantt/${projectId}`)
      );
      return response.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch tasks for project ${projectId}: ${error.message}`);
      return [];
    }
  }

  async getProjectMilestones(projectId: string): Promise<MilestoneData[]> {
    if (!projectId) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get<MilestoneData[]>(`${this.PLANNING_URL}/milestone/project/${projectId}`)
      );
      return response.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch milestones for project ${projectId}: ${error.message}`);
      return [];
    }
  }

  async getProjectContext(projectId: string, siteId?: string): Promise<ProjectContextResponse> {
    const [project, sites, tasks, milestones, site, teams] = await Promise.all([
      this.getProjectData(projectId),
      this.getProjectSites(projectId),
      this.getProjectTasks(projectId),
      this.getProjectMilestones(projectId),
      siteId ? this.getSiteData(siteId) : Promise.resolve(null),
      siteId ? this.getSiteTeams(siteId) : Promise.resolve([]),
    ]);

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingMilestones = milestones.filter(m => m.status !== 'completed').length;
    const totalSitesBudget = sites.reduce((sum, s) => sum + (Number(s.budget) || 0), 0);

    const siteTasks = siteId ? tasks.filter(t => t.siteId === siteId) : [];
    const siteMilestones = siteId ? milestones.filter(m => m.siteId === siteId) : [];
    const siteActiveTasks = siteTasks.filter(t => t.status === 'in_progress').length;
    const siteCompletedTasks = siteTasks.filter(t => t.status === 'completed').length;
    const sitePendingMilestones = siteMilestones.filter(m => m.status !== 'completed').length;
    const siteStats = siteId ? {
      totalBudget: Number(site?.budget) || 0,
      teamSize: teams.length,
      activeTasks: siteActiveTasks,
      completedTasks: siteCompletedTasks,
      pendingMilestones: sitePendingMilestones,
    } : undefined;

    return {
      project,
      sites,
      site,
      teams,
      tasks,
      milestones,
      projectStats: {
        totalBudget: Number(project?.budget) || 0,
        totalSitesBudget,
        taskCount: tasks.length,
        completedTasks,
        pendingMilestones,
      },
      siteStats,
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
