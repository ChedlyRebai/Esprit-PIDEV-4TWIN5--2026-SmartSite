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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestionSiteController = void 0;
const common_1 = require("@nestjs/common");
const gestion_site_service_1 = require("./gestion-site.service");
const dto_1 = require("./dto");
let GestionSiteController = class GestionSiteController {
    constructor(gestionSiteService) {
        this.gestionSiteService = gestionSiteService;
    }
    async create(createSiteDto) {
        return this.gestionSiteService.create(createSiteDto);
    }
    async findAll(page, limit, nom, localisation, estActif, status, budgetMin, budgetMax) {
        const parsedBudgetMin = budgetMin ? parseInt(budgetMin, 10) : undefined;
        const parsedBudgetMax = budgetMax ? parseInt(budgetMax, 10) : undefined;
        const filters = {
            nom,
            localisation,
            estActif: estActif !== undefined ? estActif === 'true' : undefined,
            status,
            budgetMin: parsedBudgetMin,
            budgetMax: parsedBudgetMax,
        };
        const pagination = {
            page,
            limit,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        };
        return this.gestionSiteService.findAll(filters, pagination);
    }
    async getStatistics() {
        return this.gestionSiteService.getStatistics();
    }
    async getTotalBudget() {
        const total = await this.gestionSiteService.getTotalBudget();
        return { totalBudget: total };
    }
    async findActiveSites() {
        return this.gestionSiteService.findActiveSites();
    }
    async findById(id) {
        return this.gestionSiteService.findById(id);
    }
    async findByName(nom) {
        return this.gestionSiteService.findByName(nom);
    }
    async findByLocalisation(localisation) {
        return this.gestionSiteService.findByLocalisation(localisation);
    }
    async update(id, updateSiteDto) {
        return this.gestionSiteService.update(id, updateSiteDto);
    }
    async softDelete(id) {
        return this.gestionSiteService.softDelete(id);
    }
    async restore(id) {
        return this.gestionSiteService.restore(id);
    }
    async remove(id) {
        return this.gestionSiteService.remove(id);
    }
};
exports.GestionSiteController = GestionSiteController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateSiteDto]),
    __metadata("design:returntype", Promise)
], GestionSiteController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('nom')),
    __param(3, (0, common_1.Query)('localisation')),
    __param(4, (0, common_1.Query)('estActif')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('budgetMin')),
    __param(7, (0, common_1.Query)('budgetMax')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], GestionSiteController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GestionSiteController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('budget/total'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GestionSiteController.prototype, "getTotalBudget", null);
__decorate([
    (0, common_1.Get)('active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GestionSiteController.prototype, "findActiveSites", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GestionSiteController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('search/nom/:nom'),
    __param(0, (0, common_1.Param)('nom')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GestionSiteController.prototype, "findByName", null);
__decorate([
    (0, common_1.Get)('localisation/:localisation'),
    __param(0, (0, common_1.Param)('localisation')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GestionSiteController.prototype, "findByLocalisation", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateSiteDto]),
    __metadata("design:returntype", Promise)
], GestionSiteController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id/soft'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GestionSiteController.prototype, "softDelete", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GestionSiteController.prototype, "restore", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GestionSiteController.prototype, "remove", null);
exports.GestionSiteController = GestionSiteController = __decorate([
    (0, common_1.Controller)('gestion-sites'),
    __metadata("design:paramtypes", [gestion_site_service_1.GestionSiteService])
], GestionSiteController);
//# sourceMappingURL=gestion-site.controller.js.map