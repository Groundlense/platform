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
exports.CreateBoreholeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateBoreholeDto {
    boreholeCode;
    name;
    latitude;
    longitude;
    groundLevelRL;
    plannedDepth;
    structureType;
    chainage;
    span;
}
exports.CreateBoreholeDto = CreateBoreholeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique borehole code within the project (as marked on the borelog)',
        example: 'BH-01',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBoreholeDto.prototype, "boreholeCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Human-readable name or location label for the borehole',
        example: 'Bridge Abutment A1',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBoreholeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Latitude of the borehole location in decimal degrees (WGS84), as a numeric string',
        example: '28.613939',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], CreateBoreholeDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Longitude of the borehole location in decimal degrees (WGS84), as a numeric string',
        example: '77.209021',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], CreateBoreholeDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Ground level reduced level (RL) at the borehole collar in meters, as a numeric string',
        example: '212.45',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], CreateBoreholeDto.prototype, "groundLevelRL", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Planned termination depth of the borehole in meters below ground level, as a numeric string',
        example: '30.0',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], CreateBoreholeDto.prototype, "plannedDepth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Structure type of the boring location',
        example: 'VUP',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBoreholeDto.prototype, "structureType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Chainage of the boring location',
        example: '134+550',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBoreholeDto.prototype, "chainage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Span details of the structure',
        example: '1x20',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBoreholeDto.prototype, "span", void 0);
//# sourceMappingURL=create-borehole.dto.js.map