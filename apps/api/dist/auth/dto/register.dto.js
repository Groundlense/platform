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
exports.RegisterDto = exports.RegisterAdminDto = exports.RegisterOrganizationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class RegisterOrganizationDto {
    name;
    type;
    gstin;
    email;
    phone;
    city;
    state;
}
exports.RegisterOrganizationDto = RegisterOrganizationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Registered company name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterOrganizationDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Company type per the ERD',
        enum: client_1.OrganizationType,
    }),
    (0, class_validator_1.IsEnum)(client_1.OrganizationType),
    __metadata("design:type", String)
], RegisterOrganizationDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'GST identification number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterOrganizationDto.prototype, "gstin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Company contact email' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterOrganizationDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Company contact phone number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterOrganizationDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'City of the company office' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterOrganizationDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'State of the company office' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterOrganizationDto.prototype, "state", void 0);
class RegisterAdminDto {
    firstName;
    lastName;
    email;
    password;
    mobile;
}
exports.RegisterAdminDto = RegisterAdminDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'First name of the company admin' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterAdminDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Last name of the company admin' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterAdminDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Login email of the company admin' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterAdminDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account password (minimum 8 characters)',
        minLength: 8,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], RegisterAdminDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Mobile number of the company admin' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterAdminDto.prototype, "mobile", void 0);
class RegisterDto {
    organization;
    admin;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Company being registered',
        type: RegisterOrganizationDto,
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RegisterOrganizationDto),
    __metadata("design:type", RegisterOrganizationDto)
], RegisterDto.prototype, "organization", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'First admin user of the company',
        type: RegisterAdminDto,
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RegisterAdminDto),
    __metadata("design:type", RegisterAdminDto)
], RegisterDto.prototype, "admin", void 0);
//# sourceMappingURL=register.dto.js.map