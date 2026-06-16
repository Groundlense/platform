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
exports.SoilDescriptionsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let SoilDescriptionsService = class SoilDescriptionsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async upsert(intervalId, userId, dto) {
        const interval = await this.db.boreholeInterval.findUnique({
            where: { id: intervalId },
        });
        if (!interval) {
            throw new common_1.NotFoundException('Borehole interval not found');
        }
        return this.db.soilDescription.upsert({
            where: { sptRecordId: intervalId },
            update: {
                soilType: dto.soilType,
                uscsCode: dto.uscsCode || null,
                color: dto.color || null,
                consistency: dto.consistency || null,
                description: dto.description,
                remarks: dto.remarks || null,
                enteredByUserId: userId,
            },
            create: {
                sptRecordId: intervalId,
                soilType: dto.soilType,
                uscsCode: dto.uscsCode || null,
                color: dto.color || null,
                consistency: dto.consistency || null,
                description: dto.description,
                remarks: dto.remarks || null,
                enteredByUserId: userId,
            },
        });
    }
    async findByInterval(intervalId) {
        const description = await this.db.soilDescription.findUnique({
            where: { sptRecordId: intervalId },
            include: {
                enteredBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        if (!description) {
            throw new common_1.NotFoundException('Soil description not found for this interval');
        }
        return description;
    }
};
exports.SoilDescriptionsService = SoilDescriptionsService;
exports.SoilDescriptionsService = SoilDescriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SoilDescriptionsService);
//# sourceMappingURL=soil-descriptions.service.js.map