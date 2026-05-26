import { pingCodeClient } from '../client/index.js';
export async function listReleases(params) {
    const query = new URLSearchParams();
    if (params.name)
        query.append('name', params.name);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return pingCodeClient.get(`/v1/project/projects/${params.project_id}/versions${queryString}`);
}
export async function getRelease(releaseId) {
    return pingCodeClient.get(`/v1/project/versions/${releaseId}`);
}
export async function createRelease(params) {
    return pingCodeClient.post('/v1/project/versions', params);
}
export async function updateRelease(params) {
    const { release_id, ...body } = params;
    return pingCodeClient.patch(`/v1/project/versions/${release_id}`, body);
}
export async function deleteRelease(releaseId) {
    return pingCodeClient.delete(`/v1/project/versions/${releaseId}`);
}
//# sourceMappingURL=release.js.map