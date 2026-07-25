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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const project_access_service_1 = require("../common/access/project-access.service");
let DashboardService = class DashboardService {
    db;
    access;
    constructor(db, access) {
        this.db = db;
        this.access = access;
    }
    async getSummary(user) {
        const scopedProjects = await this.db.project.findMany({
            where: this.access.projectScopeWhere(user),
            select: { id: true },
        });
        const projectIds = scopedProjects.map((p) => p.id);
        const boreholeScope = {
            projectId: { in: projectIds },
        };
        const [boreholes, intervals, samples, media] = await Promise.all([
            this.db.borehole.count({
                where: boreholeScope,
            }),
            this.db.boreholeInterval.count({
                where: { borehole: boreholeScope },
            }),
            this.db.sample.count({
                where: {
                    interval: { borehole: boreholeScope },
                },
            }),
            this.db.media.count({
                where: {
                    interval: { borehole: boreholeScope },
                },
            }),
        ]);
        return {
            projects: projectIds.length,
            boreholes,
            intervals,
            samples,
            media,
        };
    }
    async getProjectDashboard(projectId, user) {
        await this.access.assertProjectAccess(user, projectId);
        const project = await this.db.project.findUnique({
            where: {
                id: projectId,
            },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        const boreholes = await this.db.borehole.findMany({
            where: {
                projectId,
            },
            select: {
                id: true,
            },
        });
        const boreholeIds = boreholes.map((b) => b.id);
        const intervals = await this.db.boreholeInterval.count({
            where: {
                boreholeId: {
                    in: boreholeIds,
                },
            },
        });
        const completedIntervals = await this.db.boreholeInterval.count({
            where: {
                boreholeId: {
                    in: boreholeIds,
                },
                isCompleted: true,
            },
        });
        const samples = await this.db.sample.count({
            where: {
                interval: {
                    boreholeId: {
                        in: boreholeIds,
                    },
                },
            },
        });
        const media = await this.db.media.count({
            where: {
                interval: {
                    boreholeId: {
                        in: boreholeIds,
                    },
                },
            },
        });
        const completionPercentage = intervals === 0 ? 0 : Math.round((completedIntervals / intervals) * 100);
        return {
            projectId,
            projectName: project.name,
            boreholes: boreholeIds.length,
            intervals,
            completedIntervals,
            completionPercentage,
            samples,
            media,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        project_access_service_1.ProjectAccessService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map