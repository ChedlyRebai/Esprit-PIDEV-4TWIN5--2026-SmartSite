"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GestionSiteService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestionSiteService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const site_entity_1 = require("./entities/site.entity");
let GestionSiteService = GestionSiteService_1 = class GestionSiteService {
    constructor(siteModel, connection) {
        this.siteModel = siteModel;
        this.connection = connection;
        this.logger = new common_1.Logger(GestionSiteService_1.name);
    }
    async create(createSiteDto, userId) {
        try {
            const existingSite = await this.siteModel.findOne({
                nom: { $regex: new RegExp(`^${createSiteDto.nom}$`, 'i') },
            });
            if (existingSite) {
                throw new common_1.BadRequestException(`Un site avec le nom "${createSiteDto.nom}" existe déjà`);
            }
            const siteData = {
                ...createSiteDto,
            };
            if (userId) {
                siteData.createdBy = userId;
                siteData.updatedBy = userId;
            }
            const createdSite = new this.siteModel(siteData);
            const savedSite = await createdSite.save();
            this.logger.log(`Site créé: ${savedSite.nom} (${savedSite._id})`);
            return savedSite;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error(`Erreur lors de la création du site: ${error.message}`);
            throw new common_1.InternalServerErrorException('Erreur lors de la création du site');
        }
    }
    async findAll(filters, pagination) {
        try {
            const query = {};
            if (filters) {
                if (filters.nom) {
                    query.nom = { $regex: filters.nom, $options: 'i' };
                }
                if (filters.localisation) {
                    query.localisation = { $regex: filters.localisation, $options: 'i' };
                }
                if (filters.estActif !== undefined) {
                    query.estActif = filters.estActif;
                }
                if (filters.status) {
                    query.status = filters.status;
                }
                if (filters.budgetMin !== undefined || filters.budgetMax !== undefined) {
                    query.budget = {};
                    if (filters.budgetMin !== undefined) {
                        query.budget.$gte = filters.budgetMin;
                    }
                    if (filters.budgetMax !== undefined) {
                        query.budget.$lte = filters.budgetMax;
                    }
                }
            }
            const page = pagination?.page || 1;
            const limit = pagination?.limit || 10;
            const skip = (page - 1) * limit;
            const sort = {};
            if (pagination?.sortBy) {
                sort[pagination.sortBy] = pagination.sortOrder === 'desc' ? -1 : 1;
            }
            else {
                sort.createdAt = -1;
            }
            const [data, total] = await Promise.all([
                this.siteModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
                this.siteModel.countDocuments(query).exec(),
            ]);
            return {
                data,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            this.logger.error(`Erreur lors de la récupération des sites: ${error.message}`);
            throw new common_1.InternalServerErrorException('Erreur lors de la récupération des sites');
        }
    }
    async findById(id) {
        try {
            const site = await this.siteModel.findById(id).exec();
            if (!site) {
                throw new common_1.NotFoundException(`Site avec l'ID "${id}" non trouvé`);
            }
            return site;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Erreur lors de la récupération du site: ${error.message}`);
            throw new common_1.InternalServerErrorException('Erreur lors de la récupération du site');
        }
    }
    async findByName(nom) {
        try {
            return await this.siteModel
                .find({ nom: { $regex: nom, $options: 'i' } })
                .limit(20)
                .exec();
        }
        catch (error) {
            this.logger.error(`Erreur lors de la recherche de sites: ${error.message}`);
            throw new common_1.InternalServerErrorException('Erreur lors de la recherche de sites');
        }
    }
    async findByLocalisation(localisation) {
        try {
            return await this.siteModel
                .find({ localisation: { $regex: localisation, $options: 'i' } })
                .exec();
        }
        catch (error) {
            this.logger.error(`Erreur lors de la recherche par localisation: ${error.message}`);
            throw new common_1.InternalServerErrorException('Erreur lors de la recherche par localisation');
        }
    }
    async findActiveSites() {
        try {
            return await this.siteModel.find({ estActif: true }).exec();
        }
        catch (error) {
            this.logger.error(`Erreur lors de la récupération des sites actifs: ${error.message}`);
            throw new common_1.InternalServerErrorException('Erreur lors de la récupération des sites actifs');
        }
    }
    async update(id, updateSiteDto, userId) {
        try {
            const existingSite = await this.siteModel.findById(id).exec();
            if (!existingSite) {
                throw new common_1.NotFoundException(`Site avec l'ID "${id}" non trouvé`);
            }
            if (updateSiteDto.nom) {
                const duplicateSite = await this.siteModel.findOne({
                    nom: { $regex: new RegExp(`^${updateSiteDto.nom}$`, 'i') },
                    _id: { $ne: id },
                });
                if (duplicateSite) {
                    throw new common_1.BadRequestException(`Un site avec le nom "${updateSiteDto.nom}" existe déjà`);
                }
            }
            const updateData = { ...updateSiteDto };
            if (userId) {
                updateData.updatedBy = userId;
            }
            const updatedSite = await this.siteModel
                .findByIdAndUpdate(id, updateData, { new: true })
                .exec();
            if (!updatedSite) {
                throw new common_1.NotFoundException(`Site avec l'ID "${id}" non trouvé`);
            }
            this.logger.log(`Site mis à jour: ${updatedSite.nom} (${id})`);
            return updatedSite;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error(`Erreur lors de la mise à jour du site: ${error.message}`);
            throw new common_1.InternalServerErrorException('Erreur lors de la mise à jour du site');
        }
    }
    async softDelete(id) {
        try {
            const site = await this.siteModel
                .findByIdAndUpdate(id, { estActif: false }, { new: true })
                .exec();
            if (!site) {
                throw new common_1.NotFoundException(`Site avec l'ID "${id}" non trouvé`);
            }
            this.logger.log(`Site soft-deleted: ${site.nom} (${id})`);
            return site;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Erreur lors de la suppression du site: ${error.message}`);
            throw new common_1.InternalServerErrorException('Erreur lors de la suppression du site');
        }
    }
    async remove(id) {
        try {
            const site = await this.siteModel.findByIdAndDelete(id).exec();
            if (!site) {
                throw new common_1.NotFoundException(`Site avec l'ID "${id}" non trouvé`);
            }
            this.logger.log(`Site supprimé définitivement: ${site.nom} (${id})`);
            return { message: `Site "${site.nom}" supprimé définitivement` };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Erreur lors de la suppression définitive du site: ${error.message}`);
            throw new common_1.InternalServerErrorException('Erreur lors de la suppression définitive du site');
        }
    }
    async restore(id) {
        try {
            const site = await this.siteModel
                .findByIdAndUpdate(id, { estActif: true }, { new: true })
                .exec();
            if (!site) {
                throw new common_1.NotFoundException(`Site avec l'ID "${id}" non trouvé`);
            }
            this.logger.log(`Site restauré: ${site.nom} (${id})`);
            return site;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Erreur lors de la restauration du site: ${error.message}`);
            throw new common_1.InternalServerErrorException('Erreur lors de la restauration du site');
        }
    }
    async getStatistics() {
        try {
            const [total, active, inactive, stats] = await Promise.all([
                this.siteModel.countDocuments().exec(),
                this.siteModel.countDocuments({ estActif: true }).exec(),
                this.siteModel.countDocuments({ estActif: false }).exec(),
                this.siteModel.aggregate([
                    {
                        $group: {
                            _id: '$localisation',
                            count: { $sum: 1 },
                            totalBudget: { $sum: '$budget' },
                        },
                    },
                    { $sort: { count: -1 } },
                ]),
            ]);
            const totalBudget = stats.reduce((sum, item) => sum + item.totalBudget, 0);
            const averageBudget = total > 0 ? totalBudget / total : 0;
            return {
                total,
                active,
                inactive,
                totalBudget,
                averageBudget,
                byLocalisation: stats.map((item) => ({
                    localisation: item._id,
                    count: item.count,
                })),
            };
        }
        catch (error) {
            this.logger.error(`Erreur lors de la récupération des statistiques: ${error.message}`);
            throw new common_1.InternalServerErrorException('Erreur lors de la récupération des statistiques');
        }
    }
    async getTotalBudget() {
        try {
            const result = await this.siteModel.aggregate([
                { $group: { _id: null, total: { $sum: '$budget' } } },
            ]);
            return result[0]?.total || 0;
        }
        catch (error) {
            this.logger.error(`Erreur lors de la récupération du budget total: ${error.message}`);
            throw new common_1.InternalServerErrorException('Erreur lors de la récupération du budget total');
        }
    }
};
exports.GestionSiteService = GestionSiteService;
exports.GestionSiteService = GestionSiteService = GestionSiteService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(site_entity_1.Site.name)),
    __param(1, (0, mongoose_1.InjectConnection)()),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Connection])
], GestionSiteService);
//# sourceMappingURL=gestion-site.service.js.map