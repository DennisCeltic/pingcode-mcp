export interface CreateWorkloadParams {
    principal_id: string;
    principal_type: string;
    type_id: string;
    duration: number;
    report_at: number;
    report_by_id?: string;
    description?: string;
}
export interface ListWorkloadsParams {
    principal_type: string;
    principal_id?: string;
    start_at?: number;
    end_at?: number;
    report_by_id?: string;
}
export interface UpdateWorkloadParams {
    workload_id: string;
    type_id?: string;
    duration?: number;
    report_at?: number;
    report_by_id?: string;
    description?: string;
}
export declare function createWorkload(params: CreateWorkloadParams): Promise<unknown>;
export declare function listWorkloads(params: ListWorkloadsParams): Promise<unknown>;
export declare function getWorkload(workloadId: string): Promise<unknown>;
export declare function updateWorkload(params: UpdateWorkloadParams): Promise<unknown>;
export declare function deleteWorkload(workloadId: string): Promise<unknown>;
export declare function listWorkloadTypes(): Promise<unknown>;
//# sourceMappingURL=workload.d.ts.map