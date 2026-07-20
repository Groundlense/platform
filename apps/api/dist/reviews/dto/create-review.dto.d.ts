export declare enum ReviewAction {
    APPROVE = "APPROVE",
    REJECT = "REJECT",
    MODIFY_N = "MODIFY_N",
    MODIFY_FIELD = "MODIFY_FIELD"
}
export declare const EDITABLE_INTERVAL_FIELDS: readonly ["fromDepth", "toDepth", "blow1", "blow2", "blow3", "nValue", "nCorrected", "soilDescription"];
export type EditableIntervalField = (typeof EDITABLE_INTERVAL_FIELDS)[number];
export declare class CreateReviewDto {
    action: ReviewAction;
    nValueNew?: number;
    fieldName?: EditableIntervalField;
    fieldValueNew?: string;
    isCodeReason?: string;
    comments?: string;
}
