export interface ListProjectsParams {
    keywords?: string;
    page_index?: number;
    page_size?: number;
}
export declare function listProjects(params?: ListProjectsParams): Promise<unknown>;
export declare function getProject(projectId: string): Promise<unknown>;
//# sourceMappingURL=project.d.ts.map