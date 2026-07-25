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
exports.CreateSampleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateSampleDto {
    sampleNumber;
    sampleType;
    sampleDepth;
    remarks;
}
exports.CreateSampleDto = CreateSampleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sample identifier as recorded on the borelog',
        example: 'DS-1',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSampleDto.prototype, "sampleNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type of sample collected (e.g. disturbed, undisturbed, SPT split-spoon, water)',
        enum: client_1.SampleType,
    }),
    (0, class_validator_1.IsEnum)(client_1.SampleType),
    __metadata("design:type", String)
], CreateSampleDto.prototype, "sampleType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Depth at which the sample was recovered, in meters below ground level (numeric string)',
        example: '4.50',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSampleDto.prototype, "sampleDepth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional remarks about the sample (recovery, condition, preservation)',
        example: 'UDS tube recovery 85%, sealed with wax',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSampleDto.prototype, "remarks", void 0);
//# sourceMappingURL=create-sample.dto.js.map