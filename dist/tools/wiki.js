import { pingCodeClient } from '../client/index.js';
export async function listWikiSpaces(params = {}) {
    const query = new URLSearchParams();
    query.append('page_index', String(params.page_index ?? 0));
    query.append('page_size', String(params.page_size ?? 100));
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return pingCodeClient.get(`/v1/wiki/spaces${queryString}`);
}
export async function listWikiPages(params) {
    const query = new URLSearchParams();
    query.append('space_id', params.space_id);
    query.append('page_index', String(params.page_index ?? 0));
    query.append('page_size', String(params.page_size ?? 100));
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return pingCodeClient.get(`/v1/wiki/pages${queryString}`);
}
export async function getWikiPage(params) {
    const formatType = params.format_type ?? 'markdown';
    return pingCodeClient.get(`/v1/wiki/pages/${params.page_id}/content?format_type=${formatType}`);
}
//# sourceMappingURL=wiki.js.map