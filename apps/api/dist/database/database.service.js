"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const RETRY_DELAYS_MS = [2_000, 4_000, 8_000, 15_000, 30_000];
let DatabaseService = DatabaseService_1 = class DatabaseService extends client_1.PrismaClient {
    logger = new common_1.Logger(DatabaseService_1.name);
    async onModuleInit() {
        for (let attempt = 0;; attempt++) {
            try {
                await this.$connect();
                if (attempt > 0) {
                    this.logger.log(`Database connected after ${attempt + 1} attempts`);
                }
                return;
            }
            catch (err) {
                if (attempt >= RETRY_DELAYS_MS.length) {
                    this.logger.error(`Database unreachable after ${attempt + 1} attempts — giving up`);
                    throw err;
                }
                const delay = RETRY_DELAYS_MS[attempt];
                this.logger.warn(`Database connect failed (attempt ${attempt + 1}/${RETRY_DELAYS_MS.length + 1}): ${err.message?.split('\n')[0]} — retrying in ${delay / 1000}s`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)()
], DatabaseService);
//# sourceMappingURL=database.service.js.map