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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteProjectCompanyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class InviteProjectCompanyDto {
    organizationId;
    role;
}
exports.InviteProjectCompanyDto = InviteProjectCompanyDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Organization to link to the project',
        example: '3f1d2c40-8a9b-4c1d-9e2f-5a6b7c8d9e0f',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InviteProjectCompanyDto.prototype, "organizationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Role the company plays on this project',
        enum: client_1.ProjectCompanyRole,
        example: client_1.ProjectCompanyRole.CONTRACTOR,
    }),
    (0, class_validator_1.IsEnum)(client_1.ProjectCompanyRole),
    __metadata("design:type", typeof (_a = typeof client_1.ProjectCompanyRole !== "undefined" && client_1.ProjectCompanyRole) === "function" ? _a : Object)
], InviteProjectCompanyDto.prototype, "role", void 0);
//# sourceMappingURL=invite-project-company.dto.js.map