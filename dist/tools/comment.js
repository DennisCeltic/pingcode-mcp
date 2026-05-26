import { pingCodeClient } from '../client/index.js';
export async function createComment(params) {
    return pingCodeClient.post('/v1/comments', params);
}
export async function listComments(params) {
    const query = new URLSearchParams();
    query.append('principal_type', params.principal_type);
    query.append('principal_id', params.principal_id);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return pingCodeClient.get(`/v1/comments${queryString}`);
}
export async function getComment(commentId, principal_type, principal_id) {
    const query = new URLSearchParams();
    if (principal_type)
        query.append('principal_type', principal_type);
    if (principal_id)
        query.append('principal_id', principal_id);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return pingCodeClient.get(`/v1/comments/${commentId}${queryString}`);
}
export async function deleteComment(commentId) {
    return pingCodeClient.delete(`/v1/comments/${commentId}`);
}
//# sourceMappingURL=comment.js.map