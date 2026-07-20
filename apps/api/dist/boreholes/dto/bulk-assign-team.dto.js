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
exports.BulkAssignTeamDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class BulkAssignTeamDto {
    boreholeIds;
    teamId;
}
exports.BulkAssignTeamDto = BulkAssignTeamDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Borehole IDs to assign in one call',
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BulkAssignTeamDto.prototype, "boreholeIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Team ID to assign the boreholes to' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkAssignTeamDto.prototype, "teamId", void 0);
//# sourceMappingURL=bulk-assign-team.dto.js.map