export interface ListProjectsParams {
    keywords?: string;
    page_index?: number;
    page_size?: number;
}
export interface CreateProjectParams {
    name: string;
    identifier: string;
    type?: 'scrum' | 'kanban' | 'waterfall' | 'hybrid';
    visibility?: 'private' | 'public';
    description?: string;
    assignee_id?: string;
}
export declare function listProjects(params?: ListProjectsParams): Promise<unknown>;
export declare function getProject(projectId: string): Promise<unknown>;
export declare function createProject(params: CreateProjectParams): Promise<unknown>;
export interface AddProjectMembersParams {
    project_id: string;
    user_ids: string[];
    role_id?: string;
}
export declare function addProjectMembers(params: AddProjectMembersParams): Promise<unknown>;
//# sourceMappingURL=project.d.ts.map