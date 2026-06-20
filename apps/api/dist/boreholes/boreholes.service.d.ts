import { DatabaseService } from '../database/database.service';
import { CreateBoreholeDto } from './dto/create-borehole.dto';
import { UpdateIntervalDto } from './dto/update-interval.dto';
import { CreateSampleDto } from './dto/create-sample.dto';
import { AssignBoreholeDto } from './dto/assign-borehole.dto';
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { ProjectAccessService } from "../common/access/project-access.service";
import { IntegrityService } from "../common/integrity/integrity.service";
import { BoreholeStatus } from '@prisma/client';
import { CreateWaterTableDto } from './dto/create-water-table.dto';
export declare class BoreholesService {
    private readonly db;
    private readonly activityLogsService;
    private readonly access;
    private readonly integrity;
    constructor(db: DatabaseService, activityLogsService: ActivityLogsService, access: ProjectAccessService, integrity: IntegrityService);
    findByProject(projectId: string, user: any): Promise<any>;
    findOne(id: string, user: any): Promise<any>;
    create(projectId: string, user: any, dto: CreateBoreholeDto): Promise<any>;
    getIntervals(boreholeId: string, user: any): Promise<any>;
    updateInterval(id: string, user: any, dto: UpdateIntervalDto): Promise<any>;
    createSample(intervalId: string, user: any, dto: CreateSampleDto): Promise<any>;
    getSamples(intervalId: string, user: any): Promise<any>;
    assign(boreholeId: string, user: any, dto: AssignBoreholeDto): Promise<any>;
    updateStatus(boreholeId: string, status: BoreholeStatus, user: any): Promise<any>;
    getReportData(boreholeId: string, user: any): Promise<any>;
    createWaterTableObservation(boreholeId: string, dto: CreateWaterTableDto, user: any): Promise<any>;
    getWaterTableObservations(boreholeId: string, user: any): Promise<any>;
    getIntegrity(boreholeId: string, user: any): Promise<{
        valid: boolean;
        intervalCount: any;
        brokenAt: number[];
        unhashed: number;
        chainRoot: any;
        waterTable: {
            total: any;
            invalid: number;
            unhashed: number;
        };
    }>;
    exportBorehole(boreholeId: string, user: any): Promise<{
        fileName: string;
        payload: {
            exportedAt: string;
            borehole: any;
            integrity: {
                valid: boolean;
                intervalCount: any;
                brokenAt: number[];
                unhashed: number;
                chainRoot: any;
                waterTable: {
                    total: any;
                    invalid: number;
                    unhashed: number;
                };
            };
        };
    }>;
    exportBoreholeCsv(boreholeId: string, user: any): Promise<{
        fileName: string;
        csv: string;
    }>;
    exportProject(projectId: string, user: any): Promise<{
        exportedAt: string;
        project: any;
        integrity: Record<string, any>;
    }>;
    private computeIntegritySummary;
    private safeFileName;
    private csvEscape;
}
