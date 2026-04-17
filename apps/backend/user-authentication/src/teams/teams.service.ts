import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team } from './entities/team.entity';
import { SitesService } from '../sites/sites.service';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<Team>,
    private sitesService: SitesService,
  ) {}

  async create(createTeamDto: any) {
    const createdTeam = new this.teamModel(createTeamDto);
    return createdTeam.save();
  }

  async findAll() {
    try {
      return await this.teamModel.find()
        .populate({
          path: 'members',
          select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
        })
        .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
        .exec();
    } catch (error) {
      console.error('Error in findAll teams:', error);
      return this.teamModel.find().exec();
    }
  }

  async findById(id: string) {
    try {
      return await this.teamModel.findById(id)
        .populate({
          path: 'members',
          select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
        })
        .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
        .exec();
    } catch (error) {
      console.error('Error in findById team:', error);
      return this.teamModel.findById(id).exec();
    }
  }

  async findByName(name: string) {
    return this.teamModel.findOne({ name })
      .populate({
        path: 'members',
        select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
      })
      .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
      .exec();
  }

  async update(id: string, updateTeamDto: any) {
    return this.teamModel.findByIdAndUpdate(id, updateTeamDto, { new: true })
      .populate({
        path: 'members',
        select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
      })
      .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
      .exec();
  }

  async remove(id: string) {
    return this.teamModel.findByIdAndDelete(id).exec();
  }

  async addMemberToTeam(teamId: string, memberId: string) {
    if (!Types.ObjectId.isValid(teamId)) {
      throw new BadRequestException('Identifiant d’équipe invalide');
    }
    if (!Types.ObjectId.isValid(memberId)) {
      throw new BadRequestException(
        'Identifiant utilisateur invalide — utilisez l’ID MongoDB du compte (24 caractères hexadécimaux), pas un identifiant de démo.',
      );
    }
    const memberObjectId = new Types.ObjectId(memberId);
    const updated = await this.teamModel
      .findByIdAndUpdate(
        teamId,
        { $addToSet: { members: memberObjectId } },
        { new: true },
      )
      .populate({
        path: 'members',
        select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
      })
      .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
      .exec();
    if (!updated) {
      throw new NotFoundException('Équipe introuvable');
    }
    return updated;
  }

  async removeMemberFromTeam(teamId: string, memberId: string) {
    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(memberId)) {
      throw new BadRequestException('Identifiant invalide');
    }
    const updated = await this.teamModel
      .findByIdAndUpdate(
        teamId,
        { $pull: { members: new Types.ObjectId(memberId) } },
        { new: true },
      )
      .populate({
        path: 'members',
        select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
      })
      .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
      .exec();
    if (!updated) {
      throw new NotFoundException('Équipe introuvable');
    }
    return updated;
  }

  async setManager(teamId: string, managerId: string) {
    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(managerId)) {
      throw new BadRequestException('Identifiant invalide');
    }
    const updated = await this.teamModel
      .findByIdAndUpdate(
        teamId,
        { manager: new Types.ObjectId(managerId) },
        { new: true },
      )
      .populate({
        path: 'members',
        select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
      })
      .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
      .exec();
    if (!updated) {
      throw new NotFoundException('Équipe introuvable');
    }
    return updated;
  }

  // Note: assignSite method - updates the Team document with the assigned site
  async assignSite(teamId: string, siteId: string) {
    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(siteId)) {
      throw new BadRequestException('Identifiant invalide');
    }

    // Assigner le site à l'équipe
    const updated = await this.teamModel
      .findByIdAndUpdate(
        teamId,
        { site: new Types.ObjectId(siteId) },
        { new: true }
      )
      .populate({
        path: 'members',
        select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
      })
      .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
      .exec();

    if (!updated) {
      throw new NotFoundException('Équipe introuvable');
    }

    // Ajouter l'équipe au site (synchro inverse)
    try {
      await this.sitesService.addTeamToSite(siteId, teamId);
    } catch (siteError) {
      console.error('Error adding team to site:', siteError);
      // On ne bloque pas si le site n'existe pas ou autre
    }

    return updated;
  }

  // Remove site assignment from team
  async removeSite(teamId: string) {
    // D'abord récupérer le siteId avant de le déassigner
    const team = await this.teamModel.findById(teamId).exec();
    const siteId = team?.site?.toString();

    const result = await this.teamModel.findByIdAndUpdate(
      teamId,
      { $unset: { site: 1 } },
      { new: true }
    )
      .populate({
        path: 'members',
        select: '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt'
      })
      .populate('manager', '-role -password -emailVerificationOtp -otpExpiresAt -passwordResetCode -passwordResetCodeExpiresAt')
      .exec();

    // Retirer l'équipe du site (synchro inverse)
    if (siteId) {
      try {
        await this.sitesService.removeTeamFromSite(siteId, teamId);
      } catch (siteError) {
        console.error('Error removing team from site:', siteError);
      }
    }

    return result;
  }
}
