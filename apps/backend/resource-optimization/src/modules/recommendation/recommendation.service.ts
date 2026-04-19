import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';

export interface CreateRecommendationDto {
  type: string;
  title: string;
  description: string;
  priority: number;
  estimatedSavings: number;
  estimatedCO2Reduction: number;
  confidenceScore: number;
  actionItems: string[];
  siteId: string;
}

export interface UpdateRecommendationStatusDto {
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
}

export interface Recommendation {
  _id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  estimatedSavings: number;
  estimatedCO2Reduction: number;
  priority: number;
  confidenceScore: number;
  actionItems: string[];
  siteId: string;
  createdAt: string;
  approvedAt?: string;
  implementedAt?: string;
  beforeMetrics?: any;
  afterMetrics?: any;
  improvement?: any;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectModel('Recommendation') private recommendationModel: Model<Recommendation>,
    private readonly httpService: HttpService,
  ) { }

  async create(createRecommendationDto: CreateRecommendationDto): Promise<Recommendation> {
    const newRecommendation = new this.recommendationModel({
      ...createRecommendationDto,
      status: 'pending',
      createdAt: new Date(),
    });
    return newRecommendation.save();
  }

  async findAll(siteId?: string, status?: string): Promise<Recommendation[]> {
    const query: Record<string, string> = {};
    if (siteId) query.siteId = siteId;
    if (status) query.status = status;
    return this.recommendationModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async getSummary(siteId: string): Promise<{
    totalPotentialSavings: string;
    approvedSavings: string;
    realizedSavings: string;
    totalCO2Reduction: string;
  }> {
    const recs = await this.findAll(siteId);
    const approved = recs.filter((r) => r.status === 'approved');
    const implemented = recs.filter((r) => r.status === 'implemented');
    return {
      totalPotentialSavings: String(
        recs.reduce((s, r) => s + (Number(r.estimatedSavings) || 0), 0),
      ),
      approvedSavings: String(
        approved.reduce((s, r) => s + (Number(r.estimatedSavings) || 0), 0),
      ),
      realizedSavings: String(
        implemented.reduce((s, r) => s + (Number(r.estimatedSavings) || 0), 0),
      ),
      totalCO2Reduction: String(
        recs.reduce((s, r) => s + (Number(r.estimatedCO2Reduction) || 0), 0),
      ),
    };
  }

  async findOne(id: string): Promise<Recommendation | null> {
    return this.recommendationModel.findById(id).exec();
  }

  async update(id: string, updateRecommendationDto: Partial<Recommendation>): Promise<Recommendation | null> {
    return this.recommendationModel
      .findByIdAndUpdate(id, updateRecommendationDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Recommendation | null> {
    return this.recommendationModel.findByIdAndDelete(id).exec();
  }

  async approveRecommendation(id: string): Promise<Recommendation> {
    // Get recommendation before approval
    const recommendation = await this.recommendationModel.findById(id);
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    // Store "before" metrics for analytics
    const beforeMetrics = await this.captureCurrentMetrics(recommendation.siteId);

    // Update recommendation status
    const updatedRecommendation = await this.recommendationModel.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedAt: new Date(),
        beforeMetrics: beforeMetrics,
      },
      { new: true }
    );

    this.logger.log(`Recommendation ${id} approved with before metrics captured`);
    return updatedRecommendation;
  }

  async implementRecommendation(id: string): Promise<Recommendation> {
    // Get recommendation
    const recommendation = await this.recommendationModel.findById(id);
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    // Store "after" metrics for analytics
    const afterMetrics = await this.captureCurrentMetrics(recommendation.siteId);

    // Calculate improvement
    const improvement = this.calculateImprovement(
      recommendation.beforeMetrics,
      afterMetrics,
      recommendation.type
    );

    // Update recommendation with results
    const updatedRecommendation = await this.recommendationModel.findByIdAndUpdate(
      id,
      {
        status: 'implemented',
        implementedAt: new Date(),
        afterMetrics: afterMetrics,
        improvement: improvement,
      },
      { new: true }
    );

    this.logger.log(`Recommendation ${id} implemented with improvement: ${JSON.stringify(improvement)}`);
    return updatedRecommendation;
  }

  /**
   * Capture current metrics for a site
   */
  private async captureCurrentMetrics(siteId: string): Promise<any> {
    try {
      const [siteData, tasksData, teamsData] = await Promise.all([
        this.getSiteData(siteId),
        this.getTasksData(siteId),
        this.getTeamsData(siteId)
      ]);

      return {
        timestamp: new Date(),
        budget: {
          total: siteData.budget || 0,
          spent: this.calculateSpentBudget(tasksData) || 0,
          remaining: (siteData.budget || 0) - (this.calculateSpentBudget(tasksData) || 0),
        },
        tasks: {
          total: tasksData.length,
          completed: tasksData.filter(t => t.status === 'completed').length,
          inProgress: tasksData.filter(t => t.status === 'in_progress').length,
          overdue: tasksData.filter(t =>
            t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
          ).length,
          avgDuration: this.calculateAverageTaskDuration(tasksData),
        },
        teams: {
          total: teamsData.length,
          totalMembers: teamsData.reduce((sum, team) => sum + (team.members?.length || 0), 0),
          avgWorkload: this.calculateAverageWorkload(teamsData, tasksData),
        },
        efficiency: {
          taskCompletionRate: this.calculateTaskCompletionRate(tasksData),
          budgetUtilization: this.calculateBudgetUtilization(siteData.budget, tasksData),
          teamProductivity: this.calculateTeamProductivity(teamsData, tasksData),
        }
      };
    } catch (error) {
      this.logger.error('Error capturing metrics:', error);
      return null;
    }
  }

  /**
   * Calculate improvement between before and after metrics
   */
  private calculateImprovement(before: any, after: any, recommendationType: string): any {
    if (!before || !after) return null;

    const improvement: any = {
      type: recommendationType,
      timestamp: new Date(),
    };

    switch (recommendationType) {
      case 'budget':
        improvement.budgetSavings = before.budget.spent - after.budget.spent;
        improvement.budgetUtilizationImprovement =
          ((after.efficiency.budgetUtilization - before.efficiency.budgetUtilization) /
            before.efficiency.budgetUtilization) * 100;
        break;

      case 'task_distribution':
        improvement.workloadBalanceImprovement =
          Math.abs(after.teams.avgWorkload - before.teams.avgWorkload);
        improvement.productivityImprovement =
          after.efficiency.teamProductivity - before.efficiency.teamProductivity;
        break;

      case 'timeline':
        improvement.overdueTasksReduction =
          before.tasks.overdue - after.tasks.overdue;
        improvement.completionRateImprovement =
          after.efficiency.taskCompletionRate - before.efficiency.taskCompletionRate;
        break;

      case 'individual_task_management':
        improvement.taskDurationImprovement =
          before.tasks.avgDuration - after.tasks.avgDuration;
        improvement.personalEfficiencyImprovement =
          after.efficiency.taskCompletionRate - before.efficiency.taskCompletionRate;
        break;

      default:
        improvement.overallEfficiencyImprovement =
          after.efficiency.taskCompletionRate - before.efficiency.taskCompletionRate;
        break;
    }

    return improvement;
  }

  // Helper methods for calculations
  private calculateSpentBudget(tasks: any[]): number {
    return tasks.reduce((sum, task) => sum + (task.budget || 0), 0);
  }

  private calculateAverageTaskDuration(tasks: any[]): number {
    const completedTasks = tasks.filter(t =>
      t.status === 'completed' && t.startDate && t.endDate
    );
    if (completedTasks.length === 0) return 0;

    const totalDuration = completedTasks.reduce((sum, task) => {
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      return sum + ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)); // days
    }, 0);

    return totalDuration / completedTasks.length;
  }

  private calculateAverageWorkload(teams: any[], tasks: any[]): number {
    const totalTasks = tasks.length;
    const totalMembers = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
    return totalMembers > 0 ? totalTasks / totalMembers : 0;
  }

  private calculateTaskCompletionRate(tasks: any[]): number {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return (completed / tasks.length) * 100;
  }

  private calculateBudgetUtilization(budget: number, tasks: any[]): number {
    if (!budget || budget === 0) return 0;
    const spent = this.calculateSpentBudget(tasks);
    return (spent / budget) * 100;
  }

  private calculateTeamProductivity(teams: any[], tasks: any[]): number {
    const totalMembers = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
    if (totalMembers === 0) return 0;

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    return completedTasks / totalMembers;
  }

  private async getSiteData(siteId: string) {
    try {
      const response = await this.httpService.axiosRef.get(
        `http://localhost:3001/api/gestion-sites/${siteId}`
      );
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching site data:', error);
      return { budget: 5000, nom: 'Site par défaut' };
    }
  }

  private async getTasksData(siteId: string) {
    try {
      const response = await this.httpService.axiosRef.get(
        `http://localhost:3002/api/planning/tasks/site/${siteId}`
      );
      return response.data || [];
    } catch (error) {
      this.logger.error('Error fetching tasks data:', error);
      return [];
    }
  }

  private async getTeamsData(siteId: string) {
    try {
      const response = await this.httpService.axiosRef.get(
        `http://localhost:3001/api/gestion-sites/${siteId}/teams`
      );
      return response.data || [];
    } catch (error) {
      this.logger.error('Error fetching teams data:', error);
      return [];
    }
  }

  /**
   * Cumulative budget-related series: each approval adds estimated savings;
   * optional spent snapshot from beforeMetrics captured at approval.
   */
  private buildBudgetInfluenceOnApprovals(recommendations: Recommendation[]): Array<{
    step: number;
    label: string;
    title: string;
    approvedAt: string | null;
    incrementalSavingsTnd: number;
    cumulativePotentialReliefTnd: number;
    budgetSpentSnapshotTnd: number | null;
    siteBudgetTotalTnd: number | null;
  }> {
    const list = recommendations.filter(
      (r) => r.status === 'approved' || r.status === 'implemented',
    );
    list.sort((a, b) => {
      const ta = new Date(a.approvedAt || a.createdAt).getTime();
      const tb = new Date(b.approvedAt || b.createdAt).getTime();
      return ta - tb;
    });

    let cumulative = 0;
    const points: Array<{
      step: number;
      label: string;
      title: string;
      approvedAt: string | null;
      incrementalSavingsTnd: number;
      cumulativePotentialReliefTnd: number;
      budgetSpentSnapshotTnd: number | null;
      siteBudgetTotalTnd: number | null;
    }> = [];

    if (list.length === 0) {
      return points;
    }

    const bm0 = list[0].beforeMetrics;
    const initialSpent =
      bm0?.budget?.spent != null ? Number(bm0.budget.spent) : null;
    const initialTotal =
      bm0?.budget?.total != null
        ? Number(bm0.budget.total)
        : bm0?.budget?.remaining != null && bm0?.budget?.spent != null
          ? Number(bm0.budget.remaining) + Number(bm0.budget.spent)
          : null;

    points.push({
      step: 0,
      label: 'Start',
      title: 'Before first approval',
      approvedAt: null,
      incrementalSavingsTnd: 0,
      cumulativePotentialReliefTnd: 0,
      budgetSpentSnapshotTnd: initialSpent,
      siteBudgetTotalTnd: initialTotal,
    });

    list.forEach((r, idx) => {
      const inc = Number(r.estimatedSavings) || 0;
      cumulative += inc;
      const bm = r.beforeMetrics;
      const spent = bm?.budget?.spent != null ? Number(bm.budget.spent) : null;
      const total =
        bm?.budget?.total != null
          ? Number(bm.budget.total)
          : bm?.budget?.remaining != null && bm?.budget?.spent != null
            ? Number(bm.budget.remaining) + Number(bm.budget.spent)
            : null;
      points.push({
        step: idx + 1,
        label: `Approval ${idx + 1}`,
        title: r.title,
        approvedAt: r.approvedAt
          ? new Date(r.approvedAt).toISOString()
          : r.createdAt
            ? new Date(r.createdAt).toISOString()
            : null,
        incrementalSavingsTnd: inc,
        cumulativePotentialReliefTnd: cumulative,
        budgetSpentSnapshotTnd: spent,
        siteBudgetTotalTnd: total,
      });
    });

    return points;
  }

  /**
   * Get analytics data for a site
   */
  async getAnalytics(siteId: string): Promise<any> {
    const recommendations = await this.findAll(siteId);

    const analytics = {
      totalRecommendations: recommendations.length,
      approvedRecommendations: recommendations.filter(r => r.status === 'approved').length,
      implementedRecommendations: recommendations.filter(r => r.status === 'implemented').length,

      /** Approuvées mais pas encore mises en œuvre : snapshot pris à l’approbation (courbe « après » au prochain jalon) */
      pendingImplementationSnapshots: recommendations
        .filter(r => r.status === 'approved' && r.beforeMetrics && !r.afterMetrics)
        .map(r => ({
          recommendationId: r._id,
          type: r.type,
          title: r.title,
          baselineAtApproval: r.beforeMetrics,
        })),

      // Calculate total improvements
      totalImprovements: {
        budgetSavings: 0,
        taskCompletionImprovement: 0,
        efficiencyGains: 0,
      },

      // Before/After comparisons (référence à l’approbation vs mesure après mise en œuvre)
      beforeAfterComparisons: recommendations
        .filter(r => r.beforeMetrics && r.afterMetrics)
        .map(r => ({
          recommendationId: r._id,
          type: r.type,
          title: r.title,
          before: r.beforeMetrics,
          after: r.afterMetrics,
          improvement: r.improvement,
        })),

      /** Curve: cumulative estimated savings vs approval order; spent snapshot from approval-time metrics */
      budgetInfluenceOnApprovals: this.buildBudgetInfluenceOnApprovals(recommendations),
    };

    // Calculate total improvements
    recommendations.forEach(r => {
      if (r.improvement) {
        if (r.improvement.budgetSavings) {
          analytics.totalImprovements.budgetSavings += r.improvement.budgetSavings;
        }
        if (r.improvement.completionRateImprovement) {
          analytics.totalImprovements.taskCompletionImprovement += r.improvement.completionRateImprovement;
        }
        if (r.improvement.overallEfficiencyImprovement) {
          analytics.totalImprovements.efficiencyGains += r.improvement.overallEfficiencyImprovement;
        }
      }
    });

    return analytics;
  }
}
