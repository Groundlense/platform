import type { Response } from 'express';
import { BoreholesService } from './boreholes.service';
import { CreateBoreholeDto } from './dto/create-borehole.dto';
import { UpdateIntervalDto } from './dto/update-interval.dto';
import { CreateSampleDto } from './dto/create-sample.dto';
import { AssignBoreholeDto } from './dto/assign-borehole.dto';
import { UpdateBoreholeStatusDto } from './dto/update-borehole-status.dto';
import { CreateWaterTableDto } from './dto/create-water-table.dto';
import { ExportBoreholeQueryDto, ExportProjectQueryDto } from './dto/export-query.dto';
export declare class BoreholesController {
    private readonly boreholesService;
    constructor(boreholesService: BoreholesService);
    create(projectId: string, dto: CreateBoreholeDto, user: any): Promise<any>;
    findByProject(projectId: string, user: any): Promise<any>;
    findOne(id: string, user: any): Promise<any>;
    getIntervals(boreholeId: string, user: any): Promise<any>;
    updateInterval(id: string, dto: UpdateIntervalDto, user: any): Promise<any>;
    createSample(intervalId: string, dto: CreateSampleDto, user: any): Promise<any>;
    getSamples(intervalId: string, user: any): Promise<any>;
    assign(boreholeId: string, dto: AssignBoreholeDto, user: any): Promise<any>;
    updateStatus(boreholeId: string, dto: UpdateBoreholeStatusDto, user: any): Promise<any>;
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
    exportBorehole(boreholeId: string, query: ExportBoreholeQueryDto, user: any, res: Response): Promise<any>;
    exportProject(projectId: string, _query: ExportProjectQueryDto, user: any): Promise<{
        exportedAt: string;
        project: any;
        integrity: Record<string, any>;
    }>;
}
