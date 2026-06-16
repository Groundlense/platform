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
exports.NablLabsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const nabl_labs_service_1 = require("./nabl-labs.service");
const create_nabl_lab_dto_1 = require("./dto/create-nabl-lab.dto");
const create_lab_result_dto_1 = require("./dto/create-lab-result.dto");
const dispatch_sample_dto_1 = require("./dto/dispatch-sample.dto");
let NablLabsController = class NablLabsController {
    nablLabsService;
    constructor(nablLabsService) {
        this.nablLabsService = nablLabsService;
    }
    registerLab(dto) {
        return this.nablLabsService.registerLab(dto);
    }
    findAllLabs() {
        return this.nablLabsService.findAllLabs();
    }
    approveLab(labId) {
        return this.nablLabsService.approveLab(labId);
    }
    submitResult(sampleId, dto) {
        return this.nablLabsService.submitResult(sampleId, dto);
    }
    dispatchSample(sampleId, dto, user) {
        return this.nablLabsService.dispatchSample(sampleId, dto, user);
    }
    getResult(sampleId) {
        return this.nablLabsService.getResult(sampleId);
    }
};
exports.NablLabsController = NablLabsController;
__decorate([
    (0, permissions_decorator_1.Permissions)('PROJECT_EDIT'),
    (0, common_1.Post)('nabl-labs'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_nabl_lab_dto_1.CreateNablLabDto]),
    __metadata("design:returntype", void 0)
], NablLabsController.prototype, "registerLab", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('PROJECT_VIEW'),
    (0, common_1.Get)('nabl-labs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NablLabsController.prototype, "findAllLabs", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('NABL_LAB_APPROVE'),
    (0, common_1.Patch)('nabl-labs/:labId/approve'),
    __param(0, (0, common_1.Param)('labId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NablLabsController.prototype, "approveLab", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_EDIT'),
    (0, common_1.Post)('samples/:sampleId/lab-results'),
    __param(0, (0, common_1.Param)('sampleId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_lab_result_dto_1.CreateLabResultDto]),
    __metadata("design:returntype", void 0)
], NablLabsController.prototype, "submitResult", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_EDIT'),
    (0, common_1.Patch)('samples/:sampleId/dispatch'),
    __param(0, (0, common_1.Param)('sampleId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_sample_dto_1.DispatchSampleDto, Object]),
    __metadata("design:returntype", void 0)
], NablLabsController.prototype, "dispatchSample", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_VIEW'),
    (0, common_1.Get)('samples/:sampleId/lab-results'),
    __param(0, (0, common_1.Param)('sampleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NablLabsController.prototype, "getResult", null);
exports.NablLabsController = NablLabsController = __decorate([
    (0, swagger_1.ApiTags)('NABL Labs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [nabl_labs_service_1.NablLabsService])
], NablLabsController);
//# sourceMappingURL=nabl-labs.controller.js.map