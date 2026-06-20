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
exports.NablLabsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const project_access_service_1 = require("../common/access/project-access.service");
const activity_logs_service_1 = require("../activity-logs/activity-logs.service");
let NablLabsService = class NablLabsService {
    db;
    access;
    activityLogsService;
    constructor(db, access, activityLogsService) {
        this.db = db;
        this.access = access;
        this.activityLogsService = activityLogsService;
    }
    async registerLab(dto) {
        const org = await this.db.organization.findUnique({
            where: { id: dto.companyId },
        });
        if (!org) {
            throw new common_1.NotFoundException('Company organization not found');
        }
        return this.db.nablLab.upsert({
            where: { companyId: dto.companyId },
            update: {
                nablCertNumber: dto.nablCertNumber,
                labName: dto.labName,
                accreditedTests: dto.accreditedTests,
                certValidFrom: new Date(dto.certValidFrom),
                certValidUntil: new Date(dto.certValidUntil),
                verificationDocUrl: dto.verificationDocUrl || null,
                isVerified: false,
            },
            create: {
                companyId: dto.companyId,
                nablCertNumber: dto.nablCertNumber,
                labName: dto.labName,
                accreditedTests: dto.accreditedTests,
                certValidFrom: new Date(dto.certValidFrom),
                certValidUntil: new Date(dto.certValidUntil),
                verificationDocUrl: dto.verificationDocUrl || null,
                isVerified: false,
            },
        });
    }
    async approveLab(labId) {
        const lab = await this.db.nablLab.findUnique({
            where: { id: labId },
        });
        if (!lab) {
            throw new common_1.NotFoundException('NABL Lab not registered');
        }
        return this.db.nablLab.update({
            where: { id: labId },
            data: { isVerified: true },
        });
    }
    async findAllLabs() {
        return this.db.nablLab.findMany({
            include: {
                organization: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
    }
    async submitResult(sampleId, dto) {
        const sample = await this.db.sample.findUnique({
            where: { id: sampleId },
        });
        if (!sample) {
            throw new common_1.NotFoundException('Soil sample not found');
        }
        const lab = await this.db.nablLab.findUnique({
            where: { id: dto.nablLabId },
        });
        if (!lab) {
            throw new common_1.NotFoundException('NABL Lab not registered');
        }
        return this.db.$transaction(async (tx) => {
            const result = await tx.labResult.upsert({
                where: { sampleId },
                update: {
                    nablLabId: dto.nablLabId,
                    testType: dto.testType,
                    testValues: dto.testValues,
                    resultValues: dto.resultValues,
                    reportNumber: dto.reportNumber,
                    reportPdfUrl: dto.reportPdfUrl,
                    testedOn: new Date(dto.testedOn),
                },
                create: {
                    sampleId,
                    nablLabId: dto.nablLabId,
                    testType: dto.testType,
                    testValues: dto.testValues,
                    resultValues: dto.resultValues,
                    reportNumber: dto.reportNumber,
                    reportPdfUrl: dto.reportPdfUrl,
                    testedOn: new Date(dto.testedOn),
                },
            });
            await tx.sample.update({
                where: { id: sampleId },
                data: {
                    status: 'TESTED',
                },
            });
            return result;
        });
    }
    async dispatchSample(sampleId, dto, user) {
        const sample = await this.db.sample.findUnique({
            where: { id: sampleId },
        });
        if (!sample) {
            throw new common_1.NotFoundException('Soil sample not found');
        }
        await this.access.assertIntervalAccess(user, sample.intervalId);
        const lab = await this.db.nablLab.findUnique({
            where: { id: dto.assignedLabId },
        });
        if (!lab) {
            throw new common_1.NotFoundException('NABL Lab not registered');
        }
        if (!lab.isVerified) {
            throw new common_1.BadRequestException('NABL lab is not yet approved by Groundlense');
        }
        const updated = await this.db.sample.update({
            where: { id: sampleId },
            data: {
                assignedLabId: lab.id,
                dispatchedToLabId: lab.id,
                dispatchDate: dto.dispatchDate
                    ? new Date(dto.dispatchDate)
                    : new Date(),
                status: 'DISPATCHED',
            },
        });
        await this.activityLogsService.log(user.id, 'SAMPLE_DISPATCHED', 'SAMPLE', sampleId, {
            assignedLabId: lab.id,
            labName: lab.labName,
        });
        return updated;
    }
    async getResult(sampleId) {
        const result = await this.db.labResult.findUnique({
            where: { sampleId },
            include: {
                nablLab: true,
                sample: true,
            },
        });
        if (!result) {
            throw new common_1.NotFoundException('No lab results found for this sample');
        }
        return result;
    }
};
exports.NablLabsService = NablLabsService;
exports.NablLabsService = NablLabsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        project_access_service_1.ProjectAccessService,
        activity_logs_service_1.ActivityLogsService])
], NablLabsService);
//# sourceMappingURL=nabl-labs.service.js.map