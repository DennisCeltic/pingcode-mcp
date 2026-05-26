import { pingCodeClient } from '../client/index.js';

export interface ListReleasesParams {
  project_id: string;
  name?: string;
}

export interface CreateReleaseParams {
  project_id: string;
  name: string;
  start_at: number;
  end_at: number;
  assignee_id?: string;
  stage_id?: string;
  category_ids?: string[];
}

export interface UpdateReleaseParams {
  release_id: string;
  name?: string;
  start_at?: number;
  end_at?: number;
  assignee_id?: string;
  stage_id?: string;
  category_ids?: string[];
}

export async function listReleases(params: ListReleasesParams) {
  const query = new URLSearchParams();
  if (params.name) query.append('name', params.name);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return pingCodeClient.get(`/v1/project/projects/${params.project_id}/versions${queryString}`);
}

export async function getRelease(releaseId: string) {
  return pingCodeClient.get(`/v1/project/versions/${releaseId}`);
}

export async function createRelease(params: CreateReleaseParams) {
  return pingCodeClient.post('/v1/project/versions', params);
}

export async function updateRelease(params: UpdateReleaseParams) {
  const { release_id, ...body } = params;
  return pingCodeClient.patch(`/v1/project/versions/${release_id}`, body);
}

export async function deleteRelease(releaseId: string) {
  return pingCodeClient.delete(`/v1/project/versions/${releaseId}`);
}
