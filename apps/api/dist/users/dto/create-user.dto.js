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
exports.CreateUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateUserDto {
    organizationId;
    firstName;
    lastName;
    email;
    employeeCode;
    roleCode;
    designation;
    userType;
    preferredLanguage;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the organization the user belongs to',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "organizationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'First name of the user',
        example: 'Ravi',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Last name of the user',
        example: 'Sharma',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email address of the user (used as login identifier when provided)',
        example: 'ravi.sharma@groundlense.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Internal employee code (alternative login identifier for field staff)',
        example: 'EMP-0042',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "employeeCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Role code to assign to the user (e.g. ADMIN, ENGINEER, FIELD_WORKER)',
        example: 'FIELD_WORKER',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "roleCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Designation / role name of the user',
        example: 'Driller',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "designation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User type / qualification of the user',
        example: 'ITI',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "userType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Preferred language / status of the user',
        example: 'On site',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "preferredLanguage", void 0);
//# sourceMappingURL=create-user.dto.js.map