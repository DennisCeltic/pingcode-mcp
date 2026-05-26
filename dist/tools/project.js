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
//# sourceMappingURL=project.js.map