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
exports.CreatePasswordDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreatePasswordDto {
    mobile;
    password;
}
exports.CreatePasswordDto = CreatePasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The mobile number of the user activating their account',
        example: '9876543210',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePasswordDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The new password chosen by the user',
        example: 'NewP@ssw0rd123',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePasswordDto.prototype, "password", void 0);
//# sourceMappingURL=create-password.dto.js.map