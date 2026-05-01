import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Types } from 'mongoose';
import { GestionSiteService } from '../gestion-site.service';
import { Site } from '../entities/site.entity';
import { Team } from '../entities/team.entity';

const SITE_ID = '507f1f77bcf86cd799439011';
const TEAM_ID = '507f1f77bcf86cd799439022';

const mockSite = {
  _id: SITE_ID,
  nom: 'Chantier Test',
  adresse: '123 Rue Test',
  localisation: 'Tunis',
  budget: 100000,
  isActif: true,
  status: 'planning',
  progress: 0,
  teamIds: [],
  toObject: jest.fn().mockReturnThis(),
};

function MockSiteModel(dto: any) {
  return {
    ...dto,
    _id: SITE_ID,
    isActif: true,
    status: 'planning',
    progress: 0,
    teamIds: [],
    save: jest.fn().mockResolvedValue({ ...dto, _id: SITE_ID, isActif: true, status: 'planning', progress: 0 }),
  };
}
MockSiteModel.findOne = jest.fn();
MockSiteModel.find = jest.fn();
MockSiteModel.findById = jest.fn();
MockSiteModel.findByIdAndUpdate = jest.fn();
MockSiteModel.deleteOne = jest.fn();
MockSiteModel.countDocuments = jest.fn();
MockSiteModel.aggregate = jest.fn();

const MockTeamModel = { find: jest.fn(), findById: jest.fn() };
const MockConnection = { model: jest.fn() };

describe('GestionSiteService - Extra Coverage', () => {
  let service: GestionSiteService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GestionSiteService,
        { provide: getModelToken(Site.name), useValue: MockSiteModel },
        { provide: getModelToken(Team.name), useValue: MockTeamModel },
        { provide: getConnectionToken(), useValue: MockConnection },
      ],
    }).compile();
    service = module.get<GestionSiteService>(GestionSiteService);
  });

  // ─── findByName ─────────────────────────────────────────────────────────────
  describe('findByName', () => {
    it('should return sites matching name', async () => {
      MockSiteModel.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockSite]),
        }),
      });
      const result = await service.findByName('Chantier');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw InternalServerErrorException on error', async () => {
      MockSiteModel.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest.fn().mockRejectedValue(new Error('DB error')),
        }),
      });
      await expect(service.findByName('test')).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── findByLocalisation ─────────────────────────────────────────────────────
  describe('findByLocalisation', () => {
    it('should return sites by localisation', async () => {
      MockSiteModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockSite]),
      });
      const result = await service.findByLocalisation('Tunis');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw InternalServerErrorException on error', async () => {
      MockSiteModel.find.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      await expect(service.findByLocalisation('Tunis')).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── softDelete ─────────────────────────────────────────────────────────────
  describe('softDelete', () => {
    it('should soft delete a site', async () => {
      const softDeleted = { ...mockSite, isActif: false };
      MockSiteModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(softDeleted),
      });
      const result = await service.softDelete(SITE_ID);
      expect(result.isActif).toBe(false);
    });

    it('should throw NotFoundException when site not found', async () => {
      MockSiteModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.softDelete('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on DB error', async () => {
      MockSiteModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      await expect(service.softDelete(SITE_ID)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── restore ────────────────────────────────────────────────────────────────
  describe('restore', () => {
    it('should restore a soft-deleted site', async () => {
      MockSiteModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSite),
      });
      const result = await service.restore(SITE_ID);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when site not found', async () => {
      MockSiteModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.restore('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on DB error', async () => {
      MockSiteModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      await expect(service.restore(SITE_ID)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── getStatistics ──────────────────────────────────────────────────────────
  describe('getStatistics', () => {
    it('should return statistics', async () => {
      MockSiteModel.countDocuments
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(10) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(7) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(3) });
      MockSiteModel.aggregate.mockResolvedValue([
        { _id: 'Tunis', count: 5, totalBudget: 500000 },
        { _id: 'Sfax', count: 5, totalBudget: 300000 },
      ]);

      const result = await service.getStatistics();
      expect(result.total).toBe(10);
      expect(result.active).toBe(7);
      expect(result.inactive).toBe(3);
      expect(result.totalBudget).toBe(800000);
      expect(result.byLocalisation).toHaveLength(2);
    });

    it('should return 0 averageBudget when total is 0', async () => {
      MockSiteModel.countDocuments
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(0) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(0) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(0) });
      MockSiteModel.aggregate.mockResolvedValue([]);

      const result = await service.getStatistics();
      expect(result.averageBudget).toBe(0);
    });

    it('should throw InternalServerErrorException on error', async () => {
      MockSiteModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      await expect(service.getStatistics()).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── getTotalBudget ─────────────────────────────────────────────────────────
  describe('getTotalBudget', () => {
    it('should return total budget', async () => {
      MockSiteModel.aggregate.mockResolvedValue([{ _id: null, total: 500000 }]);
      const result = await service.getTotalBudget();
      expect(result).toBe(500000);
    });

    it('should return 0 when no sites', async () => {
      MockSiteModel.aggregate.mockResolvedValue([]);
      const result = await service.getTotalBudget();
      expect(result).toBe(0);
    });

    it('should throw InternalServerErrorException on error', async () => {
      MockSiteModel.aggregate.mockRejectedValue(new Error('DB error'));
      await expect(service.getTotalBudget()).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── getSiteByteamId ────────────────────────────────────────────────────────
  describe('getSiteByteamId', () => {
    it('should return sites for a valid team ID', async () => {
      MockSiteModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockSite]),
      });
      const result = await service.getSiteByteamId(TEAM_ID);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw BadRequestException when teamId is empty', async () => {
      await expect(service.getSiteByteamId('')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when teamId is invalid ObjectId', async () => {
      await expect(service.getSiteByteamId('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on DB error', async () => {
      MockSiteModel.find.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      await expect(service.getSiteByteamId(TEAM_ID)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── assignTeamToSite ───────────────────────────────────────────────────────
  describe('assignTeamToSite', () => {
    it('should assign a team to a site', async () => {
      const siteWithoutTeam = { ...mockSite, teamIds: [] };
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(siteWithoutTeam),
      });
      const updatedSite = { ...mockSite, teamIds: [new Types.ObjectId(TEAM_ID)] };
      MockSiteModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedSite),
      });

      const result = await service.assignTeamToSite(SITE_ID, TEAM_ID);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when site not found', async () => {
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.assignTeamToSite('nonexistent', TEAM_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when team already assigned', async () => {
      const siteWithTeam = {
        ...mockSite,
        teamIds: [{ toString: () => TEAM_ID }],
      };
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(siteWithTeam),
      });
      await expect(service.assignTeamToSite(SITE_ID, TEAM_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on DB error', async () => {
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      await expect(service.assignTeamToSite(SITE_ID, TEAM_ID)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── removeTeamFromSite ─────────────────────────────────────────────────────
  describe('removeTeamFromSite', () => {
    it('should remove a team from a site', async () => {
      const siteWithTeam = {
        ...mockSite,
        teamIds: [{ toString: () => TEAM_ID }],
      };
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(siteWithTeam),
      });
      MockSiteModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockSite, teamIds: [] }),
      });

      const result = await service.removeTeamFromSite(SITE_ID, TEAM_ID);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when site not found', async () => {
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.removeTeamFromSite('nonexistent', TEAM_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when team not assigned', async () => {
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockSite, teamIds: [] }),
      });
      await expect(service.removeTeamFromSite(SITE_ID, TEAM_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on DB error', async () => {
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      await expect(service.removeTeamFromSite(SITE_ID, TEAM_ID)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── getTeamsAssignedToSite ─────────────────────────────────────────────────
  describe('getTeamsAssignedToSite', () => {
    it('should return teams for a site', async () => {
      const siteWithTeams = {
        ...mockSite,
        teamIds: [{ _id: TEAM_ID, name: 'Team A', toObject: () => ({ _id: TEAM_ID, name: 'Team A' }) }],
      };
      MockSiteModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(siteWithTeams),
        }),
      });

      const result = await service.getTeamsAssignedToSite(SITE_ID);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no teams', async () => {
      MockSiteModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ ...mockSite, teamIds: null }),
        }),
      });

      const result = await service.getTeamsAssignedToSite(SITE_ID);
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when site not found', async () => {
      MockSiteModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      await expect(service.getTeamsAssignedToSite('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on DB error', async () => {
      MockSiteModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockRejectedValue(new Error('DB error')),
        }),
      });
      await expect(service.getTeamsAssignedToSite(SITE_ID)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── getAllSitesWithTeams ────────────────────────────────────────────────────
  describe('getAllSitesWithTeams', () => {
    it('should return all sites with teams', async () => {
      MockSiteModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockSite]),
        }),
      });
      const result = await service.getAllSitesWithTeams();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter by projectId when provided', async () => {
      MockSiteModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockSite]),
        }),
      });
      const result = await service.getAllSitesWithTeams('proj-123');
      expect(MockSiteModel.find).toHaveBeenCalledWith({ projectId: 'proj-123' });
    });

    it('should throw InternalServerErrorException on error', async () => {
      MockSiteModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockRejectedValue(new Error('DB error')),
        }),
      });
      await expect(service.getAllSitesWithTeams()).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── findAll with filters ───────────────────────────────────────────────────
  describe('findAll with filters', () => {
    it('should apply all filters correctly', async () => {
      MockSiteModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockSite]),
            }),
          }),
        }),
      });
      MockSiteModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(
        { nom: 'Test', localisation: 'Tunis', isActif: true, status: 'planning', budgetMin: 0, budgetMax: 200000, projectId: 'proj-1' },
        { page: 2, limit: 5, sortBy: 'nom', sortOrder: 'asc' },
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    it('should throw InternalServerErrorException on DB error', async () => {
      MockSiteModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockRejectedValue(new Error('DB error')),
            }),
          }),
        }),
      });
      MockSiteModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });
      await expect(service.findAll()).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── update with progress 100 ───────────────────────────────────────────────
  describe('update - auto complete', () => {
    it('should set status to completed when progress is 100', async () => {
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSite),
      });
      MockSiteModel.findOne.mockResolvedValue(null);
      const completedSite = { ...mockSite, progress: 100, status: 'completed' };
      MockSiteModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(completedSite),
      });

      const result = await service.update(SITE_ID, { progress: 100 } as any);
      expect(result.status).toBe('completed');
    });

    it('should throw BadRequestException on duplicate name', async () => {
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSite),
      });
      MockSiteModel.findOne.mockResolvedValue({ ...mockSite, _id: 'other-id' });

      await expect(service.update(SITE_ID, { nom: 'Duplicate' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on DB error', async () => {
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      await expect(service.update(SITE_ID, {} as any)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── remove - deletedCount 0 ────────────────────────────────────────────────
  describe('remove - edge cases', () => {
    it('should throw InternalServerErrorException when deletedCount is 0', async () => {
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSite),
      });
      MockSiteModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      });
      await expect(service.remove(SITE_ID)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException on DB error', async () => {
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      await expect(service.remove(SITE_ID)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── findById - InternalServerError ─────────────────────────────────────────
  describe('findById - error handling', () => {
    it('should throw InternalServerErrorException on DB error', async () => {
      MockSiteModel.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      await expect(service.findById(SITE_ID)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
