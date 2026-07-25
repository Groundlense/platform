export declare function isCloudinaryConfigured(): boolean;
export declare function isRemoteFilePath(filePath: string): boolean;
export declare function uploadToCloudinary(localPath: string, opts: {
    folder: string;
    fileName?: string;
    mimeType?: string;
}): Promise<string>;
