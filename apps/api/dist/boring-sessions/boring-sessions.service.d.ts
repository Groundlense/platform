import { DatabaseService } from '../database/database.service';
import { CreateBoringSessionDto } from './dto/create-boring-session.dto';
import { EndBoringSessionDto } from './dto/end-boring-session.dto';
export declare class BoringSessionsService {
    private readonly db;
    constructor(db: DatabaseService);
    start(boreholeId: string, workerId: string, dto: CreateBoringSessionDto): Promise<any>;
    end(sessionId: string, dto: EndBoringSessionDto): Promise<any>;
    findByBorehole(boreholeId: string): Promise<any>;
}
