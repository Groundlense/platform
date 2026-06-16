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
exports.BoreholesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const boreholes_service_1 = require("./boreholes.service");
const create_borehole_dto_1 = require("./dto/create-borehole.dto");
const update_interval_dto_1 = require("./dto/update-interval.dto");
const create_sample_dto_1 = require("./dto/create-sample.dto");
const assign_borehole_dto_1 = require("./dto/assign-borehole.dto");
const swagger_1 = require("@nestjs/swagger");
const update_borehole_status_dto_1 = require("./dto/update-borehole-status.dto");
const create_water_table_dto_1 = require("./dto/create-water-table.dto");
const export_query_dto_1 = require("./dto/export-query.dto");
let BoreholesController = class BoreholesController {
    boreholesService;
    constructor(boreholesService) {
        this.boreholesService = boreholesService;
    }
    create(projectId, dto, user) {
        return this.boreholesService.create(projectId, user, dto);
    }
    findByProject(projectId, user) {
        return this.boreholesService.findByProject(projectId, user);
    }
    findOne(id, user) {
        return this.boreholesService.findOne(id, user);
    }
    getIntervals(boreholeId, user) {
        return this.boreholesService.getIntervals(boreholeId, user);
    }
    updateInterval(id, dto, user) {
        return this.boreholesService.updateInterval(id, user, dto);
    }
    createSample(intervalId, dto, user) {
        return this.boreholesService.createSample(intervalId, user, dto);
    }
    getSamples(intervalId, user) {
        return this.boreholesService.getSamples(intervalId, user);
    }
    assign(boreholeId, dto, user) {
        return this.boreholesService.assign(boreholeId, user, dto);
    }
    updateStatus(boreholeId, dto, user) {
        return this.boreholesService.updateStatus(boreholeId, dto.status, user);
    }
    getReportData(boreholeId, user) {
        return this.boreholesService.getReportData(boreholeId, user);
    }
    createWaterTableObservation(boreholeId, dto, user) {
        return this.boreholesService
            .createWaterTableObservation(boreholeId, dto, user);
    }
    getWaterTableObservations(boreholeId, user) {
        return this.boreholesService
            .getWaterTableObservations(boreholeId, user);
    }
    getIntegrity(boreholeId, user) {
        return this.boreholesService.getIntegrity(boreholeId, user);
    }
    async exportBorehole(boreholeId, query, user, res) {
        if (query.format === 'csv') {
            const { fileName, csv } = await this.boreholesService.exportBoreholeCsv(boreholeId, user);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            return res.send(csv);
        }
        const { fileName, payload } = await this.boreholesService.exportBorehole(boreholeId, user);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.send(JSON.stringify(payload, null, 2));
    }
    exportProject(projectId, _query, user) {
        return this.boreholesService.exportProject(projectId, user);
    }
};
exports.BoreholesController = BoreholesController;
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_CREATE'),
    (0, common_1.Post)('projects/:projectId/boreholes'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_borehole_dto_1.CreateBoreholeDto, Object]),
    __metadata("design:returntype", void 0)
], BoreholesController.prototype, "create", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_VIEW'),
    (0, common_1.Get)('projects/:projectId/boreholes'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BoreholesController.prototype, "findByProject", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_VIEW'),
    (0, common_1.Get)('boreholes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BoreholesController.prototype, "findOne", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_VIEW'),
    (0, common_1.Get)('boreholes/:id/intervals'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BoreholesController.prototype, "getIntervals", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_EDIT'),
    (0, common_1.Patch)('intervals/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_interval_dto_1.UpdateIntervalDto, Object]),
    __metadata("design:returntype", void 0)
], BoreholesController.prototype, "updateInterval", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_EDIT'),
    (0, common_1.Post)('intervals/:intervalId/samples'),
    __param(0, (0, common_1.Param)('intervalId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_sample_dto_1.CreateSampleDto, Object]),
    __metadata("design:returntype", void 0)
], BoreholesController.prototype, "createSample", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_VIEW'),
    (0, common_1.Get)('intervals/:intervalId/samples'),
    __param(0, (0, common_1.Param)('intervalId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BoreholesController.prototype, "getSamples", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('WORKER_ASSIGN'),
    (0, common_1.Patch)('boreholes/:id/assignment'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_borehole_dto_1.AssignBoreholeDto, Object]),
    __metadata("design:returntype", void 0)
], BoreholesController.prototype, "assign", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_EDIT'),
    (0, common_1.Patch)('boreholes/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_borehole_status_dto_1.UpdateBoreholeStatusDto, Object]),
    __metadata("design:returntype", void 0)
], BoreholesController.prototype, "updateStatus", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('REPORT_VIEW'),
    (0, common_1.Get)('boreholes/:id/report-data'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BoreholesController.prototype, "getReportData", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_EDIT'),
    (0, common_1.Post)('boreholes/:id/water-table'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_water_table_dto_1.CreateWaterTableDto, Object]),
    __metadata("design:returntype", void 0)
], BoreholesController.prototype, "createWaterTableObservation", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_VIEW'),
    (0, common_1.Get)('boreholes/:id/water-table'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BoreholesController.prototype, "getWaterTableObservations", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('REPORT_VIEW'),
    (0, common_1.Get)('boreholes/:id/integrity'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BoreholesController.prototype, "getIntegrity", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('REPORT_VIEW'),
    (0, common_1.Get)('boreholes/:id/export'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, export_query_dto_1.ExportBoreholeQueryDto, Object, Object]),
    __metadata("design:returntype", Promise)
], BoreholesController.prototype, "exportBorehole", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('REPORT_VIEW'),
    (0, common_1.Get)('projects/:projectId/export'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, export_query_dto_1.ExportProjectQueryDto, Object]),
    __metadata("design:returntype", void 0)
], BoreholesController.prototype, "exportProject", null);
exports.BoreholesController = BoreholesController = __decorate([
    (0, swagger_1.ApiTags)('Boreholes'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [boreholes_service_1.BoreholesService])
], BoreholesController);
//# sourceMappingURL=boreholes.controller.js.map