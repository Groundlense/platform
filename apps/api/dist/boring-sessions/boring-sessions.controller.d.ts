import { BoringSessionsService } from './boring-sessions.service';
import { CreateBoringSessionDto } from './dto/create-boring-session.dto';
import { EndBoringSessionDto } from './dto/end-boring-session.dto';
export declare class BoringSessionsController {
    private readonly boringSessionsService;
    constructor(boringSessionsService: BoringSessionsService);
    start(boreholeId: string, user: any, dto: CreateBoringSessionDto): Promise<any>;
    end(sessionId: string, dto: EndBoringSessionDto): Promise<any>;
    findByBorehole(boreholeId: string): Promise<any>;
}
