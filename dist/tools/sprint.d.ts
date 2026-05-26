export interface ListSprintsParams {
    project_id?: string;
    page_index?: number;
    page_size?: number;
}
export declare function listSprints(params?: ListSprintsParams): Promise<unknown>;
export declare function getSprint(sprintId: string): Promise<unknown>;
//# sourceMappingURL=sprint.d.ts.map