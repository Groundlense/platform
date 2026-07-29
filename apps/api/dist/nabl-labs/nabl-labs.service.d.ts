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
    registerLab(dto: CreateNablLabDto): Promise<{
        id: string;
        createdAt: Date;
        isVerified: boolean;
        companyId: string;
        nablCertNumber: string;
        labName: string;
        accreditedTests: import("@prisma/client/runtime/library").JsonValue;
        certValidFrom: Date;
        certValidUntil: Date;
        verificationDocUrl: string | null;
    }>;
    approveLab(labId: string): Promise<{
        id: string;
        createdAt: Date;
        isVerified: boolean;
        companyId: string;
        nablCertNumber: string;
        labName: string;
        accreditedTests: import("@prisma/client/runtime/library").JsonValue;
        certValidFrom: Date;
        certValidUntil: Date;
        verificationDocUrl: string | null;
    }>;
    findAllLabs(): Promise<({
        organization: {
            name: string;
            email: string | null;
            phone: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        isVerified: boolean;
        companyId: string;
        nablCertNumber: string;
        labName: string;
        accreditedTests: import("@prisma/client/runtime/library").JsonValue;
        certValidFrom: Date;
        certValidUntil: Date;
        verificationDocUrl: string | null;
    })[]>;
    submitResult(sampleId: string, dto: CreateLabResultDto): Promise<{
        id: string;
        createdAt: Date;
        sha256Hash: string | null;
        nablLabId: string;
        testType: string;
        testValues: import("@prisma/client/runtime/library").JsonValue;
        resultValues: import("@prisma/client/runtime/library").JsonValue;
        reportNumber: string;
        reportPdfUrl: string;
        testedOn: Date;
        sampleId: string;
    }>;
    dispatchSample(sampleId: string, dto: DispatchSampleDto, user: any): Promise<{
        id: string;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
        remarks: string | null;
        sampleNumber: string;
        sampleType: import("@prisma/client").$Enums.SampleType;
        sampleDepth: import("@prisma/client/runtime/library").Decimal;
        depthFrom: import("@prisma/client/runtime/library").Decimal | null;
        depthTo: import("@prisma/client/runtime/library").Decimal | null;
        collectedAt: Date | null;
        sampleCondition: string | null;
        dispatchDate: Date | null;
        intervalId: string;
        collectedByUserId: string | null;
        dispatchedToLabId: string | null;
        assignedLabId: string | null;
    }>;
    getResult(sampleId: string): Promise<{
        nablLab: {
            id: string;
            createdAt: Date;
            isVerified: boolean;
            companyId: string;
            nablCertNumber: string;
            labName: string;
            accreditedTests: import("@prisma/client/runtime/library").JsonValue;
            certValidFrom: Date;
            certValidUntil: Date;
            verificationDocUrl: string | null;
        };
        sample: {
            id: string;
            status: string | null;
            createdAt: Date;
            updatedAt: Date;
            remarks: string | null;
            sampleNumber: string;
            sampleType: import("@prisma/client").$Enums.SampleType;
            sampleDepth: import("@prisma/client/runtime/library").Decimal;
            depthFrom: import("@prisma/client/runtime/library").Decimal | null;
            depthTo: import("@prisma/client/runtime/library").Decimal | null;
            collectedAt: Date | null;
            sampleCondition: string | null;
            dispatchDate: Date | null;
            intervalId: string;
            collectedByUserId: string | null;
            dispatchedToLabId: string | null;
            assignedLabId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        sha256Hash: string | null;
        nablLabId: string;
        testType: string;
        testValues: import("@prisma/client/runtime/library").JsonValue;
        resultValues: import("@prisma/client/runtime/library").JsonValue;
        reportNumber: string;
        reportPdfUrl: string;
        testedOn: Date;
        sampleId: string;
    }>;
}
