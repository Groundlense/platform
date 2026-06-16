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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const users_service_1 = require("../users/users.service");
const database_service_1 = require("../database/database.service");
const activity_logs_service_1 = require("../activity-logs/activity-logs.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    db;
    activityLogsService;
    constructor(usersService, jwtService, db, activityLogsService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.db = db;
        this.activityLogsService = activityLogsService;
    }
    hashToken(token) {
        return crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
    }
    generateRefreshToken() {
        return crypto
            .randomBytes(48)
            .toString('base64url');
    }
    async issueTokens(userId, organizationId) {
        const accessToken = await this.jwtService.signAsync({
            sub: userId,
            organizationId,
        });
        const refreshToken = this.generateRefreshToken();
        await this.db.refreshToken.create({
            data: {
                userId,
                tokenHash: this.hashToken(refreshToken),
                expiresAt: new Date(Date.now() +
                    30 * 24 * 60 * 60 * 1000),
            },
        });
        return {
            accessToken,
            refreshToken,
        };
    }
    async login(identifier, password) {
        const user = await this.usersService.findByIdentifier(identifier);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('User account inactive');
        }
        let valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid && user.pinHash) {
            valid = await bcrypt.compare(password, user.pinHash);
        }
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.activityLogsService.log(user.id, 'LOGIN', 'USER', user.id);
        return this.issueTokens(user.id, user.organizationId);
    }
    async register(dto) {
        const existingUser = await this.db.user.findUnique({
            where: { email: dto.admin.email },
            select: { id: true },
        });
        if (existingUser) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        if (dto.organization.gstin) {
            const existingOrg = await this.db.organization.findFirst({
                where: { gstin: dto.organization.gstin },
                select: { id: true },
            });
            if (existingOrg) {
                throw new common_1.ConflictException('An organization with this GSTIN already exists');
            }
        }
        const roleCode = dto.organization.type === 'EPC_CONTRACTOR'
            ? 'EPC_ADMIN'
            : 'GEOTECH_ADMIN';
        const passwordHash = await bcrypt.hash(dto.admin.password, 10);
        const user = await this.db.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: {
                    name: dto.organization.name,
                    type: dto.organization.type,
                    gstin: dto.organization.gstin,
                    email: dto.organization.email,
                    phone: dto.organization.phone,
                    city: dto.organization.city,
                    state: dto.organization.state,
                },
            });
            let prefix = 'GL-USER';
            if (dto.organization.type === 'EPC_CONTRACTOR') {
                prefix = 'GL-CON';
            }
            else if (dto.organization.type === 'GEOTECH_CONTRACTOR') {
                prefix = 'GL-GEO';
            }
            else if (dto.organization.type === 'CLIENT') {
                prefix = 'GL-CL';
            }
            else if (dto.organization.type === 'NABL_LAB') {
                prefix = 'GL-LAB';
            }
            else if (dto.organization.type === 'IE_FIRM') {
                prefix = 'GL-ENG';
            }
            else if (dto.organization.type === 'STRUCTURAL_CONSULTANT') {
                prefix = 'GL-STR';
            }
            let employeeCode = '';
            let isUnique = false;
            let attempts = 0;
            while (!isUnique && attempts < 10) {
                const randNum = Math.floor(1000 + Math.random() * 9000);
                employeeCode = `${prefix}-${randNum}`;
                const existing = await tx.user.findUnique({
                    where: { employeeCode },
                });
                if (!existing) {
                    isUnique = true;
                }
                attempts++;
            }
            const admin = await tx.user.create({
                data: {
                    organizationId: organization.id,
                    employeeCode: isUnique ? employeeCode : null,
                    firstName: dto.admin.firstName,
                    lastName: dto.admin.lastName,
                    email: dto.admin.email,
                    mobile: dto.admin.mobile,
                    passwordHash,
                    status: 'ACTIVE',
                },
            });
            const role = await tx.role.findUnique({
                where: { code: roleCode },
            });
            if (role) {
                await tx.userRole.create({
                    data: {
                        userId: admin.id,
                        roleId: role.id,
                    },
                });
            }
            return admin;
        });
        await this.activityLogsService.log(user.id, 'REGISTER', 'ORGANIZATION', user.organizationId, {
            organizationName: dto.organization.name,
            organizationType: dto.organization.type,
            adminRole: roleCode,
        });
        return this.issueTokens(user.id, user.organizationId);
    }
    async refresh(refreshToken) {
        const matchedToken = await this.db.refreshToken.findFirst({
            where: {
                tokenHash: this.hashToken(refreshToken),
                revokedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                user: true,
            },
        });
        if (!matchedToken) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        await this.db.refreshToken.update({
            where: {
                id: matchedToken.id,
            },
            data: {
                revokedAt: new Date(),
            },
        });
        return this.issueTokens(matchedToken.user.id, matchedToken.user.organizationId);
    }
    async logout(refreshToken) {
        const token = await this.db.refreshToken.findFirst({
            where: {
                tokenHash: this.hashToken(refreshToken),
                revokedAt: null,
            },
        });
        if (!token) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        await this.db.refreshToken.update({
            where: {
                id: token.id,
            },
            data: {
                revokedAt: new Date(),
            },
        });
        return {
            success: true,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        database_service_1.DatabaseService,
        activity_logs_service_1.ActivityLogsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map