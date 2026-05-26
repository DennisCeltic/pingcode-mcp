import { pingCodeClient } from '../client/index.js';

export interface CreateCommentParams {
  principal_type: string;
  principal_id: string;
  content: string;
}

export interface ListCommentsParams {
  principal_type: string;
  principal_id: string;
}

export async function createComment(params: CreateCommentParams) {
  return pingCodeClient.post('/v1/comments', params);
}

export async function listComments(params: ListCommentsParams) {
  const query = new URLSearchParams();
  query.append('principal_type', params.principal_type);
  query.append('principal_id', params.principal_id);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return pingCodeClient.get(`/v1/comments${queryString}`);
}

export async function getComment(commentId: string, principal_type?: string, principal_id?: string) {
  const query = new URLSearchParams();
  if (principal_type) query.append('principal_type', principal_type);
  if (principal_id) query.append('principal_id', principal_id);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return pingCodeClient.get(`/v1/comments/${commentId}${queryString}`);
}

export async function deleteComment(commentId: string) {
  return pingCodeClient.delete(`/v1/comments/${commentId}`);
}
