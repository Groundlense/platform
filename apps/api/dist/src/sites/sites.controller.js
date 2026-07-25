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
exports.SitesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const sites_service_1 = require("./sites.service");
const create_site_dto_1 = require("./dto/create-site.dto");
let SitesController = class SitesController {
    sitesService;
    constructor(sitesService) {
        this.sitesService = sitesService;
    }
    create(projectId, dto) {
        return this.sitesService.create(projectId, dto);
    }
    findByProject(projectId) {
        return this.sitesService.findByProject(projectId);
    }
    findOne(id) {
        return this.sitesService.findOne(id);
    }
    getDashboard(siteId) {
        return this.sitesService.getDashboard(siteId);
    }
};
exports.SitesController = SitesController;
__decorate([
    (0, common_1.Post)('projects/:projectId/sites'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_site_dto_1.CreateSiteDto]),
    __metadata("design:returntype", void 0)
], SitesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('projects/:projectId/sites'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SitesController.prototype, "findByProject", null);
__decorate([
    (0, common_1.Get)('sites/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SitesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('sites/:siteId/dashboard'),
    __param(0, (0, common_1.Param)('siteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SitesController.prototype, "getDashboard", null);
exports.SitesController = SitesController = __decorate([
    (0, swagger_1.ApiTags)('Sites'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [sites_service_1.SitesService])
], SitesController);
//# sourceMappingURL=sites.controller.js.map