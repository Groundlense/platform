export interface StampInfo {
    boreholeCode?: string | null;
    subStructure?: string | null;
    structureType?: string | null;
    chainage?: string | null;
    span?: string | null;
    gpsLat?: number | null;
    gpsLng?: number | null;
    accuracyM?: number | null;
    takenAt?: string | null;
    photoLabel?: string | null;
    intervalNo?: number | null;
    fromDepth?: string | number | null;
    toDepth?: string | number | null;
}
export declare function isStampable(mimeType?: string | null): boolean;
export declare function stampGeoTag(filePath: string, info: StampInfo): Promise<void>;
