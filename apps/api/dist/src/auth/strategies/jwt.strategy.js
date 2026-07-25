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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const database_service_1 = require("../../database/database.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt') {
    db;
    constructor(db) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_ACCESS_SECRET,
        });
        this.db = db;
    }
    async validate(payload) {
        const user = await this.db.user.findUnique({
            where: {
                id: payload.sub,
            },
            include: {
                organization: true,
                roles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!user || user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('User no longer active');
        }
        const roles = user.roles.map((r) => r.role.code);
        const permissions = user.roles.flatMap((r) => r.role.rolePermissions.map((rp) => rp.permission.code));
        return {
            id: user.id,
            organizationId: user.organizationId,
            firstName: user.firstName,
            lastName: user.lastName,
            employeeCode: user.employeeCode,
            email: user.email,
            organization: user.organization,
            roles,
            permissions,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map