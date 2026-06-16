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
exports.AssignBoreholeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AssignBoreholeDto {
    siteId;
    teamId;
}
exports.AssignBoreholeDto = AssignBoreholeDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID of the site to assign the borehole to',
        example: 'b3c1a2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignBoreholeDto.prototype, "siteId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID of the drilling/logging team to assign the borehole to',
        example: 'f6e5d4c3-b2a1-4b3c-9d8e-7f6a5b4c3d2e',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignBoreholeDto.prototype, "teamId", void 0);
//# sourceMappingURL=assign-borehole.dto.js.map