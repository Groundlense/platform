import { DatabaseService } from '../database/database.service';
import { CreateBoringSessionDto } from './dto/create-boring-session.dto';
import { EndBoringSessionDto } from './dto/end-boring-session.dto';
export declare class BoringSessionsService {
    private readonly db;
    constructor(db: DatabaseService);
    start(boreholeId: string, workerId: string, dto: CreateBoringSessionDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        startedAt: Date;
        startDepth: import("@prisma/client/runtime/library").Decimal;
        boreholeId: string;
        endDepth: import("@prisma/client/runtime/library").Decimal;
        terminationReason: string | null;
        endedAt: Date | null;
        workerId: string;
    }>;
    end(sessionId: string, dto: EndBoringSessionDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        startedAt: Date;
        startDepth: import("@prisma/client/runtime/library").Decimal;
        boreholeId: string;
        endDepth: import("@prisma/client/runtime/library").Decimal;
        terminationReason: string | null;
        endedAt: Date | null;
        workerId: string;
    }>;
    findByBorehole(boreholeId: string): Promise<({
        worker: {
            firstName: string;
            lastName: string | null;
            employeeCode: string | null;
            id: string;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        startedAt: Date;
        startDepth: import("@prisma/client/runtime/library").Decimal;
        boreholeId: string;
        endDepth: import("@prisma/client/runtime/library").Decimal;
        terminationReason: string | null;
        endedAt: Date | null;
        workerId: string;
    })[]>;
}
