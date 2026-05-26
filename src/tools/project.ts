import { pingCodeClient } from '../client/index.js';

export interface ListProjectsParams {
  keywords?: string;
  page_index?: number;
  page_size?: number;
}

export async function listProjects(params: ListProjectsParams = {}) {
  const query = new URLSearchParams();
  
  if (params.keywords) query.append('keywords', params.keywords);
  query.append('page_index', String(params.page_index ?? 0));
  query.append('page_size', String(params.page_size ?? 30));

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return pingCodeClient.get(`/v1/project/projects${queryString}`);
}

export async function getProject(projectId: string) {
  return pingCodeClient.get(`/v1/project/projects/${projectId}`);
}
