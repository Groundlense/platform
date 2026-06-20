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
exports.CreateNablLabDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateNablLabDto {
    companyId;
    nablCertNumber;
    labName;
    accreditedTests;
    certValidFrom;
    certValidUntil;
    verificationDocUrl;
}
exports.CreateNablLabDto = CreateNablLabDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Organization ID associated with the lab' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNablLabDto.prototype, "companyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NABL certification identifier code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNablLabDto.prototype, "nablCertNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Official name of the lab' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNablLabDto.prototype, "labName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'JSON structure listing accredited tests' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], CreateNablLabDto.prototype, "accreditedTests", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Certification validity start date' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNablLabDto.prototype, "certValidFrom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Certification validity end date' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNablLabDto.prototype, "certValidUntil", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL link to certificate document' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateNablLabDto.prototype, "verificationDocUrl", void 0);
//# sourceMappingURL=create-nabl-lab.dto.js.map