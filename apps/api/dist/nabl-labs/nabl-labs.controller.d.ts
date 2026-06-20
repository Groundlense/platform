import { NablLabsService } from './nabl-labs.service';
import { CreateNablLabDto } from './dto/create-nabl-lab.dto';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { DispatchSampleDto } from './dto/dispatch-sample.dto';
export declare class NablLabsController {
    private readonly nablLabsService;
    constructor(nablLabsService: NablLabsService);
    registerLab(dto: CreateNablLabDto): Promise<any>;
    findAllLabs(): Promise<any>;
    approveLab(labId: string): Promise<any>;
    submitResult(sampleId: string, dto: CreateLabResultDto): Promise<any>;
    dispatchSample(sampleId: string, dto: DispatchSampleDto, user: any): Promise<any>;
    getResult(sampleId: string): Promise<any>;
}
