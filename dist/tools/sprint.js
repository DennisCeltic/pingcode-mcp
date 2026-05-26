import { pingCodeClient } from '../client/index.js';
export async function listSprints(params = {}) {
    const query = new URLSearchParams();
    if (params.project_id)
        query.append('project_id', params.project_id);
    query.append('page_index', String(params.page_index ?? 0));
    query.append('page_size', String(params.page_size ?? 30));
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return pingCodeClient.get(`/v1/project/sprints${queryString}`);
}
export async function getSprint(sprintId) {
    return pingCodeClient.get(`/v1/project/sprints/${sprintId}`);
}
//# sourceMappingURL=sprint.js.map