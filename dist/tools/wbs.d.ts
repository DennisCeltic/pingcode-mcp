export interface WbsTask {
    title: string;
    description?: string;
    start_at?: number;
    end_at?: number;
    assignee_id?: string;
}
export interface WbsMilestone {
    title: string;
    description?: string;
    end_at: number;
    tasks?: WbsTask[];
}
export interface WbsStage {
    title: string;
    description?: string;
    start_at: number;
    end_at: number;
    milestones?: WbsMilestone[];
    tasks?: WbsTask[];
}
export interface CreateFromWbsParams {
    project_id: string;
    assignee_id?: string;
    stages: WbsStage[];
}
export declare function createFromWbs(params: CreateFromWbsParams): Promise<string>;
//# sourceMappingURL=wbs.d.ts.map