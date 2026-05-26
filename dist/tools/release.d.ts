export interface ListReleasesParams {
    project_id: string;
    name?: string;
}
export interface CreateReleaseParams {
    project_id: string;
    name: string;
    start_at: number;
    end_at: number;
    assignee_id?: string;
    stage_id?: string;
    category_ids?: string[];
}
export interface UpdateReleaseParams {
    release_id: string;
    name?: string;
    start_at?: number;
    end_at?: number;
    assignee_id?: string;
    stage_id?: string;
    category_ids?: string[];
}
export declare function listReleases(params: ListReleasesParams): Promise<unknown>;
export declare function getRelease(releaseId: string): Promise<unknown>;
export declare function createRelease(params: CreateReleaseParams): Promise<unknown>;
export declare function updateRelease(params: UpdateReleaseParams): Promise<unknown>;
export declare function deleteRelease(releaseId: string): Promise<unknown>;
//# sourceMappingURL=release.d.ts.map