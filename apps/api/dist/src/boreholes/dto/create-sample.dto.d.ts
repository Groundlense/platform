import { SampleType } from '@prisma/client';
export declare class CreateSampleDto {
    sampleNumber: string;
    sampleType: SampleType;
    sampleDepth: string;
    remarks?: string;
}
