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
exports.BoringSessionsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let BoringSessionsService = class BoringSessionsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async start(boreholeId, workerId, dto) {
        const borehole = await this.db.borehole.findUnique({
            where: { id: boreholeId },
        });
        if (!borehole) {
            throw new common_1.NotFoundException('Borehole not found');
        }
        return this.db.boringSession.create({
            data: {
                boreholeId,
                workerId,
                startDepth: dto.startDepth,
                endDepth: dto.startDepth,
                status: 'IN_PROGRESS',
                startedAt: new Date(),
            },
        });
    }
    async end(sessionId, dto) {
        const session = await this.db.boringSession.findUnique({
            where: { id: sessionId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Boring session not found');
        }
        return this.db.boringSession.update({
            where: { id: sessionId },
            data: {
                endDepth: dto.endDepth,
                status: dto.status,
                terminationReason: dto.terminationReason || null,
                endedAt: new Date(),
            },
        });
    }
    async findByBorehole(boreholeId) {
        return this.db.boringSession.findMany({
            where: { boreholeId },
            include: {
                worker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                    },
                },
            },
            orderBy: {
                startedAt: 'desc',
            },
        });
    }
};
exports.BoringSessionsService = BoringSessionsService;
exports.BoringSessionsService = BoringSessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], BoringSessionsService);
//# sourceMappingURL=boring-sessions.service.js.map