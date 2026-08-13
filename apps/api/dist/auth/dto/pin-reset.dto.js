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
exports.CompletePinResetDto = exports.GeneratePinResetLinkDto = exports.RequestPinResetDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RequestPinResetDto {
    mobile;
}
exports.RequestPinResetDto = RequestPinResetDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Mobile number of the worker account' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestPinResetDto.prototype, "mobile", void 0);
class GeneratePinResetLinkDto {
    userId;
}
exports.GeneratePinResetLinkDto = GeneratePinResetLinkDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User id of the crew member to reset' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GeneratePinResetLinkDto.prototype, "userId", void 0);
class CompletePinResetDto {
    token;
    mobile;
    newPassword;
}
exports.CompletePinResetDto = CompletePinResetDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Single-use token from the reset link' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CompletePinResetDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Mobile number of the account being reset' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CompletePinResetDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'New PIN / password (min 4 characters)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    __metadata("design:type", String)
], CompletePinResetDto.prototype, "newPassword", void 0);
//# sourceMappingURL=pin-reset.dto.js.map