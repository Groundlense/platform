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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const project_access_service_1 = require("../common/access/project-access.service");
const activity_logs_service_1 = require("../activity-logs/activity-logs.service");
const DIRECTORY_SELECT = {
    id: true,
    name: true,
    type: true,
    city: true,
    state: true,
};
let OrganizationsService = class OrganizationsService {
    db;
    access;
    activityLogsService;
    constructor(db, access, activityLogsService) {
        this.db = db;
        this.access = access;
        this.activityLogsService = activityLogsService;
    }
    async findAll(type) {
        return this.db.organization.findMany({
            where: type ? { type } : undefined,
            select: DIRECTORY_SELECT,
            orderBy: {
                name: 'asc',
            },
        });
    }
    async findOne(organizationId, user) {
        const organization = await this.db.organization.findUnique({
            where: { id: organizationId },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        this.access.assertSameOrganization(user, organization.id);
        return organization;
    }
    async create(dto, user) {
        if (!this.access.isSuperAdmin(user)) {
            throw new common_1.ForbiddenException('Only the platform administrator can create organizations directly');
        }
        const organization = await this.db.organization.create({
            data: {
                name: dto.name,
                type: dto.type,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                city: dto.city,
                state: dto.state,
                country: dto.country,
                gstin: dto.gstin,
                pan: dto.pan,
                registeredAddress: dto.registeredAddress,
                pincode: dto.pincode,
                logoUrl: dto.logoUrl,
                website: dto.website,
            },
        });
        await this.activityLogsService.log(user.id, 'ORGANIZATION_CREATED', 'ORGANIZATION', organization.id, {
            name: organization.name,
            type: organization.type,
        });
        return organization;
    }
    async update(organizationId, dto, user) {
        const organization = await this.db.organization.findUnique({
            where: { id: organizationId },
            select: { id: true },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        this.access.assertSameOrganization(user, organizationId);
        const updated = await this.db.organization.update({
            where: { id: organizationId },
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                city: dto.city,
                state: dto.state,
                country: dto.country,
                gstin: dto.gstin,
                pan: dto.pan,
                registeredAddress: dto.registeredAddress,
                pincode: dto.pincode,
                logoUrl: dto.logoUrl,
                website: dto.website,
            },
        });
        await this.activityLogsService.log(user.id, 'ORGANIZATION_UPDATED', 'ORGANIZATION', organizationId, {
            updatedFields: Object.keys(dto),
        });
        return updated;
    }
    async verifyKyc(organizationId, user) {
        const organization = await this.db.organization.findUnique({
            where: { id: organizationId },
            select: { id: true, name: true },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        const updated = await this.db.organization.update({
            where: { id: organizationId },
            data: {
                isVerified: true,
                verifiedAt: new Date(),
            },
        });
        await this.activityLogsService.log(user.id, 'ORGANIZATION_KYC_VERIFIED', 'ORGANIZATION', organizationId, {
            name: organization.name,
        });
        return updated;
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        project_access_service_1.ProjectAccessService,
        activity_logs_service_1.ActivityLogsService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map