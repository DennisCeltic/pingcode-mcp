export interface ListActivitiesParams {
    principal_type: 'work_item' | 'test_case' | 'test_run' | 'idea' | 'ticket';
    principal_id: string;
}
export interface ActivityRecord {
    id: string;
    template: string;
    type: string;
    summary: string;
    created_at: number;
    created_by: {
        id: string;
        name: string;
        display_name: string;
    };
    content?: {
        property_key?: string;
        origin?: {
            duration?: number | null;
            unit?: string;
        };
        target?: {
            duration?: number | null;
            unit?: string;
        };
    };
}
export declare function listActivities(params: ListActivitiesParams): Promise<{
    values: ActivityRecord[];
}>;
export declare function formatActivitySummary(activities: ActivityRecord[], maxItems?: number): string;
//# sourceMappingURL=activity.d.ts.map