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
exports.ActivityLogsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const project_access_service_1 = require("../common/access/project-access.service");
const NON_FIELD_ACTIONS = [
    'LOGIN',
    'LOGOUT',
    'REGISTER',
    'TOKEN_REFRESH',
    'PASSWORD_RESET',
    'PASSWORD_CREATED',
    'OTP_SENT',
    'OTP_VERIFIED',
];
let ActivityLogsService = class ActivityLogsService {
    db;
    access;
    constructor(db, access) {
        this.db = db;
        this.access = access;
    }
    orgScopeWhere(actor) {
        return this.access.isSuperAdmin(actor)
            ? {}
            : {
                user: {
                    organizationId: actor.organizationId,
                },
            };
    }
    async log(userId, action, entityType, entityId, metadata, options) {
        return this.db.activityLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                metadata,
                oldValue: options?.oldValue,
                newValue: options?.newValue,
                actorCompanyId: options?.actorCompanyId,
                isCodeReason: options?.isCodeReason,
            },
        });
    }
    async findAll(actor) {
        return this.db.activityLog.findMany({
            where: this.orgScopeWhere(actor),
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        employeeCode: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findRecent(actor) {
        return this.db.activityLog.findMany({
            take: 20,
            where: {
                ...this.orgScopeWhere(actor),
                action: { notIn: NON_FIELD_ACTIONS },
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findByUser(userId, actor) {
        return this.db.activityLog.findMany({
            where: {
                userId,
                ...this.orgScopeWhere(actor),
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
};
exports.ActivityLogsService = ActivityLogsService;
exports.ActivityLogsService = ActivityLogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        project_access_service_1.ProjectAccessService])
], ActivityLogsService);
//# sourceMappingURL=activity-logs.service.js.map