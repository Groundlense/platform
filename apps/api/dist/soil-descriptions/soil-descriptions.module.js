"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoilDescriptionsModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../database/database.module");
const soil_descriptions_service_1 = require("./soil-descriptions.service");
const soil_descriptions_controller_1 = require("./soil-descriptions.controller");
let SoilDescriptionsModule = class SoilDescriptionsModule {
};
exports.SoilDescriptionsModule = SoilDescriptionsModule;
exports.SoilDescriptionsModule = SoilDescriptionsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [soil_descriptions_controller_1.SoilDescriptionsController],
        providers: [soil_descriptions_service_1.SoilDescriptionsService],
        exports: [soil_descriptions_service_1.SoilDescriptionsService],
    })
], SoilDescriptionsModule);
//# sourceMappingURL=soil-descriptions.module.js.map