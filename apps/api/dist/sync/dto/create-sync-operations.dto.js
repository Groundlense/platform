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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSyncOperationsDto = exports.SyncOperationItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class SyncOperationItemDto {
    deviceId;
    operationId;
    entityType;
    entityId;
    operationType;
    payloadJson;
    boringSessionId;
}
exports.SyncOperationItemDto = SyncOperationItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Device ID registry key' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SyncOperationItemDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Client side operation sequence ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SyncOperationItemDto.prototype, "operationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target entity type', enum: client_1.SyncEntityType }),
    (0, class_validator_1.IsEnum)(client_1.SyncEntityType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", typeof (_a = typeof client_1.SyncEntityType !== "undefined" && client_1.SyncEntityType) === "function" ? _a : Object)
], SyncOperationItemDto.prototype, "entityType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UUID of target data entity' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SyncOperationItemDto.prototype, "entityId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Operation type', enum: client_1.OperationType }),
    (0, class_validator_1.IsEnum)(client_1.OperationType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", typeof (_b = typeof client_1.OperationType !== "undefined" && client_1.OperationType) === "function" ? _b : Object)
], SyncOperationItemDto.prototype, "operationType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Changed fields snapshot payload' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], SyncOperationItemDto.prototype, "payloadJson", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Associated shift boring session ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SyncOperationItemDto.prototype, "boringSessionId", void 0);
class CreateSyncOperationsDto {
    operations;
}
exports.CreateSyncOperationsDto = CreateSyncOperationsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sync queue operations list',
        type: [SyncOperationItemDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SyncOperationItemDto),
    __metadata("design:type", Array)
], CreateSyncOperationsDto.prototype, "operations", void 0);
//# sourceMappingURL=create-sync-operations.dto.js.map