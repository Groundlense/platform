import { DatabaseService } from '../../database/database.service';
export declare class IntegrityService {
    private readonly db;
    constructor(db: DatabaseService);
    computeRecordHash(prevHash: string | null, record: object): string;
    hashIntervalPayload(interval: {
        boreholeId: string;
        intervalNo: number;
        fromDepth: any;
        toDepth: any;
        blow1: number | null;
        blow2: number | null;
        blow3: number | null;
        nValue: number | null;
        nCorrected: number | null;
        isRefusal: boolean;
        penetrationMm: number | null;
        soilDescription: string | null;
        observedAt: Date | string | null;
        recordedByUserId: string | null;
    }): object;
    hashWaterTablePayload(observation: {
        boreholeId: string;
        depth: any;
        observedAt: Date | string;
        readingType: string | null;
        createdByUserId: string;
    }): object;
    rehashChain(boreholeId: string, fromIntervalNo: number): Promise<{
        updated: number;
        chainRoot: string | null;
    }>;
    private toIsoOrNull;
    private canonicalJson;
}
