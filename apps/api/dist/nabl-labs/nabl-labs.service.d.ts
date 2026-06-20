import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateNablLabDto } from './dto/create-nabl-lab.dto';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { DispatchSampleDto } from './dto/dispatch-sample.dto';
export declare class NablLabsService {
    private readonly db;
    private readonly access;
    private readonly activityLogsService;
    constructor(db: DatabaseService, access: ProjectAccessService, activityLogsService: ActivityLogsService);
    registerLab(dto: CreateNablLabDto): Promise<any>;
    approveLab(labId: string): Promise<any>;
    findAllLabs(): Promise<any>;
    submitResult(sampleId: string, dto: CreateLabResultDto): Promise<any>;
    dispatchSample(sampleId: string, dto: DispatchSampleDto, user: any): Promise<any>;
    getResult(sampleId: string): Promise<any>;
}
