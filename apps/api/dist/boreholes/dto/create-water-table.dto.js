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
exports.CreateWaterTableDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateWaterTableDto {
    depth;
    observedAt;
    remarks;
}
exports.CreateWaterTableDto = CreateWaterTableDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Depth at which the water table was encountered, in meters below ground level',
        example: 6.2,
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateWaterTableDto.prototype, "depth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ISO 8601 date-time when the water level was observed',
        example: '2026-06-12T08:30:00.000Z',
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateWaterTableDto.prototype, "observedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional remarks about the observation (e.g. measured 24 hours after boring, seepage)',
        example: 'Stabilized reading taken 24 hours after completion of boring',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWaterTableDto.prototype, "remarks", void 0);
//# sourceMappingURL=create-water-table.dto.js.map