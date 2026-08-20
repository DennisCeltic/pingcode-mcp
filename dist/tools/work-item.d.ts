export interface ListWorkItemsParams {
    identifier?: string;
    project_ids?: string;
    type_ids?: string;
    assignee_ids?: string;
    state_ids?: string;
    sprint_ids?: string;
    keywords?: string;
    updated_between?: string;
    page_index?: number;
    page_size?: number;
}
export interface CreateWorkItemParams {
    project_id: string;
    type_id: string;
    title: string;
    description?: string;
    state_id?: string;
    priority_id?: string;
    assignee_id?: string;
    sprint_id?: string;
    parent_id?: string;
    story_points?: number;
    estimated_workload?: number;
    remaining_workload?: number;
    start_at?: number;
    end_at?: number;
    phase_id?: string;
}
export interface UpdateWorkItemParams {
    work_item_id: string;
    title?: string;
    description?: string;
    state_id?: string;
    priority_id?: string;
    assignee_id?: string;
    sprint_id?: string;
    parent_id?: string;
    story_points?: number;
    estimated_workload?: number;
    remaining_workload?: number;
    start_at?: number;
    end_at?: number;
    phase_id?: string;
}
export declare function listWorkItems(params?: ListWorkItemsParams): Promise<unknown>;
export declare function getWorkItem(workItemId: string): Promise<unknown>;
export declare function createWorkItem(params: CreateWorkItemParams): Promise<unknown>;
export declare function updateWorkItem(params: UpdateWorkItemParams): Promise<unknown>;
//# sourceMappingURL=work-item.d.ts.map