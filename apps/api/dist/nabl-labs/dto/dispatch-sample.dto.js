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
exports.DispatchSampleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class DispatchSampleDto {
    assignedLabId;
    dispatchDate;
}
exports.DispatchSampleDto = DispatchSampleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the GL-verified NABL lab the sample is dispatched to',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DispatchSampleDto.prototype, "assignedLabId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date the sample was dispatched (defaults to now)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DispatchSampleDto.prototype, "dispatchDate", void 0);
//# sourceMappingURL=dispatch-sample.dto.js.map