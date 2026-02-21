"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentsService = void 0;
const common_1 = require("@nestjs/common");
let IncidentsService = class IncidentsService {
    incidents = [];
    findAll() {
        return this.incidents;
    }
    findOne(id) {
        const inc = this.incidents.find((i) => i.id === id);
        if (!inc)
            throw new common_1.NotFoundException("Incident not found");
        return inc;
    }
    create(dto) {
        const incident = {
            id: (Date.now() + Math.random()).toString(36),
            type: dto.type,
            degree: dto.degree,
            title: dto.title,
            description: dto.description ?? null,
            reportedAt: new Date().toISOString(),
            reportedBy: dto.reportedBy ?? null,
        };
        this.incidents.push(incident);
        return incident;
    }
    update(id, dto) {
        const inc = this.findOne(id);
        Object.assign(inc, dto);
        return inc;
    }
    remove(id) {
        const idx = this.incidents.findIndex((i) => i.id === id);
        if (idx === -1)
            throw new common_1.NotFoundException("Incident not found");
        this.incidents.splice(idx, 1);
        return { removed: true };
    }
};
exports.IncidentsService = IncidentsService;
exports.IncidentsService = IncidentsService = __decorate([
    (0, common_1.Injectable)()
], IncidentsService);
//# sourceMappingURL=incidents.service.js.map