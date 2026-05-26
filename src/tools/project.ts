import { pingCodeClient } from '../client/index.js';

export interface ListProjectsParams {
  keywords?: string;
  page_index?: number;
  page_size?: number;
}

export interface CreateProjectParams {
  name: string;
  type?: 'scrum' | 'kanban';
  visibility?: 'private' | 'public';
  description?: string;
  assignee_id?: string;
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

export async function createProject(params: CreateProjectParams) {
  return pingCodeClient.post('/v1/project/projects', {
    name: params.name,
    type: params.type ?? 'scrum',
    visibility: params.visibility ?? 'private',
    description: params.description ?? '',
    assignee_id: params.assignee_id,
  });
}
