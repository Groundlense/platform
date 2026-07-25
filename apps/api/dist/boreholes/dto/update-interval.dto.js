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
exports.UpdateIntervalDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateIntervalDto {
    soilDescription;
    nValue;
    remarks;
}
exports.UpdateIntervalDto = UpdateIntervalDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Visual soil/rock description for the depth interval (per IS 1498 classification)',
        example: 'Silty clay of medium plasticity (CI), stiff, brownish grey',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIntervalDto.prototype, "soilDescription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'SPT N-value for the interval — sum of blow counts for the last 300 mm of penetration (IS 2131)',
        example: 18,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateIntervalDto.prototype, "nValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional remarks for the interval (e.g. refusal, wash boring, casing depth)',
        example: 'Refusal at 50 blows for 8 cm penetration',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIntervalDto.prototype, "remarks", void 0);
//# sourceMappingURL=update-interval.dto.js.map