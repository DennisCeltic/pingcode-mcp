import { pingCodeClient } from '../client/index.js';

export interface ListWikiSpacesParams {
  page_index?: number;
  page_size?: number;
}

export interface ListWikiPagesParams {
  space_id: string;
  page_index?: number;
  page_size?: number;
}

export interface GetWikiPageParams {
  page_id: string;
  format_type?: 'markdown' | 'html';
}

export async function listWikiSpaces(params: ListWikiSpacesParams = {}) {
  const query = new URLSearchParams();
  query.append('page_index', String(params.page_index ?? 0));
  query.append('page_size', String(params.page_size ?? 100));

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return pingCodeClient.get(`/v1/wiki/spaces${queryString}`);
}

export async function listWikiPages(params: ListWikiPagesParams) {
  const query = new URLSearchParams();
  query.append('space_id', params.space_id);
  query.append('page_index', String(params.page_index ?? 0));
  query.append('page_size', String(params.page_size ?? 100));

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return pingCodeClient.get(`/v1/wiki/pages${queryString}`);
}

export async function getWikiPage(params: GetWikiPageParams) {
  const formatType = params.format_type ?? 'markdown';
  return pingCodeClient.get(`/v1/wiki/pages/${params.page_id}/content?format_type=${formatType}`);
}

export interface AddWikiMembersParams {
  space_id: string;
  user_ids: string[];
  role_id?: string;
}

export async function addWikiMembers(params: AddWikiMembersParams) {
  const results: unknown[] = [];
  for (const uid of params.user_ids) {
    const body: { user_id: string; role_id?: string } = { user_id: uid };
    if (params.role_id) body.role_id = params.role_id;
    const result = await pingCodeClient.post(
      `/v1/wiki/spaces/${params.space_id}/members`,
      body,
    );
    results.push(result);
  }
  return results.length === 1 ? results[0] : results;
}
