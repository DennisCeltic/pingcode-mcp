import { pingCodeClient } from '../client/index.js';
export async function listProjects(params = {}) {
    const query = new URLSearchParams();
    if (params.keywords)
        query.append('keywords', params.keywords);
    query.append('page_index', String(params.page_index ?? 0));
    query.append('page_size', String(params.page_size ?? 30));
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return pingCodeClient.get(`/v1/project/projects${queryString}`);
}
export async function getProject(projectId) {
    return pingCodeClient.get(`/v1/project/projects/${projectId}`);
}
export async function createProject(params) {
    return pingCodeClient.post('/v1/project/projects', {
        name: params.name,
        identifier: params.identifier,
        type: params.type ?? 'scrum',
        visibility: params.visibility ?? 'private',
        description: params.description ?? '',
        assignee_id: params.assignee_id,
    });
}
export async function addProjectMembers(params) {
    const results = [];
    for (const uid of params.user_ids) {
        const body = { user_id: uid };
        if (params.role_id)
            body.role_id = params.role_id;
        const result = await pingCodeClient.post(`/v1/project/projects/${params.project_id}/members`, body);
        results.push(result);
    }
    return results.length === 1 ? results[0] : results;
}
//# sourceMappingURL=project.js.map