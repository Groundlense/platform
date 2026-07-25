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
exports.CreateTeamDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateTeamDto {
    code;
    name;
    description;
    projectId;
}
exports.CreateTeamDto = CreateTeamDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique team code within the organization',
        example: 'RIG-02',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeamDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Team name',
        example: 'Drilling Crew B',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeamDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Description of the team, its rig, or area of operation',
        example: 'Rotary rig crew handling boreholes in the northern site cluster',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeamDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Associated project ID (optional)',
        example: 'd9b0f7e1-8a5f-4a6f-a5b6-7c8d9e0f1a2b',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeamDto.prototype, "projectId", void 0);
//# sourceMappingURL=create-team.dto.js.map