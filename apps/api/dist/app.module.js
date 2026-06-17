"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const database_module_1 = require("./database/database.module");
const access_module_1 = require("./common/access/access.module");
const integrity_module_1 = require("./common/integrity/integrity.module");
const config_1 = require("@nestjs/config");
const projects_module_1 = require("./projects/projects.module");
const boreholes_module_1 = require("./boreholes/boreholes.module");
const media_module_1 = require("./media/media.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const sites_module_1 = require("./sites/sites.module");
const teams_module_1 = require("./teams/teams.module");
const activity_logs_module_1 = require("./activity-logs/activity-logs.module");
const boring_sessions_module_1 = require("./boring-sessions/boring-sessions.module");
const soil_descriptions_module_1 = require("./soil-descriptions/soil-descriptions.module");
const nabl_labs_module_1 = require("./nabl-labs/nabl-labs.module");
const payments_module_1 = require("./payments/payments.module");
const sync_module_1 = require("./sync/sync.module");
const reviews_module_1 = require("./reviews/reviews.module");
const organizations_module_1 = require("./organizations/organizations.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: process.env.NODE_ENV === 'production' ? undefined : '.env.development',
            }),
            database_module_1.DatabaseModule,
            access_module_1.AccessModule,
            integrity_module_1.IntegrityModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            projects_module_1.ProjectsModule,
            boreholes_module_1.BoreholesModule,
            media_module_1.MediaModule,
            dashboard_module_1.DashboardModule,
            sites_module_1.SitesModule,
            teams_module_1.TeamsModule,
            activity_logs_module_1.ActivityLogsModule,
            boring_sessions_module_1.BoringSessionsModule,
            soil_descriptions_module_1.SoilDescriptionsModule,
            nabl_labs_module_1.NablLabsModule,
            payments_module_1.PaymentsModule,
            sync_module_1.SyncModule,
            reviews_module_1.ReviewsModule,
            organizations_module_1.OrganizationsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map