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
exports.AssignProjectRoleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AssignProjectRoleDto {
    userId;
    projectRole;
}
exports.AssignProjectRoleDto = AssignProjectRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User receiving the project-level role',
        example: '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignProjectRoleDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Role code (roles.code) to assign at project level, e.g. GEOTECH_ENGINEER',
        example: 'GEOTECH_ENGINEER',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AssignProjectRoleDto.prototype, "projectRole", void 0);
//# sourceMappingURL=assign-project-role.dto.js.map