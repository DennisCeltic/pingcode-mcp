import { pingCodeClient } from '../client/index.js';

export interface ListWorkItemsParams {
  identifier?: string;
  project_ids?: string;
  type_ids?: string;
  assignee_ids?: string;
  state_ids?: string;
  sprint_ids?: string;
  keywords?: string;
  updated_between?: string;
  page_index?: number;
  page_size?: number;
}

export interface CreateWorkItemParams {
  project_id: string;
  type_id: string;
  title: string;
  description?: string;
  state_id?: string;
  priority_id?: string;
  assignee_id?: string;
  sprint_id?: string;
  parent_id?: string;
  story_points?: number;
  estimated_workload?: number;
  remaining_workload?: number;
  start_at?: number;
  end_at?: number;
  phase_id?: string;
}

export interface UpdateWorkItemParams {
  work_item_id: string;
  title?: string;
  description?: string;
  state_id?: string;
  priority_id?: string;
  assignee_id?: string;
  sprint_id?: string;
  parent_id?: string;
  story_points?: number;
  estimated_workload?: number;
  remaining_workload?: number;
  start_at?: number;
  end_at?: number;
  phase_id?: string;
}

export async function listWorkItems(params: ListWorkItemsParams = {}) {
  const query = new URLSearchParams();
  
  if (params.identifier) query.append('identifier', params.identifier);
  if (params.project_ids) query.append('project_ids', params.project_ids);
  if (params.type_ids) query.append('type_ids', params.type_ids);
  if (params.assignee_ids) query.append('assignee_ids', params.assignee_ids);
  if (params.state_ids) query.append('state_ids', params.state_ids);
  if (params.sprint_ids) query.append('sprint_ids', params.sprint_ids);
  if (params.keywords) query.append('keywords', params.keywords);
  query.append('page_index', String(params.page_index ?? 0));
  query.append('page_size', String(params.page_size ?? 30));

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return pingCodeClient.get(`/v1/project/work_items${queryString}`);
}

export async function getWorkItem(workItemId: string) {
  return pingCodeClient.get(`/v1/project/work_items/${workItemId}`);
}

export async function createWorkItem(params: CreateWorkItemParams) {
  return pingCodeClient.post('/v1/project/work_items', params);
}

export async function updateWorkItem(params: UpdateWorkItemParams) {
  const { work_item_id, ...body } = params;
  return pingCodeClient.patch(`/v1/project/work_items/${work_item_id}`, body);
}
