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
exports.CreateLabResultDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateLabResultDto {
    nablLabId;
    testType;
    testValues;
    resultValues;
    reportNumber;
    reportPdfUrl;
    testedOn;
}
exports.CreateLabResultDto = CreateLabResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the NABL Lab conducting the tests' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLabResultDto.prototype, "nablLabId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The geotechnical test type' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLabResultDto.prototype, "testType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Raw parameters/values of the test' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], CreateLabResultDto.prototype, "testValues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Final processed results metrics' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], CreateLabResultDto.prototype, "resultValues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lab report validation number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLabResultDto.prototype, "reportNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'URL link to the uploaded PDF certificate report' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLabResultDto.prototype, "reportPdfUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date the test was completed' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLabResultDto.prototype, "testedOn", void 0);
//# sourceMappingURL=create-lab-result.dto.js.map