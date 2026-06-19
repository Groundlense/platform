"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const SAFE_USER_SELECT = {
    id: true,
    organizationId: true,
    employeeCode: true,
    firstName: true,
    lastName: true,
    email: true,
    mobile: true,
    mobileVerified: true,
    status: true,
    lastLoginAt: true,
    userType: true,
    designation: true,
    profilePhotoUrl: true,
    preferredLanguage: true,
    createdAt: true,
    updatedAt: true,
};
let UsersService = class UsersService {
    db;
    constructor(db) {
        this.db = db;
    }
    isSuperAdmin(actor) {
        return actor?.roles?.includes('SUPER_ADMIN') ?? false;
    }
    async assertSameOrganization(actor, userId) {
        const target = await this.db.user.findUnique({
            where: { id: userId },
            select: { id: true, organizationId: true },
        });
        if (!target) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!this.isSuperAdmin(actor) &&
            target.organizationId !== actor.organizationId) {
            throw new common_1.ForbiddenException('User belongs to another organization');
        }
        return target;
    }
    async findByIdentifier(identifier) {
        return this.db.user.findFirst({
            where: {
                OR: [{ email: identifier }, { employeeCode: identifier }],
            },
            include: {
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
    }
    async findAll(actor) {
        return this.db.user.findMany({
            where: this.isSuperAdmin(actor)
                ? undefined
                : { organizationId: actor.organizationId },
            select: {
                ...SAFE_USER_SELECT,
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
            orderBy: {
                firstName: 'asc',
            },
        });
    }
    async createUser(dto, actor) {
        const organizationId = this.isSuperAdmin(actor)
            ? dto.organizationId
            : actor.organizationId;
        const oneTimePassword = crypto.randomBytes(9).toString('base64url');
        const passwordHash = await bcrypt.hash(oneTimePassword, 10);
        let employeeCode = dto.employeeCode?.trim() || null;
        if (!employeeCode) {
            const org = await this.db.organization.findUnique({
                where: { id: organizationId },
                select: { type: true },
            });
            let prefix = 'GL-W';
            if (dto.roleCode === 'FIELD_WORKER' || dto.roleCode === 'WORKER') {
                prefix = 'GL-W';
            }
            else if (dto.roleCode === 'DRILLER') {
                prefix = 'GL-D';
            }
            else if (dto.roleCode === 'LAB_TECHNICIAN') {
                prefix = 'GL-L';
            }
            else if (dto.roleCode === 'PROJECT_MANAGER' || dto.roleCode === 'PM') {
                prefix = 'GL-GEO';
            }
            else if (org?.type === 'EPC_CONTRACTOR') {
                prefix = 'GL-CON';
            }
            else if (org?.type === 'GEOTECH_CONTRACTOR') {
                prefix = 'GL-GEO';
            }
            else if (org?.type === 'CLIENT') {
                prefix = 'GL-CL';
            }
            else if (org?.type === 'NABL_LAB') {
                prefix = 'GL-LAB';
            }
            else if (org?.type === 'IE_FIRM') {
                prefix = 'GL-ENG';
            }
            else if (org?.type === 'STRUCTURAL_CONSULTANT') {
                prefix = 'GL-STR';
            }
            let isUnique = false;
            let attempts = 0;
            while (!isUnique && attempts < 10) {
                const randNum = Math.floor(1000 + Math.random() * 9000);
                const candidate = `${prefix}-${randNum}`;
                const existing = await this.db.user.findUnique({
                    where: { employeeCode: candidate },
                });
                if (!existing) {
                    employeeCode = candidate;
                    isUnique = true;
                }
                attempts++;
            }
        }
        let mobileVerified = false;
        if (dto.mobile) {
            const otpRecord = await this.db.otp.findUnique({
                where: { type_target: { type: 'MOBILE', target: dto.mobile } },
            });
            if (otpRecord && otpRecord.verified) {
                mobileVerified = true;
            }
        }
        const user = await this.db.user.create({
            data: {
                organizationId,
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                mobile: dto.mobile,
                mobileVerified,
                employeeCode,
                passwordHash,
                designation: dto.designation,
                userType: dto.userType,
                preferredLanguage: dto.preferredLanguage,
            },
            select: SAFE_USER_SELECT,
        });
        const role = await this.db.role.findUnique({
            where: {
                code: dto.roleCode,
            },
        });
        if (role) {
            await this.db.userRole.create({
                data: {
                    userId: user.id,
                    roleId: role.id,
                },
            });
        }
        return {
            user,
            oneTimePassword,
        };
    }
    async updateStatus(userId, status, actor) {
        await this.assertSameOrganization(actor, userId);
        return this.db.user.update({
            where: {
                id: userId,
            },
            data: {
                status,
            },
            select: SAFE_USER_SELECT,
        });
    }
    async findOne(userId, actor) {
        await this.assertSameOrganization(actor, userId);
        return this.db.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                ...SAFE_USER_SELECT,
                roles: {
                    include: {
                        role: true,
                    },
                },
                teamMemberships: {
                    include: {
                        team: true,
                    },
                },
            },
        });
    }
    async resetPin(userId, pin, actor) {
        await this.assertSameOrganization(actor, userId);
        const pinHash = await bcrypt.hash(pin, 10);
        return this.db.user.update({
            where: {
                id: userId,
            },
            data: {
                pinHash,
            },
            select: SAFE_USER_SELECT,
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], UsersService);
//# sourceMappingURL=users.service.js.map