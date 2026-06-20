export interface InsightScopeParams {
    project_id?: string;
    sprint_id?: string;
    assignee_ids?: string;
    state_ids?: string;
    type_ids?: string;
    updated_between?: string;
    include_done?: boolean;
    stale_days?: number;
    due_soon_days?: number;
    page_size?: number;
    max_items?: number;
}
export interface WorkItemContextParams {
    work_item_id: string;
    activity_limit?: number;
    comment_limit?: number;
    include_attachments?: boolean;
}
export interface TeamLoadParams extends InsightScopeParams {
    start_at?: number;
    end_at?: number;
}
export declare function generateProjectHealthReport(params?: InsightScopeParams): Promise<string>;
export declare function summarizeWorkItemContext(params: WorkItemContextParams): Promise<string>;
export declare function generateTeamLoadReport(params?: TeamLoadParams): Promise<string>;
export declare function scanDeliveryRisks(params?: InsightScopeParams): Promise<string>;
//# sourceMappingURL=insights.d.ts.map