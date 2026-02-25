"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestionSiteModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const gestion_site_service_1 = require("./gestion-site.service");
const gestion_site_controller_1 = require("./gestion-site.controller");
const site_entity_1 = require("./entities/site.entity");
let GestionSiteModule = class GestionSiteModule {
};
exports.GestionSiteModule = GestionSiteModule;
exports.GestionSiteModule = GestionSiteModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: site_entity_1.Site.name, schema: site_entity_1.SiteSchema }]),
        ],
        providers: [gestion_site_service_1.GestionSiteService],
        controllers: [gestion_site_controller_1.GestionSiteController],
        exports: [gestion_site_service_1.GestionSiteService],
    })
], GestionSiteModule);
//# sourceMappingURL=gestion-site.module.js.map