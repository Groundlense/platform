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
exports.IntegrityService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
let IntegrityService = class IntegrityService {
    db;
    constructor(db) {
        this.db = db;
    }
    computeRecordHash(prevHash, record) {
        const material = `${prevHash ?? 'GENESIS'}|${this.canonicalJson(record)}`;
        return (0, node_crypto_1.createHash)('sha256').update(material, 'utf8').digest('hex');
    }
    hashIntervalPayload(interval) {
        return {
            boreholeId: interval.boreholeId,
            intervalNo: interval.intervalNo,
            fromDepth: interval.fromDepth,
            toDepth: interval.toDepth,
            blow1: interval.blow1 ?? null,
            blow2: interval.blow2 ?? null,
            blow3: interval.blow3 ?? null,
            nValue: interval.nValue ?? null,
            nCorrected: interval.nCorrected ?? null,
            isRefusal: interval.isRefusal ?? false,
            penetrationMm: interval.penetrationMm ?? null,
            soilDescription: interval.soilDescription ?? null,
            observedAt: this.toIsoOrNull(interval.observedAt),
            recordedByUserId: interval.recordedByUserId ?? null,
        };
    }
    hashWaterTablePayload(observation) {
        return {
            boreholeId: observation.boreholeId,
            depth: observation.depth,
            observedAt: this.toIsoOrNull(observation.observedAt),
            readingType: observation.readingType ?? null,
            createdByUserId: observation.createdByUserId,
        };
    }
    async rehashChain(boreholeId, fromIntervalNo) {
        const previous = await this.db.boreholeInterval.findFirst({
            where: {
                boreholeId,
                intervalNo: { lt: fromIntervalNo },
            },
            orderBy: { intervalNo: 'desc' },
        });
        const tail = await this.db.boreholeInterval.findMany({
            where: {
                boreholeId,
                intervalNo: { gte: fromIntervalNo },
            },
            orderBy: { intervalNo: 'asc' },
        });
        let running = previous?.sha256Hash ?? null;
        let updated = 0;
        for (const interval of tail) {
            const sha256Hash = this.computeRecordHash(running, this.hashIntervalPayload(interval));
            if (interval.sha256Hash !== sha256Hash || interval.prevHash !== running) {
                await this.db.boreholeInterval.update({
                    where: { id: interval.id },
                    data: { prevHash: running, sha256Hash },
                });
                updated += 1;
            }
            running = sha256Hash;
        }
        return { updated, chainRoot: running };
    }
    toIsoOrNull(value) {
        if (value == null) {
            return null;
        }
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
    canonicalJson(value) {
        if (value === null || value === undefined) {
            return 'null';
        }
        if (typeof value === 'number') {
            return Number.isFinite(value) ? String(value) : 'null';
        }
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        if (typeof value === 'string') {
            return JSON.stringify(value);
        }
        if (value instanceof Date) {
            return JSON.stringify(value.toISOString());
        }
        if (typeof value === 'object' && typeof value.toNumber === 'function') {
            return String(Number(value.toNumber()));
        }
        if (Array.isArray(value)) {
            return `[${value.map((item) => this.canonicalJson(item)).join(',')}]`;
        }
        if (typeof value === 'object') {
            const keys = Object.keys(value).sort();
            const entries = keys.map((key) => `${JSON.stringify(key)}:${this.canonicalJson(value[key])}`);
            return `{${entries.join(',')}}`;
        }
        return JSON.stringify(String(value));
    }
};
exports.IntegrityService = IntegrityService;
exports.IntegrityService = IntegrityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], IntegrityService);
//# sourceMappingURL=integrity.service.js.map