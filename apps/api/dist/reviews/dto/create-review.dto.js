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
exports.CreateReviewDto = exports.ReviewAction = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var ReviewAction;
(function (ReviewAction) {
    ReviewAction["APPROVE"] = "APPROVE";
    ReviewAction["REJECT"] = "REJECT";
    ReviewAction["MODIFY_N"] = "MODIFY_N";
})(ReviewAction || (exports.ReviewAction = ReviewAction = {}));
class CreateReviewDto {
    action;
    nValueNew;
    isCodeReason;
    comments;
}
exports.CreateReviewDto = CreateReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Review decision for the interval: APPROVE / REJECT the boring data, or MODIFY_N to correct the SPT N-value (requires nValueNew + isCodeReason)',
        enum: ReviewAction,
    }),
    (0, class_validator_1.IsEnum)(ReviewAction),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Corrected SPT N-value. Mandatory when action is MODIFY_N; ignored otherwise',
        required: false,
        example: 27,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "nValueNew", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'IS-code justification for the modification (e.g. "IS 2131 cl. 4.3 overburden correction"). Mandatory when action is MODIFY_N',
        required: false,
        maxLength: 255,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "isCodeReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Free-text reviewer comments attached to the review record',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "comments", void 0);
//# sourceMappingURL=create-review.dto.js.map