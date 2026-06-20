export declare enum ReviewAction {
    APPROVE = "APPROVE",
    REJECT = "REJECT",
    MODIFY_N = "MODIFY_N"
}
export declare class CreateReviewDto {
    action: ReviewAction;
    nValueNew?: number;
    isCodeReason?: string;
    comments?: string;
}
