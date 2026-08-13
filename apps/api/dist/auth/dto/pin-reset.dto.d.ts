export declare class RequestPinResetDto {
    mobile: string;
}
export declare class GeneratePinResetLinkDto {
    userId: string;
}
export declare class CompletePinResetDto {
    token: string;
    mobile: string;
    newPassword: string;
}
