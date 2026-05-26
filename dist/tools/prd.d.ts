export interface PrdChildItem {
    title: string;
    description?: string;
    type_id?: string;
    priority_id?: string;
    assignee_id?: string;
    story_points?: number;
    estimated_workload?: number;
    children?: PrdChildItem[];
}
export interface CreateFromPrdParams {
    project_id: string;
    title: string;
    description?: string;
    type_id?: string;
    priority_id?: string;
    assignee_id?: string;
    sprint_id?: string;
    story_points?: number;
    estimated_workload?: number;
    children?: PrdChildItem[];
}
export declare function createFromPrd(params: CreateFromPrdParams): Promise<string>;
//# sourceMappingURL=prd.d.ts.map