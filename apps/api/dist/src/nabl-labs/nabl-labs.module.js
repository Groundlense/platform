"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NablLabsModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../database/database.module");
const activity_logs_module_1 = require("../activity-logs/activity-logs.module");
const nabl_labs_service_1 = require("./nabl-labs.service");
const nabl_labs_controller_1 = require("./nabl-labs.controller");
let NablLabsModule = class NablLabsModule {
};
exports.NablLabsModule = NablLabsModule;
exports.NablLabsModule = NablLabsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, activity_logs_module_1.ActivityLogsModule],
        controllers: [nabl_labs_controller_1.NablLabsController],
        providers: [nabl_labs_service_1.NablLabsService],
        exports: [nabl_labs_service_1.NablLabsService],
    })
], NablLabsModule);
//# sourceMappingURL=nabl-labs.module.js.map