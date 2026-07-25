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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SitesService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let SitesService = class SitesService {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(projectId, dto) {
        return this.db.projectSite.create({
            data: {
                projectId,
                code: dto.code,
                name: dto.name,
                description: dto.description,
                latitude: dto.latitude,
                longitude: dto.longitude,
            },
        });
    }
    async findByProject(projectId) {
        return this.db.projectSite.findMany({
            where: {
                projectId,
            },
            orderBy: {
                code: 'asc',
            },
        });
    }
    async findOne(id) {
        return this.db.projectSite.findUnique({
            where: {
                id,
            },
            include: {
                project: true,
                boreholes: true,
            },
        });
    }
    async getDashboard(siteId) {
        const site = await this.db.projectSite.findUnique({
            where: {
                id: siteId,
            },
            include: {
                boreholes: true,
            },
        });
        const boreholes = site?.boreholes ?? [];
        return {
            siteId: site?.id,
            siteName: site?.name,
            boreholes: boreholes.length,
            planned: boreholes.filter((b) => b.status === 'PLANNED').length,
            inProgress: boreholes.filter((b) => b.status === 'IN_PROGRESS').length,
            completed: boreholes.filter((b) => b.status === 'COMPLETED').length,
            abandoned: boreholes.filter((b) => b.status === 'ABANDONED').length,
        };
    }
};
exports.SitesService = SitesService;
exports.SitesService = SitesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SitesService);
//# sourceMappingURL=sites.service.js.map